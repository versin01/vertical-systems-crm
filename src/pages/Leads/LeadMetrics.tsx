import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Target, 
  Calendar, Filter, Download, RefreshCw, BarChart3,
  ArrowUp, ArrowDown, Minus, Clock, Zap, Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Lead } from '../../types/leads';
import DataVisualizationGrid from '../../components/DataVisualization/DataVisualizationGrid';

interface FunnelMetrics {
  totalLeads: number;
  newLeads: number;
  warmLeads: number;
  qualityConversation: number;
  leadMagnetSent: number;
  assetConsumed: number;
  nurtureSequence: number;
  bookingRequested: number;
  qualified: number;
  proposalSent: number;
  closedWon: number;
  closedLost: number;
  unqualified: number;
  revenueGenerated: number;
  cashCollected: number;
}

interface TimeMetrics {
  current: FunnelMetrics;
  previous: FunnelMetrics;
}

interface MetricsData {
  today: TimeMetrics;
  thisWeek: TimeMetrics;
  thisMonth: TimeMetrics;
  last30Days: TimeMetrics;
  thisQuarter: TimeMetrics;
  allTime: TimeMetrics;
}

const LeadMetrics: React.FC = () => {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      setLoading(true);
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const metrics = calculateMetrics(leads || []);
      setMetricsData(metrics);
      setLastUpdated(new Date());
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (leads: Lead[]): MetricsData => {
    const now = new Date();
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

    const calculateFunnelMetrics = (filteredLeads: Lead[]): FunnelMetrics => {
      const totalLeads = filteredLeads.length;
      const newLeads = filteredLeads.filter(lead => lead.status === 'new').length;
      const qualified = filteredLeads.filter(lead => lead.status === 'qualified').length;
      const proposalSent = filteredLeads.filter(lead => lead.status === 'proposal_sent').length;
      const closedWon = filteredLeads.filter(lead => lead.status === 'closed_won').length;
      const closedLost = filteredLeads.filter(lead => lead.status === 'closed_lost').length;
      const unqualified = filteredLeads.filter(lead => lead.status === 'unqualified').length;

      // Checklist-based metrics
      const warmLeads = filteredLeads.filter(lead => 
        lead.lead_checklist?.warm_lead === true
      ).length;
      
      const qualityConversation = filteredLeads.filter(lead => 
        lead.lead_checklist?.quality_conversation === true
      ).length;
      
      const leadMagnetSent = filteredLeads.filter(lead => 
        lead.lead_checklist?.lead_magnet_sent === true
      ).length;
      
      const assetConsumed = filteredLeads.filter(lead => 
        lead.lead_checklist?.asset_consumed === true
      ).length;
      
      const nurtureSequence = filteredLeads.filter(lead => 
        lead.lead_checklist?.nurture_sequence === true
      ).length;
      
      const bookingRequested = filteredLeads.filter(lead => 
        lead.lead_checklist?.booking_requested === true
      ).length;

      // Financial metrics
      const revenueGenerated = filteredLeads.reduce((sum, lead) => 
        sum + (lead.revenue_generated || 0), 0
      );
      
      const cashCollected = filteredLeads.reduce((sum, lead) => 
        sum + (lead.cash_collected || 0), 0
      );

      return {
        totalLeads,
        newLeads,
        warmLeads,
        qualityConversation,
        leadMagnetSent,
        assetConsumed,
        nurtureSequence,
        bookingRequested,
        qualified,
        proposalSent,
        closedWon,
        closedLost,
        unqualified,
        revenueGenerated,
        cashCollected
      };
    };

    const filterLeadsByDate = (leads: Lead[], startDate: Date, endDate?: Date) => {
      return leads.filter(lead => {
        const createdAt = new Date(lead.created_at);
        if (endDate) {
          return createdAt >= startDate && createdAt <= endDate;
        }
        return createdAt >= startDate;
      });
    };

    return {
      today: {
        current: calculateFunnelMetrics(filterLeadsByDate(leads, today)),
        previous: calculateFunnelMetrics(filterLeadsByDate(leads, yesterday, today))
      },
      thisWeek: {
        current: calculateFunnelMetrics(filterLeadsByDate(leads, thisWeekStart)),
        previous: calculateFunnelMetrics(filterLeadsByDate(leads, lastWeekStart, lastWeekEnd))
      },
      thisMonth: {
        current: calculateFunnelMetrics(filterLeadsByDate(leads, thisMonthStart)),
        previous: calculateFunnelMetrics(filterLeadsByDate(leads, lastMonthStart, lastMonthEnd))
      },
      last30Days: {
        current: calculateFunnelMetrics(filterLeadsByDate(leads, last30DaysStart)),
        previous: calculateFunnelMetrics(filterLeadsByDate(leads, previous30DaysStart, previous30DaysEnd))
      },
      thisQuarter: {
        current: calculateFunnelMetrics(filterLeadsByDate(leads, thisQuarterStart)),
        previous: calculateFunnelMetrics(filterLeadsByDate(leads, lastQuarterStart, lastQuarterEnd))
      },
      allTime: {
        current: calculateFunnelMetrics(leads),
        previous: { totalLeads: 0, newLeads: 0, warmLeads: 0, qualityConversation: 0, leadMagnetSent: 0, assetConsumed: 0, nurtureSequence: 0, bookingRequested: 0, qualified: 0, proposalSent: 0, closedWon: 0, closedLost: 0, unqualified: 0, revenueGenerated: 0, cashCollected: 0 }
      }
    };
  };

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage > 0) return <ArrowUp className="h-4 w-4 text-green-400" />;
    if (percentage < 0) return <ArrowDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (percentage: number) => {
    if (percentage > 0) return 'text-green-400';
    if (percentage < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const calculateConversionRate = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return (current / previous) * 100;
  };

  // Prepare data for visualizations
  const prepareVisualizationData = (metrics: FunnelMetrics) => {
    return {
      neuronData: {
        nodes: [
          {
            id: 'total',
            value: metrics.totalLeads,
            label: 'Total Leads',
            color: '#3b82f6',
            connections: ['warm', 'qualified']
          },
          {
            id: 'warm',
            value: metrics.warmLeads,
            label: 'Warm Leads',
            color: '#f59e0b',
            connections: ['conversation', 'magnet']
          },
          {
            id: 'conversation',
            value: metrics.qualityConversation,
            label: 'Quality Conv.',
            color: '#8b5cf6',
            connections: ['booking', 'qualified']
          },
          {
            id: 'magnet',
            value: metrics.leadMagnetSent,
            label: 'Lead Magnet',
            color: '#ec4899',
            connections: ['consumed', 'nurture']
          },
          {
            id: 'consumed',
            value: metrics.assetConsumed,
            label: 'Asset Used',
            color: '#6366f1',
            connections: ['booking']
          },
          {
            id: 'nurture',
            value: metrics.nurtureSequence,
            label: 'Nurtured',
            color: '#10b981',
            connections: ['qualified']
          },
          {
            id: 'booking',
            value: metrics.bookingRequested,
            label: 'Booking Req.',
            color: '#f59e0b',
            connections: ['qualified']
          },
          {
            id: 'qualified',
            value: metrics.qualified,
            label: 'Qualified',
            color: '#10b981',
            connections: ['won']
          },
          {
            id: 'won',
            value: metrics.closedWon,
            label: 'Closed Won',
            color: '#059669',
            connections: []
          }
        ]
      },
      spiderData: [
        {
          label: 'Lead Generation',
          value: metrics.totalLeads,
          maxValue: Math.max(metrics.totalLeads, 100),
          color: '#3b82f6'
        },
        {
          label: 'Engagement',
          value: metrics.warmLeads,
          maxValue: metrics.totalLeads || 1,
          color: '#f59e0b'
        },
        {
          label: 'Qualification',
          value: metrics.qualified,
          maxValue: metrics.totalLeads || 1,
          color: '#10b981'
        },
        {
          label: 'Conversion',
          value: metrics.closedWon,
          maxValue: metrics.qualified || 1,
          color: '#059669'
        },
        {
          label: 'Revenue',
          value: metrics.revenueGenerated,
          maxValue: Math.max(metrics.revenueGenerated, 10000),
          color: '#dc2626'
        },
        {
          label: 'Collection',
          value: metrics.cashCollected,
          maxValue: metrics.revenueGenerated || 1,
          color: '#16a34a'
        }
      ],
      funnelData: [
        {
          id: 'total',
          label: 'Total Leads',
          value: metrics.totalLeads,
          color: '#3b82f6'
        },
        {
          id: 'warm',
          label: 'Warm Leads',
          value: metrics.warmLeads,
          color: '#f59e0b'
        },
        {
          id: 'conversation',
          label: 'Quality Conversation',
          value: metrics.qualityConversation,
          color: '#8b5cf6'
        },
        {
          id: 'qualified',
          label: 'Qualified',
          value: metrics.qualified,
          color: '#10b981'
        },
        {
          id: 'proposal',
          label: 'Proposal Sent',
          value: metrics.proposalSent,
          color: '#06b6d4'
        },
        {
          id: 'won',
          label: 'Closed Won',
          value: metrics.closedWon,
          color: '#059669'
        }
      ]
    };
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

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

  if (error || !metricsData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text section-gradient-leads">
            Lead Metrics
          </h1>
          <p className="text-gray-400 mt-2">
            Analyze lead performance and conversion rates.
          </p>
        </div>
        
        <div className="glass-card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-300 mb-4">
            Error Loading Metrics
          </h2>
          <p className="text-gray-400 mb-4">
            {error || 'Unable to load metrics data.'}
          </p>
          <button
            onClick={fetchMetrics}
            className="px-6 py-2 bg-gradient-to-r from-teal-400 to-cyan-600 hover:from-teal-500 hover:to-cyan-700 text-white font-medium rounded-lg transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentMetrics = metricsData[selectedPeriod].current;
  const previousMetrics = metricsData[selectedPeriod].previous;

  const funnelStages = [
    { key: 'totalLeads', label: 'Total Leads', icon: Users, color: 'text-blue-400' },
    { key: 'newLeads', label: 'New Leads', icon: Zap, color: 'text-cyan-400' },
    { key: 'warmLeads', label: 'Warm Leads', icon: TrendingUp, color: 'text-orange-400' },
    { key: 'qualityConversation', label: 'Quality Conversation', icon: Target, color: 'text-purple-400' },
    { key: 'leadMagnetSent', label: 'Lead Magnet Sent', icon: BarChart3, color: 'text-pink-400' },
    { key: 'assetConsumed', label: 'Asset Consumed', icon: Clock, color: 'text-indigo-400' },
    { key: 'nurtureSequence', label: 'Nurture Sequence', icon: TrendingUp, color: 'text-green-400' },
    { key: 'bookingRequested', label: 'Booking Requested', icon: Calendar, color: 'text-yellow-400' },
    { key: 'qualified', label: 'Qualified', icon: Target, color: 'text-emerald-400' },
    { key: 'proposalSent', label: 'Proposal Sent', icon: BarChart3, color: 'text-violet-400' },
    { key: 'closedWon', label: 'Closed Won', icon: TrendingUp, color: 'text-green-500' },
    { key: 'closedLost', label: 'Closed Lost', icon: TrendingDown, color: 'text-red-400' },
    { key: 'unqualified', label: 'Unqualified', icon: Minus, color: 'text-gray-400' },
    { key: 'revenueGenerated', label: 'Revenue Generated', icon: DollarSign, color: 'text-emerald-500', isCurrency: true },
    { key: 'cashCollected', label: 'Cash Collected', icon: DollarSign, color: 'text-green-500', isCurrency: true }
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-teal-400/20 to-cyan-600/20 rounded-xl">
              <BarChart3 className="h-8 w-8 text-teal-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text section-gradient-leads">
                Lead Metrics Dashboard
              </h1>
              <p className="text-gray-400 mt-1">
                Comprehensive funnel tracking with futuristic data visualization
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
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

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
                  ? 'bg-gradient-to-r from-teal-400 to-cyan-600 text-white shadow-lg shadow-teal-500/25'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Leads</p>
              <p className="text-3xl font-bold text-white mt-1">{currentMetrics.totalLeads}</p>
              <div className="flex items-center space-x-1 mt-2">
                {getTrendIcon(calculatePercentageChange(currentMetrics.totalLeads, previousMetrics.totalLeads))}
                <span className={`text-sm font-medium ${getTrendColor(calculatePercentageChange(currentMetrics.totalLeads, previousMetrics.totalLeads))}`}>
                  {formatPercentage(calculatePercentageChange(currentMetrics.totalLeads, previousMetrics.totalLeads))}
                </span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl">
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Conversion Rate</p>
              <p className="text-3xl font-bold text-white mt-1">
                {currentMetrics.totalLeads > 0 ? ((currentMetrics.closedWon / currentMetrics.totalLeads) * 100).toFixed(1) : 0}%
              </p>
              <div className="flex items-center space-x-1 mt-2">
                <Target className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">
                  {currentMetrics.closedWon} won
                </span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl">
              <Target className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Revenue Generated</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(currentMetrics.revenueGenerated)}</p>
              <div className="flex items-center space-x-1 mt-2">
                {getTrendIcon(calculatePercentageChange(currentMetrics.revenueGenerated, previousMetrics.revenueGenerated))}
                <span className={`text-sm font-medium ${getTrendColor(calculatePercentageChange(currentMetrics.revenueGenerated, previousMetrics.revenueGenerated))}`}>
                  {formatPercentage(calculatePercentageChange(currentMetrics.revenueGenerated, previousMetrics.revenueGenerated))}
                </span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-xl">
              <DollarSign className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Cash Collected</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(currentMetrics.cashCollected)}</p>
              <div className="flex items-center space-x-1 mt-2">
                <span className="text-sm text-gray-400">
                  {currentMetrics.revenueGenerated > 0 ? ((currentMetrics.cashCollected / currentMetrics.revenueGenerated) * 100).toFixed(1) : 0}% collected
                </span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl">
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Futuristic Data Visualizations */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Sparkles className="h-6 w-6 text-teal-400" />
          <h2 className="text-2xl font-bold gradient-text section-gradient-leads">
            Advanced Data Visualization
          </h2>
        </div>
        
        <DataVisualizationGrid 
          data={prepareVisualizationData(currentMetrics)}
        />
      </div>

      {/* Comprehensive Funnel Tracking Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold gradient-text section-gradient-leads">
              Sales Funnel Metrics - {periods.find(p => p.key === selectedPeriod)?.label}
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                vs {periods.find(p => p.key === selectedPeriod)?.previousLabel}
              </span>
              <button className="flex items-center space-x-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/60">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Funnel Stage</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Current</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Previous</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Change</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Conversion Rate</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Drop-off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {funnelStages.map((stage, index) => {
                const currentValue = currentMetrics[stage.key as keyof FunnelMetrics] as number;
                const previousValue = previousMetrics[stage.key as keyof FunnelMetrics] as number;
                const change = calculatePercentageChange(currentValue, previousValue);
                
                // Calculate conversion rate from previous stage
                const previousStageValue = index > 0 ? 
                  currentMetrics[funnelStages[index - 1].key as keyof FunnelMetrics] as number : 
                  currentValue;
                const conversionRate = calculateConversionRate(currentValue, previousStageValue);
                
                // Calculate drop-off from previous stage
                const dropOff = index > 0 ? 
                  100 - conversionRate : 
                  0;

                return (
                  <tr key={stage.key} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 bg-gray-800/50 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                          <stage.icon className={`h-5 w-5 ${stage.color}`} />
                        </div>
                        <span className="font-medium text-white group-hover:text-gray-100 transition-colors">
                          {stage.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-bold text-white">
                        {stage.isCurrency ? formatCurrency(currentValue) : currentValue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-400">
                        {stage.isCurrency ? formatCurrency(previousValue) : previousValue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {getTrendIcon(change)}
                        <span className={`font-medium ${getTrendColor(change)}`}>
                          {formatPercentage(change)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {index > 0 && !stage.isCurrency ? (
                        <span className="text-blue-400 font-medium">
                          {conversionRate.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {index > 0 && !stage.isCurrency ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span className={`font-medium ${dropOff > 50 ? 'text-red-400' : dropOff > 25 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {dropOff.toFixed(1)}%
                          </span>
                          <div className="w-16 bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                dropOff > 50 ? 'bg-red-400' : dropOff > 25 ? 'bg-yellow-400' : 'bg-green-400'
                              }`}
                              style={{ width: `${Math.min(dropOff, 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Velocity */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-teal-400" />
            Funnel Velocity Insights
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
              <span className="text-gray-300">Lead to Qualified Rate</span>
              <span className="text-white font-semibold">
                {currentMetrics.totalLeads > 0 ? ((currentMetrics.qualified / currentMetrics.totalLeads) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
              <span className="text-gray-300">Qualified to Won Rate</span>
              <span className="text-white font-semibold">
                {currentMetrics.qualified > 0 ? ((currentMetrics.closedWon / currentMetrics.qualified) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
              <span className="text-gray-300">Revenue per Lead</span>
              <span className="text-white font-semibold">
                {formatCurrency(currentMetrics.totalLeads > 0 ? currentMetrics.revenueGenerated / currentMetrics.totalLeads : 0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
              <span className="text-gray-300">Cash Collection Rate</span>
              <span className="text-green-400 font-semibold">
                {currentMetrics.revenueGenerated > 0 ? ((currentMetrics.cashCollected / currentMetrics.revenueGenerated) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-teal-400" />
            Performance Summary
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-green-400 font-medium">Top Performing Stage</span>
                <span className="text-white font-semibold">
                  {currentMetrics.warmLeads > 0 ? 'Warm Leads' : 'New Leads'}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                Highest conversion rate in the funnel
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-yellow-400 font-medium">Needs Attention</span>
                <span className="text-white font-semibold">
                  {currentMetrics.qualified > currentMetrics.closedWon ? 'Closing' : 'Qualification'}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                Stage with highest drop-off rate
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-400 font-medium">Outstanding Revenue</span>
                <span className="text-white font-semibold">
                  {formatCurrency(currentMetrics.revenueGenerated - currentMetrics.cashCollected)}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                Revenue yet to be collected
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadMetrics;