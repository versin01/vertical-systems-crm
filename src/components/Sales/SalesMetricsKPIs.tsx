import React from 'react';
import { 
  BarChart3, DollarSign, Target, TrendingUp, Award,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';

interface PipelineMetrics {
  totalDeals: number;
  contractSigned: number;
  totalValue: number;
  weightedValue: number;
  wonValue: number;
  conversionRate: number;
  averageDealSize: number;
}

interface SalesMetricsKPIsProps {
  currentMetrics: PipelineMetrics;
  previousMetrics: PipelineMetrics;
}

const SalesMetricsKPIs: React.FC<SalesMetricsKPIsProps> = ({
  currentMetrics,
  previousMetrics
}) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Deals</p>
            <p className="text-3xl font-bold text-white mt-1">{currentMetrics.totalDeals}</p>
            <div className="flex items-center space-x-1 mt-2">
              {getTrendIcon(calculatePercentageChange(currentMetrics.totalDeals, previousMetrics.totalDeals))}
              <span className={`text-sm font-medium ${getTrendColor(calculatePercentageChange(currentMetrics.totalDeals, previousMetrics.totalDeals))}`}>
                {formatPercentage(calculatePercentageChange(currentMetrics.totalDeals, previousMetrics.totalDeals))}
              </span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-emerald-400/20 to-green-600/20 rounded-xl">
            <BarChart3 className="h-8 w-8 text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Pipeline Value</p>
            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(currentMetrics.totalValue)}</p>
            <div className="flex items-center space-x-1 mt-2">
              {getTrendIcon(calculatePercentageChange(currentMetrics.totalValue, previousMetrics.totalValue))}
              <span className={`text-sm font-medium ${getTrendColor(calculatePercentageChange(currentMetrics.totalValue, previousMetrics.totalValue))}`}>
                {formatPercentage(calculatePercentageChange(currentMetrics.totalValue, previousMetrics.totalValue))}
              </span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl">
            <DollarSign className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Weighted Value</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(currentMetrics.weightedValue)}</p>
            <div className="flex items-center space-x-1 mt-2">
              {getTrendIcon(calculatePercentageChange(currentMetrics.weightedValue, previousMetrics.weightedValue))}
              <span className={`text-sm font-medium ${getTrendColor(calculatePercentageChange(currentMetrics.weightedValue, previousMetrics.weightedValue))}`}>
                {formatPercentage(calculatePercentageChange(currentMetrics.weightedValue, previousMetrics.weightedValue))}
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
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Won Value</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(currentMetrics.wonValue)}</p>
            <div className="flex items-center space-x-1 mt-2">
              <Award className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">
                {currentMetrics.contractSigned} deals
              </span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-xl">
            <Award className="h-8 w-8 text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Win Rate</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">
              {currentMetrics.conversionRate.toFixed(1)}%
            </p>
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-yellow-400 font-medium">
                Conversion rate
              </span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-xl">
            <TrendingUp className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesMetricsKPIs;