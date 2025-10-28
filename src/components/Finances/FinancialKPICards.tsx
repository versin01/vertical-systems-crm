import React from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Target, Award, AlertTriangle,
  ArrowUp, ArrowDown, Minus, PieChart, Activity, Clock, CheckCircle
} from 'lucide-react';
import { FinancialMetricsData } from '../../types/finances';

interface FinancialKPICardsProps {
  currentMetrics: FinancialMetricsData;
  previousMetrics: FinancialMetricsData;
}

const FinancialKPICards: React.FC<FinancialKPICardsProps> = ({
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
      {/* Total Income */}
      <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-green-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Income</p>
            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(currentMetrics.totalIncome)}</p>
            <div className="flex items-center space-x-1 mt-2">
              {getTrendIcon(calculatePercentageChange(currentMetrics.totalIncome, previousMetrics.totalIncome))}
              <span className={`text-sm font-medium ${getTrendColor(calculatePercentageChange(currentMetrics.totalIncome, previousMetrics.totalIncome))}`}>
                {formatPercentage(calculatePercentageChange(currentMetrics.totalIncome, previousMetrics.totalIncome))}
              </span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Total Expenses */}
      <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-red-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Expenses</p>
            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(currentMetrics.totalExpenses)}</p>
            <div className="flex items-center space-x-1 mt-2">
              {getTrendIcon(calculatePercentageChange(currentMetrics.totalExpenses, previousMetrics.totalExpenses))}
              <span className={`text-sm font-medium ${getTrendColor(calculatePercentageChange(currentMetrics.totalExpenses, previousMetrics.totalExpenses))}`}>
                {formatPercentage(calculatePercentageChange(currentMetrics.totalExpenses, previousMetrics.totalExpenses))}
              </span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-red-400/20 to-red-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <TrendingDown className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Net Profit */}
      <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-amber-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Net Profit</p>
            <p className={`text-2xl font-bold mt-1 ${currentMetrics.netProfit >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {formatCurrency(currentMetrics.netProfit)}
            </p>
            <div className="flex items-center space-x-1 mt-2">
              {getTrendIcon(calculatePercentageChange(currentMetrics.netProfit, previousMetrics.netProfit))}
              <span className={`text-sm font-medium ${getTrendColor(calculatePercentageChange(currentMetrics.netProfit, previousMetrics.netProfit))}`}>
                {formatPercentage(calculatePercentageChange(currentMetrics.netProfit, previousMetrics.netProfit))}
              </span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Award className="h-8 w-8 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Total Commissions */}
      <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Commissions</p>
            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(currentMetrics.totalCommissions)}</p>
            <div className="flex items-center space-x-1 mt-2">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">
                {currentMetrics.totalIncome > 0 ? ((currentMetrics.totalCommissions / currentMetrics.totalIncome) * 100).toFixed(1) : 0}% of income
              </span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Target className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Overdue Receivables */}
      <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-red-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Overdue Receivables</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(currentMetrics.overdueReceivables)}</p>
            <div className="flex items-center space-x-1 mt-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400 font-medium">
                Needs attention
              </span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-red-400/20 to-red-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Collection Rate */}
      <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Collection Rate</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">{currentMetrics.collectionRate.toFixed(1)}%</p>
            <div className="flex items-center space-x-1 mt-2">
              <CheckCircle className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">
                Payment efficiency
              </span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <CheckCircle className="h-8 w-8 text-cyan-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialKPICards;