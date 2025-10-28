import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Trash2, CreditCard as Edit, Eye, Users, ChevronLeft, ChevronRight, MoreVertical, Sparkles, TrendingUp, Target, Award, ChevronDown, DollarSign, Zap } from 'lucide-react';
import { Lead, LeadFilters, LeadStatus } from '../../types/leads';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useWebhookTracking } from '../../hooks/useWebhookTracking';
import FollowUpButtons from '../../components/Leads/FollowUpButtons';
import FollowUpProgress from '../../components/Leads/FollowUpProgress';
import LeadChecklist from '../../components/Leads/LeadChecklist';
import LeadForm from '../../components/Leads/LeadForm';
import DealForm from '../../components/Pipeline/DealForm';
import RoleGuard from '../../components/RoleGuard';

const LeadsCRM: React.FC = () => {
  const { user } = useAuth();
  const { trackStatusChange, trackLeadDeleted } = useWebhookTracking();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [convertingLeadId, setConvertingLeadId] = useState<string | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    status: '',
    lead_source: '',
    assigned_to: '',
    follow_up_completion: 'all',
    checklist_completion: 'all'
  });

  // Items per page options
  const itemsPerPageOptions = [10, 15, 25, 50];

  // Fetch leads
  const fetchLeads = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Apply filters
  useEffect(() => {
    let filtered = [...leads];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.first_name.toLowerCase().includes(searchLower) ||
        lead.last_name.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        (lead.company && lead.company.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(lead => lead.status === filters.status);
    }

    // Lead source filter
    if (filters.lead_source) {
      filtered = filtered.filter(lead => lead.lead_source === filters.lead_source);
    }

    // Follow-up completion filter
    if (filters.follow_up_completion !== 'all') {
      filtered = filtered.filter(lead => {
        const completedCount = lead.follow_ups_completed.filter(Boolean).length;
        if (filters.follow_up_completion === 'complete') {
          return completedCount === 7;
        } else {
          return completedCount < 7;
        }
      });
    }

    // Checklist completion filter
    if (filters.checklist_completion !== 'all') {
      filtered = filtered.filter(lead => {
        if (!lead.lead_checklist) return filters.checklist_completion === 'incomplete';
        const completedCount = Object.values(lead.lead_checklist).filter(Boolean).length;
        if (filters.checklist_completion === 'complete') {
          return completedCount === 6;
        } else {
          return completedCount < 6;
        }
      });
    }

    setFilteredLeads(filtered);
    setCurrentPage(1);
  }, [leads, filters]);

  // Calculate financial totals
  const financialTotals = leads.reduce((totals, lead) => ({
    totalRevenue: totals.totalRevenue + (lead.revenue_generated || 0),
    totalCashCollected: totals.totalCashCollected + (lead.cash_collected || 0)
  }), { totalRevenue: 0, totalCashCollected: 0 });

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (key: keyof LeadFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === paginatedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(paginatedLeads.map(lead => lead.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedLeads.length) return;
    
    if (confirm(`Delete ${selectedLeads.length} selected leads?`)) {
      try {
        // Track webhook for each deleted lead
        for (const leadId of selectedLeads) {
          await trackLeadDeleted(leadId);
        }

        const { error } = await supabase
          .from('leads')
          .delete()
          .in('id', selectedLeads);

        if (error) throw error;
        
        setSelectedLeads([]);
        fetchLeads();
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleConvertToDeal = (leadId: string) => {
    setConvertingLeadId(leadId);
    setShowDealForm(true);
  };

  const handleSaveLead = (savedLead: Lead) => {
    if (editingLead) {
      setLeads(prev => prev.map(lead => 
        lead.id === savedLead.id ? savedLead : lead
      ));
    } else {
      setLeads(prev => [savedLead, ...prev]);
    }
    setEditingLead(undefined);
  };

  const handleSaveDeal = (savedDeal: any) => {
    // Refresh leads to update any status changes
    fetchLeads();
    setConvertingLeadId(undefined);
  };

  const handleFollowUpUpdate = (leadId: string, newFollowUps: boolean[], newDates: (string | null)[]) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { ...lead, follow_ups_completed: newFollowUps, follow_up_dates: newDates }
        : lead
    ));
  };

  const handleChecklistUpdate = (leadId: string, newChecklist: any, newDates: any) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { ...lead, lead_checklist: newChecklist, checklist_dates: newDates }
        : lead
    ));
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      // Find the lead to get the old status
      const lead = leads.find(l => l.id === leadId);
      const oldStatus = lead?.status;

      const { error } = await supabase
        .from('leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      // Track webhook for status change
      if (oldStatus && oldStatus !== newStatus) {
        await trackStatusChange(leadId, oldStatus, newStatus);
      }

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
      
      setEditingStatus(null);
    } catch (error: any) {
      console.error('Error updating status:', error);
    }
  };

  const StatusDropdown: React.FC<{ lead: Lead }> = ({ lead }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const statusOptions = [
      { value: 'new', label: 'New', color: 'bg-blue-900/30 text-blue-400 border-blue-500/30' },
      { value: 'contacted', label: 'Contacted', color: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30' },
      { value: 'qualified', label: 'Qualified', color: 'bg-green-900/30 text-green-400 border-green-500/30' },
      { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-purple-900/30 text-purple-400 border-purple-500/30' },
      { value: 'closed_won', label: 'Closed Won', color: 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' },
      { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-900/30 text-red-400 border-red-500/30' },
      { value: 'nurturing', label: 'Nurturing', color: 'bg-orange-900/30 text-orange-400 border-orange-500/30' },
      { value: 'unqualified', label: 'Unqualified', color: 'bg-gray-900/30 text-gray-400 border-gray-500/30' }
    ];

    const currentStatus = statusOptions.find(s => s.value === lead.status);

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            group flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 
            hover:scale-105 hover:shadow-lg cursor-pointer
            ${currentStatus?.color || statusOptions[0].color}
          `}
        >
          <span>{currentStatus?.label || 'New'}</span>
          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    handleStatusChange(lead.id, option.value as LeadStatus);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-3 text-sm transition-all duration-200 hover:bg-gray-700/50
                    ${option.value === lead.status ? 'bg-gray-700/30' : ''}
                    ${option.color.includes('blue') ? 'hover:bg-blue-900/20' : ''}
                    ${option.color.includes('yellow') ? 'hover:bg-yellow-900/20' : ''}
                    ${option.color.includes('green') ? 'hover:bg-green-900/20' : ''}
                    ${option.color.includes('purple') ? 'hover:bg-purple-900/20' : ''}
                    ${option.color.includes('emerald') ? 'hover:bg-emerald-900/20' : ''}
                    ${option.color.includes('red') ? 'hover:bg-red-900/20' : ''}
                    ${option.color.includes('orange') ? 'hover:bg-orange-900/20' : ''}
                    ${option.color.includes('gray') ? 'hover:bg-gray-700/20' : ''}
                  `}
                >
                  <span className={`font-medium ${option.color.split(' ')[1]}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-400/30 border-t-teal-400"></div>
          <div className="absolute inset-0 rounded-full bg-teal-400/10 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard section="leads">
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-teal-400/20 to-cyan-600/20 rounded-xl">
                <Users className="h-8 w-8 text-teal-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text section-gradient-leads">
                  Leads CRM
                </h1>
                <p className="text-gray-400 mt-1">
                  Manage and track your leads through the sales pipeline with follow-up and progression tracking.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingLead(undefined);
              setShowForm(true);
            }}
            className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-600 hover:from-teal-500 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-teal-500/25"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Add Lead</span>
          </button>
        </div>

        {/* Enhanced Stats with Financial Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-teal-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Leads</p>
                <p className="text-3xl font-bold text-white mt-1">{leads.length}</p>
                <p className="text-xs text-teal-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Active pipeline
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-teal-400/20 to-cyan-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-teal-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">New Leads</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {leads.filter(lead => lead.status === 'new').length}
                </p>
                <p className="text-xs text-blue-400 mt-1 flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Fresh opportunities
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">N</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-green-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Qualified</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {leads.filter(lead => lead.status === 'qualified').length}
                </p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  Ready to convert
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">Q</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Revenue</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${financialTotals.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-emerald-400 mt-1 flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Generated
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-green-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Cash Collected</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  ${financialTotals.totalCashCollected.toLocaleString()}
                </p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  Collected
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">$</span>
                </div>
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
                placeholder="Search leads..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400 hover:bg-gray-700/50 transition-all duration-200"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="closed_won">Closed Won</option>
              <option value="closed_lost">Closed Lost</option>
              <option value="nurturing">Nurturing</option>
              <option value="unqualified">Unqualified</option>
            </select>

            {/* Lead Source Filter */}
            <select
              value={filters.lead_source}
              onChange={(e) => handleFilterChange('lead_source', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="">All Sources</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Cold Call">Cold Call</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Facebook">Facebook</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Email Campaign">Email Campaign</option>
              <option value="Trade Show">Trade Show</option>
              <option value="Networking">Networking</option>
              <option value="Skool Group">Skool Group</option>
              <option value="YouTube">YouTube</option>
              <option value="Other">Other</option>
            </select>

            {/* Follow-up Filter */}
            <select
              value={filters.follow_up_completion}
              onChange={(e) => handleFilterChange('follow_up_completion', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="all">All Follow-ups</option>
              <option value="incomplete">Incomplete</option>
              <option value="complete">Complete</option>
            </select>

            {/* Checklist Filter */}
            <select
              value={filters.checklist_completion}
              onChange={(e) => handleFilterChange('checklist_completion', e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <option value="all">All Checklists</option>
              <option value="incomplete">Incomplete</option>
              <option value="complete">Complete</option>
            </select>

            {/* Actions */}
            <div className="flex space-x-2">
              {selectedLeads.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center space-x-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete ({selectedLeads.length})</span>
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

        {/* Enhanced Leads Table */}
        <div className="glass-card overflow-hidden hover:bg-gray-800/30 transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/60 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-500 hover:scale-110 transition-transform duration-200"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Lead Source</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Revenue</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Follow-ups</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Checklist</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {paginatedLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-gray-800/40 transition-all duration-300 group hover:shadow-lg hover:shadow-gray-900/20"
                  >
                    <td className="px-6 py-5">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => handleSelectLead(lead.id)}
                        className="rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-500 hover:scale-110 transition-transform duration-200"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="group-hover:scale-105 transition-transform duration-200">
                        <div className="font-semibold text-white group-hover:text-teal-100 transition-colors">
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{lead.email}</div>
                        {lead.company && (
                          <div className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">{lead.company}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusDropdown lead={lead} />
                    </td>
                    <td className="px-6 py-5 text-gray-300 group-hover:text-white transition-colors">
                      {lead.lead_source || '-'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-sm text-white font-semibold">
                          ${(lead.revenue_generated || 0).toFixed(0)}
                        </div>
                        <div className="text-xs text-green-400">
                          ${(lead.cash_collected || 0).toFixed(0)} collected
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <FollowUpButtons
                        leadId={lead.id}
                        followUps={lead.follow_ups_completed}
                        followUpDates={lead.follow_up_dates}
                        onUpdate={(newFollowUps, newDates) => 
                          handleFollowUpUpdate(lead.id, newFollowUps, newDates)
                        }
                        size="sm"
                      />
                    </td>
                    <td className="px-6 py-5">
                      {lead.lead_checklist && (
                        <LeadChecklist
                          leadId={lead.id}
                          checklist={lead.lead_checklist}
                          checklistDates={lead.checklist_dates}
                          onUpdate={(newChecklist, newDates) => 
                            handleChecklistUpdate(lead.id, newChecklist, newDates)
                          }
                          size="sm"
                          showLabels={false}
                        />
                      )}
                    </td>
                    <td className="px-6 py-5 text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditLead(lead)}
                          className="text-gray-400 hover:text-teal-400 transition-all duration-200 hover:scale-110 p-2 rounded-lg hover:bg-gray-700/50"
                          title="Edit lead"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleConvertToDeal(lead.id)}
                          className="text-gray-400 hover:text-emerald-400 transition-all duration-200 hover:scale-110 p-2 rounded-lg hover:bg-gray-700/50"
                          title="Convert to deal"
                        >
                          <Zap className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination with Items Per Page Selector */}
          <div className="px-6 py-4 border-t border-gray-800/50 flex items-center justify-between bg-gray-800/20">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-white">{Math.min(startIndex + itemsPerPage, filteredLeads.length)}</span> of{' '}
                <span className="font-semibold text-white">{filteredLeads.length}</span> leads
              </div>
              
              {/* Items Per Page Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-3 py-1 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:bg-gray-600/50 transition-all duration-200"
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

        {/* Lead Form Modal */}
        <LeadForm
          lead={editingLead}
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingLead(undefined);
          }}
          onSave={handleSaveLead}
        />

        {/* Deal Form Modal for Lead Conversion */}
        <DealForm
          isOpen={showDealForm}
          leadId={convertingLeadId}
          onClose={() => {
            setShowDealForm(false);
            setConvertingLeadId(undefined);
          }}
          onSave={handleSaveDeal}
        />
      </div>
    </RoleGuard>
  );
};

export default LeadsCRM;