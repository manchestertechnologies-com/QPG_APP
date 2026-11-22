import axios from 'axios';
import { Subject, ClassLevel, Question, DifficultyLevel } from '../types';
import { config } from '../config';
import { normalizeQuestion } from './questionQuality';

interface QueryOptions {
  subject: Subject;
  classLevel?: ClassLevel | 'both';
  chapter?: string;
  topic?: string;
  exam?: string;
  qType?: string;
  difficulty?: DifficultyLevel;
  search?: string;
  limit?: number;
  offset?: number;
}

type DbConfig = { classLevel: ClassLevel; url: string; apiKey: string };

const PAGE_SIZE = 1000; // Supabase / PostgREST returns at most 1000 rows per request
const CHAPTER_CACHE_MS = 6 * 60 * 60 * 1000;

export class QuestionBankService {
  private static chapterCache: Record<string, { at: number; list: { name: string; count: number; classLevel: ClassLevel }[] }> = {};

  private static headers(db: DbConfig, extra: Record<string, string> = {}) {
    return { apikey: db.apiKey, Authorization: `Bearer ${db.apiKey}`, ...extra };
  }

  /**
   * Raw bank row -> clean, validated Question, or null when the question cannot be shown
   * correctly (see questionQuality.ts). Every question served to the app goes through here.
   */
  public static toCleanQuestion(row: any, subject: Subject, classLevel: ClassLevel, fallbackChapter = 'General'): Question | null {
    const result = normalizeQuestion(row);
    if (!result.ok) return null;
    const c = result.question;
    return {
      id: String(row.id),
      subject,
      klass: classLevel,
      chapter: row.chapter ? String(row.chapter).trim() : fallbackChapter,
      topic: row.topic || '',
      exams: row.exams || [],
      q_type: c.q_type,
      question: c.question,
      opt_a: c.opt_a,
      opt_b: c.opt_b,
      opt_c: c.opt_c,
      opt_d: c.opt_d,
      assertion: c.assertion,
      reason: c.reason,
      statement_1: c.statement_1,
      statement_2: c.statement_2,
      match_table: c.match_table,
      match_headers: c.match_headers,
      stem_after: c.stem_after,
      num_answer: c.num_answer,
      answer_display: c.answer_display,
      correct_option: c.correct_option,
      solution_text: c.solution_text,
      difficulty: this.extractDifficulty(row),
      source: row.source || '',
      year: row.year ? String(row.year) : '',
    };
  }

