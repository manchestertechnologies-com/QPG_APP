export type Subject = 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology';
export type ClassLevel = '11' | '12';
export type ExamType = 'NEET' | 'JEE' | 'KCET' | 'CET' | 'CUSTOM';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type QuestionType = 'mcq_single' | 'assertion_reason' | 'numerical' | 'match_options' | 'all';

export interface User {
  id: string;
  email: string;
  password?: string;
  name?: string;
  institution?: string;
  subject: Subject; // Locked specialization for individual teacher
  role: 'teacher' | 'admin';
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  amount: number;
  status: 'active' | 'expired' | 'pending';
  started_at: string | null;
  expires_at: string | null;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_subject: Subject;
  amount: number;
  utr: string;
  payment_time: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface Question {
  id: string;
  subject: string;
  klass: string;
  chapter: string;
  topic?: string;
  exams?: string[] | string;
  q_type: string;
  question: string;
  opt_a?: string;
  opt_b?: string;
  opt_c?: string;
  opt_d?: string;
  assertion?: string;
  reason?: string;
  column_a?: string;
  column_b?: string;
  match_options?: string;
  num_answer?: string;
  correct_option?: string;
  solution_text?: string;
  difficulty?: DifficultyLevel;
  source?: string;
  year?: string;
}

export interface PaperGenerationConfig {
  title: string;
  institution_name: string;
  exam_type: ExamType;
  subject: Subject;
  class_levels: ClassLevel[];
  chapters: string[];
  total_questions: number;
  difficulty_distribution?: {
    easy_percent: number;
    medium_percent: number;
    hard_percent: number;
  };
  duration_minutes: number;
  marks_per_question: number;
  negative_marking: number;
  include_answer_key: boolean;
  include_solutions: boolean;
  sections?: {
    name: string;
    description?: string;
    total_questions: number;
    attempt_questions: number;
    marks_per_question: number;
    negative_marking: number;
    q_types?: string[];
  }[];
  custom_instructions?: string[];
}

export interface GeneratedPaper {
  id: string;
  user_id: string;
  title: string;
  institution_name: string;
  subject: Subject;
  exam_type: ExamType;
  class_levels: ClassLevel[];
  duration_minutes: number;
  total_marks: number;
  questions_count: number;
  sections: {
    name: string;
    description?: string;
    attempt_count: number;
    marks_per_question: number;
    negative_marking: number;
    questions: Question[];
  }[];
  all_questions: Question[];
  answer_key: { q_no: number; answer: string; num_answer?: string }[];
  instructions: string[];
  created_at: string;
}
