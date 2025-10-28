export interface Proposal {
  id: string;
  deal_id?: string;
  title: string;
  proposal_text?: string;
  deliverables: DeliverableItem[];
  timelines: TimelineItem[];
  proposal_value: number;
  follow_up_count: number;
  status: ProposalStatus;
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  sent_date?: string;
  last_viewed_date?: string;
  expiration_date?: string;
  client_notes?: string;
  internal_notes?: string;
  proposal_link?: string;
  
  // Related data
  deal?: {
    id: string;
    deal_name: string;
    deal_value: number;
    stage: string;
    lead_id?: string;
  };
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    company?: string;
  };
  creator?: {
    id: string;
    email: string;
    full_name?: string;
  };
  assignee?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface DeliverableItem {
  id: string;
  title: string;
  description: string;
  included: boolean;
  price?: number;
}

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  duration: number; // in days
  start_offset: number; // days from project start
}

export type ProposalStatus = 
  | 'draft'
  | 'review'
  | 'approved'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'revised';

export interface ProposalFormData {
  title: string;
  proposal_text: string;
  deliverables: DeliverableItem[];
  timelines: TimelineItem[];
  proposal_value: number;
  assigned_to?: string;
  expiration_date?: string;
  client_notes?: string;
  internal_notes?: string;
  proposal_link?: string;
}

export interface ProposalFilters {
  search: string;
  status: ProposalStatus | '';
  deal_id: string;
  assigned_to: string;
  date_range: 'all' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
  start_date?: string;
  end_date?: string;
  value_range: 'all' | 'under_10k' | '10k_50k' | '50k_100k' | 'over_100k';
}