import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FinancialMetricsData, FinancialTimeMetrics, FinancialPeriodData } from '../types/finances';

export const useFinancialMetrics = () => {
  const [metricsData, setMetricsData] = useState<FinancialPeriodData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFinancialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch cash entries with related data
      const { data: cashEntries, error: cashError } = await supabase
        .from('cash_entries')
        .select(`
          *,
          offer:offers(id, name),
          setter:setter_id(id, email, full_name),
          creator:created_by(id, email, full_name)
        `)
        .order('date', { ascending: false });

      if (cashError) throw cashError;

      // Fetch expenses with related data
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          *,
          creator:created_by(id, email, full_name)
        `)
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      // Calculate metrics for different time periods
      const metrics = calculateFinancialMetrics(cashEntries || [], expenses || []);
      setMetricsData(metrics);
    } catch (error: any) {
      console.error('Error fetching financial data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialMetrics = (cashEntries: any[], expenses: any[]): FinancialPeriodData => {
    const now = new Date();
    
    // Date boundaries
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const lastWeekStart = new Date(thisWeekStart.getTime() - (7 * 24 * 60 * 60 * 1000));
    const lastWeekEnd = new Date(thisWeekStart.getTime() - 1);
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);
    
    const last30DaysStart = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const previous30DaysStart = new Date(last30DaysStart.getTime() - (30 * 24 * 60 * 60 * 1000));
    const previous30DaysEnd = new Date(last30DaysStart.getTime() - 1);
    
    const thisQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const lastQuarterStart = new Date(thisQuarterStart.getFullYear(), thisQuarterStart.getMonth() - 3, 1);
    const lastQuarterEnd = new Date(thisQuarterStart.getTime() - 1);

    const calculateMetrics = (
      filteredCashEntries: any[], 
      filteredExpenses: any[]
    ): FinancialMetricsData => {
      // Income calculations
      const totalIncome = filteredCashEntries.reduce((sum, entry) => sum + entry.income, 0);
      const grossProfit = filteredCashEntries.reduce((sum, entry) => sum + entry.gross_profit, 0);
      const totalCommissions = filteredCashEntries.reduce((sum, entry) => sum + entry.total_commissions, 0);
      
      // Expense calculations
      const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Net profit calculation
      const netProfit = grossProfit - totalCommissions - totalExpenses;
      
      // Receivables calculations
      const receivableEntries = filteredCashEntries.filter(entry => entry.due_date);
      const totalReceivables = receivableEntries.reduce((sum, entry) => sum + entry.income, 0);
      const overdueReceivables = receivableEntries
        .filter(entry => entry.due_date && new Date(entry.due_date) < now && entry.status !== 'Paid')
        .reduce((sum, entry) => sum + entry.income, 0);
      
      const weekEnd = new Date(thisWeekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
      const dueThisWeek = receivableEntries
        .filter(entry => {
          if (!entry.due_date || entry.status === 'Paid') return false;
          const dueDate = new Date(entry.due_date);
          return dueDate >= thisWeekStart && dueDate <= weekEnd;
        })
        .reduce((sum, entry) => sum + entry.income, 0);
      
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const dueThisMonth = receivableEntries
        .filter(entry => {
          if (!entry.due_date || entry.status === 'Paid') return false;
          const dueDate = new Date(entry.due_date);
          return dueDate >= thisMonthStart && dueDate <= monthEnd;
        })
        .reduce((sum, entry) => sum + entry.income, 0);

      // Rates and margins
      const collectionRate = totalReceivables > 0 
        ? (filteredCashEntries.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.income, 0) / totalReceivables) * 100 
        : 0;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      // Breakdown data
      const incomeByOffer: { [key: string]: number } = {};
      const commissionsBySetter: { [key: string]: number } = {};
      const commissionsByCloser: { [key: string]: number } = {};
      const incomeByStatus: { [key: string]: number } = {};

      filteredCashEntries.forEach(entry => {
        // Income by offer
        const offerName = entry.offer?.name || 'No Offer';
        incomeByOffer[offerName] = (incomeByOffer[offerName] || 0) + entry.income;
        
        // Commissions by setter
        if (entry.setter && entry.setter_payment > 0) {
          const setterName = entry.setter.full_name || entry.setter.email;
          commissionsBySetter[setterName] = (commissionsBySetter[setterName] || 0) + entry.setter_payment;
        }
        
        // Commissions by closer (using creator as closer for now)
        if (entry.creator && entry.closer_payment > 0) {
          const closerName = entry.creator.full_name || entry.creator.email;
          commissionsByCloser[closerName] = (commissionsByCloser[closerName] || 0) + entry.closer_payment;
        }
        
        // Income by status
        incomeByStatus[entry.status] = (incomeByStatus[entry.status] || 0) + entry.income;
      });

      const expensesByType: { [key: string]: number } = {};
      filteredExpenses.forEach(expense => {
        expensesByType[expense.expense_type] = (expensesByType[expense.expense_type] || 0) + expense.amount;
      });

      const receivablesByStatus: { [key: string]: number } = {};
      receivableEntries.forEach(entry => {
        receivablesByStatus[entry.status] = (receivablesByStatus[entry.status] || 0) + entry.income;
      });

      // Monthly trends (last 6 months)
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthCashEntries = filteredCashEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= monthStart && entryDate <= monthEnd;
        });
        
        const monthExpenses = filteredExpenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        });
        
        const monthIncome = monthCashEntries.reduce((sum, entry) => sum + entry.income, 0);
        const monthExpenseAmount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const monthProfit = monthIncome - monthExpenseAmount;
        
        monthlyTrends.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          income: monthIncome,
          expenses: monthExpenseAmount,
          profit: monthProfit
        });
      }

      return {
        totalIncome,
        totalExpenses,
        netProfit,
        grossProfit,
        totalCommissions,
        totalReceivables,
        overdueReceivables,
        dueThisWeek,
        dueThisMonth,
        collectionRate,
        profitMargin,
        incomeByOffer,
        expensesByType,
        commissionsBySetter,
        commissionsByCloser,
        monthlyTrends,
        incomeByStatus,
        receivablesByStatus
      };
    };

    const filterByDateRange = (items: any[], startDate: Date, endDate?: Date, dateField: string = 'date') => {
      return items.filter(item => {
        const itemDate = new Date(item[dateField]);
        if (endDate) {
          return itemDate >= startDate && itemDate <= endDate;
        }
        return itemDate >= startDate;
      });
    };

    return {
      today: {
        current: calculateMetrics(
          filterByDateRange(cashEntries, today),
          filterByDateRange(expenses, today)
        ),
        previous: calculateMetrics(
          filterByDateRange(cashEntries, yesterday, today),
          filterByDateRange(expenses, yesterday, today)
        )
      },
      thisWeek: {
        current: calculateMetrics(
          filterByDateRange(cashEntries, thisWeekStart),
          filterByDateRange(expenses, thisWeekStart)
        ),
        previous: calculateMetrics(
          filterByDateRange(cashEntries, lastWeekStart, lastWeekEnd),
          filterByDateRange(expenses, lastWeekStart, lastWeekEnd)
        )
      },
      thisMonth: {
        current: calculateMetrics(
          filterByDateRange(cashEntries, thisMonthStart),
          filterByDateRange(expenses, thisMonthStart)
        ),
        previous: calculateMetrics(
          filterByDateRange(cashEntries, lastMonthStart, lastMonthEnd),
          filterByDateRange(expenses, lastMonthStart, lastMonthEnd)
        )
      },
      last30Days: {
        current: calculateMetrics(
          filterByDateRange(cashEntries, last30DaysStart),
          filterByDateRange(expenses, last30DaysStart)
        ),
        previous: calculateMetrics(
          filterByDateRange(cashEntries, previous30DaysStart, previous30DaysEnd),
          filterByDateRange(expenses, previous30DaysStart, previous30DaysEnd)
        )
      },
      thisQuarter: {
        current: calculateMetrics(
          filterByDateRange(cashEntries, thisQuarterStart),
          filterByDateRange(expenses, thisQuarterStart)
        ),
        previous: calculateMetrics(
          filterByDateRange(cashEntries, lastQuarterStart, lastQuarterEnd),
          filterByDateRange(expenses, lastQuarterStart, lastQuarterEnd)
        )
      },
      allTime: {
        current: calculateMetrics(cashEntries, expenses),
        previous: {
          totalIncome: 0, totalExpenses: 0, netProfit: 0, grossProfit: 0, totalCommissions: 0,
          totalReceivables: 0, overdueReceivables: 0, dueThisWeek: 0, dueThisMonth: 0,
          collectionRate: 0, profitMargin: 0, incomeByOffer: {}, expensesByType: {},
          commissionsBySetter: {}, commissionsByCloser: {}, monthlyTrends: [],
          incomeByStatus: {}, receivablesByStatus: {}
        }
      }
    };
  };

  return {
    metricsData,
    loading,
    error,
    fetchFinancialData
  };
};