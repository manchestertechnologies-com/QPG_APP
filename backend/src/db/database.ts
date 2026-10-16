import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { User, Subscription, PaymentRequest } from '../types';
import { config } from '../config';

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  details: any;
  created_at: string;
}

export interface StoredOtp {
  email: string;
  code: string;
  expires_at: number;
}

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'db_store.json');

interface Schema {
  users: User[];
  subscriptions: Subscription[];
  payment_requests: PaymentRequest[];
  otps: StoredOtp[];
  audit_logs: AuditLog[];
}

export class AppDatabase {
  private data: Schema = {
    users: [],
    subscriptions: [],
    payment_requests: [],
    otps: [],
    audit_logs: [],
  };

  private pgPool: Pool | null = null;
  public readyPromise: Promise<void>;

  constructor() {
    this.initFileStore();
    this.readyPromise = this.initPostgres();
  }

  private initFileStore() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error loading db store, initializing fresh:', err);
        this.persist();
      }
    } else {
      this.persist();
    }
  }

  private async initPostgres(): Promise<void> {
    if (!config.databaseUrl) {
      console.log('📦 Using embedded persistent storage (DATABASE_URL not set).');
      return;
    }

    try {
      console.log('🔌 Connecting to PostgreSQL database...');
      this.pgPool = new Pool({
        connectionString: config.databaseUrl,
        ssl: config.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      });

      // Test connection & ensure tables
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255),
          name VARCHAR(255),
          institution VARCHAR(255),
          subject VARCHAR(64) NOT NULL,
          role VARCHAR(32) DEFAULT 'teacher',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

        CREATE TABLE IF NOT EXISTS subscriptions (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          plan_name VARCHAR(64) DEFAULT 'Premium Monthly',
          amount NUMERIC(10, 2) DEFAULT 299.00,
          status VARCHAR(32) DEFAULT 'pending',
          started_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ,
          payment_reference VARCHAR(128),
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payment_requests (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          user_email VARCHAR(255) NOT NULL,
          user_subject VARCHAR(64) NOT NULL,
          amount NUMERIC(10, 2) DEFAULT 299.00,
          utr VARCHAR(64) UNIQUE NOT NULL,
          payment_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          note TEXT,
          status VARCHAR(32) DEFAULT 'pending',
          rejection_reason TEXT,
          verified_by VARCHAR(255),
          verified_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(64) PRIMARY KEY,
          action VARCHAR(128) NOT NULL,
          actor VARCHAR(255) NOT NULL,
          details JSONB,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('✅ PostgreSQL schema verified successfully.');

      // Hydrate in-memory store from PostgreSQL
      const usersRes = await this.pgPool.query('SELECT * FROM users');
      if (usersRes.rows.length > 0) {
        this.data.users = usersRes.rows.map((r: any) => ({
          id: r.id,
          email: r.email,
          password: r.password || undefined,
          name: r.name,
          institution: r.institution,
          subject: r.subject,
          role: r.role,
          created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        }));
      }

      const subsRes = await this.pgPool.query('SELECT * FROM subscriptions');
      if (subsRes.rows.length > 0) {
        this.data.subscriptions = subsRes.rows.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          plan_name: r.plan_name,
          amount: parseFloat(r.amount) || 299,
          status: r.status,
          started_at: r.started_at ? new Date(r.started_at).toISOString() : null,
          expires_at: r.expires_at ? new Date(r.expires_at).toISOString() : null,
          payment_reference: r.payment_reference,
          created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
        }));
      }

      const payRes = await this.pgPool.query('SELECT * FROM payment_requests');
      if (payRes.rows.length > 0) {
        this.data.payment_requests = payRes.rows.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          user_email: r.user_email,
          user_subject: r.user_subject,
          amount: parseFloat(r.amount) || 299,
          utr: r.utr,
          payment_time: r.payment_time ? new Date(r.payment_time).toISOString() : new Date().toISOString(),
          note: r.note || '',
          status: r.status,
          rejection_reason: r.rejection_reason,
          verified_by: r.verified_by,
          verified_at: r.verified_at ? new Date(r.verified_at).toISOString() : undefined,
          created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        }));
      }

      console.log(`📦 Loaded ${this.data.users.length} users and ${this.data.subscriptions.length} subscriptions from PostgreSQL.`);
      this.persist();
    } catch (err: any) {
      console.error('⚠️ PostgreSQL connection error:', err.message);
    }
  }

  private persist() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  // --- User Operations ---
  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public async createUser(user: User): Promise<User> {
    const existing = this.getUserByEmail(user.email);
    if (existing) {
      throw new Error('An account already exists with this email address');
    }
    this.data.users.push(user);
    this.persist();

    if (this.pgPool) {
      try {
        await this.pgPool.query(
          'INSERT INTO users (id, email, password, name, institution, subject, role, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [user.id, user.email, user.password || null, user.name, user.institution, user.subject, user.role, user.created_at]
        );
      } catch (e: any) {
        console.error('PG Insert User Error:', e.message);
      }
    }

    return user;
  }

  public async updateUserSubject(userId: string, subject: User['subject']): Promise<User> {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.subject = subject;
    this.persist();

    if (this.pgPool) {
      try {
        await this.pgPool.query('UPDATE users SET subject = $1 WHERE id = $2', [subject, userId]);
      } catch (e: any) {
        console.error('PG Update Subject Error:', e.message);
      }
    }

    return user;
  }

  // --- OTP Operations ---
  public saveOtp(email: string, code: string, validityMinutes = 10): void {
    const expires_at = Date.now() + validityMinutes * 60 * 1000;
    this.data.otps = this.data.otps.filter(
      (o) => o.email.toLowerCase() !== email.toLowerCase()
    );
    this.data.otps.push({ email: email.toLowerCase(), code, expires_at });
    this.persist();
  }

  public verifyOtp(email: string, code: string): boolean {
    const record = this.data.otps.find(
      (o) => o.email.toLowerCase() !== email.toLowerCase()
    );
    if (!record) return false;
    if (Date.now() > record.expires_at) return false;
    if (record.code !== code.trim()) return false;

    this.data.otps = this.data.otps.filter(
      (o) => o.email.toLowerCase() !== email.toLowerCase()
    );
    this.persist();
    return true;
  }

  // --- Subscription Operations ---
  public getSubscriptionByUserId(userId: string): Subscription | undefined {
    return this.data.subscriptions.find((s) => s.user_id === userId);
  }

  public async createOrUpdateSubscription(sub: Subscription): Promise<Subscription> {
    const idx = this.data.subscriptions.findIndex((s) => s.user_id === sub.user_id);
    if (idx >= 0) {
      this.data.subscriptions[idx] = sub;
    } else {
      this.data.subscriptions.push(sub);
    }
    this.persist();

    if (this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO subscriptions (id, user_id, plan_name, amount, status, started_at, expires_at, payment_reference, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
             status = EXCLUDED.status,
             started_at = EXCLUDED.started_at,
             expires_at = EXCLUDED.expires_at,
             payment_reference = EXCLUDED.payment_reference,
             updated_at = EXCLUDED.updated_at`,
          [
            sub.id,
            sub.user_id,
            sub.plan_name,
            sub.amount,
            sub.status,
            sub.started_at,
            sub.expires_at,
            sub.payment_reference,
            sub.created_at,
            sub.updated_at,
          ]
        );
      } catch (e: any) {
        console.error('PG Subscription Upsert Error:', e.message);
      }
    }

    return sub;
  }

  // --- Payment Requests Operations ---
  public async createPaymentRequest(req: PaymentRequest): Promise<PaymentRequest> {
    const cleanUtr = req.utr.trim().toUpperCase();
    const duplicate = this.data.payment_requests.find(
      (p) => p.utr.trim().toUpperCase() === cleanUtr && p.status !== 'rejected'
    );
    if (duplicate) {
      throw new Error(`This transaction reference (UTR: ${req.utr}) has already been submitted.`);
    }

    this.data.payment_requests.push(req);
    this.persist();

    if (this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO payment_requests (id, user_id, user_email, user_subject, amount, utr, payment_time, note, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            req.id,
            req.user_id,
            req.user_email,
            req.user_subject,
            req.amount,
            req.utr,
            req.payment_time,
            req.note || '',
            req.status,
            req.created_at,
          ]
        );
      } catch (e: any) {
        console.error('PG Payment Insert Error:', e.message);
      }
    }

    return req;
  }

  public getPaymentRequests(status?: 'pending' | 'approved' | 'rejected'): PaymentRequest[] {
    if (status) {
      return this.data.payment_requests
        .filter((p) => p.status === status)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return [...this.data.payment_requests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getPaymentRequestById(id: string): PaymentRequest | undefined {
    return this.data.payment_requests.find((p) => p.id === id);
  }

  public async updatePaymentRequest(req: PaymentRequest): Promise<void> {
    const idx = this.data.payment_requests.findIndex((p) => p.id === req.id);
    if (idx >= 0) {
      this.data.payment_requests[idx] = req;
      this.persist();

      if (this.pgPool) {
        try {
          await this.pgPool.query(
            `UPDATE payment_requests SET
              status = $1,
              rejection_reason = $2,
              verified_by = $3,
              verified_at = $4
             WHERE id = $5`,
            [req.status, req.rejection_reason || null, req.verified_by || null, req.verified_at || null, req.id]
          );
        } catch (e: any) {
          console.error('PG Payment Update Error:', e.message);
        }
      }
    }
  }

  // --- Audit Logs ---
  public async logAudit(action: string, actor: string, details: any): Promise<void> {
    const log: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      action,
      actor,
      details,
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.push(log);
    this.persist();

    if (this.pgPool) {
      try {
        await this.pgPool.query(
          'INSERT INTO audit_logs (id, action, actor, details, created_at) VALUES ($1, $2, $3, $4, $5)',
          [log.id, log.action, log.actor, JSON.stringify(log.details), log.created_at]
        );
      } catch (e: any) {
        console.error('PG Audit Log Error:', e.message);
      }
    }
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.data.audit_logs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
}

export const db = new AppDatabase();
