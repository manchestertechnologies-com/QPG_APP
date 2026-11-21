/**
 * Storage for classrooms, online exams, participants and attempts.
 *
 * Postgres is the source of truth whenever DATABASE_URL is set: every read goes to the
 * database so all serverless instances agree on exam state. Without DATABASE_URL the same
 * API runs on an in-memory store mirrored to a local JSON file (development only).
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { db } from './database';

export type ExamStatus = 'payment_pending' | 'scheduled' | 'cancelled';
export type AttemptStatus = 'in_progress' | 'submitted' | 'auto_submitted';
export type ShowResults = 'after_submit' | 'after_end' | 'never';

export interface Classroom {
  id: string;
  teacher_id: string;
  name: string;
  description: string;
  subject: string | null;
  join_code: string;
  created_at: string;
  updated_at: string;
}

export interface ClassroomSummary extends Classroom {
  member_count: number;
  exam_count: number;
}

export interface ClassroomMember {
  classroom_id: string;
  student_id: string;
  added_via: string; // 'email' | 'examprep' | 'join_code'
  joined_at: string;
}

export interface ClassroomExam {
  id: string;
  classroom_id: string;
  teacher_id: string;
  title: string;
  instructions: string;
  paper: any; // full paper incl. answers; never sent to students as-is
  exam_type: string;
  subject: string;
  question_count: number;
  total_marks: number;
  duration_minutes: number;
  starts_at: string;
  ends_at: string;
  show_results: ShowResults;
  shuffle_questions: boolean;
  status: ExamStatus;
  seats_paid: number;
  created_at: string;
  updated_at: string;
}

export interface AnswerEntry {
  option?: string; // 'A' | 'B' | 'C' | 'D'
  value?: string; // numerical answer as typed
  marked?: boolean; // marked for review
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  status: AttemptStatus;
  started_at: string;
  deadline_at: string;
  submitted_at: string | null;
  question_order: string[];
  answers: Record<string, AnswerEntry>;
  score: number | null;
  max_score: number | null;
  correct: number | null;
  incorrect: number | null;
  unanswered: number | null;
  result: any;
}

interface MemoryShape {
  classrooms: Classroom[];
  members: ClassroomMember[];
  exams: ClassroomExam[];
  participants: { exam_id: string; student_id: string }[];
  attempts: ExamAttempt[];
}

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'qpg-data') : path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'classrooms_store.json');

const iso = (v: any): string => (v ? new Date(v).toISOString() : new Date().toISOString());
const num = (v: any): number | null => (v === null || v === undefined ? null : Number(v));

function mapClassroom(r: any): Classroom {
  return {
    id: r.id,
    teacher_id: r.teacher_id,
    name: r.name,
    description: r.description || '',
    subject: r.subject || null,
    join_code: r.join_code,
    created_at: iso(r.created_at),
    updated_at: iso(r.updated_at),
  };
}

function mapExam(r: any): ClassroomExam {
  return {
    id: r.id,
    classroom_id: r.classroom_id,
    teacher_id: r.teacher_id,
    title: r.title,
    instructions: r.instructions || '',
    paper: r.paper,
    exam_type: r.exam_type || '',
    subject: r.subject || '',
    question_count: Number(r.question_count) || 0,
    total_marks: Number(r.total_marks) || 0,
    duration_minutes: Number(r.duration_minutes) || 0,
    starts_at: iso(r.starts_at),
    ends_at: iso(r.ends_at),
    show_results: r.show_results || 'after_submit',
    shuffle_questions: !!r.shuffle_questions,
    status: r.status,
    seats_paid: Number(r.seats_paid) || 0,
    created_at: iso(r.created_at),
    updated_at: iso(r.updated_at),
  };
}

function mapAttempt(r: any): ExamAttempt {
  return {
    id: r.id,
    exam_id: r.exam_id,
    student_id: r.student_id,
    status: r.status,
    started_at: iso(r.started_at),
    deadline_at: iso(r.deadline_at),
    submitted_at: r.submitted_at ? iso(r.submitted_at) : null,
    question_order: r.question_order || [],
    answers: r.answers || {},
    score: num(r.score),
    max_score: num(r.max_score),
    correct: num(r.correct),
    incorrect: num(r.incorrect),
    unanswered: num(r.unanswered),
    result: r.result || null,
  };
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

class ClassroomStore {
  private mem: MemoryShape = { classrooms: [], members: [], exams: [], participants: [], attempts: [] };
  private schemaReady: Promise<void> | null = null;

  private get pool(): Pool | null {
    return db.pool;
  }

  /** Creates the tables once per process (Postgres) or loads the JSON mirror. */
  public ready(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = this.init().catch((err) => {
        this.schemaReady = null;
        throw err;
      });
    }
    return this.schemaReady;
  }

  private async init(): Promise<void> {
    await db.readyPromise;
    const pool = this.pool;
    if (!pool) {
      try {
        if (fs.existsSync(DATA_FILE)) this.mem = { ...this.mem, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) };
      } catch (err) {
        console.error('Could not load classroom store, starting empty:', err);
      }
      return;
    }
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classrooms (
        id VARCHAR(64) PRIMARY KEY,
        teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(160) NOT NULL,
        description TEXT,
        subject VARCHAR(64),
        join_code VARCHAR(12) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON classrooms(teacher_id);

      CREATE TABLE IF NOT EXISTS classroom_members (
        classroom_id VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
        student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        added_via VARCHAR(16) DEFAULT 'email',
        joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (classroom_id, student_id)
      );
      CREATE INDEX IF NOT EXISTS idx_classroom_members_student ON classroom_members(student_id);

      CREATE TABLE IF NOT EXISTS classroom_exams (
        id VARCHAR(64) PRIMARY KEY,
        classroom_id VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
        teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        instructions TEXT,
        paper JSONB NOT NULL,
        exam_type VARCHAR(32),
        subject VARCHAR(64),
        question_count INT DEFAULT 0,
        total_marks NUMERIC(10, 2) DEFAULT 0,
        duration_minutes INT NOT NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ NOT NULL,
        show_results VARCHAR(16) DEFAULT 'after_submit',
        shuffle_questions BOOLEAN DEFAULT FALSE,
        status VARCHAR(24) NOT NULL,
        seats_paid INT DEFAULT 10,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_classroom_exams_classroom ON classroom_exams(classroom_id);

      CREATE TABLE IF NOT EXISTS exam_participants (
        exam_id VARCHAR(64) NOT NULL REFERENCES classroom_exams(id) ON DELETE CASCADE,
        student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (exam_id, student_id)
      );
      CREATE INDEX IF NOT EXISTS idx_exam_participants_student ON exam_participants(student_id);

      CREATE TABLE IF NOT EXISTS exam_attempts (
        id VARCHAR(64) PRIMARY KEY,
        exam_id VARCHAR(64) NOT NULL REFERENCES classroom_exams(id) ON DELETE CASCADE,
        student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL,
        started_at TIMESTAMPTZ NOT NULL,
        deadline_at TIMESTAMPTZ NOT NULL,
        submitted_at TIMESTAMPTZ,
        question_order JSONB,
        answers JSONB DEFAULT '{}'::jsonb,
        score NUMERIC(10, 2),
        max_score NUMERIC(10, 2),
        correct INT,
        incorrect INT,
        unanswered INT,
        result JSONB,
        UNIQUE (exam_id, student_id)
      );
    `);
  }

  private persist() {
    if (this.pool) return;
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.mem, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist classroom store:', err);
    }
  }

  // ------------------------------------------------------------------ classrooms

  public async createClassroom(c: Classroom): Promise<Classroom> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      await pool.query(
        `INSERT INTO classrooms (id, teacher_id, name, description, subject, join_code, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [c.id, c.teacher_id, c.name, c.description, c.subject, c.join_code, c.created_at, c.updated_at]
      );
      return c;
    }
    if (this.mem.classrooms.some((x) => x.join_code === c.join_code)) {
      const err: any = new Error('duplicate join code');
      err.code = '23505';
      throw err;
    }
    this.mem.classrooms.push(clone(c));
    this.persist();
    return c;
  }

  public async updateClassroom(c: Classroom): Promise<Classroom> {
    await this.ready();
    c.updated_at = new Date().toISOString();
    const pool = this.pool;
    if (pool) {
      await pool.query(
        'UPDATE classrooms SET name = $1, description = $2, subject = $3, join_code = $4, updated_at = $5 WHERE id = $6',
        [c.name, c.description, c.subject, c.join_code, c.updated_at, c.id]
      );
      return c;
    }
    const idx = this.mem.classrooms.findIndex((x) => x.id === c.id);
    if (idx >= 0) this.mem.classrooms[idx] = clone(c);
    this.persist();
    return c;
  }

  public async deleteClassroom(id: string): Promise<void> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      await pool.query('DELETE FROM classrooms WHERE id = $1', [id]);
      return;
    }
    const examIds = this.mem.exams.filter((e) => e.classroom_id === id).map((e) => e.id);
    this.mem.classrooms = this.mem.classrooms.filter((c) => c.id !== id);
    this.mem.members = this.mem.members.filter((m) => m.classroom_id !== id);
    this.mem.exams = this.mem.exams.filter((e) => e.classroom_id !== id);
    this.mem.participants = this.mem.participants.filter((p) => !examIds.includes(p.exam_id));
    this.mem.attempts = this.mem.attempts.filter((a) => !examIds.includes(a.exam_id));
    this.persist();
  }

  public async getClassroom(id: string): Promise<Classroom | undefined> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query('SELECT * FROM classrooms WHERE id = $1', [id]);
      return res.rows[0] ? mapClassroom(res.rows[0]) : undefined;
    }
    const c = this.mem.classrooms.find((x) => x.id === id);
    return c ? clone(c) : undefined;
  }

  public async getClassroomByCode(code: string): Promise<Classroom | undefined> {
    await this.ready();
    const clean = code.trim().toUpperCase();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query('SELECT * FROM classrooms WHERE join_code = $1', [clean]);
      return res.rows[0] ? mapClassroom(res.rows[0]) : undefined;
    }
    const c = this.mem.classrooms.find((x) => x.join_code === clean);
    return c ? clone(c) : undefined;
  }

  public async listClassroomsByTeacher(teacherId: string): Promise<ClassroomSummary[]> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query(
        `SELECT c.*,
           (SELECT COUNT(*) FROM classroom_members m WHERE m.classroom_id = c.id) AS member_count,
           (SELECT COUNT(*) FROM classroom_exams e WHERE e.classroom_id = c.id AND e.status <> 'cancelled') AS exam_count
         FROM classrooms c WHERE c.teacher_id = $1 ORDER BY c.created_at DESC`,
        [teacherId]
      );
      return res.rows.map((r: any) => ({
        ...mapClassroom(r),
        member_count: Number(r.member_count) || 0,
        exam_count: Number(r.exam_count) || 0,
      }));
    }
    return this.mem.classrooms
      .filter((c) => c.teacher_id === teacherId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((c) => ({
        ...clone(c),
        member_count: this.mem.members.filter((m) => m.classroom_id === c.id).length,
        exam_count: this.mem.exams.filter((e) => e.classroom_id === c.id && e.status !== 'cancelled').length,
      }));
  }

  public async listClassroomsForStudent(studentId: string): Promise<(Classroom & { teacher_name: string | null; joined_at: string })[]> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query(
        `SELECT c.*, u.name AS teacher_name, m.joined_at AS member_joined_at
         FROM classroom_members m
         JOIN classrooms c ON c.id = m.classroom_id
         LEFT JOIN users u ON u.id = c.teacher_id
         WHERE m.student_id = $1 ORDER BY m.joined_at DESC`,
        [studentId]
      );
      return res.rows.map((r: any) => ({ ...mapClassroom(r), teacher_name: r.teacher_name, joined_at: iso(r.member_joined_at) }));
    }
    return this.mem.members
      .filter((m) => m.student_id === studentId)
      .map((m) => {
        const c = this.mem.classrooms.find((x) => x.id === m.classroom_id);
        if (!c) return null;
        const teacher = db.getUserById(c.teacher_id);
        return { ...clone(c), teacher_name: teacher?.name || null, joined_at: m.joined_at };
      })
      .filter(Boolean) as any;
  }

  // ------------------------------------------------------------------ members

  /** Returns true when the student was newly added. */
  public async addMember(classroomId: string, studentId: string, addedVia: string): Promise<boolean> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query(
        `INSERT INTO classroom_members (classroom_id, student_id, added_via) VALUES ($1, $2, $3)
         ON CONFLICT (classroom_id, student_id) DO NOTHING`,
        [classroomId, studentId, addedVia]
      );
      return (res.rowCount || 0) > 0;
    }
    if (this.mem.members.some((m) => m.classroom_id === classroomId && m.student_id === studentId)) return false;
    this.mem.members.push({ classroom_id: classroomId, student_id: studentId, added_via: addedVia, joined_at: new Date().toISOString() });
    this.persist();
    return true;
  }

  public async removeMember(classroomId: string, studentId: string): Promise<boolean> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query('DELETE FROM classroom_members WHERE classroom_id = $1 AND student_id = $2', [classroomId, studentId]);
      return (res.rowCount || 0) > 0;
    }
    const before = this.mem.members.length;
    this.mem.members = this.mem.members.filter((m) => !(m.classroom_id === classroomId && m.student_id === studentId));
    this.persist();
    return this.mem.members.length < before;
  }

  public async listMembers(classroomId: string): Promise<ClassroomMember[]> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query('SELECT * FROM classroom_members WHERE classroom_id = $1 ORDER BY joined_at ASC', [classroomId]);
      return res.rows.map((r: any) => ({ ...r, joined_at: iso(r.joined_at) }));
    }
    return clone(this.mem.members.filter((m) => m.classroom_id === classroomId));
  }

  public async isMember(classroomId: string, studentId: string): Promise<boolean> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query('SELECT 1 FROM classroom_members WHERE classroom_id = $1 AND student_id = $2', [classroomId, studentId]);
      return res.rows.length > 0;
    }
    return this.mem.members.some((m) => m.classroom_id === classroomId && m.student_id === studentId);
  }

  // ------------------------------------------------------------------ exams

  public async createExam(e: ClassroomExam, participantIds: string[]): Promise<ClassroomExam> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO classroom_exams (id, classroom_id, teacher_id, title, instructions, paper, exam_type, subject,
             question_count, total_marks, duration_minutes, starts_at, ends_at, show_results, shuffle_questions,
             status, seats_paid, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
          [
            e.id, e.classroom_id, e.teacher_id, e.title, e.instructions, JSON.stringify(e.paper), e.exam_type, e.subject,
            e.question_count, e.total_marks, e.duration_minutes, e.starts_at, e.ends_at, e.show_results,
            e.shuffle_questions, e.status, e.seats_paid, e.created_at, e.updated_at,
          ]
        );
        if (participantIds.length) {
          await client.query(
            `INSERT INTO exam_participants (exam_id, student_id)
             SELECT $1, UNNEST($2::varchar[]) ON CONFLICT DO NOTHING`,
            [e.id, participantIds]
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw err;
      } finally {
        client.release();
      }
      return e;
    }
    this.mem.exams.push(clone(e));
    participantIds.forEach((sid) => this.mem.participants.push({ exam_id: e.id, student_id: sid }));
    this.persist();
    return e;
  }

  public async updateExam(e: ClassroomExam): Promise<ClassroomExam> {
    await this.ready();
    e.updated_at = new Date().toISOString();
    const pool = this.pool;
    if (pool) {
      await pool.query(
        `UPDATE classroom_exams SET title = $1, instructions = $2, duration_minutes = $3, starts_at = $4, ends_at = $5,
           show_results = $6, shuffle_questions = $7, status = $8, seats_paid = $9, updated_at = $10
         WHERE id = $11`,
        [e.title, e.instructions, e.duration_minutes, e.starts_at, e.ends_at, e.show_results, e.shuffle_questions, e.status, e.seats_paid, e.updated_at, e.id]
      );
      return e;
    }
    const idx = this.mem.exams.findIndex((x) => x.id === e.id);
    if (idx >= 0) this.mem.exams[idx] = clone(e);
    this.persist();
    return e;
  }

  public async getExam(id: string): Promise<ClassroomExam | undefined> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query('SELECT * FROM classroom_exams WHERE id = $1', [id]);
      return res.rows[0] ? mapExam(res.rows[0]) : undefined;
    }
    const e = this.mem.exams.find((x) => x.id === id);
    return e ? clone(e) : undefined;
  }

  /** Exams of a classroom with participant / submission counts (paper omitted). */
  public async listExamsByClassroom(classroomId: string): Promise<(ClassroomExam & { participant_count: number; submitted_count: number })[]> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query(
        `SELECT e.id, e.classroom_id, e.teacher_id, e.title, e.instructions, NULL::jsonb AS paper, e.exam_type, e.subject,
           e.question_count, e.total_marks, e.duration_minutes, e.starts_at, e.ends_at, e.show_results, e.shuffle_questions,
           e.status, e.seats_paid, e.created_at, e.updated_at,
           (SELECT COUNT(*) FROM exam_participants p WHERE p.exam_id = e.id) AS participant_count,
           (SELECT COUNT(*) FROM exam_attempts a WHERE a.exam_id = e.id AND a.status <> 'in_progress') AS submitted_count
         FROM classroom_exams e WHERE e.classroom_id = $1 ORDER BY e.starts_at DESC`,
        [classroomId]
      );
      return res.rows.map((r: any) => ({
        ...mapExam(r),
        participant_count: Number(r.participant_count) || 0,
        submitted_count: Number(r.submitted_count) || 0,
      }));
    }
    return this.mem.exams
      .filter((e) => e.classroom_id === classroomId)
      .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
      .map((e) => ({
        ...clone({ ...e, paper: null }),
        participant_count: this.mem.participants.filter((p) => p.exam_id === e.id).length,
        submitted_count: this.mem.attempts.filter((a) => a.exam_id === e.id && a.status !== 'in_progress').length,
      }));
  }

  /** Exams a student is a participant of (paper omitted), with classroom name. */
  public async listExamsForStudent(studentId: string): Promise<(ClassroomExam & { classroom_name: string })[]> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query(
        `SELECT e.id, e.classroom_id, e.teacher_id, e.title, e.instructions, NULL::jsonb AS paper, e.exam_type, e.subject,
           e.question_count, e.total_marks, e.duration_minutes, e.starts_at, e.ends_at, e.show_results, e.shuffle_questions,
           e.status, e.seats_paid, e.created_at, e.updated_at, c.name AS classroom_name
         FROM exam_participants p
         JOIN classroom_exams e ON e.id = p.exam_id
         JOIN classrooms c ON c.id = e.classroom_id
         WHERE p.student_id = $1 AND e.status = 'scheduled'
         ORDER BY e.starts_at DESC`,
        [studentId]
      );
      return res.rows.map((r: any) => ({ ...mapExam(r), classroom_name: r.classroom_name }));
    }
    const ids = this.mem.participants.filter((p) => p.student_id === studentId).map((p) => p.exam_id);
    return this.mem.exams
      .filter((e) => ids.includes(e.id) && e.status === 'scheduled')
      .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
      .map((e) => ({
        ...clone({ ...e, paper: null }),
        classroom_name: this.mem.classrooms.find((c) => c.id === e.classroom_id)?.name || '',
      }));
  }

  public async listParticipantIds(examId: string): Promise<string[]> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query('SELECT student_id FROM exam_participants WHERE exam_id = $1', [examId]);
      return res.rows.map((r: any) => r.student_id);
    }
    return this.mem.participants.filter((p) => p.exam_id === examId).map((p) => p.student_id);
  }

  public async isParticipant(examId: string, studentId: string): Promise<boolean> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query('SELECT 1 FROM exam_participants WHERE exam_id = $1 AND student_id = $2', [examId, studentId]);
      return res.rows.length > 0;
    }
    return this.mem.participants.some((p) => p.exam_id === examId && p.student_id === studentId);
  }

  public async setParticipants(examId: string, studentIds: string[]): Promise<void> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM exam_participants WHERE exam_id = $1', [examId]);
        if (studentIds.length) {
          await client.query(
            'INSERT INTO exam_participants (exam_id, student_id) SELECT $1, UNNEST($2::varchar[]) ON CONFLICT DO NOTHING',
            [examId, studentIds]
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw err;
      } finally {
        client.release();
      }
      return;
    }
    this.mem.participants = this.mem.participants.filter((p) => p.exam_id !== examId);
    studentIds.forEach((sid) => this.mem.participants.push({ exam_id: examId, student_id: sid }));
    this.persist();
  }

  // ------------------------------------------------------------------ attempts

  public async getAttempt(examId: string, studentId: string): Promise<ExamAttempt | undefined> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query('SELECT * FROM exam_attempts WHERE exam_id = $1 AND student_id = $2', [examId, studentId]);
      return res.rows[0] ? mapAttempt(res.rows[0]) : undefined;
    }
    const a = this.mem.attempts.find((x) => x.exam_id === examId && x.student_id === studentId);
    return a ? clone(a) : undefined;
  }

  /** Inserts the attempt, or returns the existing one if the student already started (double click / two tabs). */
  public async createAttempt(a: ExamAttempt): Promise<ExamAttempt> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      await pool.query(
        `INSERT INTO exam_attempts (id, exam_id, student_id, status, started_at, deadline_at, question_order, answers)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (exam_id, student_id) DO NOTHING`,
        [a.id, a.exam_id, a.student_id, a.status, a.started_at, a.deadline_at, JSON.stringify(a.question_order), JSON.stringify(a.answers)]
      );
      return (await this.getAttempt(a.exam_id, a.student_id))!;
    }
    const existing = this.mem.attempts.find((x) => x.exam_id === a.exam_id && x.student_id === a.student_id);
    if (existing) return clone(existing);
    this.mem.attempts.push(clone(a));
    this.persist();
    return a;
  }

  public async saveAnswers(attemptId: string, answers: Record<string, AnswerEntry>): Promise<boolean> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query(
        `UPDATE exam_attempts SET answers = $1 WHERE id = $2 AND status = 'in_progress'`,
        [JSON.stringify(answers), attemptId]
      );
      return (res.rowCount || 0) > 0;
    }
    const a = this.mem.attempts.find((x) => x.id === attemptId);
    if (!a || a.status !== 'in_progress') return false;
    a.answers = clone(answers);
    this.persist();
    return true;
  }

  /** Finalizes an in-progress attempt. Returns false if it was already finalized (first submit wins). */
  public async finalizeAttempt(a: ExamAttempt): Promise<boolean> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query(
        `UPDATE exam_attempts SET status = $1, submitted_at = $2, answers = $3, score = $4, max_score = $5,
           correct = $6, incorrect = $7, unanswered = $8, result = $9
         WHERE id = $10 AND status = 'in_progress'`,
        [a.status, a.submitted_at, JSON.stringify(a.answers), a.score, a.max_score, a.correct, a.incorrect, a.unanswered, JSON.stringify(a.result), a.id]
      );
      return (res.rowCount || 0) > 0;
    }
    const idx = this.mem.attempts.findIndex((x) => x.id === a.id);
    if (idx < 0 || this.mem.attempts[idx].status !== 'in_progress') return false;
    this.mem.attempts[idx] = clone(a);
    this.persist();
    return true;
  }

  public async listAttempts(examId: string): Promise<ExamAttempt[]> {
    await this.ready();
    const pool = this.pool;
    if (pool) {
      const res = await pool.query('SELECT * FROM exam_attempts WHERE exam_id = $1', [examId]);
      return res.rows.map(mapAttempt);
    }
    return clone(this.mem.attempts.filter((a) => a.exam_id === examId));
  }
}

export const classroomStore = new ClassroomStore();
