import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Trash2, CreditCard as Edit, DollarSign, ChevronLeft, ChevronRight, Calendar, Sparkles, TrendingUp, Target, Award, RefreshCw, FileText, Tag, CheckSquare, Square } from 'lucide-react';
import { Expense, ExpenseFilters, ExpenseType } from '../../types/finances';
import { useExpenses } from '../../hooks/useExpenses';
import { useAuth } from '../../contexts/AuthContext';
import ExpenseForm from '../../components/Finances/ExpenseForm';
import RoleGuard from '../../components/RoleGuard';

const CashOut: React.FC = () => {
  const { user } = useAuth();
  const { expenses, loading, error, fetchExpenses, createExpense, updateExpense, deleteExpense } = useExpenses();
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const [filters, setFilters] = useState<ExpenseFilters>({
    search: '',
    expense_type: '',
    invoice_filed: 'all',
    date_range: 'all'
  });

  // Items per page options
  const itemsPerPageOptions = [10, 15, 25, 50];

  // Fetch data
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...expenses];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.expense_name.toLowerCase().includes(searchLower) ||
        (expense.notes && expense.notes.toLowerCase().includes(searchLower))
      );
    }

    // Expense type filter
    if (filters.expense_type) {
      filtered = filtered.filter(expense => expense.expense_type === filters.expense_type);
    }

    // Invoice filed filter
    if (filters.invoice_filed !== 'all') {
      filtered = filtered.filter(expense => expense.invoice_filed === (filters.invoice_filed === 'yes'));
    }

    // Date range filter
    if (filters.date_range !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // End of today

      switch (filters.date_range) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          filtered = filtered.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= endDate;
          });
          break;
        case 'this_week':
          startDate = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
          startDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= endDate;
          });
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= endDate;
          });
          break;
        case 'custom':
          if (filters.start_date) {
            const customStartDate = new Date(filters.start_date);
            customStartDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(expense => new Date(expense.date) >= customStartDate);
          }
          if (filters.end_date) {
            const customEndDate = new Date(filters.end_date);
            customEndDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(expense => new Date(expense.date) <= customEndDate);
          }
          break;
      }
    }

    setFilteredExpenses(filtered);
    setCurrentPage(1);
  }, [expenses, filters]);

  // Calculate financial totals
  const financialTotals = expenses.reduce((totals, expense) => ({
    totalAmount: totals.totalAmount + expense.amount,
    filedInvoices: totals.filedInvoices + (expense.invoice_filed ? 1 : 0),
    unfiledInvoices: totals.unfiledInvoices + (expense.invoice_filed ? 0 : 1)
  }), { 
    totalAmount: 0, 
    filedInvoices: 0,
    unfiledInvoices: 0
  });

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (key: keyof ExpenseFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSelectExpense = (expenseId: string) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedExpenses.length === paginatedExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(paginatedExpenses.map(expense => expense.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedExpenses.length) return;
    
    if (confirm(`Delete ${selectedExpenses.length} selected expenses?`)) {
      try {
        for (const expenseId of selectedExpenses) {
          await deleteExpense(expenseId);
        }
        setSelectedExpenses([]);
        fetchExpenses();
      } catch (error: any) {
        console.error('Error deleting expenses:', error);
      }
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleSaveExpense = (savedExpense: Expense) => {
    fetchExpenses();
    setEditingExpense(undefined);
    setLastUpdated(new Date());
  };

  const handleRefresh = async () => {
    await fetchExpenses();
    setLastUpdated(new Date());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const expenseTypeOptions: ExpenseType[] = [
    'Bank fees', 'Course', 'Done with you program', 'Done for you program',
    'Meta ads', 'Agency fees', 'Loan', 'Misk', 'Monthly software', 'Other',
    'Personal', 'Referral free', 'Refund', 'Taxes', 'Team payroll',
    'Yearly software', 'YouTube ads'
  ];

  if (loading && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-400/30 border-t-rose-400"></div>
          <div className="absolute inset-0 rounded-full bg-rose-400/10 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard section="finances">
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-rose-400/20 to-amber-500/20 rounded-xl">
                <DollarSign className="h-8 w-8 text-rose-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text section-gradient-finances">
                  Cash Out
                </h1>
                <p className="text-gray-400 mt-1">
                  Track outgoing payments and manage business expenses.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Last Updated</p>
              <p className="text-sm font-semibold text-white">
                {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                setEditingExpense(undefined);
                setShowForm(true);
              }}
              className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-rose-400 to-amber-500 hover:from-rose-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-rose-500/25"
            >
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-rose-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Expenses</p>
                <p className="text-3xl font-bold text-white mt-1">{expenses.length}</p>
                <p className="text-xs text-rose-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  All recorded expenses
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-rose-400/20 to-amber-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-8 w-8 text-rose-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-red-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Amount</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(financialTotals.totalAmount)}</p>
                <p className="text-xs text-red-400 mt-1 flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Total cash out
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-400/20 to-red-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-8 w-8 text-red-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-green-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Invoices Filed</p>
                <p className="text-3xl font-bold text-white mt-1">{financialTotals.filedInvoices}</p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <CheckSquare className="h-3 w-3 mr-1" />
                  For accounting
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <CheckSquare className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Invoices Pending</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">{financialTotals.unfiledInvoices}</p>
                <p className="text-xs text-yellow-400 mt-1 flex items-center">
                  <Square className="h-3 w-3 mr-1" />
                  Action required
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Square className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="glass-card p-6 hover:bg-gray-800/40 transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400 hover:bg-gray-700/50 transition-all duration-200"
              />
            </div>

            {/* Expense Type Filter */}
            <select
              value={filters.expense_type}
              onChange={(e) => handleFilterChange('expense_type', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="">All Types</option>
              {expenseTypeOptions.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Invoice Filed Filter */}
            <select
              value={filters.invoice_filed}
              onChange={(e) => handleFilterChange('invoice_filed', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="all">All Invoices</option>
              <option value="yes">Filed</option>
              <option value="no">Not Filed</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={filters.date_range}
              onChange={(e) => handleFilterChange('date_range', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {/* Actions */}
            <div className="flex space-x-2">
              {selectedExpenses.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center space-x-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete ({selectedExpenses.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Custom Date Range */}
          {filters.date_range === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.start_date || ''}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-gray-400">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.end_date || ''}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg animate-pulse">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Enhanced Expenses Table */}
        <div className="glass-card overflow-hidden hover:bg-gray-800/30 transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/60 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.length === paginatedExpenses.length && paginatedExpenses.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-600 bg-gray-700 text-rose-500 focus:ring-rose-500 hover:scale-110 transition-transform duration-200"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Expense Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Expense Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Invoice Filed</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Notes</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Created By</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {paginatedExpenses.map((expense) => (
                  <tr 
                    key={expense.id} 
                    className="hover:bg-gray-800/40 transition-all duration-300 group hover:shadow-lg hover:shadow-gray-900/20"
                  >
                    <td className="px-6 py-5">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.includes(expense.id)}
                        onChange={() => handleSelectExpense(expense.id)}
                        className="rounded border-gray-600 bg-gray-700 text-rose-500 focus:ring-rose-500 hover:scale-110 transition-transform duration-200"
                      />
                    </td>
                    <td className="px-6 py-5 text-gray-300 group-hover:text-white transition-colors">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-red-400 font-semibold">
                        {formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-white group-hover:text-rose-100 transition-colors">
                        {expense.expense_name}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-900/30 text-gray-400 border border-gray-500/30">
                        {expense.expense_type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {expense.invoice_filed ? (
                        <CheckSquare className="h-5 w-5 text-green-400" />
                      ) : (
                        <Square className="h-5 w-5 text-yellow-400" />
                      )}
                    </td>
                    <td className="px-6 py-5 text-gray-400 text-sm group-hover:text-gray-300 transition-colors max-w-xs truncate">
                      {expense.notes || '-'}
                    </td>
                    <td className="px-6 py-5 text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                      {expense.creator?.full_name || expense.creator?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-gray-400 hover:text-rose-400 transition-all duration-200 hover:scale-110 p-2 rounded-lg hover:bg-gray-700/50"
                          title="Edit expense"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginatedExpenses.length === 0 && (
            <div className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                No Expenses Found
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {filters.search || filters.expense_type || filters.invoice_filed !== 'all' || filters.date_range !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by adding your first expense entry.'}
              </p>
              <button
                onClick={() => {
                  setEditingExpense(undefined);
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-rose-400 to-amber-500 hover:from-rose-500 hover:to-amber-600 text-white font-medium rounded-lg transition-all duration-200"
              >
                Add Expense
              </button>
            </div>
          )}

          {/* Enhanced Pagination */}
          {paginatedExpenses.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-800/50 flex items-center justify-between bg-gray-800/20">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400">
                  Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold text-white">{Math.min(startIndex + itemsPerPage, filteredExpenses.length)}</span> of{' '}
                  <span className="font-semibold text-white">{filteredExpenses.length}</span> entries
                </div>
                
                {/* Items Per Page Selector */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="px-3 py-1 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent hover:bg-gray-600/50 transition-all duration-200"
                  >
                    {itemsPerPageOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-400">per page</span>
                </div>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 hover:bg-gray-700/50 rounded-lg"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-gray-300 px-3 py-1 bg-gray-700/50 rounded-lg">
                    Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
                    <span className="font-semibold text-white">{totalPages}</span>
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 hover:bg-gray-700/50 rounded-lg"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expense Form Modal */}
        <ExpenseForm
          expense={editingExpense}
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(undefined);
          }}
          onSave={handleSaveExpense}
          createExpense={createExpense}
          updateExpense={updateExpense}
        />
      </div>
    </RoleGuard>
  );
};

export default CashOut;