import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Expense, ExpenseFilters } from '../types/finances';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async (filters?: Partial<ExpenseFilters>) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          creator:created_by(id, email, full_name)
        `)
        .order('date', { ascending: false });

      // Apply filters if provided
      if (filters) {
        // Search filter
        if (filters.search) {
          query = query.or(`expense_name.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
        }

        // Expense type filter
        if (filters.expense_type) {
          query = query.eq('expense_type', filters.expense_type);
        }

        // Invoice filed filter
        if (filters.invoice_filed !== 'all') {
          query = query.eq('invoice_filed', filters.invoice_filed === 'yes');
        }

        // Date range filter
        if (filters.date_range && filters.date_range !== 'all') {
          const now = new Date();
          let startDate: Date;

          switch (filters.date_range) {
            case 'today':
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              query = query.gte('date', startDate.toISOString().split('T'));
              break;
            case 'this_week':
              startDate = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
              query = query.gte('date', startDate.toISOString().split('T'));
              break;
            case 'this_month':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              query = query.gte('date', startDate.toISOString().split('T'));
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
      }

      const { data, error } = await query;

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expenseData: Partial<Expense>) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select(`
          *,
          creator:created_by(id, email, full_name)
        `)
        .single();

      if (error) throw error;
      
      setExpenses(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating expense:', error);
      return { data: null, error };
    }
  };

  const updateExpense = async (expenseId: string, updates: Partial<Expense>) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', expenseId)
        .select(`
          *,
          creator:created_by(id, email, full_name)
        `)
        .single();

      if (error) throw error;
      
      setExpenses(prev => prev.map(expense => 
        expense.id === expenseId ? data : expense
      ));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating expense:', error);
      return { data: null, error };
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
      
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      return { error };
    }
  };

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense
  };
};