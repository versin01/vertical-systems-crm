import React from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Target, Award, AlertTriangle,
  ArrowUp, ArrowDown, Minus, Download, PieChart, Activity
} from 'lucide-react';
import { FinancialMetricsData } from '../../types/finances';

interface FinancialMetricsTableProps {
  currentMetrics: FinancialMetricsData;
  previousMetrics: FinancialMetricsData;
  selectedPeriod: string;
  periods: Array<{ key: string; label: string; previousLabel: string }>;
}

const FinancialMetricsTable: React.FC<FinancialMetricsTableProps> = ({
  currentMetrics,
  previousMetrics,
  selectedPeriod,
  periods
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

  const financialMetrics = [
    { key: 'totalIncome', label: 'Total Income', icon: DollarSign, color: 'text-green-400', isCurrency: true },
    { key: 'grossProfit', label: 'Gross Profit', icon: TrendingUp, color: 'text-emerald-400', isCurrency: true },
    { key: 'totalCommissions', label: 'Total Commissions', icon: Target, color: 'text-blue-400', isCurrency: true },
    { key: 'totalExpenses', label: 'Total Expenses', icon: TrendingDown, color: 'text-red-400', isCurrency: true },
    { key: 'netProfit', label: 'Net Profit', icon: Award, color: 'text-amber-400', isCurrency: true },
    { key: 'totalReceivables', label: 'Total Receivables', icon: PieChart, color: 'text-purple-400', isCurrency: true },
    { key: 'overdueReceivables', label: 'Overdue Receivables', icon: AlertTriangle, color: 'text-red-500', isCurrency: true },
    { key: 'dueThisWeek', label: 'Due This Week', icon: Activity, color: 'text-yellow-400', isCurrency: true },
    { key: 'dueThisMonth', label: 'Due This Month', icon: Activity, color: 'text-orange-400', isCurrency: true },
    { key: 'collectionRate', label: 'Collection Rate (%)', icon: Target, color: 'text-cyan-400', isPercentage: true },
    { key: 'profitMargin', label: 'Profit Margin (%)', icon: TrendingUp, color: 'text-emerald-500', isPercentage: true }
  ];

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold gradient-text section-gradient-finances">
            Financial Metrics - {periods.find(p => p.key === selectedPeriod)?.label}
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Financial Metric</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Current</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Previous</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Change</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {financialMetrics.map((metric) => {
              const currentValue = currentMetrics[metric.key as keyof FinancialMetricsData] as number;
              const previousValue = previousMetrics[metric.key as keyof FinancialMetricsData] as number;
              const change = calculatePercentageChange(currentValue, previousValue);
              
              // Performance indicator
              const getPerformanceIndicator = () => {
                if (metric.key === 'totalExpenses' || metric.key === 'overdueReceivables') {
                  // For expenses and overdue, lower is better
                  if (change < -10) return { text: 'Excellent', color: 'text-green-400' };
                  if (change < 0) return { text: 'Good', color: 'text-green-400' };
                  if (change < 10) return { text: 'Fair', color: 'text-yellow-400' };
                  return { text: 'Poor', color: 'text-red-400' };
                } else {
                  // For income, profit, etc., higher is better
                  if (change > 20) return { text: 'Excellent', color: 'text-green-400' };
                  if (change > 10) return { text: 'Good', color: 'text-green-400' };
                  if (change > 0) return { text: 'Fair', color: 'text-yellow-400' };
                  return { text: 'Poor', color: 'text-red-400' };
                }
              };

              const performance = getPerformanceIndicator();

              return (
                <tr key={metric.key} className="hover:bg-gray-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 bg-gray-800/50 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                        <metric.icon className={`h-5 w-5 ${metric.color}`} />
                      </div>
                      <span className="font-medium text-white group-hover:text-gray-100 transition-colors">
                        {metric.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-white">
                      {metric.isCurrency 
                        ? formatCurrency(currentValue) 
                        : metric.isPercentage 
                          ? `${currentValue.toFixed(1)}%`
                          : currentValue.toLocaleString()
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-400">
                      {metric.isCurrency 
                        ? formatCurrency(previousValue) 
                        : metric.isPercentage 
                          ? `${previousValue.toFixed(1)}%`
                          : previousValue.toLocaleString()
                      }
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
                    <span className={`font-medium ${performance.color}`}>
                      {performance.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialMetricsTable;