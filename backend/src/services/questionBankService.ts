import axios from 'axios';
import { Subject, ClassLevel, Question, DifficultyLevel } from '../types';
import { config } from '../config';

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

export class QuestionBankService {
  private static chapterCache: Record<string, { name: string; count: number }[]> = {};

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

          allResults.push({
            id: row.id,
            subject: opts.subject,
            klass: dbConfig.classLevel,
            chapter: row.chapter || 'General',
            topic: row.topic || '',
            exams: row.exams || [],
            q_type: row.q_type || 'mcq_single',
            question: this.cleanQuestionText(row.question || ''),
            opt_a: row.opt_a || '',
            opt_b: row.opt_b || '',
            opt_c: row.opt_c || '',
            opt_d: row.opt_d || '',
            assertion: row.assertion || '',
            reason: row.reason || '',
            column_a: row.column_a || '',
            column_b: row.column_b || '',
            match_options: row.match_options || '',
            num_answer: row.num_answer || '',
            correct_option: row.correct_option || '',
            solution_text: this.cleanQuestionText(row.solution_text || ''),
            difficulty: diff,
            source: row.source || '',
            year: row.year ? String(row.year) : '',
          });
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
    const dbConfigs = this.getDbConfigs(subject, classLevel);
    const chapterMap = new Map<string, { count: number; classLevel: ClassLevel }>();

    for (const dbConfig of dbConfigs) {
      const headers = {
        apikey: dbConfig.apiKey,
        Authorization: `Bearer ${dbConfig.apiKey}`,
      };

      try {
        // Query sample of 1500 to extract all distinct chapters
        const resp = await axios.get(`${dbConfig.url}/questions`, {
          headers,
          params: { select: 'chapter', limit: '2000' },
          timeout: 10000,
        });

        for (const item of resp.data || []) {
          if (!item.chapter) continue;
          const ch = item.chapter.trim();
          const existing = chapterMap.get(ch);
          if (existing) {
            existing.count += 1;
          } else {
            chapterMap.set(ch, { count: 1, classLevel: dbConfig.classLevel });
          }
        }
      } catch (err: any) {
        console.error(`Error fetching chapters for ${subject}:`, err.message);
      }
    }

    const list = Array.from(chapterMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      classLevel: data.classLevel,
    }));

    list.sort((a, b) => a.name.localeCompare(b.name));
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
        const params: Record<string, string> = { select: 'topic,chapter', limit: '1500' };
        if (chapter && chapter !== 'All Chapters') {
          params['chapter'] = `eq.${chapter}`;
        }

        const resp = await axios.get(`${dbConfig.url}/questions`, {
          headers,
          params,
          timeout: 10000,
        });

        for (const item of resp.data || []) {
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

          alternatives.push({
            id: row.id,
            subject,
            klass: dbConfig.classLevel,
            chapter: row.chapter || chapter || 'General',
            topic: row.topic || '',
            exams: row.exams || [],
            q_type: row.q_type || 'mcq_single',
            question: this.cleanQuestionText(row.question || ''),
            opt_a: row.opt_a || '',
            opt_b: row.opt_b || '',
            opt_c: row.opt_c || '',
            opt_d: row.opt_d || '',
            assertion: row.assertion || '',
            reason: row.reason || '',
            column_a: row.column_a || '',
            column_b: row.column_b || '',
            match_options: row.match_options || '',
            num_answer: row.num_answer || '',
            correct_option: row.correct_option || '',
            solution_text: this.cleanQuestionText(row.solution_text || ''),
            difficulty: diff,
            source: row.source || '',
            year: row.year ? String(row.year) : '',
          });

          if (alternatives.length >= limit) break;
        }
      } catch (err: any) {
        console.error(`Error fetching alternatives for ${subject}:`, err.message);
      }
    }

    return alternatives;
  }
}
