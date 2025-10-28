import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Download, Trash2, Edit, 
  Eye, Users, ChevronLeft, ChevronRight, MoreVertical,
  Sparkles, TrendingUp, Target, Award, ChevronDown, DollarSign,
  BarChart3, Calendar, Building, User, Phone, Mail
} from 'lucide-react';
import { Deal, DealFilters, DealStage } from '../../types/deals';
import { useDeals } from '../../hooks/useDeals';
import { useAuth } from '../../contexts/AuthContext';
import DealForm from '../../components/Pipeline/DealForm';
import DealStatusDropdown from '../../components/Sales/DealStatusDropdown';
import RoleGuard from '../../components/RoleGuard';

const SalesCRM: React.FC = () => {
  const { user } = useAuth();
  const { deals, loading, error, fetchDeals, updateDeal, deleteDeal } = useDeals();
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [filters, setFilters] = useState<DealFilters>({
    search: '',
    stage: '',
    service_type: '',
    deal_owner: '',
    deal_source: '',
    value_range: 'all',
    probability_range: 'all'
  });

  // Items per page options
  const itemsPerPageOptions = [10, 15, 25, 50];

  // Fetch deals
  useEffect(() => {
    fetchDeals();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...deals];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(deal => 
        deal.deal_name.toLowerCase().includes(searchLower) ||
        (deal.lead?.first_name && deal.lead.first_name.toLowerCase().includes(searchLower)) ||
        (deal.lead?.last_name && deal.lead.last_name.toLowerCase().includes(searchLower)) ||
        (deal.lead?.company && deal.lead.company.toLowerCase().includes(searchLower))
      );
    }

    // Stage filter
    if (filters.stage) {
      filtered = filtered.filter(deal => deal.stage === filters.stage);
    }

    // Service type filter
    if (filters.service_type) {
      filtered = filtered.filter(deal => deal.service_type === filters.service_type);
    }

    // Deal owner filter
    if (filters.deal_owner) {
      filtered = filtered.filter(deal => deal.deal_owner === filters.deal_owner);
    }

    // Deal source filter
    if (filters.deal_source) {
      filtered = filtered.filter(deal => deal.deal_source === filters.deal_source);
    }

    // Value range filter
    if (filters.value_range !== 'all') {
      filtered = filtered.filter(deal => {
        const value = deal.deal_value;
        switch (filters.value_range) {
          case 'under_10k': return value < 10000;
          case '10k_50k': return value >= 10000 && value < 50000;
          case '50k_100k': return value >= 50000 && value < 100000;
          case 'over_100k': return value >= 100000;
          default: return true;
        }
      });
    }

    // Probability range filter
    if (filters.probability_range !== 'all') {
      filtered = filtered.filter(deal => {
        const prob = deal.probability;
        switch (filters.probability_range) {
          case 'low': return prob < 40;
          case 'medium': return prob >= 40 && prob < 80;
          case 'high': return prob >= 80;
          default: return true;
        }
      });
    }

    setFilteredDeals(filtered);
    setCurrentPage(1);
  }, [deals, filters]);

  // Calculate financial totals
  const financialTotals = deals.reduce((totals, deal) => ({
    totalValue: totals.totalValue + deal.deal_value,
    weightedValue: totals.weightedValue + (deal.deal_value * deal.probability / 100),
    wonValue: totals.wonValue + (deal.stage === 'contract_signed' ? deal.deal_value : 0),
    wonCount: totals.wonCount + (deal.stage === 'contract_signed' ? 1 : 0)
  }), { totalValue: 0, weightedValue: 0, wonValue: 0, wonCount: 0 });

  // Pagination
  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDeals = filteredDeals.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (key: keyof DealFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSelectDeal = (dealId: string) => {
    setSelectedDeals(prev => 
      prev.includes(dealId) 
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDeals.length === paginatedDeals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(paginatedDeals.map(deal => deal.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedDeals.length) return;
    
    if (confirm(`Delete ${selectedDeals.length} selected deals?`)) {
      try {
        for (const dealId of selectedDeals) {
          await deleteDeal(dealId);
        }
        setSelectedDeals([]);
        fetchDeals();
      } catch (error: any) {
        console.error('Error deleting deals:', error);
      }
    }
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setShowForm(true);
  };

  const handleSaveDeal = (savedDeal: Deal) => {
    if (editingDeal) {
      // Update existing deal in local state
      fetchDeals();
    } else {
      // Add new deal to local state
      fetchDeals();
    }
    setEditingDeal(undefined);
  };

  const handleStatusChange = async (dealId: string, newStage: DealStage) => {
    try {
      const updates: Partial<Deal> = { 
        stage: newStage,
        updated_at: new Date().toISOString()
      };

      // Set dates based on stage
      if (newStage === 'contract_signed') {
        updates.won_date = new Date().toISOString();
        updates.actual_close_date = new Date().toISOString();
      } else if (newStage === 'lost') {
        updates.lost_date = new Date().toISOString();
      }

      const result = await updateDeal(dealId, updates);
      if (result.error) {
        console.error('Error updating deal stage:', result.error);
      }
    } catch (error: any) {
      console.error('Error updating deal stage:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getServiceTypeColor = (serviceType?: string) => {
    const colors = {
      'Growth Creator': 'bg-blue-900/30 text-blue-400',
      'AIGC Systems': 'bg-purple-900/30 text-purple-400',
      'Custom Projects': 'bg-green-900/30 text-green-400',
      'Ongoing Support': 'bg-orange-900/30 text-orange-400',
      'Business Consulting': 'bg-teal-900/30 text-teal-400',
      'System Optimization': 'bg-indigo-900/30 text-indigo-400',
      'CRM Implementation': 'bg-pink-900/30 text-pink-400'
    };
    return colors[serviceType as keyof typeof colors] || 'bg-gray-900/30 text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-400/30 border-t-emerald-400"></div>
          <div className="absolute inset-0 rounded-full bg-emerald-400/10 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard section="sales">
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-400/20 to-green-600/20 rounded-xl">
                <BarChart3 className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text section-gradient-sales">
                  Sales CRM
                </h1>
                <p className="text-gray-400 mt-1">
                  Manage and track your deals through the sales pipeline.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingDeal(undefined);
              setShowForm(true);
            }}
            className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-400 to-green-600 hover:from-emerald-500 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Add Deal</span>
          </button>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Deals</p>
                <p className="text-3xl font-bold text-white mt-1">{deals.length}</p>
                <p className="text-xs text-emerald-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Active pipeline
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-400/20 to-green-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Pipeline Value</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(financialTotals.totalValue)}</p>
                <p className="text-xs text-blue-400 mt-1 flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Total potential
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-green-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Weighted Value</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(financialTotals.weightedValue)}</p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  Probability adjusted
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Won Deals</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">{financialTotals.wonCount}</p>
                <p className="text-xs text-emerald-400 mt-1 flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  Closed won
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Award className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Win Rate</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">
                  {deals.length > 0 ? ((financialTotals.wonCount / deals.length) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-yellow-400 mt-1 flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Conversion rate
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-8 w-8 text-yellow-400" />
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
                placeholder="Search deals..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400 hover:bg-gray-700/50 transition-all duration-200"
              />
            </div>

            {/* Stage Filter */}
            <select
              value={filters.stage}
              onChange={(e) => handleFilterChange('stage', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="">All Stages</option>
              <option value="new_opportunity">New Opportunity</option>
              <option value="discovery_call_scheduled">Discovery Scheduled</option>
              <option value="discovery_call_completed">Discovery Completed</option>
              <option value="proposal_preparation">Proposal Prep</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="proposal_review">Proposal Review</option>
              <option value="negotiation">Negotiation</option>
              <option value="contract_sent">Contract Sent</option>
              <option value="contract_signed">Contract Signed</option>
              <option value="project_kickoff">Project Kickoff</option>
              <option value="on_hold">On Hold</option>
              <option value="lost">Lost</option>
            </select>

            {/* Service Type Filter */}
            <select
              value={filters.service_type}
              onChange={(e) => handleFilterChange('service_type', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="">All Services</option>
              <option value="Growth Creator">Growth Creator</option>
              <option value="AIGC Systems">AIGC Systems</option>
              <option value="Custom Projects">Custom Projects</option>
              <option value="Ongoing Support">Ongoing Support</option>
              <option value="Business Consulting">Business Consulting</option>
              <option value="System Optimization">System Optimization</option>
              <option value="CRM Implementation">CRM Implementation</option>
            </select>

            {/* Value Range Filter */}
            <select
              value={filters.value_range}
              onChange={(e) => handleFilterChange('value_range', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="all">All Values</option>
              <option value="under_10k">Under $10K</option>
              <option value="10k_50k">$10K - $50K</option>
              <option value="50k_100k">$50K - $100K</option>
              <option value="over_100k">Over $100K</option>
            </select>

            {/* Probability Range Filter */}
            <select
              value={filters.probability_range}
              onChange={(e) => handleFilterChange('probability_range', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="all">All Probabilities</option>
              <option value="low">Low (0-39%)</option>
              <option value="medium">Medium (40-79%)</option>
              <option value="high">High (80-100%)</option>
            </select>

            {/* Actions */}
            <div className="flex space-x-2">
              {selectedDeals.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center space-x-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete ({selectedDeals.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg animate-pulse">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Enhanced Deals Table */}
        <div className="glass-card overflow-hidden hover:bg-gray-800/30 transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/60 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedDeals.length === paginatedDeals.length && paginatedDeals.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500 hover:scale-110 transition-transform duration-200"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Deal Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Stage</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Service Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Deal Value</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Probability</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Expected Close</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {paginatedDeals.map((deal) => (
                  <tr 
                    key={deal.id} 
                    className="hover:bg-gray-800/40 transition-all duration-300 group hover:shadow-lg hover:shadow-gray-900/20"
                  >
                    <td className="px-6 py-5">
                      <input
                        type="checkbox"
                        checked={selectedDeals.includes(deal.id)}
                        onChange={() => handleSelectDeal(deal.id)}
                        className="rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500 hover:scale-110 transition-transform duration-200"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="group-hover:scale-105 transition-transform duration-200">
                        <div className="font-semibold text-white group-hover:text-emerald-100 transition-colors">
                          {deal.deal_name}
                        </div>
                        {deal.lead && (
                          <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                            {deal.lead.first_name} {deal.lead.last_name}
                          </div>
                        )}
                        {deal.lead?.company && (
                          <div className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                            {deal.lead.company}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <DealStatusDropdown 
                        deal={deal} 
                        onStatusChange={handleStatusChange}
                      />
                    </td>
                    <td className="px-6 py-5">
                      {deal.service_type ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceTypeColor(deal.service_type)}`}>
                          {deal.service_type}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-white group-hover:text-emerald-100 transition-colors">
                        {formatCurrency(deal.deal_value)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Weighted: {formatCurrency(deal.deal_value * deal.probability / 100)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{deal.probability}%</span>
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full transition-all duration-300"
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                      {formatDate(deal.expected_close_date)}
                    </td>
                    <td className="px-6 py-5 text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                      {formatDate(deal.created_at)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditDeal(deal)}
                          className="text-gray-400 hover:text-emerald-400 transition-all duration-200 hover:scale-110 p-2 rounded-lg hover:bg-gray-700/50"
                          title="Edit deal"
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

          {/* Enhanced Pagination */}
          <div className="px-6 py-4 border-t border-gray-800/50 flex items-center justify-between bg-gray-800/20">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-white">{Math.min(startIndex + itemsPerPage, filteredDeals.length)}</span> of{' '}
                <span className="font-semibold text-white">{filteredDeals.length}</span> deals
              </div>
              
              {/* Items Per Page Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-3 py-1 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:bg-gray-600/50 transition-all duration-200"
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
        </div>

        {/* Deal Form Modal */}
        <DealForm
          deal={editingDeal}
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingDeal(undefined);
          }}
          onSave={handleSaveDeal}
        />
      </div>
    </RoleGuard>
  );
};

export default SalesCRM;