import React, { useState, useEffect } from 'react';
import { Deal, DealFilters } from '../types/deals';
import { useDeals, usePipelineMetrics } from '../hooks/useDeals';
import { useAuth } from '../contexts/AuthContext';
import PipelineBoard from '../components/Pipeline/PipelineBoard';
import PipelineHeader from '../components/Pipeline/PipelineHeader';
import PipelineMetrics from '../components/Pipeline/PipelineMetrics';
import PipelineFilters from '../components/Pipeline/PipelineFilters';
import DealForm from '../components/Pipeline/DealForm';
import RoleGuard from '../components/RoleGuard';

const SalesPipeline: React.FC = () => {
  const { user } = useAuth();
  const { deals, loading, error, fetchDeals, updateDeal, createDeal } = useDeals();
  const metrics = usePipelineMetrics(deals);
  
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const [filters, setFilters] = useState<DealFilters>({
    search: '',
    stage: '',
    service_type: '',
    deal_owner: '',
    deal_source: '',
    value_range: 'all',
    probability_range: 'all'
  });

  useEffect(() => {
    fetchDeals();
  }, []);

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
  }, [deals, filters]);

  const handleFilterChange = (key: keyof DealFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDealUpdate = async (dealId: string, updates: Partial<Deal>) => {
    const result = await updateDeal(dealId, updates);
    if (result.error) {
      console.error('Error updating deal:', result.error);
    }
  };

  const handleDealClick = (deal: Deal) => {
    setEditingDeal(deal);
    setShowForm(true);
  };

  const handleSaveDeal = (savedDeal: Deal) => {
    setEditingDeal(undefined);
    setLastUpdated(new Date());
  };

  const handleRefresh = async () => {
    await fetchDeals();
    setLastUpdated(new Date());
  };

  const handleNewDeal = () => {
    setEditingDeal(undefined);
    setShowForm(true);
  };

  const handleViewModeChange = (mode: 'board' | 'list') => {
    setViewMode(mode);
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
      <div className="space-y-4 h-full flex flex-col">
        {/* Compact Header */}
        <PipelineHeader
          lastUpdated={lastUpdated}
          loading={loading}
          viewMode={viewMode}
          onRefresh={handleRefresh}
          onViewModeChange={handleViewModeChange}
          onNewDeal={handleNewDeal}
        />

        {/* Compact Metrics */}
        <PipelineMetrics metrics={metrics} />

        {/* Compact Filters */}
        <PipelineFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Pipeline Board */}
        <div className="flex-1 min-h-0">
          {viewMode === 'board' ? (
            <PipelineBoard
              deals={filteredDeals}
              onDealUpdate={handleDealUpdate}
              onDealClick={handleDealClick}
            />
          ) : (
            <div className="glass-card p-6">
              <p className="text-gray-400 text-center">List view coming soon...</p>
            </div>
          )}
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

export default SalesPipeline;