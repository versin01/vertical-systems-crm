interface CloserReportWebhookData {
  report: {
    id: string;
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
    follow_up_actions_required?: string;
    challenges_faced?: string;
    key_achievements?: string;
    next_day_priorities?: string;
    report_date: string;
    created_at: string;
    
    // Calculated metrics
    call_completion_rate: number;
    collection_rate: number;
    total_meetings_attended: number;
    outstanding_revenue: number;
  };
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
    action: 'closer_report_submitted';
  };
}

class CloserReportWebhookService {
  private webhookUrl = import.meta.env.VITE_WEBHOOK_CLOSER_REPORT;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  /**
   * Send closer report data to webhook
   */
  async sendCloserReportSubmission(reportData: any, userData: any): Promise<void> {
    try {
      // Calculate performance metrics
      const callCompletionRate = reportData.total_calls_scheduled > 0 
        ? (reportData.calls_completed / reportData.total_calls_scheduled) * 100 
        : 0;
      
      const collectionRate = reportData.revenue_generated > 0 
        ? (reportData.cash_collected / reportData.revenue_generated) * 100 
        : 0;
      
      const totalMeetingsAttended = reportData.sales_team_meetings + reportData.leadership_meetings + reportData.training_sessions;
      const outstandingRevenue = reportData.revenue_generated - reportData.cash_collected;

      // Prepare webhook payload
      const payload: CloserReportWebhookData = {
        report: {
          id: reportData.id,
          closer_name: reportData.closer_name,
          closer_role: reportData.closer_role,
          total_calls_scheduled: reportData.total_calls_scheduled,
          calls_completed: reportData.calls_completed,
          follow_up_calls_scheduled: reportData.follow_up_calls_scheduled,
          revenue_generated: reportData.revenue_generated,
          cash_collected: reportData.cash_collected,
          deposits: reportData.deposits,
          sales_team_meetings: reportData.sales_team_meetings,
          leadership_meetings: reportData.leadership_meetings,
          training_sessions: reportData.training_sessions,
          follow_up_actions_required: reportData.follow_up_actions_required,
          challenges_faced: reportData.challenges_faced,
          key_achievements: reportData.key_achievements,
          next_day_priorities: reportData.next_day_priorities,
          report_date: reportData.report_date,
          created_at: reportData.created_at,
          
          // Calculated metrics
          call_completion_rate: Math.round(callCompletionRate * 100) / 100,
          collection_rate: Math.round(collectionRate * 100) / 100,
          total_meetings_attended: totalMeetingsAttended,
          outstanding_revenue: outstandingRevenue
        },
        user: {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          phone: userData.phone,
          job_title: userData.job_title
        },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'vertical_systems_crm',
          version: '1.0',
          environment: import.meta.env.MODE || 'development',
          action: 'closer_report_submitted'
        }
      };

      // Send webhook with retry logic
      await this.sendWithRetry(payload);

      // Log successful webhook
      console.log('Closer report webhook sent successfully:', {
        reportId: reportData.id,
        closerName: reportData.closer_name,
        timestamp: payload.metadata.timestamp
      });

    } catch (error) {
      console.error('Failed to send closer report webhook:', error);
      // Log failed webhook for debugging
      this.logFailedWebhook(reportData, userData, error);
    }
  }

  /**
   * Send webhook with retry logic
   */
  private async sendWithRetry(payload: CloserReportWebhookData, attempt: number = 1): Promise<void> {
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
      console.log('Closer report webhook response:', responseText);

    } catch (error) {
      console.error(`Closer report webhook attempt ${attempt} failed:`, error);

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
  private logFailedWebhook(reportData: any, userData: any, error: any): void {
    console.error('Failed closer report webhook logged:', {
      reportId: reportData.id,
      closerName: reportData.closer_name,
      userEmail: userData.email,
      timestamp: new Date().toISOString(),
      error: error.message
    });

    // In production, you might want to store this in a database table
    // for later retry or analysis
  }
}

// Export singleton instance
export const closerReportWebhookService = new CloserReportWebhookService();
export default closerReportWebhookService;