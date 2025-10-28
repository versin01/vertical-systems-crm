import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Trash2, CreditCard as Edit, Eye, FileText, ChevronLeft, ChevronRight, MoreVertical, Sparkles, TrendingUp, Target, Award, ChevronDown, DollarSign, BarChart3, Calendar, Building, User, Phone, Mail, RefreshCw } from 'lucide-react';
import { Proposal, ProposalFilters, ProposalStatus } from '../../types/proposals';
import { useProposals } from '../../hooks/useProposals';
import { useLeads } from '../../hooks/useLeads';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import { useDeals } from '../../hooks/useDeals';
import { supabase } from '../../lib/supabase';
import ProposalForm from '../../components/Documents/ProposalForm';
import ProposalCard from '../../components/Documents/ProposalCard';
import ProposalStatusBadge from '../../components/Documents/ProposalStatusBadge';
import ProposalFiltersComponent from '../../components/Documents/ProposalFilters';
import GenerateAIProposalModal from '../../components/Documents/GenerateAIProposalModal';
import aiProposalService from '../../services/aiProposalService';
import RoleGuard from '../../components/RoleGuard';

const Proposals: React.FC = () => {
  const { user } = useAuth();
  const { proposals, loading, error, fetchProposals, createProposal, updateProposal, updateProposalStatus, deleteProposal, incrementFollowUp, setLoading } = useProposals();
  const { users, fetchUsers } = useUsers();
  const { deals, fetchDeals } = useDeals();
  const { leads, fetchLeads } = useLeads();
  
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showAIProposalModal, setShowAIProposalModal] = useState(false);
  const [selectedProposalForAI, setSelectedProposalForAI] = useState<Proposal | undefined>();

  const [filters, setFilters] = useState<ProposalFilters>({
    search: '',
    status: '',
    deal_id: '',
    assigned_to: '',
    date_range: 'all',
    value_range: 'all'
  });

  // Items per page options
  const itemsPerPageOptions = [10, 15, 25, 50];

  // Fetch initial data
  useEffect(() => {
    fetchProposals();
    fetchUsers();
    fetchDeals();
    fetchLeads();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...proposals];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(proposal => 
        proposal.title.toLowerCase().includes(searchLower) ||
        (proposal.proposal_text && proposal.proposal_text.toLowerCase().includes(searchLower)) ||
        (proposal.lead?.first_name && proposal.lead.first_name.toLowerCase().includes(searchLower)) ||
        (proposal.lead?.last_name && proposal.lead.last_name.toLowerCase().includes(searchLower)) ||
        (proposal.lead?.company && proposal.lead.company.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(proposal => proposal.status === filters.status);
    }

    // Deal filter
    if (filters.deal_id) {
      filtered = filtered.filter(proposal => proposal.deal_id === filters.deal_id);
    }

    // Assigned to filter
    if (filters.assigned_to) {
      filtered = filtered.filter(proposal => proposal.assigned_to === filters.assigned_to);
    }

    // Value range filter
    if (filters.value_range !== 'all') {
      filtered = filtered.filter(proposal => {
        const value = proposal.proposal_value;
        switch (filters.value_range) {
          case 'under_10k': return value < 10000;
          case '10k_50k': return value >= 10000 && value < 50000;
          case '50k_100k': return value >= 50000 && value < 100000;
          case 'over_100k': return value >= 100000;
          default: return true;
        }
      });
    }

    setFilteredProposals(filtered);
    setCurrentPage(1);
  }, [proposals, filters]);

  // Calculate financial totals
  const financialTotals = proposals.reduce((totals, proposal) => ({
    totalValue: totals.totalValue + proposal.proposal_value,
    draftValue: totals.draftValue + (proposal.status === 'draft' ? proposal.proposal_value : 0),
    sentValue: totals.sentValue + (proposal.status === 'sent' || proposal.status === 'viewed' ? proposal.proposal_value : 0),
    acceptedValue: totals.acceptedValue + (proposal.status === 'accepted' ? proposal.proposal_value : 0),
    rejectedValue: totals.rejectedValue + (proposal.status === 'rejected' ? proposal.proposal_value : 0)
  }), { totalValue: 0, draftValue: 0, sentValue: 0, acceptedValue: 0, rejectedValue: 0 });

  // Pagination
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProposals = filteredProposals.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (key: keyof ProposalFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (range: ProposalFilters['date_range']) => {
    setFilters(prev => ({ 
      ...prev, 
      date_range: range,
      // Reset custom dates if not using custom range
      start_date: range === 'custom' ? prev.start_date : undefined,
      end_date: range === 'custom' ? prev.end_date : undefined
    }));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSelectProposal = (proposalId: string) => {
    setSelectedProposals(prev => 
      prev.includes(proposalId) 
        ? prev.filter(id => id !== proposalId)
        : [...prev, proposalId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProposals.length === paginatedProposals.length) {
      setSelectedProposals([]);
    } else {
      setSelectedProposals(paginatedProposals.map(proposal => proposal.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedProposals.length) return;
    
    if (confirm(`Delete ${selectedProposals.length} selected proposals?`)) {
      try {
        for (const proposalId of selectedProposals) {
          await deleteProposal(proposalId);
        }
        setSelectedProposals([]);
        fetchProposals();
      } catch (error: any) {
        console.error('Error deleting proposals:', error);
      }
    }
  };

  const handleEditProposal = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setShowForm(true);
  };

  const handleSaveProposal = (savedProposal: Proposal) => {
    fetchProposals();
    setEditingProposal(undefined);
  };

  const handleStatusChange = async (proposalId: string, newStatus: ProposalStatus) => {
    try {
      const { error } = await updateProposalStatus(proposalId, newStatus);
      if (error) {
        console.error('Error updating proposal status:', error);
      } else {
        fetchProposals();
      }
    } catch (error: any) {
      console.error('Error updating proposal status:', error);
    }
  };

  const handleFollowUp = async (proposalId: string) => {
    try {
      const { error } = await incrementFollowUp(proposalId);
      if (error) {
        console.error('Error incrementing follow-up count:', error);
      } else {
        fetchProposals();
      }
    } catch (error: any) {
      console.error('Error incrementing follow-up count:', error);
    }
  };

  const handleRefresh = async () => {
    await fetchProposals();
    setLastUpdated(new Date());
  };

  const handleGenerateAIProposal = (proposal?: Proposal) => {
    setSelectedProposalForAI(proposal);
    setShowAIProposalModal(true);
  };

  const handleAIProposalGenerate = async (
    selectedLead: Lead, 
    input: { transcript?: string; meetingNumber?: string }, 
    existingProposalId?: string
  ) => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch associated deal if any
      let associatedDeal = null;
      if (selectedLead.id) {
        const { data: dealData, error: dealError } = await supabase
          .from('deals')
          .select('*')
          .eq('lead_id', selectedLead.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!dealError && dealData) {
          associatedDeal = dealData;
        }
      }

      // Fetch existing proposal if enhancing
      let existingProposal = null;
      if (existingProposalId) {
        const existingProp = proposals.find(p => p.id === existingProposalId);
        if (existingProp) {
          existingProposal = existingProp;
        }
      }

      // Call AI service
      const aiResponse = await aiProposalService.sendAIProposalRequest(
        selectedLead,
        input,
        user.id,
        existingProposal,
        associatedDeal
      );

      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'AI proposal generation failed');
      }

      // Prepare proposal data from AI response
      const proposalData = {
        title: aiResponse.title || `Proposal for ${selectedLead.company || `${selectedLead.first_name} ${selectedLead.last_name}`}`,
        proposal_text: aiResponse.proposal_text || '',
        proposal_value: aiResponse.proposal_value || (associatedDeal?.deal_value || 15000),
        deliverables: aiResponse.deliverables || [],
        timelines: aiResponse.timelines || [],
        proposal_link: aiResponse.proposal_link || '',
        status: 'draft' as ProposalStatus,
        assigned_to: user.id,
        deal_id: associatedDeal?.id || null
      };

      if (existingProposalId) {
        // Update existing proposal
        const { error } = await updateProposal(existingProposalId, proposalData);
        if (error) {
          throw new Error('Failed to update proposal with AI content');
        }
      } else {
        // Create new proposal
        const { error } = await createProposal({
          ...proposalData,
          created_by: user.id
        });
        if (error) {
          throw new Error('Failed to create new proposal with AI content');
        }
      }

      // Refresh proposals list
      await fetchProposals();
      
      console.log('AI Proposal generated successfully:', {
        leadId: selectedLead.id,
        proposalLink: aiResponse.proposal_link,
        existingProposalId
      });

    } catch (error: any) {
      console.error('Error generating AI proposal:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
      setShowAIProposalModal(false);
      setSelectedProposalForAI(undefined);
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

  if (loading && proposals.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400/30 border-t-purple-400"></div>
          <div className="absolute inset-0 rounded-full bg-purple-400/10 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard section="documents">
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-400/20 to-blue-600/20 rounded-xl">
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text section-gradient-documents">
                  Proposals
                </h1>
                <p className="text-gray-400 mt-1">
                  Create, manage, and track client proposals through the sales process.
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
                setEditingProposal(undefined);
                setShowForm(true);
              }}
              className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-600 hover:from-purple-500 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25"
            >
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Create Proposal</span>
            </button>
            <button
              onClick={() => handleGenerateAIProposal()}
              className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25"
            >
              <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Generate AI Proposal</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Proposals</p>
                <p className="text-3xl font-bold text-white mt-1">{proposals.length}</p>
                <p className="text-xs text-purple-400 mt-1 flex items-center">
                  <FileText className="h-3 w-3 mr-1" />
                  All proposals
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-400/20 to-blue-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Value</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(financialTotals.totalValue)}</p>
                <p className="text-xs text-blue-400 mt-1 flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Proposed value
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Sent Value</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{formatCurrency(financialTotals.sentValue)}</p>
                <p className="text-xs text-yellow-400 mt-1 flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  Awaiting response
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Mail className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-green-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Accepted Value</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(financialTotals.acceptedValue)}</p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  Closed won
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Award className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-red-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Rejected Value</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(financialTotals.rejectedValue)}</p>
                <p className="text-xs text-red-400 mt-1 flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  Lost opportunities
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-400/20 to-red-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <ProposalFiltersComponent
          filters={filters}
          onFilterChange={handleFilterChange}
          onDateRangeChange={handleDateRangeChange}
          users={users}
          deals={deals}
        />

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg animate-pulse">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* View Mode Selector */}
        <div className="flex justify-end">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-all duration-200 text-sm ${
                viewMode === 'list' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-all duration-200 text-sm ${
                viewMode === 'grid' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Grid</span>
            </button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProposals.map(proposal => (
              <ProposalCard 
                key={proposal.id} 
                proposal={proposal} 
                onClick={() => handleEditProposal(proposal)} 
              />
            ))}
            
            {paginatedProposals.length === 0 && (
              <div className="col-span-full glass-card p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">
                  No Proposals Found
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {filters.search || filters.status || filters.deal_id || filters.assigned_to || filters.date_range !== 'all' || filters.value_range !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'Get started by creating your first proposal.'}
                </p>
                <button
                  onClick={() => {
                    setEditingProposal(undefined);
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-400 to-blue-600 hover:from-purple-500 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Create Proposal
                </button>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="glass-card overflow-hidden hover:bg-gray-800/30 transition-all duration-300">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/60 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProposals.length === paginatedProposals.length && paginatedProposals.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 hover:scale-110 transition-transform duration-200"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Client</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Value</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Sent</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Follow-ups</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Proposal Link</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {paginatedProposals.map((proposal) => (
                    <tr 
                      key={proposal.id} 
                      className="hover:bg-gray-800/40 transition-all duration-300 group hover:shadow-lg hover:shadow-gray-900/20"
                    >
                      <td className="px-6 py-5">
                        <input
                          type="checkbox"
                          checked={selectedProposals.includes(proposal.id)}
                          onChange={() => handleSelectProposal(proposal.id)}
                          className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 hover:scale-110 transition-transform duration-200"
                        />
                      </td>
                      <td className="px-6 py-5">
                        <div className="group-hover:scale-105 transition-transform duration-200">
                          <div className="font-semibold text-white group-hover:text-purple-100 transition-colors">
                            {proposal.title}
                          </div>
                          {proposal.deal && (
                            <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                              {proposal.deal.deal_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <ProposalStatusBadge status={proposal.status} />
                      </td>
                      <td className="px-6 py-5">
                        {proposal.lead ? (
                          <div>
                            <div className="text-white font-medium">
                              {proposal.lead.first_name} {proposal.lead.last_name}
                            </div>
                            {proposal.lead.company && (
                              <div className="text-sm text-gray-400">
                                {proposal.lead.company}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-purple-400 font-semibold">
                          {formatCurrency(proposal.proposal_value)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                        {formatDate(proposal.created_at)}
                      </td>
                      <td className="px-6 py-5 text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                        {proposal.sent_date ? formatDate(proposal.sent_date) : '-'}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-300">{proposal.follow_up_count || 0}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowUp(proposal.id);
                            }}
                            className="p-1 text-gray-400 hover:text-purple-400 transition-colors rounded-full hover:bg-gray-700/50"
                            title="Add follow-up"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          {proposal.proposal_link ? (
                            <div className="flex items-center space-x-2">
                              <a
                                href={proposal.proposal_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 transition-all duration-200 hover:scale-110 p-2 rounded-lg hover:bg-gray-700/50"
                                title="Open proposal link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(proposal.proposal_link || '');
                                }}
                                className="text-gray-400 hover:text-purple-400 transition-all duration-200 hover:scale-110 p-1 rounded-lg hover:bg-gray-700/50"
                                title="Copy link"
                              >
                                <span className="text-xs">📋</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">No link</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditProposal(proposal)}
                            className="text-gray-400 hover:text-purple-400 transition-all duration-200 hover:scale-110 p-2 rounded-lg hover:bg-gray-700/50"
                            title="Edit proposal"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this proposal?')) {
                                deleteProposal(proposal.id);
                              }
                            }}
                            className="text-gray-400 hover:text-red-400 transition-all duration-200 hover:scale-110 p-2 rounded-lg hover:bg-gray-700/50"
                            title="Delete proposal"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedProposals.length === 0 && (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">
                  No Proposals Found
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {filters.search || filters.status || filters.deal_id || filters.assigned_to || filters.date_range !== 'all' || filters.value_range !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'Get started by creating your first proposal.'}
                </p>
                <button
                  onClick={() => {
                    setEditingProposal(undefined);
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-400 to-blue-600 hover:from-purple-500 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Create Proposal
                </button>
              </div>
            )}

            {/* Enhanced Pagination with Items Per Page Selector */}
            {paginatedProposals.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-800/50 flex items-center justify-between bg-gray-800/20">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-400">
                    Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-white">{Math.min(startIndex + itemsPerPage, filteredProposals.length)}</span> of{' '}
                    <span className="font-semibold text-white">{filteredProposals.length}</span> proposals
                  </div>
                  
                  {/* Items Per Page Selector */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="px-3 py-1 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-gray-600/50 transition-all duration-200"
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
        )}

        {/* Proposal Form Modal */}
        <ProposalForm
          proposal={editingProposal}
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingProposal(undefined);
          }}
          onSave={handleSaveProposal}
        />

        {/* Generate AI Proposal Modal */}
        <GenerateAIProposalModal
          isOpen={showAIProposalModal}
          proposal={selectedProposalForAI}
          leads={leads}
          onClose={() => {
            setShowAIProposalModal(false);
            setSelectedProposalForAI(undefined);
          }}
          onGenerate={(selectedLead, input, existingProposalId) => 
            handleAIProposalGenerate(selectedLead, input, existingProposalId)
          }
        />
      </div>
    </RoleGuard>
  );
};

export default Proposals;