export interface SetterReport {
  id: string;
  setter_name: string;
  setter_role: string;
  new_leads_received: number;
  calls_expected: number;
  calls_made: number;
  cancelled_appointments: number;
  calls_not_qualified: number;
  linkedin_connections: number;
  loom_explanations_sent: number;
  sales_appointments_booked: number;
  notes?: string;
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

export interface SetterReportFormData {
  setter_name: string;
  setter_role: string;
  new_leads_received: number;
  calls_expected: number;
  calls_made: number;
  cancelled_appointments: number;
  calls_not_qualified: number;
  linkedin_connections: number;
  loom_explanations_sent: number;
  sales_appointments_booked: number;
  notes: string;
}

export interface DailySetterSummary {
  report_date: string;
  total_reports: number;
  total_new_leads: number;
  total_calls_made: number;
  total_appointments_booked: number;
  avg_call_completion_rate: number;
}

export interface SetterReportFilters {
  search: string;
  date_range: 'today' | 'this_week' | 'this_month' | 'custom';
  start_date: string;
  end_date: string;
  setter_name: string;
}