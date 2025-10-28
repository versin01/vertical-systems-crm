import React from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Target, Zap 
} from 'lucide-react';

interface PipelineMetricsProps {
  metrics: {
    totalDeals: number;
    totalValue: number;
    weightedValue: number;
    averageDealSize: number;
    conversionRate: number;
  };
}

const PipelineMetrics: React.FC<PipelineMetricsProps> = ({ metrics }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const metricCards = [
    {
      title: 'Total Deals',
      value: metrics.totalDeals,
      icon: BarChart3,
      color: 'from-emerald-400/20 to-green-600/20',
      iconColor: 'text-emerald-400',
      subtitle: 'Active pipeline'
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(metrics.totalValue),
      icon: DollarSign,
      color: 'from-blue-400/20 to-blue-600/20',
      iconColor: 'text-blue-400',
      subtitle: 'Total potential'
    },
    {
      title: 'Weighted Value',
      value: formatCurrency(metrics.weightedValue),
      icon: Target,
      color: 'from-green-400/20 to-green-600/20',
      iconColor: 'text-green-400',
      subtitle: 'Probability adjusted'
    },
    {
      title: 'Avg Deal Size',
      value: formatCurrency(metrics.averageDealSize),
      icon: TrendingUp,
      color: 'from-purple-400/20 to-purple-600/20',
      iconColor: 'text-purple-400',
      subtitle: 'Per opportunity'
    },
    {
      title: 'Win Rate',
      value: `${metrics.conversionRate.toFixed(1)}%`,
      icon: Zap,
      color: 'from-yellow-400/20 to-yellow-600/20',
      iconColor: 'text-yellow-400',
      subtitle: 'Conversion rate'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {metricCards.map((metric, index) => (
        <div 
          key={index}
          className="glass-card p-4 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 bg-gradient-to-br ${metric.color} rounded-lg group-hover:scale-110 transition-transform duration-300`}>
              <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
              {metric.title}
            </p>
            <p className="text-lg font-bold text-white mt-1">
              {metric.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {metric.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PipelineMetrics;