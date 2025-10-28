import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Deal, DealFilters, PipelineMetrics } from '../types/deals';

export const useDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          lead:leads(id, first_name, last_name, email, company, phone),
          owner:deal_owner(id, email, full_name, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error: any) {
      console.error('Error fetching deals:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDeal = async (dealData: Partial<Deal>) => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .insert(dealData)
        .select(`
          *,
          lead:leads(id, first_name, last_name, email, company, phone),
          owner:deal_owner(id, email, full_name, role)
        `)
        .single();

      if (error) throw error;
      
      setDeals(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating deal:', error);
      return { data: null, error };
    }
  };

  const updateDeal = async (dealId: string, updates: Partial<Deal>) => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId)
        .select(`
          *,
          lead:leads(id, first_name, last_name, email, company, phone),
          owner:deal_owner(id, email, full_name, role)
        `)
        .single();

      if (error) throw error;
      
      setDeals(prev => prev.map(deal => 
        deal.id === dealId ? data : deal
      ));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating deal:', error);
      return { data: null, error };
    }
  };

  const deleteDeal = async (dealId: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;
      
      setDeals(prev => prev.filter(deal => deal.id !== dealId));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      return { error };
    }
  };

  const convertLeadToDeal = async (leadId: string, dealData: Partial<Deal>) => {
    try {
      // Create the deal
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .insert({
          ...dealData,
          lead_id: leadId
        })
        .select(`
          *,
          lead:leads(id, first_name, last_name, email, company, phone),
          owner:deal_owner(id, email, full_name, role)
        `)
        .single();

      if (dealError) throw dealError;

      // Update lead status to converted
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({ 
          status: 'qualified',
          conversion_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (leadUpdateError) {
        console.warn('Failed to update lead status:', leadUpdateError);
      }

      setDeals(prev => [deal, ...prev]);
      return { data: deal, error: null };
    } catch (error: any) {
      console.error('Error converting lead to deal:', error);
      return { data: null, error };
    }
  };

  return {
    deals,
    loading,
    error,
    fetchDeals,
    createDeal,
    updateDeal,
    deleteDeal,
    convertLeadToDeal
  };
};

export const usePipelineMetrics = (deals: Deal[]): PipelineMetrics => {
  return {
    totalDeals: deals.length,
    totalValue: deals.reduce((sum, deal) => sum + deal.deal_value, 0),
    weightedValue: deals.reduce((sum, deal) => sum + (deal.deal_value * deal.probability / 100), 0),
    averageDealSize: deals.length > 0 ? deals.reduce((sum, deal) => sum + deal.deal_value, 0) / deals.length : 0,
    conversionRate: deals.length > 0 ? (deals.filter(deal => deal.stage === 'contract_signed').length / deals.length) * 100 : 0,
    averageSalesCycle: 30, // This would need more complex calculation based on actual data
    stageMetrics: deals.reduce((metrics, deal) => {
      if (!metrics[deal.stage]) {
        metrics[deal.stage] = {
          count: 0,
          value: 0,
          averageProbability: 0,
          averageTimeInStage: 0
        };
      }
      
      metrics[deal.stage].count += 1;
      metrics[deal.stage].value += deal.deal_value;
      metrics[deal.stage].averageProbability += deal.probability;
      
      return metrics;
    }, {} as any)
  };
};