import { supabase } from '../lib/supabase';

interface LeadActionData {
  leadId: string;
  actionType: 'status_change' | 'checklist_update' | 'follow_up_update' | 'lead_created' | 'lead_updated' | 'lead_deleted';
  actionDetails: {
    field?: string;
    oldValue?: any;
    newValue?: any;
    checklistItem?: string;
    followUpIndex?: number;
    [key: string]: any;
  };
  timestamp: string;
  userId: string;
}

interface WebhookPayload {
  action: LeadActionData;
  lead: any;
  user: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
    phone?: string;
    job_title?: string;
  };
  metadata: {
    timestamp: string;
    source: 'vertical_systems_crm';
    version: '1.0';
    environment: string;
  };
}

class WebhookService {
  private webhookUrl = import.meta.env.VITE_WEBHOOK_GENERAL;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  /**
   * Send lead action data to webhook with retry logic
   */
  async sendLeadAction(actionData: LeadActionData): Promise<void> {
    try {
      // Get full lead data
      const lead = await this.getLeadData(actionData.leadId);
      if (!lead) {
        console.error('Lead not found for webhook:', actionData.leadId);
        return;
      }

      // Get user data - ONLY when specifically needed for webhooks
      const user = await this.getUserData(actionData.userId);
      if (!user) {
        console.error('User not found for webhook:', actionData.userId);
        return;
      }

      // Prepare webhook payload
      const payload: WebhookPayload = {
        action: actionData,
        lead: this.sanitizeLeadData(lead),
        user: this.sanitizeUserData(user),
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'vertical_systems_crm',
          version: '1.0',
          environment: import.meta.env.MODE || 'development'
        }
      };

      // Send webhook with retry logic
      await this.sendWithRetry(payload);

      // Log successful webhook
      console.log('Webhook sent successfully:', {
        leadId: actionData.leadId,
        actionType: actionData.actionType,
        timestamp: actionData.timestamp
      });

    } catch (error) {
      console.error('Failed to send webhook:', error);
      // Optionally store failed webhooks for later retry
      this.logFailedWebhook(actionData, error);
    }
  }

  /**
   * Get complete lead data from database
   */
  private async getLeadData(leadId: string): Promise<any> {
    try {
      // First get the lead data
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;
      if (!leadData) return null;

      // Get assigned user data if assigned_to exists
      let assignedUser = null;
      if (leadData.assigned_to) {
        const { data: assignedUserData, error: assignedUserError } = await supabase
          .from('users')
          .select('id, email, full_name, role')
          .eq('id', leadData.assigned_to)
          .single();

        if (!assignedUserError && assignedUserData) {
          assignedUser = assignedUserData;
        }
      }

      // Get created user data
      let createdUser = null;
      if (leadData.created_by) {
        const { data: createdUserData, error: createdUserError } = await supabase
          .from('users')
          .select('id, email, full_name, role')
          .eq('id', leadData.created_by)
          .single();

        if (!createdUserError && createdUserData) {
          createdUser = createdUserData;
        }
      }

      // Combine the data
      return {
        ...leadData,
        assigned_user: assignedUser,
        created_user: createdUser
      };

    } catch (error) {
      console.error('Error fetching lead data:', error);
      return null;
    }
  }

  /**
   * Get user data ONLY when specifically needed for webhooks
   * NOT called from AuthContext - only from specific webhook actions
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
   * Sanitize and format lead data for webhook
   */
  private sanitizeLeadData(lead: any): any {
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
      probability: lead.probability,
      revenue_generated: lead.revenue_generated,
      cash_collected: lead.cash_collected,
      notes: lead.notes,
      tags: lead.tags,
      website: lead.website,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      country: lead.country,
      zip_code: lead.zip_code,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      first_contact_date: lead.first_contact_date,
      last_contact_date: lead.last_contact_date,
      next_follow_up_date: lead.next_follow_up_date,
      conversion_date: lead.conversion_date,
      lost_date: lead.lost_date,
      lost_reason: lead.lost_reason,
      follow_ups_completed: lead.follow_ups_completed,
      follow_up_dates: lead.follow_up_dates,
      lead_checklist: lead.lead_checklist,
      checklist_dates: lead.checklist_dates,
      assigned_user: lead.assigned_user,
      created_user: lead.created_user,
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
   * Send webhook with retry logic
   */
  private async sendWithRetry(payload: WebhookPayload, attempt: number = 1): Promise<void> {
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
        throw new Error(`Webhook failed with status: ${response.status} ${response.statusText}`);
      }

      // Log successful response
      const responseText = await response.text();
      console.log('Webhook response:', responseText);

    } catch (error) {
      console.error(`Webhook attempt ${attempt} failed:`, error);

      if (attempt < this.retryAttempts) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.sendWithRetry(payload, attempt + 1);
      } else {
        throw error;
      }
    }
  }

  /**
   * Log failed webhook for debugging
   */
  private logFailedWebhook(actionData: LeadActionData, error: any): void {
    console.error('Failed webhook logged:', {
      leadId: actionData.leadId,
      actionType: actionData.actionType,
      timestamp: actionData.timestamp,
      error: error.message,
      userId: actionData.userId
    });

    // In production, you might want to store this in a database table
    // for later retry or analysis
  }

  /**
   * Track status change
   */
  async trackStatusChange(leadId: string, oldStatus: string, newStatus: string, userId: string): Promise<void> {
    const actionData: LeadActionData = {
      leadId,
      actionType: 'status_change',
      actionDetails: {
        field: 'status',
        oldValue: oldStatus,
        newValue: newStatus
      },
      timestamp: new Date().toISOString(),
      userId
    };

    await this.sendLeadAction(actionData);
  }

  /**
   * Track checklist update
   */
  async trackChecklistUpdate(
    leadId: string, 
    checklistItem: string, 
    oldValue: boolean, 
    newValue: boolean, 
    userId: string
  ): Promise<void> {
    const actionData: LeadActionData = {
      leadId,
      actionType: 'checklist_update',
      actionDetails: {
        checklistItem,
        oldValue,
        newValue,
        field: 'lead_checklist'
      },
      timestamp: new Date().toISOString(),
      userId
    };

    await this.sendLeadAction(actionData);
  }

  /**
   * Track follow-up update
   */
  async trackFollowUpUpdate(
    leadId: string, 
    followUpIndex: number, 
    oldValue: boolean, 
    newValue: boolean, 
    userId: string
  ): Promise<void> {
    const actionData: LeadActionData = {
      leadId,
      actionType: 'follow_up_update',
      actionDetails: {
        followUpIndex,
        oldValue,
        newValue,
        field: 'follow_ups_completed'
      },
      timestamp: new Date().toISOString(),
      userId
    };

    await this.sendLeadAction(actionData);
  }

  /**
   * Track lead creation
   */
  async trackLeadCreated(leadId: string, userId: string): Promise<void> {
    const actionData: LeadActionData = {
      leadId,
      actionType: 'lead_created',
      actionDetails: {},
      timestamp: new Date().toISOString(),
      userId
    };

    await this.sendLeadAction(actionData);
  }

  /**
   * Track lead update
   */
  async trackLeadUpdated(leadId: string, changes: Record<string, any>, userId: string): Promise<void> {
    const actionData: LeadActionData = {
      leadId,
      actionType: 'lead_updated',
      actionDetails: {
        changes
      },
      timestamp: new Date().toISOString(),
      userId
    };

    await this.sendLeadAction(actionData);
  }

  /**
   * Track lead deletion
   */
  async trackLeadDeleted(leadId: string, userId: string): Promise<void> {
    const actionData: LeadActionData = {
      leadId,
      actionType: 'lead_deleted',
      actionDetails: {},
      timestamp: new Date().toISOString(),
      userId
    };

    await this.sendLeadAction(actionData);
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
export default webhookService;