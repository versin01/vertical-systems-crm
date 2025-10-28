import React from 'react';
import { 
  TrendingUp, AlertTriangle, Target, Award, DollarSign, Clock,
  PieChart, Activity, CheckCircle, TrendingDown
} from 'lucide-react';
import { FinancialMetricsData } from '../../types/finances';

interface FinancialInsightsProps {
  currentMetrics: FinancialMetricsData;
  previousMetrics: FinancialMetricsData;
}

const FinancialInsights: React.FC<FinancialInsightsProps> = ({
  currentMetrics,
  previousMetrics
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTopOffer = () => {
    const offers = Object.entries(currentMetrics.incomeByOffer);
    if (offers.length === 0) return 'No offers';
    return offers.reduce((max, current) => current[1] > max[1] ? current : max)[0];
  };

  const getTopExpenseType = () => {
    const expenses = Object.entries(currentMetrics.expensesByType);
    if (expenses.length === 0) return 'No expenses';
    return expenses.reduce((max, current) => current[1] > max[1] ? current : max)[0];
  };

  const getTopSetter = () => {
    const setters = Object.entries(currentMetrics.commissionsBySetter);
    if (setters.length === 0) return 'No setters';
    return setters.reduce((max, current) => current[1] > max[1] ? current : max)[0];
  };

  const getCashFlowHealth = () => {
    const ratio = currentMetrics.overdueReceivables / (currentMetrics.totalReceivables || 1);
    if (ratio < 0.05) return { status: 'Excellent', color: 'text-green-400', description: 'Very low overdue rate' };
    if (ratio < 0.15) return { status: 'Good', color: 'text-green-400', description: 'Manageable overdue rate' };
    if (ratio < 0.30) return { status: 'Fair', color: 'text-yellow-400', description: 'Monitor overdue payments' };
    return { status: 'Poor', color: 'text-red-400', description: 'High overdue rate needs attention' };
  };

  const getProfitabilityHealth = () => {
    if (currentMetrics.profitMargin > 30) return { status: 'Excellent', color: 'text-green-400' };
    if (currentMetrics.profitMargin > 20) return { status: 'Good', color: 'text-green-400' };
    if (currentMetrics.profitMargin > 10) return { status: 'Fair', color: 'text-yellow-400' };
    if (currentMetrics.profitMargin > 0) return { status: 'Poor', color: 'text-orange-400' };
    return { status: 'Loss', color: 'text-red-400' };
  };

  const cashFlowHealth = getCashFlowHealth();
  const profitabilityHealth = getProfitabilityHealth();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Financial Health Overview */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-rose-400" />
          Financial Health Overview
        </h3>
        <div className="space-y-4">
          <div className={`p-4 bg-gradient-to-r ${
            profitabilityHealth.status === 'Excellent' || profitabilityHealth.status === 'Good' 
              ? 'from-green-900/30 to-emerald-900/30 border-green-500/30' 
              : profitabilityHealth.status === 'Fair' 
                ? 'from-yellow-900/30 to-orange-900/30 border-yellow-500/30'
                : 'from-red-900/30 to-red-900/30 border-red-500/30'
          } border rounded-lg`}>
            <div className="flex items-center justify-between">
              <span className={`font-medium ${profitabilityHealth.color}`}>Profitability</span>
              <span className="text-white font-semibold">
                {profitabilityHealth.status}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              {currentMetrics.profitMargin.toFixed(1)}% profit margin
            </p>
          </div>
          
          <div className={`p-4 bg-gradient-to-r ${
            cashFlowHealth.status === 'Excellent' || cashFlowHealth.status === 'Good' 
              ? 'from-green-900/30 to-emerald-900/30 border-green-500/30' 
              : cashFlowHealth.status === 'Fair' 
                ? 'from-yellow-900/30 to-orange-900/30 border-yellow-500/30'
                : 'from-red-900/30 to-red-900/30 border-red-500/30'
          } border rounded-lg`}>
            <div className="flex items-center justify-between">
              <span className={`font-medium ${cashFlowHealth.color}`}>Cash Flow</span>
              <span className="text-white font-semibold">
                {cashFlowHealth.status}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              {cashFlowHealth.description}
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-medium">Commission Efficiency</span>
              <span className="text-white font-semibold">
                {currentMetrics.totalIncome > 0 
                  ? `${((currentMetrics.totalCommissions / currentMetrics.totalIncome) * 100).toFixed(1)}%`
                  : '0%'
                }
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Commission rate of total income
            </p>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-purple-400 font-medium">Outstanding Revenue</span>
              <span className="text-white font-semibold">
                {formatCurrency(currentMetrics.totalReceivables - (currentMetrics.totalIncome - currentMetrics.totalReceivables))}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Revenue yet to be collected
            </p>
          </div>
        </div>
      </div>

      {/* Top Performers & Insights */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Award className="h-5 w-5 mr-2 text-rose-400" />
          Top Performers & Insights
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-green-400 font-medium">Top Revenue Source</span>
              <span className="text-white font-semibold">
                {getTopOffer()}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Highest performing offer/service
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-medium">Top Setter</span>
              <span className="text-white font-semibold">
                {getTopSetter()}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Highest commission earner
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-orange-400 font-medium">Largest Expense Category</span>
              <span className="text-white font-semibold">
                {getTopExpenseType()}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Monitor for cost optimization
            </p>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-purple-400 font-medium">Monthly Growth Rate</span>
              <span className="text-white font-semibold">
                {currentMetrics.monthlyTrends.length >= 2 ? (
                  (() => {
                    const latest = currentMetrics.monthlyTrends[currentMetrics.monthlyTrends.length - 1];
                    const previous = currentMetrics.monthlyTrends[currentMetrics.monthlyTrends.length - 2];
                    const growth = previous.income > 0 ? ((latest.income - previous.income) / previous.income) * 100 : 0;
                    return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
                  })()
                ) : 'N/A'}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Month-over-month income growth
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialInsights;