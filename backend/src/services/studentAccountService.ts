import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import { Subject, User, UserSource } from '../types';
import { examprepLogin } from './examprepService';

export function newStudentId(): string {
  return 'stu_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export interface EnsureStudentInput {
  email: string;
  name?: string;
  source: UserSource;
  examprepId?: string;
  phone?: string;
  classLevel?: string;
}

export type EnsureStudentResult =
  | { ok: true; user: User; created: boolean }
  | { ok: false; error: string };

/**
 * Finds a student by email or creates a placeholder account for them (no password yet).
 * The real person claims the account later by signing up with an email OTP, or by signing
 * in with their ExamPrep credentials.
 */
export async function ensureStudentAccount(input: EnsureStudentInput): Promise<EnsureStudentResult> {
  const email = (input.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) return { ok: false, error: 'Invalid email address' };

  const existing = await db.findUserByEmail(email);
  if (existing) {
    if (existing.role !== 'student') {
      return { ok: false, error: 'This email belongs to a teacher account' };
    }
    let changed = false;
    if (input.examprepId && !existing.examprep_id) {
      existing.examprep_id = input.examprepId;
      changed = true;
    }
    if (!existing.class_level && input.classLevel) {
      existing.class_level = input.classLevel;
      changed = true;
    }
    if (changed) await db.updateUser(existing);
    return { ok: true, user: existing, created: false };
  }

  const user: User = {
    id: newStudentId(),
    email,
    name: (input.name || '').trim() || email.split('@')[0],
    subject: undefined as unknown as Subject, // students have no locked subject (NULL in Postgres)
    role: 'student',
    source: input.source,
    examprep_id: input.examprepId,
    phone: input.phone,
    class_level: input.classLevel,
    created_at: new Date().toISOString(),
  };
  try {
    await db.createUser(user);
  } catch (e: any) {
    return { ok: false, error: e.message || 'Could not create student account' };
  }
  return { ok: true, user, created: true };
}

export type BridgeResult =
  | { ok: true; user: User; created: boolean }
  | { ok: false; status: number; error: string; message: string };

/**
 * Signs a student in with ExamPrep credentials and creates / links their QPG account.
 *
 * Only runs for emails that have no QPG account, a placeholder without a password, or an
 * account that came from ExamPrep. A QPG-native account is never taken over this way,
 * because ExamPrep does not verify email ownership at registration.
 */
export async function loginViaExamprep(email: string, password: string, local?: User): Promise<BridgeResult> {
  if (local && local.role !== 'student') {
    return { ok: false, status: 401, error: 'INVALID_CREDENTIALS', message: 'Incorrect password.' };
  }
  if (local && local.password && local.source !== 'examprep') {
    return { ok: false, status: 401, error: 'INVALID_CREDENTIALS', message: 'Incorrect password.' };
  }

  const remote = await examprepLogin(email, password);
  if (!remote.ok) {
    if (remote.reason === 'unreachable') {
      return { ok: false, status: 503, error: 'EXAMPREP_UNREACHABLE', message: remote.message };
    }
    return {
      ok: false,
      status: remote.reason === 'suspended' ? 403 : 401,
      error: remote.reason === 'suspended' ? 'EXAMPREP_SUSPENDED' : 'INVALID_CREDENTIALS',
      message: local ? 'Incorrect password.' : 'No account found with this email and password (checked QPG and ExamPrep).',
    };
  }

  if (remote.user.role !== 'student') {
    return {
      ok: false,
      status: 403,
      error: 'EXAMPREP_NOT_STUDENT',
      message: 'Only ExamPrep student accounts can sign in here. Teachers should use the teacher sign-up.',
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (local) {
    local.password = passwordHash;
    local.source = 'examprep';
    local.examprep_id = remote.user.id || local.examprep_id;
    if (!local.name || local.name === local.email.split('@')[0]) local.name = remote.user.name || local.name;
    await db.updateUser(local);
    await db.logAudit('EXAMPREP_ACCOUNT_LINKED', local.email, { userId: local.id, examprepId: local.examprep_id });
    return { ok: true, user: local, created: false };
  }

  const user: User = {
    id: newStudentId(),
    email: remote.user.email,
    password: passwordHash,
    name: remote.user.name || remote.user.email.split('@')[0],
    subject: undefined as unknown as Subject,
    role: 'student',
    source: 'examprep',
    examprep_id: remote.user.id,
    created_at: new Date().toISOString(),
  };
  await db.createUser(user);
  await db.logAudit('EXAMPREP_STUDENT_IMPORTED', user.email, { userId: user.id, examprepId: user.examprep_id });
  return { ok: true, user, created: true };
}
