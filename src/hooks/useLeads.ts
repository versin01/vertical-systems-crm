import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lead, LeadFilters } from '../types/leads';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async (filters?: Partial<LeadFilters>) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters if provided
      if (filters) {
        // Search filter
        if (filters.search) {
          query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
        }

        // Status filter
        if (filters.status) {
          query = query.eq('status', filters.status);
        }

        // Lead source filter
        if (filters.lead_source) {
          query = query.eq('lead_source', filters.lead_source);
        }

        // Assigned to filter
        if (filters.assigned_to) {
          query = query.eq('assigned_to', filters.assigned_to);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (leadData: Partial<Lead>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (error) throw error;
      
      setLeads(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating lead:', error);
      return { data: null, error };
    }
  };

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;
      
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? data : lead
      ));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating lead:', error);
      return { data: null, error };
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;
      
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      return { error };
    }
  };

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead
  };
};