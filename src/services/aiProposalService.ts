import { supabase } from '../lib/supabase';
import { Lead } from '../types/leads';
import { Deal } from '../types/deals';
import { Proposal } from '../types/proposals';

interface AIProposalWebhookData {
  proposal?: {
    id: string;
    title: string;
    proposal_value: number;
    status: string;
    created_at: string;
    updated_at: string;
    deliverables: any[];
    timelines: any[];
    proposal_text?: string;
    client_notes?: string;
    internal_notes?: string;
    proposal_link?: string;
    sent_date?: string;
    last_viewed_date?: string;
    expiration_date?: string;
    follow_up_count: number;
  };
  deal?: {
    id: string;
    deal_name: string;
    deal_value: number;
    stage: string;
    service_type?: string;
    deal_source?: string;
    probability: number;
    expected_close_date?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
  };
  lead: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    company?: string;
    job_title?: string;
    status: string;
    lead_source?: string;
    lead_type?: string;
    priority: string;
    revenue_generated: number;
    cash_collected: number;
    notes?: string;
    tags?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
    lead_checklist: any;
    checklist_dates: any;
    follow_ups_completed: boolean[];
    follow_up_dates: (string | null)[];
    created_at: string;
    updated_at: string;
    
    // Calculated fields
    follow_up_completion_rate: number;
    checklist_completion_rate: number;
    outstanding_revenue: number;
    collection_rate: number;
  };
  user: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
    phone?: string;
    job_title?: string;
  };
  input: {
    type: 'transcript' | 'meeting_number';
    transcript?: string;
    meeting_number?: string;
  };
  metadata: {
    timestamp: string;
    source: 'vertical_systems_crm';
    version: '1.0';
    environment: string;
    action: 'ai_proposal_generation_requested';
    context: 'new_proposal' | 'enhance_existing_proposal';
  };
}

interface AIProposalResponse {
  success: boolean;
  proposal_link?: string;
  proposal_text?: string;
  title?: string;
  proposal_value?: number;
  deliverables?: any[];
  timelines?: any[];
  error?: string;
}

