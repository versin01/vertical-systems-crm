import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, BarChart3, DollarSign, Target, 
  Calendar, Filter, Download, RefreshCw, Sparkles,
  ArrowUp, ArrowDown, Minus, Clock, Zap, Award
} from 'lucide-react';
import { Deal } from '../../types/deals';
import { useDeals } from '../../hooks/useDeals';
import DataVisualizationGrid from '../../components/DataVisualization/DataVisualizationGrid';
import SalesMetricsHeader from '../../components/Sales/SalesMetricsHeader';
import SalesMetricsKPIs from '../../components/Sales/SalesMetricsKPIs';
import SalesMetricsTable from '../../components/Sales/SalesMetricsTable';
import SalesMetricsInsights from '../../components/Sales/SalesMetricsInsights';

interface PipelineMetrics {
  totalDeals: number;
  newOpportunities: number;
  discoveryScheduled: number;
  discoveryCompleted: number;
  proposalPrep: number;
  proposalSent: number;
  proposalReview: number;
  negotiation: number;
  contractSent: number;
  contractSigned: number;
  projectKickoff: number;
  onHold: number;
  lost: number;
  totalValue: number;
  weightedValue: number;
  wonValue: number;
  lostValue: number;
  averageDealSize: number;
  averageSalesCycle: number;
  conversionRate: number;
}

interface TimeMetrics {
  current: PipelineMetrics;
  previous: PipelineMetrics;
}

interface MetricsData {
  today: TimeMetrics;
  thisWeek: TimeMetrics;
  thisMonth: TimeMetrics;
  last30Days: TimeMetrics;
  thisQuarter: TimeMetrics;
  allTime: TimeMetrics;
}

