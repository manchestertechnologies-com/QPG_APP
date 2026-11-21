/**
 * ExamPrep integration.
 *
 * ExamPrep (github.com/pallavids359-star/examprep-ai) is a separate MERN app whose
 * students live in MongoDB. QPG connects to it in two ways:
 *
 *  1. Login bridge (always on): an ExamPrep student signs in to QPG with their ExamPrep
 *     email + password. QPG verifies the credentials against ExamPrep's public
 *     POST /api/auth/login and then creates / links a student row in QPG's own database.
 *
 *  2. Direct directory (optional, EXAMPREP_MONGO_URI): teachers search ExamPrep's student
 *     list and import students into their classrooms. Read-only.
 */
import { config } from '../config';

export interface ExamprepStudent {
  examprepId: string;
  name: string;
  email: string;
  phone?: string;
  classLevel?: string;
}

export type ExamprepLoginResult =
  | { ok: true; user: { id: string; name: string; email: string; role: string } }
  | { ok: false; reason: 'invalid' | 'suspended' | 'unreachable'; message: string };

export async function examprepLogin(email: string, password: string): Promise<ExamprepLoginResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.examprep.timeoutMs);
  try {
    const resp = await fetch(`${config.examprep.apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      signal: controller.signal,
    });
    const data: any = await resp.json().catch(() => ({}));
    if (resp.ok && data && data.user && data.user.email) {
      return {
        ok: true,
        user: {
          id: String(data.user.id || data.user._id || ''),
          name: String(data.user.name || ''),
          email: String(data.user.email).toLowerCase(),
          role: String(data.user.role || 'student'),
        },
      };
    }
    if (resp.status === 401 || resp.status === 400) {
      return { ok: false, reason: 'invalid', message: 'Invalid ExamPrep email or password.' };
    }
    if (resp.status === 403) {
      return { ok: false, reason: 'suspended', message: data.message || 'Your ExamPrep account is suspended.' };
    }
    return { ok: false, reason: 'unreachable', message: `ExamPrep responded with status ${resp.status}.` };
  } catch (err: any) {
    return {
      ok: false,
      reason: 'unreachable',
      message: err?.name === 'AbortError' ? 'ExamPrep took too long to respond (server may be waking up).' : 'Could not reach ExamPrep.',
    };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Optional direct read access to ExamPrep's MongoDB
// ---------------------------------------------------------------------------

let mongoClientPromise: Promise<any> | null = null;

export function examprepDirectoryEnabled(): boolean {
  return !!config.examprep.mongoUri;
}

async function getUsersCollection(): Promise<any> {
  if (!config.examprep.mongoUri) throw new Error('ExamPrep directory is not configured (EXAMPREP_MONGO_URI).');
  if (!mongoClientPromise) {
    // Loaded lazily so deployments without the integration never need the driver.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(config.examprep.mongoUri, { serverSelectionTimeoutMS: 15000, maxPoolSize: 3 });
    mongoClientPromise = client.connect().catch((err: any) => {
      mongoClientPromise = null;
      throw err;
    });
  }
  const client = await mongoClientPromise;
  return client.db().collection('users');
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toStudent(doc: any): ExamprepStudent {
  return {
    examprepId: String(doc._id),
    name: doc.name || String(doc.email || '').split('@')[0],
    email: String(doc.email || '').toLowerCase(),
    phone: doc.phone || undefined,
    classLevel: doc.classLevel || undefined,
  };
}

const STUDENT_PROJECTION = { name: 1, email: 1, phone: 1, classLevel: 1 };

export async function searchExamprepStudents(query: string, limit = 30): Promise<ExamprepStudent[]> {
  const users = await getUsersCollection();
  const filter: any = { role: 'student', status: { $ne: 'suspended' } };
  const q = (query || '').trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const docs = await users
    .find(filter, { projection: STUDENT_PROJECTION })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 100))
    .toArray();
  return docs.map(toStudent);
}

export async function getExamprepStudentsByIds(ids: string[]): Promise<ExamprepStudent[]> {
  if (ids.length === 0) return [];
  const { ObjectId } = require('mongodb');
  const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  const users = await getUsersCollection();
  const docs = await users
    .find({ _id: { $in: objectIds }, role: 'student' }, { projection: STUDENT_PROJECTION })
    .toArray();
  return docs.map(toStudent);
}
