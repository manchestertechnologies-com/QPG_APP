-- ========================================================
-- QPG (Question Paper Generator) - Production Database Schema
-- Run this script in your new PostgreSQL or Supabase SQL Editor
-- ========================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('teacher', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE teacher_subject AS ENUM ('Mathematics', 'Physics', 'Chemistry', 'Biology');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'pending', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Users Table (One email = One account, Subject Locked)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255),
    institution VARCHAR(255),
    subject teacher_subject NOT NULL,
    role user_role DEFAULT 'teacher',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subject ON users(subject);

-- 3. One-Time Password (OTP) Authentication Table
CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);

-- 4. Subscriptions Table (₹299 / Calendar Month)
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(64) DEFAULT 'Premium Monthly',
    amount NUMERIC(10, 2) DEFAULT 299.00,
    status subscription_status DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);

-- 5. UPI Payment Verification Requests Table
CREATE TABLE IF NOT EXISTS payment_requests (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_subject teacher_subject NOT NULL,
    amount NUMERIC(10, 2) DEFAULT 299.00,
    utr VARCHAR(64) UNIQUE NOT NULL, -- Prevents duplicate UTR submissions
    payment_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    status payment_status DEFAULT 'pending',
    rejection_reason TEXT,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_utr ON payment_requests(utr);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON payment_requests(user_id);

-- 6. Administrative Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(128) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ========================================================
-- Students + Online Classrooms & Exams
-- (The API also creates / migrates these automatically on startup.)
-- ========================================================

-- Students share the users table (role = 'student'); they have no locked subject.
ALTER TABLE users ALTER COLUMN subject DROP NOT NULL;
ALTER TABLE users ALTER COLUMN subject TYPE VARCHAR(64);
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS class_level VARCHAR(16);          -- '11' | '12' | 'dropper'
ALTER TABLE users ADD COLUMN IF NOT EXISTS source VARCHAR(16) DEFAULT 'qpg'; -- 'qpg' | 'examprep' | 'invited'
ALTER TABLE users ADD COLUMN IF NOT EXISTS examprep_id VARCHAR(64);         -- linked ExamPrep (MongoDB) user id

-- Exam seat payments reuse the UPI/UTR verification queue
ALTER TABLE payment_requests ALTER COLUMN user_subject DROP NOT NULL;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS purpose VARCHAR(32) DEFAULT 'subscription'; -- or 'exam_seats'
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS exam_id VARCHAR(64);

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

CREATE TABLE IF NOT EXISTS classroom_members (
    classroom_id VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_via VARCHAR(16) DEFAULT 'email', -- 'email' | 'examprep' | 'join_code'
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (classroom_id, student_id)
);

CREATE TABLE IF NOT EXISTS classroom_exams (
    id VARCHAR(64) PRIMARY KEY,
    classroom_id VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    paper JSONB NOT NULL,                      -- full QPG paper incl. answers (never sent to students)
    exam_type VARCHAR(32),
    subject VARCHAR(64),
    question_count INT DEFAULT 0,
    total_marks NUMERIC(10, 2) DEFAULT 0,
    duration_minutes INT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    show_results VARCHAR(16) DEFAULT 'after_submit', -- 'after_submit' | 'after_end' | 'never'
    shuffle_questions BOOLEAN DEFAULT FALSE,
    status VARCHAR(24) NOT NULL,               -- 'payment_pending' | 'scheduled' | 'cancelled'
    seats_paid INT DEFAULT 10,                 -- free seats + seats bought at ₹25 each
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_participants (
    exam_id VARCHAR(64) NOT NULL REFERENCES classroom_exams(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS exam_attempts (
    id VARCHAR(64) PRIMARY KEY,
    exam_id VARCHAR(64) NOT NULL REFERENCES classroom_exams(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,               -- 'in_progress' | 'submitted' | 'auto_submitted'
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
