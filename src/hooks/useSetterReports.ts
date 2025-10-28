import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SetterReport, DailySetterSummary } from '../types/setterReports';
import setterReportWebhookService from '../services/setterReportWebhookService';

export const useSetterReports = () => {
  const [reports, setReports] = useState<SetterReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async (dateFilter?: string) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('setter_reports')
        .select(`
          *,
          submitter:submitted_by(id, email, full_name, role)
        `)
        .order('created_at', { ascending: false });

      // Apply date filter if provided
      if (dateFilter) {
        const today = new Date();
        let startDate: Date;

        switch (dateFilter) {
          case 'today':
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            query = query.gte('report_date', startDate.toISOString().split('T')[0]);
            break;
          case 'this_week':
            startDate = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
            query = query.gte('report_date', startDate.toISOString().split('T')[0]);
            break;
          case 'this_month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            query = query.gte('report_date', startDate.toISOString().split('T')[0]);
            break;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error('Error fetching setter reports:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (reportData: Partial<SetterReport>) => {
    try {
      // Get user data for webhook
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, role, phone, job_title')
        .eq('id', reportData.submitted_by)
        .single();

      if (userError) {
        console.warn('Could not fetch user data for webhook:', userError);
      }

      const { data, error } = await supabase
        .from('setter_reports')
        .insert(reportData)
        .select(`
          *,
          submitter:submitted_by(id, email, full_name, role)
        `)
        .single();

      if (error) throw error;
      
      // Send webhook notification
      if (userData) {
        try {
          await setterReportWebhookService.sendSetterReportSubmission(data, userData);
        } catch (webhookError) {
          console.error('Webhook failed, but report was saved:', webhookError);
          // Don't fail the entire operation if webhook fails
        }
      }
      
      setReports(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating setter report:', error);
      return { data: null, error };
    }
  };

  const updateReport = async (reportId: string, updates: Partial<SetterReport>) => {
    try {
      const { data, error } = await supabase
        .from('setter_reports')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select(`
          *,
          submitter:submitted_by(id, email, full_name, role)
        `)
        .single();

      if (error) throw error;
      
      setReports(prev => prev.map(report => 
        report.id === reportId ? data : report
      ));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating setter report:', error);
      return { data: null, error };
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('setter_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      
      setReports(prev => prev.filter(report => report.id !== reportId));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting setter report:', error);
      return { error };
    }
  };

  const fetchDailySummary = async (): Promise<DailySetterSummary[]> => {
    try {
      const { data, error } = await supabase
        .from('daily_setter_summary')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(30); // Last 30 days

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching daily summary:', error);
      return [];
    }
  };

  return {
    reports,
    loading,
    error,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    fetchDailySummary
  };
};