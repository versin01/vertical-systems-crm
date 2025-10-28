import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Proposal, ProposalFilters, ProposalStatus } from '../types/proposals';

export const useProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = async (filters?: Partial<ProposalFilters>) => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('proposals')
        .select(`
          *,
          deals:deal_id(id, deal_name, deal_value, stage, lead_id),
          lead:deals!inner(lead_id(id, first_name, last_name, email, company)),
          creator:created_by(id, email, full_name),
          assignee:assigned_to(id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters if provided
      if (filters) {
        // Search filter
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,proposal_text.ilike.%${filters.search}%`);
        }

        // Status filter
        if (filters.status) {
          query = query.eq('status', filters.status);
        }

        // Deal filter
        if (filters.deal_id) {
          query = query.eq('deal_id', filters.deal_id);
        }

        // Assigned to filter
        if (filters.assigned_to) {
          query = query.eq('assigned_to', filters.assigned_to);
        }

        // Date range filter
        if (filters.date_range && filters.date_range !== 'all') {
          const now = new Date();
          let startDate: Date;

          switch (filters.date_range) {
            case 'last_7_days':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              query = query.gte('created_at', startDate.toISOString());
              break;
            case 'last_30_days':
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              query = query.gte('created_at', startDate.toISOString());
              break;
            case 'last_90_days':
              startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
              query = query.gte('created_at', startDate.toISOString());
              break;
            case 'custom':
              if (filters.start_date) {
                query = query.gte('created_at', new Date(filters.start_date).toISOString());
              }
              if (filters.end_date) {
                query = query.lte('created_at', new Date(filters.end_date).toISOString());
              }
              break;
          }
        }

        // Value range filter
        if (filters.value_range && filters.value_range !== 'all') {
          switch (filters.value_range) {
            case 'under_10k':
              query = query.lt('proposal_value', 10000);
              break;
            case '10k_50k':
              query = query.gte('proposal_value', 10000).lt('proposal_value', 50000);
              break;
            case '50k_100k':
              query = query.gte('proposal_value', 50000).lt('proposal_value', 100000);
              break;
            case 'over_100k':
              query = query.gte('proposal_value', 100000);
              break;
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setProposals(data || []);
    } catch (error: any) {
      console.error('Error fetching proposals:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createProposal = async (proposalData: Partial<Proposal>): Promise<{ data: Proposal | null; error: any }> => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .insert(proposalData)
        .select(`
          *,
          deals:deal_id(id, deal_name, deal_value, stage, lead_id),
          lead:deals!inner(lead_id(id, first_name, last_name, email, company)),
          creator:created_by(id, email, full_name),
          assignee:assigned_to(id, email, full_name)
        `)
        .single();

      if (error) throw error;
      
      // Update local state
      setProposals(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      return { data: null, error };
    }
  };

  const updateProposal = async (proposalId: string, updates: Partial<Proposal>): Promise<{ data: Proposal | null; error: any }> => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', proposalId)
        .select(`
          *,
          deals:deal_id(id, deal_name, deal_value, stage, lead_id),
          lead:deals!inner(lead_id(id, first_name, last_name, email, company)),
          creator:created_by(id, email, full_name),
          assignee:assigned_to(id, email, full_name)
        `)
        .single();

      if (error) throw error;
      
      // Update local state
      setProposals(prev => prev.map(proposal => 
        proposal.id === proposalId ? data : proposal
      ));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating proposal:', error);
      return { data: null, error };
    }
  };

  const deleteProposal = async (proposalId: string): Promise<{ error: any }> => {
    try {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', proposalId);

      if (error) throw error;
      
      // Update local state
      setProposals(prev => prev.filter(proposal => proposal.id !== proposalId));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting proposal:', error);
      return { error };
    }
  };

  const updateProposalStatus = async (proposalId: string, status: ProposalStatus): Promise<{ error: any }> => {
    try {
      const updates: Partial<Proposal> = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      // Add additional date fields based on status
      if (status === 'sent') {
        updates.sent_date = new Date().toISOString();
      } else if (status === 'viewed') {
        updates.last_viewed_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', proposalId);

      if (error) throw error;
      
      // Update local state
      setProposals(prev => prev.map(proposal => 
        proposal.id === proposalId ? { ...proposal, ...updates } : proposal
      ));
      
      return { error: null };
    } catch (error: any) {
      console.error('Error updating proposal status:', error);
      return { error };
    }
  };

  const incrementFollowUp = async (proposalId: string): Promise<{ error: any }> => {
    try {
      // First get the current follow_up_count
      const { data: proposal, error: fetchError } = await supabase
        .from('proposals')
        .select('follow_up_count')
        .eq('id', proposalId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Increment the follow_up_count
      const { error } = await supabase
        .from('proposals')
        .update({ 
          follow_up_count: (proposal.follow_up_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', proposalId);

      if (error) throw error;
      
      // Update local state
      setProposals(prev => prev.map(p => 
        p.id === proposalId 
          ? { ...p, follow_up_count: (p.follow_up_count || 0) + 1 } 
          : p
      ));
      
      return { error: null };
    } catch (error: any) {
      console.error('Error incrementing follow-up count:', error);
      return { error };
    }
  };

  const createProposalFromDeal = async (dealId: string, userId: string): Promise<{ data: Proposal | null; error: any }> => {
    try {
      // First get the deal data
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .select(`
          *,
          lead:lead_id(id, first_name, last_name, email, company)
        `)
        .eq('id', dealId)
        .single();
      
      if (dealError) throw dealError;
      
      // Create a proposal with data from the deal
      const proposalData = {
        deal_id: dealId,
        title: `Proposal for ${deal.deal_name}`,
        proposal_value: deal.deal_value,
        status: 'draft' as ProposalStatus,
        created_by: userId,
        assigned_to: deal.deal_owner || userId,
        deliverables: [],
        timelines: [],
        proposal_text: `# Proposal for ${deal.deal_name}\n\n## Overview\n\nThank you for the opportunity to submit this proposal. We are excited to work with you on this project.\n\n## Scope of Work\n\nPlease define the scope of work here.\n\n## Investment\n\n$${deal.deal_value.toLocaleString()}`
      };
      
      return await createProposal(proposalData);
    } catch (error: any) {
      console.error('Error creating proposal from deal:', error);
      return { data: null, error };
    }
  };

  return {
    proposals,
    loading,
    setLoading,
    error,
    fetchProposals,
    createProposal,
    updateProposal,
    deleteProposal,
    updateProposalStatus,
    incrementFollowUp,
    createProposalFromDeal
  };
};