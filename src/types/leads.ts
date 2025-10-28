export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  job_title?: string;
  status: LeadStatus;
  lead_source?: string;
  lead_type?: LeadType;
  priority: Priority;
  probability: number;
  estimated_value: number;
  revenue_generated: number;
  cash_collected: number;
  first_contact_date?: string;
  last_contact_date?: string;
  next_follow_up_date?: string;
  conversion_date?: string;
  lost_date?: string;
  lost_reason?: string;
  notes?: string;
  tags?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  follow_ups_completed: boolean[];
  follow_up_dates: (string | null)[];
  lead_checklist: LeadChecklist;
  checklist_dates: ChecklistDates;
}

export interface LeadChecklist {
  warm_lead: boolean;
  quality_conversation: boolean;
  lead_magnet_sent: boolean;
  asset_consumed: boolean;
  booking_requested: boolean;
  nurture_sequence: boolean;
}

export interface ChecklistDates {
  warm_lead: string | null;
  quality_conversation: string | null;
  lead_magnet_sent: string | null;
  asset_consumed: string | null;
  booking_requested: string | null;
  nurture_sequence: string | null;
}

export type LeadStatus = 
  | 'new' 
  | 'contacted' 
  | 'qualified' 
  | 'proposal_sent' 
  | 'closed_won' 
  | 'closed_lost' 
  | 'nurturing' 
  | 'unqualified';

export type LeadType = 'inbound' | 'outbound' | 'referral' | 'partner';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface LeadFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  status: LeadStatus;
  lead_source: string;
  lead_type: LeadType | '';
  priority: Priority;
  revenue_generated: number;
  cash_collected: number;
  assigned_to: string;
  notes: string;
}

export interface LeadFilters {
  search: string;
  status: LeadStatus | '';
  lead_source: string;
  assigned_to: string;
  follow_up_completion: 'all' | 'incomplete' | 'complete';
  checklist_completion: 'all' | 'incomplete' | 'complete';
}

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    role?: string;
  };
}