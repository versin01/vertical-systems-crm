export interface Deal {
  id: string;
  lead_id?: string;
  deal_name: string;
  deal_value: number;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  stage: DealStage;
  deal_owner?: string;
  service_type?: ServiceType;
  deal_source?: string;
  notes?: string;
  won_date?: string;
  lost_date?: string;
  lost_reason?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  owner?: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
  };
}

export type DealStage = 
  | 'new_opportunity'
  | 'discovery_call_scheduled'
  | 'discovery_call_completed'
  | 'proposal_preparation'
  | 'proposal_sent'
  | 'proposal_review'
  | 'negotiation'
  | 'contract_sent'
  | 'contract_signed'
  | 'project_kickoff'
  | 'lost'
  | 'on_hold';

export type ServiceType = 
  | 'Growth Creator'
  | 'AIGC Systems'
  | 'Custom Projects'
  | 'Ongoing Support'
  | 'Business Consulting'
  | 'System Optimization'
  | 'CRM Implementation';

export interface DealFormData {
  deal_name: string;
  deal_value: number;
  probability: number;
  expected_close_date: string;
  stage: DealStage;
  deal_owner: string;
  service_type: ServiceType | '';
  deal_source: string;
  notes: string;
}

export interface DealFilters {
  search: string;
  stage: DealStage | '';
  service_type: ServiceType | '';
  deal_owner: string;
  deal_source: string;
  value_range: 'all' | 'under_10k' | '10k_50k' | '50k_100k' | 'over_100k';
  probability_range: 'all' | 'low' | 'medium' | 'high';
}

export interface PipelineStage {
  id: DealStage;
  label: string;
  color: string;
  description: string;
  deals: Deal[];
  totalValue: number;
  averageProbability: number;
}

export interface PipelineMetrics {
  totalDeals: number;
  totalValue: number;
  weightedValue: number;
  averageDealSize: number;
  conversionRate: number;
  averageSalesCycle: number;
  stageMetrics: {
    [key in DealStage]: {
      count: number;
      value: number;
      averageProbability: number;
      averageTimeInStage: number;
    };
  };
}

export interface LeadToDealConversion {
  leadId: string;
  dealName: string;
  dealValue: number;
  probability: number;
  serviceType: ServiceType;
  dealOwner: string;
  expectedCloseDate: string;
  notes: string;
}