class AIProposalService {
  private webhookUrl = import.meta.env.VITE_WEBHOOK_AI_PROPOSAL;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  /**
   * Send AI proposal generation request to webhook and return response
   */
  async sendAIProposalRequest(
    lead: Lead,
    input: { transcript?: string; meetingNumber?: string },
    userId: string,
    proposalData?: Proposal,
    dealData?: Deal
  ): Promise<AIProposalResponse> {
    try {
      // Get user data
      const userData = await this.getUserData(userId);
      if (!userData) {
        throw new Error('User data not found');
      }

      // Determine input type
      const inputType = input.transcript ? 'transcript' : 'meeting_number';
      
      // Prepare webhook payload
      const payload: AIProposalWebhookData = {
        proposal: proposalData ? this.sanitizeProposalData(proposalData) : undefined,
        deal: dealData ? this.sanitizeDealData(dealData) : undefined,
        lead: this.sanitizeLeadData(lead),
        user: this.sanitizeUserData(userData),
        input: {
          type: inputType,
          transcript: input.transcript,
          meeting_number: input.meetingNumber
        },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'vertical_systems_crm',
          version: '1.0',
          environment: import.meta.env.MODE || 'development',
          action: 'ai_proposal_generation_requested',
          context: proposalData ? 'enhance_existing_proposal' : 'new_proposal'
        }
      };

      // Send webhook with retry logic and wait for response
      const response = await this.sendWithRetry(payload);

      // Log successful webhook
      console.log('AI proposal webhook sent successfully:', {
        proposalId: proposalData?.id,
        dealId: dealData?.id,
        leadId: lead.id,
        inputType,
        timestamp: payload.metadata.timestamp
      });

      return response;

    } catch (error) {
      console.error('Failed to send AI proposal webhook:', error);
      throw error;
    }
  }

  /**
   * Get user data from database
   */
  private async getUserData(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, phone, job_title')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Supabase request failed:', error);
      return null;
    }
  }

  /**
   * Sanitize and format proposal data for webhook
   */
  private sanitizeProposalData(proposal: Proposal): any {
    return {
      id: proposal.id,
      title: proposal.title,
      proposal_value: proposal.proposal_value,
      status: proposal.status,
      created_at: proposal.created_at,
      updated_at: proposal.updated_at,
      deliverables: proposal.deliverables || [],
      timelines: proposal.timelines || [],
      proposal_text: proposal.proposal_text,
      client_notes: proposal.client_notes,
      internal_notes: proposal.internal_notes,
      proposal_link: proposal.proposal_link,
      sent_date: proposal.sent_date,
      last_viewed_date: proposal.last_viewed_date,
      expiration_date: proposal.expiration_date,
      follow_up_count: proposal.follow_up_count || 0
    };
  }

  /**
   * Sanitize and format deal data for webhook
   */
  private sanitizeDealData(deal: Deal): any {
    return {
      id: deal.id,
      deal_name: deal.deal_name,
      deal_value: deal.deal_value,
      stage: deal.stage,
      service_type: deal.service_type,
      deal_source: deal.deal_source,
      probability: deal.probability,
      expected_close_date: deal.expected_close_date,
      notes: deal.notes,
      created_at: deal.created_at,
      updated_at: deal.updated_at
    };
  }

  /**
   * Sanitize and format lead data for webhook
   */
  private sanitizeLeadData(lead: Lead): any {
    return {
      id: lead.id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      job_title: lead.job_title,
      status: lead.status,
      lead_source: lead.lead_source,
      lead_type: lead.lead_type,
      priority: lead.priority,
      revenue_generated: lead.revenue_generated || 0,
      cash_collected: lead.cash_collected || 0,
      notes: lead.notes,
      tags: lead.tags,
      website: lead.website,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      country: lead.country,
      zip_code: lead.zip_code,
      lead_checklist: lead.lead_checklist || {},
      checklist_dates: lead.checklist_dates || {},
      follow_ups_completed: lead.follow_ups_completed || [],
      follow_up_dates: lead.follow_up_dates || [],
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      // Calculated fields
      follow_up_completion_rate: this.calculateFollowUpRate(lead.follow_ups_completed),
      checklist_completion_rate: this.calculateChecklistRate(lead.lead_checklist),
      outstanding_revenue: (lead.revenue_generated || 0) - (lead.cash_collected || 0),
      collection_rate: lead.revenue_generated > 0 ? ((lead.cash_collected || 0) / lead.revenue_generated) * 100 : 0
    };
  }

  /**
   * Sanitize and format user data for webhook
   */
  private sanitizeUserData(user: any): any {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      job_title: user.job_title
    };
  }

  /**
   * Calculate follow-up completion rate
   */
  private calculateFollowUpRate(followUps: boolean[]): number {
    if (!followUps || followUps.length === 0) return 0;
    const completed = followUps.filter(Boolean).length;
    return (completed / followUps.length) * 100;
  }

  /**
   * Calculate checklist completion rate
   */
  private calculateChecklistRate(checklist: any): number {
    if (!checklist) return 0;
    const items = Object.values(checklist);
    const completed = items.filter(Boolean).length;
    return items.length > 0 ? (completed / items.length) * 100 : 0;
  }

  /**
   * Send webhook with retry logic and return parsed response
   */
  private async sendWithRetry(payload: AIProposalWebhookData, attempt: number = 1): Promise<AIProposalResponse> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VerticalSystems-CRM/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`AI proposal webhook failed with status: ${response.status} ${response.statusText}`);
      }

      // Read response as text first
      const responseText = await response.text();
      console.log('AI proposal webhook response (raw):', responseText);

      // Try to parse as JSON
      try {
        const responseData = JSON.parse(responseText);
        console.log('AI proposal webhook response (parsed):', responseData);
        return responseData as AIProposalResponse;
      } catch (jsonError) {
        // Handle non-JSON responses
        console.log('Non-JSON response received:', responseText);
        
        // Check if response is "Accepted" (case-insensitive)
        if (responseText.trim().toLowerCase() === 'accepted') {
          console.log('Webhook accepted but returned no structured data');
          return {
            success: true,
            proposal_link: undefined,
            proposal_text: undefined,
            title: undefined,
            proposal_value: undefined,
            deliverables: undefined,
            timelines: undefined
          };
        }
        
        // Check if response looks like a URL (simple check)
        if (responseText.trim().startsWith('http')) {
          console.log('Webhook returned a URL as proposal link');
          return {
            success: true,
            proposal_link: responseText.trim(),
            proposal_text: undefined,
            title: undefined,
            proposal_value: undefined,
            deliverables: undefined,
            timelines: undefined
          };
        }
        
        // For any other non-JSON response, throw an error
        throw new Error(`Unexpected webhook response format. Expected JSON but received: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
      }

    } catch (error) {
      console.error(`AI proposal webhook attempt ${attempt} failed:`, error);

      if (attempt < this.retryAttempts) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.sendWithRetry(payload, attempt + 1);
      } else {
        throw error;
      }
    }
  }
}

// Export singleton instance
export const aiProposalService = new AIProposalService();
export default aiProposalService;