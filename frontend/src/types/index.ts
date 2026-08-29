export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  learning_goal?: string;
  current_skill_level?: string;
  daily_study_time_minutes: number;
  preferred_explanation_style?: string;
  exam_date?: string;
  bio?: string;
}

export interface Course {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  subject?: string;
  status: string;
  overall_mastery: number;
  created_at: string;
  document_count?: number;
  topic_count?: number;
  weak_topics?: string[];
}

export interface Topic {
  id: number;
  course_id: number;
  name: string;
  description?: string;
  difficulty: string;
  order_index: number;
  prerequisites?: string[];
  learning_objectives?: string[];
  key_concepts?: string[];
  status: string;
  subtopics?: Subtopic[];
}

export interface Subtopic {
  id: number;
  name: string;
  description?: string;
  order_index: number;
}

export interface Document {
  id: number;
  course_id: number;
  original_filename: string;
  file_type: string;
  file_size: number;
  processing_status: string;
  total_chunks: number;
  created_at: string;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer';
  difficulty: string;
  topic_name?: string;
  options?: string[];
  order_index: number;
}

export interface Quiz {
  id: number;
  title: string;
  quiz_type: string;
  difficulty: string;
  total_questions: number;
  questions: Question[];
}

export interface StudyTask {
  id: number;
  study_plan_id: number;
  topic_id?: number;
  topic_name?: string;
  title: string;
  description?: string;
  activity_type: string;
  scheduled_date?: string;
  duration_minutes: number;
  priority: number;
  status: string;
  learning_objective?: string;
  completed_at?: string;
}

export interface StudyPlan {
  exists: boolean;
  id?: number;
  title?: string;
  description?: string;
  start_date?: string;
  is_active?: boolean;
  tasks?: StudyTask[];
}

export interface TopicMastery {
  topic_id: number;
  topic_name: string;
  mastery_score: number;
  weakness_level: string;
  quiz_count: number;
  last_studied?: string;
  last_quiz_score?: number;
}

export interface Mistake {
  id: number;
  question_text: string;
  student_answer?: string;
  correct_answer: string;
  explanation?: string;
  topic_name?: string;
  difficulty?: string;
  occurrence_count: number;
  is_resolved: boolean;
  last_occurred_at: string;
  course_id: number;
}

export interface ProgressData {
  overall_mastery: number;
  total_study_minutes: number;
  topics_mastered: number;
  total_topics: number;
  quiz_attempts: number;
  average_quiz_score: number;
  weak_topics: TopicMastery[];
  mastery_by_topic: TopicMastery[];
  recent_quiz_scores: { date: string; score: number; topic: string }[];
  study_streak_days: number;
}

export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  used_rag?: boolean;
  created_at: string;
}

export interface AdaptiveRecommendation {
  action: string;
  topic: string;
  reason: string;
  difficulty: string;
  recommended_duration: number;
  specific_focus: string;
  mastery_score?: number;
  weakness_level?: string;
}
