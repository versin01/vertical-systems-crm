export interface CloserReport {
  id: string;
  closer_name: string;
  closer_role: string;
  
  // Call Statistics
  total_calls_scheduled: number;
  calls_completed: number;
  follow_up_calls_scheduled: number;
  
  // Sales Metrics
  revenue_generated: number;
  cash_collected: number;
  deposits: number;
  
  // Meeting Attendance
  sales_team_meetings: number;
  leadership_meetings: number;
  training_sessions: number;
  
  // Notes
  follow_up_actions_required?: string;
  challenges_faced?: string;
  key_achievements?: string;
  next_day_priorities?: string;
  
  // System fields
  report_date: string;
  submitted_by: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  submitter?: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
  };
}

export interface CloserReportFormData {
  closer_name: string;
  closer_role: string;
  total_calls_scheduled: number;
  calls_completed: number;
  follow_up_calls_scheduled: number;
  revenue_generated: number;
  cash_collected: number;
  deposits: number;
  sales_team_meetings: number;
  leadership_meetings: number;
  training_sessions: number;
  follow_up_actions_required: string;
  challenges_faced: string;
  key_achievements: string;
  next_day_priorities: string;
}

export interface DailyCloserSummary {
  report_date: string;
  total_reports: number;
  total_calls_completed: number;
  total_revenue_generated: number;
  total_cash_collected: number;
  avg_call_completion_rate: number;
  avg_collection_rate: number;
}

export interface CloserReportFilters {
  search: string;
  date_range: 'today' | 'this_week' | 'this_month' | 'custom';
  start_date: string;
  end_date: string;
  closer_name: string;
}