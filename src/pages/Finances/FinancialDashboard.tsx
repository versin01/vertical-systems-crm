import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, BarChart3, Target, 
  Calendar, RefreshCw, Sparkles, ArrowUp, ArrowDown, Minus,
  PieChart, Activity, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { useFinancialMetrics } from '../../hooks/useFinancialMetrics';
import { FinancialMetricsData, FinancialPeriodData } from '../../types/finances';
import DataVisualizationGrid from '../../components/DataVisualization/DataVisualizationGrid';
import FinancialKPICards from '../../components/Finances/FinancialKPICards';
import FinancialMetricsTable from '../../components/Finances/FinancialMetricsTable';
import FinancialInsights from '../../components/Finances/FinancialInsights';
import RoleGuard from '../../components/RoleGuard';

const FinancialDashboard: React.FC = () => {
  const { metricsData, loading, error, fetchFinancialData } = useFinancialMetrics();
  const [selectedPeriod, setSelectedPeriod] = useState<keyof FinancialPeriodData>('thisMonth');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const periods = [
    { key: 'today' as const, label: 'Today', previousLabel: 'Yesterday' },
    { key: 'thisWeek' as const, label: 'This Week', previousLabel: 'Last Week' },
    { key: 'thisMonth' as const, label: 'This Month', previousLabel: 'Last Month' },
    { key: 'last30Days' as const, label: 'Last 30 Days', previousLabel: 'Previous 30 Days' },
    { key: 'thisQuarter' as const, label: 'This Quarter', previousLabel: 'Last Quarter' },
    { key: 'allTime' as const, label: 'All Time', previousLabel: 'N/A' }
  ];

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const handleRefresh = async () => {
    await fetchFinancialData();
    setLastUpdated(new Date());
  };

  // Prepare data for visualizations
  const prepareVisualizationData = (metrics: FinancialMetricsData) => {
    return {
      neuronData: {
        nodes: [
          {
            id: 'income',
            value: metrics.totalIncome,
            label: 'Total Income',
            color: '#10b981',
            connections: ['profit', 'commissions']
          },
          {
            id: 'expenses',
            value: metrics.totalExpenses,
            label: 'Expenses',
            color: '#ef4444',
            connections: ['profit']
          },
          {
            id: 'commissions',
            value: metrics.totalCommissions,
            label: 'Commissions',
            color: '#3b82f6',
            connections: ['profit']
          },
          {
            id: 'profit',
            value: Math.max(0, metrics.netProfit),
            label: 'Net Profit',
            color: '#f59e0b',
            connections: ['growth']
          },
          {
            id: 'receivables',
            value: metrics.totalReceivables,
            label: 'Receivables',
            color: '#8b5cf6',
            connections: ['income']
          },
          {
            id: 'growth',
            value: Math.max(0, metrics.profitMargin),
            label: 'Growth',
            color: '#06b6d4',
            connections: []
          }
        ]
      },
      spiderData: [
        {
          label: 'Revenue',
          value: metrics.totalIncome,
          maxValue: Math.max(metrics.totalIncome, 100000),
          color: '#10b981'
        },
        {
          label: 'Profitability',
          value: Math.max(0, metrics.profitMargin),
          maxValue: 100,
          color: '#f59e0b'
        },
        {
          label: 'Collection Rate',
          value: metrics.collectionRate,
          maxValue: 100,
          color: '#06b6d4'
        },
        {
          label: 'Commission Efficiency',
          value: metrics.totalIncome > 0 ? ((metrics.totalCommissions / metrics.totalIncome) * 100) : 0,
          maxValue: 50,
          color: '#3b82f6'
        },
        {
          label: 'Expense Control',
          value: metrics.totalIncome > 0 ? (100 - ((metrics.totalExpenses / metrics.totalIncome) * 100)) : 0,
          maxValue: 100,
          color: '#8b5cf6'
        },
        {
          label: 'Cash Flow',
          value: metrics.totalReceivables > 0 ? (((metrics.totalReceivables - metrics.overdueReceivables) / metrics.totalReceivables) * 100) : 100,
          maxValue: 100,
          color: '#ec4899'
        }
      ],
      funnelData: [
        {
          id: 'gross',
          label: 'Gross Income',
          value: metrics.totalIncome,
          color: '#10b981'
        },
        {
          id: 'after_commissions',
          label: 'After Commissions',
          value: metrics.totalIncome - metrics.totalCommissions,
          color: '#06b6d4'
        },
        {
          id: 'after_expenses',
          label: 'After Expenses',
          value: metrics.totalIncome - metrics.totalCommissions - metrics.totalExpenses,
          color: '#f59e0b'
        },
        {
          id: 'net_profit',
          label: 'Net Profit',
          value: Math.max(0, metrics.netProfit),
          color: '#8b5cf6'
        }
      ]
    };
  };

  if (loading && !metricsData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-400/30 border-t-rose-400"></div>
          <div className="absolute inset-0 rounded-full bg-rose-400/10 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !metricsData) {
    return (
      <RoleGuard section="finances">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-rose-400/20 to-amber-500/20 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-rose-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold gradient-text section-gradient-finances">
                    Financial Dashboard
                  </h1>
                  <p className="text-gray-400 mt-1">
                    Comprehensive financial analytics with futuristic data visualization
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-300 mb-4">
              Error Loading Financial Data
            </h2>
            <p className="text-gray-400 mb-4">
              {error || 'Unable to load financial metrics data.'}
            </p>
            <button
              onClick={handleRefresh}
              className="px-6 py-2 bg-gradient-to-r from-rose-400 to-amber-500 hover:from-rose-500 hover:to-amber-600 text-white font-medium rounded-lg transition-all duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </RoleGuard>
    );
  }

  const currentMetrics = metricsData[selectedPeriod].current;
  const previousMetrics = metricsData[selectedPeriod].previous;

  return (
    <RoleGuard section="finances">
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-rose-400/20 to-amber-500/20 rounded-xl">
                <BarChart3 className="h-8 w-8 text-rose-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text section-gradient-finances">
                  Financial Dashboard
                </h1>
                <p className="text-gray-400 mt-1">
                  Comprehensive financial analytics with futuristic data visualization
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
                    ? 'bg-gradient-to-r from-rose-400 to-amber-500 text-white shadow-lg shadow-rose-500/25'
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
        <FinancialKPICards 
          currentMetrics={currentMetrics}
          previousMetrics={previousMetrics}
        />

        {/* Futuristic Data Visualizations */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-6 w-6 text-rose-400" />
            <h2 className="text-2xl font-bold gradient-text section-gradient-finances">
              Advanced Financial Analytics
            </h2>
          </div>
          
          <DataVisualizationGrid 
            data={prepareVisualizationData(currentMetrics)}
          />
        </div>

        {/* Financial Metrics Table */}
        <FinancialMetricsTable 
          currentMetrics={currentMetrics}
          previousMetrics={previousMetrics}
          selectedPeriod={selectedPeriod}
          periods={periods}
        />

        {/* Financial Insights */}
        <FinancialInsights 
          currentMetrics={currentMetrics}
          previousMetrics={previousMetrics}
        />
      </div>
    </RoleGuard>
  );
};

export default FinancialDashboard;