  /** Retries a Supabase request once after a short pause (transient 401/5xx/timeouts happen). */
  private static async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status && status < 500 && status !== 401 && status !== 429) throw err;
      await new Promise((r) => setTimeout(r, 600));
      return fn();
    }
  }

  /** Number of rows matching the filters (uses PostgREST's exact count header). */
  public static async countRows(db: DbConfig, filters: Record<string, string> = {}): Promise<number> {
    const resp = await this.withRetry(() => axios.get(`${db.url}/questions`, {
      headers: this.headers(db, { Prefer: 'count=exact', Range: '0-0' }),
      params: { select: 'id', ...filters },
      timeout: 15000,
    }));
    const total = parseInt(String(resp.headers['content-range'] || '').split('/')[1], 10);
    return Number.isFinite(total) ? total : (resp.data || []).length;
  }

  /** Fetches rows[from..to] (inclusive) for the given select + filters. */
  public static async fetchRange(db: DbConfig, select: string, filters: Record<string, string>, from: number, to: number): Promise<any[]> {
    const resp = await this.withRetry(() => axios.get(`${db.url}/questions`, {
      headers: this.headers(db, { Range: `${from}-${to}` }),
      params: { select, order: 'id.asc', ...filters },
      timeout: 20000,
    }));
    return resp.data || [];
  }

  private static countsCache: { at: number; data: Record<string, { class11: number; class12: number; total: number }> } | null = null;

  /** Live question counts per subject and class (cached for 6 hours). */
  public static async getBankCounts(): Promise<Record<string, { class11: number; class12: number; total: number }>> {
    if (this.countsCache && Date.now() - this.countsCache.at < CHAPTER_CACHE_MS) return this.countsCache.data;
    const data: Record<string, { class11: number; class12: number; total: number }> = {};
    let failed = false;
    await Promise.all(
      (Object.keys(config.databases) as Subject[]).map(async (subject) => {
        const [c11, c12] = await Promise.all(
          (['11', '12'] as ClassLevel[]).map((kl) =>
            this.countRows({ classLevel: kl, ...config.databases[subject][kl] }).catch(() => {
              failed = true;
              return 0;
            })
          )
        );
        data[subject] = { class11: c11, class12: c12, total: c11 + c12 };
      })
    );
    if (!failed) this.countsCache = { at: Date.now(), data };
    return data;
  }

  /** Every matching row, paged 1000 at a time with a few requests in parallel. */
  public static async fetchAllRows(db: DbConfig, select: string, filters: Record<string, string> = {}): Promise<any[]> {
    const total = await this.countRows(db, filters);
    const pages: [number, number][] = [];
    for (let from = 0; from < total; from += PAGE_SIZE) pages.push([from, Math.min(total, from + PAGE_SIZE) - 1]);
    const rows: any[] = [];
    const CONCURRENCY = 6;
    for (let i = 0; i < pages.length; i += CONCURRENCY) {
      const batch = await Promise.all(pages.slice(i, i + CONCURRENCY).map(([a, b]) => this.fetchRange(db, select, filters, a, b)));
      batch.forEach((part) => rows.push(...part));
    }
    return rows;
  }

  /**
   * Helper to parse difficulty tag from question or solution_text
   */
  public static extractDifficulty(q: any): DifficultyLevel {
    const text = (q.solution_text || '') + ' ' + (q.question || '');
    if (text.includes('[QBP_DIFFICULTY:Easy]')) return 'Easy';
    if (text.includes('[QBP_DIFFICULTY:Hard]')) return 'Hard';
    if (text.includes('[QBP_DIFFICULTY:Medium]')) return 'Medium';
    return 'Medium'; // default
  }

  /**
   * Clean internal metadata tags from question text
   */
  public static cleanQuestionText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\[QBP_DIFFICULTY:[^\]]+\]/g, '')
      .replace(/\[QBP_EXAM:[^\]]+\]/g, '')
      .trim();
  }

  /**
   * Get target database configurations for the requested subject and class
   */
  private static getDbConfigs(subject: Subject, classLevel?: ClassLevel | 'both') {
    const subjectDbs = config.databases[subject];
    if (!subjectDbs) {
      throw new Error(`Unauthorized or unsupported subject: ${subject}`);
    }

    const configs: { classLevel: ClassLevel; url: string; apiKey: string }[] = [];
    if (!classLevel || classLevel === 'both') {
      configs.push({ classLevel: '11', ...subjectDbs['11'] });
      configs.push({ classLevel: '12', ...subjectDbs['12'] });
    } else if (classLevel === '11') {
      configs.push({ classLevel: '11', ...subjectDbs['11'] });
    } else if (classLevel === '12') {
      configs.push({ classLevel: '12', ...subjectDbs['12'] });
    }

    return configs;
  }

  /**
   * Fetch questions with filtering, pagination, and subject locking
   */
  public static async queryQuestions(opts: QueryOptions): Promise<{
    questions: Question[];
    total: number;
    hasMore: boolean;
  }> {
    const dbConfigs = this.getDbConfigs(opts.subject, opts.classLevel);
    const limit = opts.limit || 20;
    const offset = opts.offset || 0;

    let allResults: Question[] = [];
    let grandTotal = 0;

    for (const dbConfig of dbConfigs) {
      const headers = {
        apikey: dbConfig.apiKey,
        Authorization: `Bearer ${dbConfig.apiKey}`,
        Prefer: 'count=exact',
      };

      const params: Record<string, string> = {
        select: '*',
        limit: String(limit * 2), // fetch a wider window for client-side filtering if difficulty filter is applied
        offset: String(offset),
      };

      if (opts.chapter && opts.chapter !== 'All Chapters') {
        params['chapter'] = `eq.${opts.chapter}`;
      }

      if (opts.qType && opts.qType !== 'all') {
        params['q_type'] = `eq.${opts.qType}`;
      }

      if (opts.search && opts.search.trim()) {
        params['question'] = `ilike.*${encodeURIComponent(opts.search.trim())}*`;
      }

      try {
        const response = await axios.get(`${dbConfig.url}/questions`, {
          headers,
          params,
          timeout: 10000,
        });

        const contentRange = response.headers['content-range'];
        if (contentRange) {
          const parts = contentRange.split('/');
          if (parts[1]) {
            grandTotal += parseInt(parts[1], 10) || 0;
          }
        }

        const rows: any[] = response.data || [];
        for (const row of rows) {
          const diff = this.extractDifficulty(row);
          if (opts.difficulty && opts.difficulty !== diff) {
            continue; // Filter by difficulty
          }

          const clean = this.toCleanQuestion(row, opts.subject, dbConfig.classLevel);
          if (clean) allResults.push(clean);
        }
      } catch (err: any) {
        console.error(`Error querying ${opts.subject} Class ${dbConfig.classLevel}:`, err.message);
      }
    }

    const paginated = allResults.slice(0, limit);
    return {
      questions: paginated,
      total: grandTotal || allResults.length,
      hasMore: offset + limit < (grandTotal || allResults.length),
    };
  }

  /**
   * Get list of chapters for a subject and class level
   */
  public static async getChapters(
    subject: Subject,
    classLevel?: ClassLevel | 'both'
  ): Promise<{ name: string; count: number; classLevel: ClassLevel }[]> {
    const cacheKey = `${subject}_${classLevel || 'both'}`;
    const cached = this.chapterCache[cacheKey];
    if (cached && Date.now() - cached.at < CHAPTER_CACHE_MS) return cached.list;

    const dbConfigs = this.getDbConfigs(subject, classLevel);
    const chapterMap = new Map<string, { count: number; classLevel: ClassLevel }>();
    let failures = 0;

    await Promise.all(
      dbConfigs.map(async (dbConfig) => {
        try {
          // Read the chapter of every question (not a sample) so no chapter is missing.
          const rows = await this.fetchAllRows(dbConfig, 'chapter');
          for (const item of rows) {
            if (!item.chapter) continue;
            const ch = String(item.chapter).trim();
            if (!ch) continue;
            const existing = chapterMap.get(ch);
            if (existing) existing.count += 1;
            else chapterMap.set(ch, { count: 1, classLevel: dbConfig.classLevel });
          }
        } catch (err: any) {
          failures += 1;
          console.error(`Error fetching chapters for ${subject} Class ${dbConfig.classLevel}:`, err.message);
        }
      })
    );

    const list = Array.from(chapterMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      classLevel: data.classLevel,
    }));

    list.sort((a, b) => a.classLevel.localeCompare(b.classLevel) || a.name.localeCompare(b.name));
    if (failures === 0 && list.length > 0) this.chapterCache[cacheKey] = { at: Date.now(), list };
    return list;
  }

  /**
   * Get distinct concept tags / topics for a chapter
   */
  public static async getConceptTags(
    subject: Subject,
    chapter?: string
  ): Promise<{ tag: string; count: number }[]> {
    const dbConfigs = this.getDbConfigs(subject, 'both');
    const conceptMap = new Map<string, number>();

    for (const dbConfig of dbConfigs) {
      const headers = {
        apikey: dbConfig.apiKey,
        Authorization: `Bearer ${dbConfig.apiKey}`,
      };

      try {
        const filters: Record<string, string> = {};
        if (chapter && chapter !== 'All Chapters') {
          filters['chapter'] = `eq.${chapter}`;
        }
        const rows =
          Object.keys(filters).length > 0
            ? await this.fetchAllRows(dbConfig, 'topic', filters)
            : await this.fetchRange(dbConfig, 'topic', {}, 0, PAGE_SIZE - 1);
        void headers;

        for (const item of rows) {
          if (!item.topic) continue;
          const t = item.topic.trim();
          if (t) {
            conceptMap.set(t, (conceptMap.get(t) || 0) + 1);
          }
        }
      } catch (err: any) {
        console.error(`Error fetching concept tags for ${subject}:`, err.message);
      }
    }

    const tags = Array.from(conceptMap.entries()).map(([tag, count]) => ({ tag, count }));
    tags.sort((a, b) => b.count - a.count);
    return tags;
  }

  /**
   * Query alternative questions from identical subject, chapter & difficulty for in-place swapping
   */
  public static async getAlternativeQuestions(
    subject: Subject,
    chapter: string,
    excludeQuestionId: string,
    difficulty?: DifficultyLevel,
    qType?: string,
    limit: number = 6
  ): Promise<Question[]> {
    const dbConfigs = this.getDbConfigs(subject, 'both');
    const alternatives: Question[] = [];

    for (const dbConfig of dbConfigs) {
      if (alternatives.length >= limit) break;
      const headers = {
        apikey: dbConfig.apiKey,
        Authorization: `Bearer ${dbConfig.apiKey}`,
      };

      const params: Record<string, string> = {
        select: '*',
        limit: '30',
        id: `neq.${excludeQuestionId}`,
      };

      if (chapter && chapter !== 'General' && chapter !== 'All Chapters') {
        params['chapter'] = `eq.${chapter}`;
      }

      if (qType && qType !== 'all') {
        params['q_type'] = `eq.${qType}`;
      }

      try {
        const response = await axios.get(`${dbConfig.url}/questions`, {
          headers,
          params,
          timeout: 10000,
        });

        for (const row of response.data || []) {
          if (row.id === excludeQuestionId) continue;
          const diff = this.extractDifficulty(row);
          if (difficulty && diff !== difficulty) continue;

          const clean = this.toCleanQuestion(row, subject, dbConfig.classLevel, chapter || 'General');
          if (!clean) continue;
          alternatives.push(clean);

          if (alternatives.length >= limit) break;
        }
      } catch (err: any) {
        console.error(`Error fetching alternatives for ${subject}:`, err.message);
      }
    }

    return alternatives;
  }
}
