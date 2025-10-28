import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CashEntry, Offer, CashEntryFilters } from '../types/finances';

export const useCashEntries = () => {
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCashEntries = async (filters?: Partial<CashEntryFilters>) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('cash_entries')
        .select(`
          *,
          offer:offers(id, name, description),
          creator:created_by(id, email, full_name),
          setter:setter_id(id, email, full_name)
        `)
        .order('date', { ascending: false });

      // Apply filters if provided
      if (filters) {
        // Search filter
        if (filters.search) {
          query = query.or(`client_name.ilike.%${filters.search}%,client_email.ilike.%${filters.search}%`);
        }

        // Status filter
        if (filters.status) {
          query = query.eq('status', filters.status);
        }

        // Payment type filter
        if (filters.payment_type) {
          query = query.eq('payment_type', filters.payment_type);
        }

        // Offer filter
        if (filters.offer_id) {
          query = query.eq('offer_id', filters.offer_id);
        }

        // Setter filter
        if (filters.setter_id) {
          query = query.eq('setter_id', filters.setter_id);
        }

        // Date range filter
        if (filters.date_range && filters.date_range !== 'all') {
          const now = new Date();
          let startDate: Date;

          switch (filters.date_range) {
            case 'today':
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              query = query.gte('date', startDate.toISOString().split('T')[0]);
              break;
            case 'this_week':
              startDate = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
              query = query.gte('date', startDate.toISOString().split('T')[0]);
              break;
            case 'this_month':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              query = query.gte('date', startDate.toISOString().split('T')[0]);
              break;
            case 'custom':
              if (filters.start_date) {
                query = query.gte('date', filters.start_date);
              }
              if (filters.end_date) {
                query = query.lte('date', filters.end_date);
              }
              break;
          }
        }

        // Due date range filter
        if (filters.due_date_range && filters.due_date_range !== 'all') {
          const now = new Date();
          let startDate: Date;

          switch (filters.due_date_range) {
            case 'overdue':
              query = query.lt('due_date', now.toISOString().split('T')[0]);
              break;
            case 'due_this_week':
              startDate = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
              const endOfWeek = new Date(startDate.getTime() + (6 * 24 * 60 * 60 * 1000));
              query = query.gte('due_date', startDate.toISOString().split('T')[0])
                          .lte('due_date', endOfWeek.toISOString().split('T')[0]);
              break;
            case 'due_this_month':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              query = query.gte('due_date', startDate.toISOString().split('T')[0])
                          .lte('due_date', endOfMonth.toISOString().split('T')[0]);
              break;
            case 'custom':
              if (filters.due_start_date) {
                query = query.gte('due_date', filters.due_start_date);
              }
              if (filters.due_end_date) {
                query = query.lte('due_date', filters.due_end_date);
              }
              break;
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setCashEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching cash entries:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createCashEntry = async (entryData: Partial<CashEntry>) => {
    try {
      // Calculate commission payments
      const grossProfit = entryData.gross_profit || 0;
      const setterPercentage = entryData.setter_percentage || 0;
      const closerPercentage = entryData.closer_percentage || 0;
      
      const setterPayment = (grossProfit * setterPercentage) / 100;
      const closerPayment = (grossProfit * closerPercentage) / 100;
      const totalCommissions = setterPayment + closerPayment;

      const { data, error } = await supabase
        .from('cash_entries')
        .insert({
          ...entryData,
          setter_payment: setterPayment,
          closer_payment: closerPayment,
          total_commissions: totalCommissions
        })
        .select(`
          *,
          offer:offers(id, name, description),
          creator:created_by(id, email, full_name),
          setter:setter_id(id, email, full_name)
        `)
        .single();

      if (error) throw error;
      
      setCashEntries(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating cash entry:', error);
      return { data: null, error };
    }
  };

  const updateCashEntry = async (entryId: string, updates: Partial<CashEntry>) => {
    try {
      // Recalculate commission payments if relevant fields changed
      const grossProfit = updates.gross_profit !== undefined ? updates.gross_profit : 0;
      const setterPercentage = updates.setter_percentage !== undefined ? updates.setter_percentage : 0;
      const closerPercentage = updates.closer_percentage !== undefined ? updates.closer_percentage : 0;
      
      if (updates.gross_profit !== undefined || updates.setter_percentage !== undefined || updates.closer_percentage !== undefined) {
        const setterPayment = (grossProfit * setterPercentage) / 100;
        const closerPayment = (grossProfit * closerPercentage) / 100;
        const totalCommissions = setterPayment + closerPayment;
        
        updates.setter_payment = setterPayment;
        updates.closer_payment = closerPayment;
        updates.total_commissions = totalCommissions;
      }

      const { data, error } = await supabase
        .from('cash_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select(`
          *,
          offer:offers(id, name, description),
          creator:created_by(id, email, full_name),
          setter:setter_id(id, email, full_name)
        `)
        .single();

      if (error) throw error;
      
      setCashEntries(prev => prev.map(entry => 
        entry.id === entryId ? data : entry
      ));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating cash entry:', error);
      return { data: null, error };
    }
  };

  const deleteCashEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('cash_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      
      setCashEntries(prev => prev.filter(entry => entry.id !== entryId));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting cash entry:', error);
      return { error };
    }
  };

  return {
    cashEntries,
    loading,
    error,
    fetchCashEntries,
    createCashEntry,
    updateCashEntry,
    deleteCashEntry
  };
};

export const useOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('name');

      if (error) throw error;
      setOffers(data || []);
    } catch (error: any) {
      console.error('Error fetching offers:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createOffer = async (offerData: Partial<Offer>) => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .insert(offerData)
        .select()
        .single();

      if (error) throw error;
      
      setOffers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating offer:', error);
      return { data: null, error };
    }
  };

  const updateOffer = async (offerId: string, updates: Partial<Offer>) => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .select()
        .single();

      if (error) throw error;
      
      setOffers(prev => prev.map(offer => 
        offer.id === offerId ? data : offer
      ).sort((a, b) => a.name.localeCompare(b.name)));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating offer:', error);
      return { data: null, error };
    }
  };

  const deleteOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;
      
      setOffers(prev => prev.filter(offer => offer.id !== offerId));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting offer:', error);
      return { error };
    }
  };

  return {
    offers,
    loading,
    error,
    fetchOffers,
    createOffer,
    updateOffer,
    deleteOffer
  };
};