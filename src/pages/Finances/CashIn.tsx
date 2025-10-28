import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Trash2, CreditCard as Edit, DollarSign, ChevronLeft, ChevronRight, Calendar, Sparkles, TrendingUp, Target, Award, RefreshCw, Building, User, Mail, Percent } from 'lucide-react';
import { CashEntry, CashEntryFilters, PaymentType, PaymentStatus } from '../../types/finances';
import { useCashEntries, useOffers } from '../../hooks/useCashEntries';
import { useAuth } from '../../contexts/AuthContext';
import CashInForm from '../../components/Finances/CashInForm';
import RoleGuard from '../../components/RoleGuard';

const CashIn: React.FC = () => {
  const { user } = useAuth();
  const { cashEntries, loading, error, fetchCashEntries, deleteCashEntry } = useCashEntries();
  const { offers, fetchOffers } = useOffers();
  const [filteredEntries, setFilteredEntries] = useState<CashEntry[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CashEntry | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const [filters, setFilters] = useState<CashEntryFilters>({
    search: '',
    status: '',
    payment_type: '',
    offer_id: '',
    date_range: 'all'
  });

  // Items per page options
  const itemsPerPageOptions = [10, 15, 25, 50];

  // Fetch data
  useEffect(() => {
    fetchCashEntries();
    fetchOffers();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...cashEntries];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.client_name.toLowerCase().includes(searchLower) ||
        entry.client_email.toLowerCase().includes(searchLower) ||
        (entry.offer?.name && entry.offer.name.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    // Payment type filter
    if (filters.payment_type) {
      filtered = filtered.filter(entry => entry.payment_type === filters.payment_type);
    }

    // Offer filter
    if (filters.offer_id) {
      filtered = filtered.filter(entry => entry.offer_id === filters.offer_id);
    }

    // Date range filter
    if (filters.date_range !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filters.date_range) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          filtered = filtered.filter(entry => new Date(entry.date) >= startDate);
          break;
        case 'this_week':
          startDate = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
          filtered = filtered.filter(entry => new Date(entry.date) >= startDate);
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter(entry => new Date(entry.date) >= startDate);
          break;
        case 'custom':
          if (filters.start_date) {
            filtered = filtered.filter(entry => new Date(entry.date) >= new Date(filters.start_date!));
          }
          if (filters.end_date) {
            filtered = filtered.filter(entry => new Date(entry.date) <= new Date(filters.end_date!));
          }
          break;
      }
    }

    setFilteredEntries(filtered);
    setCurrentPage(1);
  }, [cashEntries, filters]);

  // Calculate financial totals
  const financialTotals = cashEntries.reduce((totals, entry) => ({
    totalIncome: totals.totalIncome + entry.income,
    totalGrossProfit: totals.totalGrossProfit + entry.gross_profit,
    totalCommissions: totals.totalCommissions + entry.total_commissions,
    totalSetterPayments: totals.totalSetterPayments + entry.setter_payment,
    totalCloserPayments: totals.totalCloserPayments + entry.closer_payment,
    paidEntries: totals.paidEntries + (entry.status === 'Paid' ? 1 : 0),
    canceledEntries: totals.canceledEntries + (entry.status === 'Canceled' ? 1 : 0),
    refundedEntries: totals.refundedEntries + (entry.status === 'Refunded' ? 1 : 0)
  }), { 
    totalIncome: 0, 
    totalGrossProfit: 0, 
    totalCommissions: 0, 
    totalSetterPayments: 0, 
    totalCloserPayments: 0,
    paidEntries: 0,
    canceledEntries: 0,
    refundedEntries: 0
  });

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (key: keyof CashEntryFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSelectEntry = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEntries.length === paginatedEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(paginatedEntries.map(entry => entry.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedEntries.length) return;
    
    if (confirm(`Delete ${selectedEntries.length} selected entries?`)) {
      try {
        for (const entryId of selectedEntries) {
          await deleteCashEntry(entryId);
        }
        setSelectedEntries([]);
        fetchCashEntries();
      } catch (error: any) {
        console.error('Error deleting entries:', error);
      }
    }
  };

  const handleEditEntry = (entry: CashEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleSaveEntry = (savedEntry: CashEntry) => {
    fetchCashEntries();
    setEditingEntry(undefined);
    setLastUpdated(new Date());
  };

  const handleRefresh = async () => {
    await fetchCashEntries();
    await fetchOffers();
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

  const getStatusColor = (status: PaymentStatus) => {
    const colors = {
      'Paid': 'bg-green-900/30 text-green-400 border-green-500/30',
      'Canceled': 'bg-red-900/30 text-red-400 border-red-500/30',
      'Refunded': 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30'
    };
    return colors[status];
  };

  const getPaymentTypeColor = (paymentType: PaymentType) => {
    if (paymentType === 'Deposit') return 'bg-blue-900/30 text-blue-400';
    if (paymentType === 'Installment') return 'bg-purple-900/30 text-purple-400';
    return 'bg-gray-900/30 text-gray-400';
  };

  if (loading && cashEntries.length === 0) {
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
                  Cash In
                </h1>
                <p className="text-gray-400 mt-1">
                  Track incoming payments and revenue with commission calculations.
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
                setEditingEntry(undefined);
                setShowForm(true);
              }}
              className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-rose-400 to-amber-500 hover:from-rose-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-rose-500/25"
            >
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Cash Entry</span>
            </button>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-rose-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Entries</p>
                <p className="text-3xl font-bold text-white mt-1">{cashEntries.length}</p>
                <p className="text-xs text-rose-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  All transactions
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-rose-400/20 to-amber-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-8 w-8 text-rose-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-green-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Income</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(financialTotals.totalIncome)}</p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Revenue received
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Gross Profit</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(financialTotals.totalGrossProfit)}</p>
                <p className="text-xs text-emerald-400 mt-1 flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  Before commissions
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Commissions</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{formatCurrency(financialTotals.totalCommissions)}</p>
                <p className="text-xs text-blue-400 mt-1 flex items-center">
                  <Percent className="h-3 w-3 mr-1" />
                  Paid out
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Percent className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-amber-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Net Profit</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {formatCurrency(financialTotals.totalGrossProfit - financialTotals.totalCommissions)}
                </p>
                <p className="text-xs text-amber-400 mt-1 flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  After commissions
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Award className="h-8 w-8 text-amber-400" />
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
                placeholder="Search entries..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400 hover:bg-gray-700/50 transition-all duration-200"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Canceled">Canceled</option>
              <option value="Refunded">Refunded</option>
            </select>

            {/* Payment Type Filter */}
            <select
              value={filters.payment_type}
              onChange={(e) => handleFilterChange('payment_type', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="">All Payment Types</option>
              <option value="Deposit">Deposit</option>
              <option value="Installment">Installment</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num.toString()}>{num}</option>
              ))}
            </select>

            {/* Offer Filter */}
            <select
              value={filters.offer_id}
              onChange={(e) => handleFilterChange('offer_id', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="">All Offers</option>
              {offers.map(offer => (
                <option key={offer.id} value={offer.id}>
                  {offer.name}
                </option>
              ))}
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
              {selectedEntries.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center space-x-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete ({selectedEntries.length})</span>
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

        {/* Enhanced Cash Entries Table */}
        <div className="glass-card overflow-hidden hover:bg-gray-800/30 transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/60 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedEntries.length === paginatedEntries.length && paginatedEntries.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-600 bg-gray-700 text-rose-500 focus:ring-rose-500 hover:scale-110 transition-transform duration-200"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Income</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Offer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Client</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Payment Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Contracted</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Gross Profit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Setter</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Closer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Total Commissions</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {paginatedEntries.map((entry) => (
                  <tr 
                    key={entry.id} 
                    className="hover:bg-gray-800/40 transition-all duration-300 group hover:shadow-lg hover:shadow-gray-900/20"
                  >
                    <td className="px-6 py-5">
                      <input
                        type="checkbox"
                        checked={selectedEntries.includes(entry.id)}
                        onChange={() => handleSelectEntry(entry.id)}
                        className="rounded border-gray-600 bg-gray-700 text-rose-500 focus:ring-rose-500 hover:scale-110 transition-transform duration-200"
                      />
                    </td>
                    <td className="px-6 py-5 text-gray-300 group-hover:text-white transition-colors">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-green-400 font-semibold">
                        {formatCurrency(entry.income)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {entry.offer ? (
                        <span className="text-white font-medium">
                          {entry.offer.name}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="group-hover:scale-105 transition-transform duration-200">
                        <div className="font-semibold text-white group-hover:text-rose-100 transition-colors">
                          {entry.client_name}
                        </div>
                        <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                          {entry.client_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentTypeColor(entry.payment_type)}`}>
                        {entry.payment_type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-white font-medium">
                        {formatCurrency(entry.contracted_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-emerald-400 font-semibold">
                        {formatCurrency(entry.gross_profit)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-blue-400 font-medium">
                          {formatCurrency(entry.setter_payment)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {entry.setter_percentage}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-green-400 font-medium">
                          {formatCurrency(entry.closer_payment)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {entry.closer_percentage}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-rose-400 font-semibold">
                        {formatCurrency(entry.total_commissions)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="text-gray-400 hover:text-rose-400 transition-all duration-200 hover:scale-110 p-2 rounded-lg hover:bg-gray-700/50"
                          title="Edit entry"
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

          {paginatedEntries.length === 0 && (
            <div className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                No Cash Entries Found
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {filters.search || filters.status || filters.payment_type || filters.offer_id || filters.date_range !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by adding your first cash entry.'}
              </p>
              <button
                onClick={() => {
                  setEditingEntry(undefined);
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-rose-400 to-amber-500 hover:from-rose-500 hover:to-amber-600 text-white font-medium rounded-lg transition-all duration-200"
              >
                Add Cash Entry
              </button>
            </div>
          )}

          {/* Enhanced Pagination */}
          {paginatedEntries.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-800/50 flex items-center justify-between bg-gray-800/20">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400">
                  Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold text-white">{Math.min(startIndex + itemsPerPage, filteredEntries.length)}</span> of{' '}
                  <span className="font-semibold text-white">{filteredEntries.length}</span> entries
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

        {/* Cash Entry Form Modal */}
        <CashInForm
          entry={editingEntry}
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingEntry(undefined);
          }}
          onSave={handleSaveEntry}
        />
      </div>
    </RoleGuard>
  );
};

export default CashIn;