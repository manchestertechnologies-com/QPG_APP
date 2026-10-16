export type Subject = 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology';
export type ClassLevel = '11' | '12';
export type ExamType = 'NEET' | 'JEE' | 'KCET' | 'CET' | 'CUSTOM';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface User {
  id: string;
  email: string;
  name?: string;
  institution?: string;
  subject: Subject;
  role: 'teacher' | 'admin';
}

export interface SubscriptionStatus {
  hasSubscription: boolean;
  isActive: boolean;
  status: 'active' | 'expired' | 'none';
  plan: string;
  amount: number;
  startedAt: string | null;
  expiresAt: string | null;
  daysRemaining: number;
  hoursRemaining: number;
  formattedExpiry: string | null;
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
  duration_minutes: number;
  marks_per_question: number;
  negative_marking: number;
  include_answer_key: boolean;
  include_solutions: boolean;
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

export interface PaymentRequest {
  id: string;
  user_id: string;
  amount: number;
  utr: string;
  payment_time: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}