const SalesMetrics: React.FC = () => {
  const { deals, loading, error, fetchDeals } = useDeals();
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<keyof MetricsData>('thisMonth');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const periods = [
    { key: 'today' as const, label: 'Today', previousLabel: 'Yesterday' },
    { key: 'thisWeek' as const, label: 'This Week', previousLabel: 'Last Week' },
    { key: 'thisMonth' as const, label: 'This Month', previousLabel: 'Last Month' },
    { key: 'last30Days' as const, label: 'Last 30 Days', previousLabel: 'Previous 30 Days' },
    { key: 'thisQuarter' as const, label: 'This Quarter', previousLabel: 'Last Quarter' },
    { key: 'allTime' as const, label: 'All Time', previousLabel: 'N/A' }
  ];

  const fetchMetrics = async () => {
    try {
      await fetchDeals();
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
    }
  };

  const calculateMetrics = (deals: Deal[]): MetricsData => {
    const now = new Date();
    
    // Fix date calculations to be more inclusive
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1); // Start of yesterday
    
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

    const calculatePipelineMetrics = (filteredDeals: Deal[]): PipelineMetrics => {
      const totalDeals = filteredDeals.length;
      const newOpportunities = filteredDeals.filter(deal => deal.stage === 'new_opportunity').length;
      const discoveryScheduled = filteredDeals.filter(deal => deal.stage === 'discovery_call_scheduled').length;
      const discoveryCompleted = filteredDeals.filter(deal => deal.stage === 'discovery_call_completed').length;
      const proposalPrep = filteredDeals.filter(deal => deal.stage === 'proposal_preparation').length;
      const proposalSent = filteredDeals.filter(deal => deal.stage === 'proposal_sent').length;
      const proposalReview = filteredDeals.filter(deal => deal.stage === 'proposal_review').length;
      const negotiation = filteredDeals.filter(deal => deal.stage === 'negotiation').length;
      const contractSent = filteredDeals.filter(deal => deal.stage === 'contract_sent').length;
      const contractSigned = filteredDeals.filter(deal => deal.stage === 'contract_signed').length;
      const projectKickoff = filteredDeals.filter(deal => deal.stage === 'project_kickoff').length;
      const onHold = filteredDeals.filter(deal => deal.stage === 'on_hold').length;
      const lost = filteredDeals.filter(deal => deal.stage === 'lost').length;

      const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.deal_value, 0);
      const weightedValue = filteredDeals.reduce((sum, deal) => sum + (deal.deal_value * deal.probability / 100), 0);
      const wonValue = filteredDeals.filter(deal => deal.stage === 'contract_signed').reduce((sum, deal) => sum + deal.deal_value, 0);
      const lostValue = filteredDeals.filter(deal => deal.stage === 'lost').reduce((sum, deal) => sum + deal.deal_value, 0);
      const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
      const averageSalesCycle = 45; // This would need more complex calculation based on actual data
      const conversionRate = totalDeals > 0 ? (contractSigned / totalDeals) * 100 : 0;

      return {
        totalDeals,
        newOpportunities,
        discoveryScheduled,
        discoveryCompleted,
        proposalPrep,
        proposalSent,
        proposalReview,
        negotiation,
        contractSent,
        contractSigned,
        projectKickoff,
        onHold,
        lost,
        totalValue,
        weightedValue,
        wonValue,
        lostValue,
        averageDealSize,
        averageSalesCycle,
        conversionRate
      };
    };

    const filterDealsByDate = (deals: Deal[], startDate: Date, endDate?: Date) => {
      return deals.filter(deal => {
        const createdAt = new Date(deal.created_at);
        if (endDate) {
          return createdAt >= startDate && createdAt <= endDate;
        }
        return createdAt >= startDate;
      });
    };

    // Debug logging for today's filter
    const todayDeals = filterDealsByDate(deals, today, tomorrow);
    const yesterdayDeals = filterDealsByDate(deals, yesterday, today);
    
    console.log('Date filtering debug:', {
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString(),
      yesterday: yesterday.toISOString(),
      totalDeals: deals.length,
      todayDeals: todayDeals.length,
      yesterdayDeals: yesterdayDeals.length
    });
    return {
      today: {
        current: calculatePipelineMetrics(todayDeals),
        previous: calculatePipelineMetrics(yesterdayDeals)
      },
      thisWeek: {
        current: calculatePipelineMetrics(filterDealsByDate(deals, thisWeekStart)),
        previous: calculatePipelineMetrics(filterDealsByDate(deals, lastWeekStart, lastWeekEnd))
      },
      thisMonth: {
        current: calculatePipelineMetrics(filterDealsByDate(deals, thisMonthStart)),
        previous: calculatePipelineMetrics(filterDealsByDate(deals, lastMonthStart, lastMonthEnd))
      },
      last30Days: {
        current: calculatePipelineMetrics(filterDealsByDate(deals, last30DaysStart)),
        previous: calculatePipelineMetrics(filterDealsByDate(deals, previous30DaysStart, previous30DaysEnd))
      },
      thisQuarter: {
        current: calculatePipelineMetrics(filterDealsByDate(deals, thisQuarterStart)),
        previous: calculatePipelineMetrics(filterDealsByDate(deals, lastQuarterStart, lastQuarterEnd))
      },
      allTime: {
        current: calculatePipelineMetrics(deals),
        previous: {
          totalDeals: 0, newOpportunities: 0, discoveryScheduled: 0, discoveryCompleted: 0, 
          proposalPrep: 0, proposalSent: 0, proposalReview: 0, negotiation: 0, contractSent: 0, 
          contractSigned: 0, projectKickoff: 0, onHold: 0, lost: 0, totalValue: 0, 
          weightedValue: 0, wonValue: 0, lostValue: 0, averageDealSize: 0, averageSalesCycle: 0, 
          conversionRate: 0
        }
      }
    };
  };

  // Prepare data for visualizations
  const prepareVisualizationData = (metrics: PipelineMetrics) => {
    return {
      neuronData: {
        nodes: [
          {
            id: 'total',
            value: metrics.totalDeals,
            label: 'Total Deals',
            color: '#3b82f6',
            connections: ['discovery', 'proposal']
          },
          {
            id: 'discovery',
            value: metrics.discoveryScheduled + metrics.discoveryCompleted,
            label: 'Discovery',
            color: '#f59e0b',
            connections: ['proposal', 'negotiation']
          },
          {
            id: 'proposal',
            value: metrics.proposalSent + metrics.proposalReview,
            label: 'Proposal',
            color: '#8b5cf6',
            connections: ['negotiation', 'contract']
          },
          {
            id: 'negotiation',
            value: metrics.negotiation,
            label: 'Negotiation',
            color: '#ec4899',
            connections: ['contract']
          },
          {
            id: 'contract',
            value: metrics.contractSent + metrics.contractSigned,
            label: 'Contract',
            color: '#6366f1',
            connections: ['won']
          },
          {
            id: 'won',
            value: metrics.contractSigned,
            label: 'Won',
            color: '#10b981',
            connections: []
          }
        ]
      },
      spiderData: [
        {
          label: 'Pipeline Volume',
          value: metrics.totalDeals,
          maxValue: Math.max(metrics.totalDeals, 50),
          color: '#3b82f6'
        },
        {
          label: 'Discovery Rate',
          value: metrics.discoveryCompleted,
          maxValue: metrics.totalDeals || 1,
          color: '#f59e0b'
        },
        {
          label: 'Proposal Rate',
          value: metrics.proposalSent,
          maxValue: metrics.totalDeals || 1,
          color: '#8b5cf6'
        },
        {
          label: 'Close Rate',
          value: metrics.contractSigned,
          maxValue: metrics.totalDeals || 1,
          color: '#10b981'
        },
        {
          label: 'Deal Value',
          value: metrics.totalValue,
          maxValue: Math.max(metrics.totalValue, 100000),
          color: '#dc2626'
        },
        {
          label: 'Win Rate',
          value: metrics.conversionRate,
          maxValue: 100,
          color: '#16a34a'
        }
      ],
      funnelData: [
        {
          id: 'total',
          label: 'Total Deals',
          value: metrics.totalDeals,
          color: '#3b82f6'
        },
        {
          id: 'discovery',
          label: 'Discovery',
          value: metrics.discoveryScheduled + metrics.discoveryCompleted,
          color: '#f59e0b'
        },
        {
          id: 'proposal',
          label: 'Proposal',
          value: metrics.proposalSent + metrics.proposalReview,
          color: '#8b5cf6'
        },
        {
          id: 'negotiation',
          label: 'Negotiation',
          value: metrics.negotiation,
          color: '#ec4899'
        },
        {
          id: 'contract',
          label: 'Contract',
          value: metrics.contractSent,
          color: '#6366f1'
        },
        {
          id: 'won',
          label: 'Closed Won',
          value: metrics.contractSigned,
          color: '#10b981'
        }
      ]
    };
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    if (deals.length > 0) {
      const metrics = calculateMetrics(deals);
      setMetricsData(metrics);
    }
  }, [deals]);

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

  if (error || !metricsData) {
    return (
      <div className="space-y-6">
        <SalesMetricsHeader 
          lastUpdated={lastUpdated}
          loading={loading}
          onRefresh={fetchMetrics}
        />
        
        <div className="glass-card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-300 mb-4">
            Error Loading Sales Metrics
          </h2>
          <p className="text-gray-400 mb-4">
            {error || 'Unable to load sales metrics data.'}
          </p>
          {/* Debug info for development */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg text-left">
              <p className="text-xs text-gray-500 mb-2">Debug Info:</p>
              <p className="text-xs text-gray-400">Deals loaded: {deals.length}</p>
              <p className="text-xs text-gray-400">Selected period: {selectedPeriod}</p>
              <p className="text-xs text-gray-400">Error: {error}</p>
            </div>
          )}
          <button
            onClick={fetchMetrics}
            className="px-6 py-2 bg-gradient-to-r from-emerald-400 to-green-600 hover:from-emerald-500 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentMetrics = metricsData[selectedPeriod].current;
  const previousMetrics = metricsData[selectedPeriod].previous;

  // Additional safety check for empty metrics
  if (!currentMetrics || currentMetrics.totalDeals === undefined) {
    return (
      <div className="space-y-6">
        <SalesMetricsHeader 
          lastUpdated={lastUpdated}
          loading={loading}
          onRefresh={fetchMetrics}
        />
        
        <div className="glass-card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-300 mb-4">
            No Data Available
          </h2>
          <p className="text-gray-400 mb-4">
            No deals found for the selected time period: {periods.find(p => p.key === selectedPeriod)?.label}
          </p>
          <button
            onClick={() => setSelectedPeriod('allTime')}
            className="px-6 py-2 bg-gradient-to-r from-emerald-400 to-green-600 hover:from-emerald-500 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-200"
          >
            View All Time
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <SalesMetricsHeader 
        lastUpdated={lastUpdated}
        loading={loading}
        onRefresh={fetchMetrics}
      />

      {/* Period Selector */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap gap-2">
          {periods.map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105
                ${selectedPeriod === period.key
                  ? 'bg-gradient-to-r from-emerald-400 to-green-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }
              `}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <SalesMetricsKPIs 
        currentMetrics={currentMetrics}
        previousMetrics={previousMetrics}
      />

      {/* Futuristic Data Visualizations */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Sparkles className="h-6 w-6 text-emerald-400" />
          <h2 className="text-2xl font-bold gradient-text section-gradient-sales">
            Advanced Sales Analytics
          </h2>
        </div>
        
        <DataVisualizationGrid 
          data={prepareVisualizationData(currentMetrics)}
        />
      </div>

      {/* Comprehensive Pipeline Tracking Table */}
      <SalesMetricsTable 
        currentMetrics={currentMetrics}
        previousMetrics={previousMetrics}
        selectedPeriod={selectedPeriod}
        periods={periods}
      />

      {/* Additional Insights */}
      <SalesMetricsInsights 
        currentMetrics={currentMetrics}
        previousMetrics={previousMetrics}
      />
    </div>
  );
};

export default SalesMetrics;