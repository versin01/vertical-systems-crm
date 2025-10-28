interface SetterReportWebhookData {
  report: {
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
    created_at: string;
    
    // Calculated metrics
    call_completion_rate: number;
    qualification_rate: number;
    booking_rate: number;
    total_activities: number;
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
    action: 'setter_report_submitted';
  };
}

class SetterReportWebhookService {
  private webhookUrl = import.meta.env.VITE_WEBHOOK_SETTER_REPORT;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  /**
   * Send setter report data to webhook
   */
  async sendSetterReportSubmission(reportData: any, userData: any): Promise<void> {
    try {
      // Calculate performance metrics
      const callCompletionRate = reportData.calls_expected > 0 
        ? (reportData.calls_made / reportData.calls_expected) * 100 
        : 0;
      
      const qualificationRate = reportData.calls_made > 0 
        ? ((reportData.calls_made - reportData.calls_not_qualified) / reportData.calls_made) * 100 
        : 0;
      
      const bookingRate = reportData.calls_made > 0 
        ? (reportData.sales_appointments_booked / reportData.calls_made) * 100 
        : 0;
      
      const totalActivities = reportData.calls_made + reportData.linkedin_connections + reportData.loom_explanations_sent;

      // Prepare webhook payload
      const payload: SetterReportWebhookData = {
        report: {
          id: reportData.id,
          setter_name: reportData.setter_name,
          setter_role: reportData.setter_role,
          new_leads_received: reportData.new_leads_received,
          calls_expected: reportData.calls_expected,
          calls_made: reportData.calls_made,
          cancelled_appointments: reportData.cancelled_appointments,
          calls_not_qualified: reportData.calls_not_qualified,
          linkedin_connections: reportData.linkedin_connections,
          loom_explanations_sent: reportData.loom_explanations_sent,
          sales_appointments_booked: reportData.sales_appointments_booked,
          notes: reportData.notes,
          report_date: reportData.report_date,
          created_at: reportData.created_at,
          
          // Calculated metrics
          call_completion_rate: Math.round(callCompletionRate * 100) / 100,
          qualification_rate: Math.round(qualificationRate * 100) / 100,
          booking_rate: Math.round(bookingRate * 100) / 100,
          total_activities: totalActivities
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
          action: 'setter_report_submitted'
        }
      };

      // Send webhook with retry logic
      await this.sendWithRetry(payload);

      // Log successful webhook
      console.log('Setter report webhook sent successfully:', {
        reportId: reportData.id,
        setterName: reportData.setter_name,
        timestamp: payload.metadata.timestamp
      });

    } catch (error) {
      console.error('Failed to send setter report webhook:', error);
      // Log failed webhook for debugging
      this.logFailedWebhook(reportData, userData, error);
    }
  }

  /**
   * Send webhook with retry logic
   */
  private async sendWithRetry(payload: SetterReportWebhookData, attempt: number = 1): Promise<void> {
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
      console.log('Setter report webhook response:', responseText);

    } catch (error) {
      console.error(`Setter report webhook attempt ${attempt} failed:`, error);

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
    console.error('Failed setter report webhook logged:', {
      reportId: reportData.id,
      setterName: reportData.setter_name,
      userEmail: userData.email,
      timestamp: new Date().toISOString(),
      error: error.message
    });

    // In production, you might want to store this in a database table
    // for later retry or analysis
  }
}

// Export singleton instance
export const setterReportWebhookService = new SetterReportWebhookService();
export default setterReportWebhookService;