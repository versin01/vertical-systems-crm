import React from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Target, Zap, 
  ArrowUp, ArrowDown, Minus, Download
} from 'lucide-react';

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
}

interface SalesMetricsTableProps {
  currentMetrics: PipelineMetrics;
  previousMetrics: PipelineMetrics;
  selectedPeriod: string;
  periods: Array<{ key: string; label: string; previousLabel: string }>;
}

const SalesMetricsTable: React.FC<SalesMetricsTableProps> = ({
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

  const calculateConversionRate = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return (current / previous) * 100;
  };

  const pipelineStages = [
    { key: 'totalDeals', label: 'Total Deals', icon: BarChart3, color: 'text-emerald-400' },
    { key: 'newOpportunities', label: 'New Opportunities', icon: Zap, color: 'text-blue-400' },
    { key: 'discoveryScheduled', label: 'Discovery Scheduled', icon: Target, color: 'text-cyan-400' },
    { key: 'discoveryCompleted', label: 'Discovery Completed', icon: TrendingUp, color: 'text-teal-400' },
    { key: 'proposalPrep', label: 'Proposal Preparation', icon: BarChart3, color: 'text-indigo-400' },
    { key: 'proposalSent', label: 'Proposal Sent', icon: TrendingUp, color: 'text-purple-400' },
    { key: 'proposalReview', label: 'Proposal Review', icon: Target, color: 'text-pink-400' },
    { key: 'negotiation', label: 'Negotiation', icon: TrendingUp, color: 'text-orange-400' },
    { key: 'contractSent', label: 'Contract Sent', icon: BarChart3, color: 'text-yellow-400' },
    { key: 'contractSigned', label: 'Contract Signed', icon: TrendingUp, color: 'text-green-500' },
    { key: 'projectKickoff', label: 'Project Kickoff', icon: Zap, color: 'text-emerald-500' },
    { key: 'onHold', label: 'On Hold', icon: Target, color: 'text-gray-400' },
    { key: 'lost', label: 'Lost', icon: TrendingDown, color: 'text-red-400' },
    { key: 'totalValue', label: 'Total Pipeline Value', icon: BarChart3, color: 'text-blue-500', isCurrency: true },
    { key: 'weightedValue', label: 'Weighted Pipeline Value', icon: Target, color: 'text-green-500', isCurrency: true },
    { key: 'wonValue', label: 'Won Value', icon: TrendingUp, color: 'text-emerald-500', isCurrency: true },
    { key: 'lostValue', label: 'Lost Value', icon: TrendingDown, color: 'text-red-500', isCurrency: true }
  ];

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold gradient-text section-gradient-sales">
            Sales Pipeline Metrics - {periods.find(p => p.key === selectedPeriod)?.label}
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Pipeline Stage</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Current</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Previous</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Change</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Conversion Rate</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Drop-off</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {pipelineStages.map((stage, index) => {
              const currentValue = currentMetrics[stage.key as keyof PipelineMetrics] as number;
              const previousValue = previousMetrics[stage.key as keyof PipelineMetrics] as number;
              const change = calculatePercentageChange(currentValue, previousValue);
              
              // Calculate conversion rate from previous stage
              const previousStageValue = index > 0 ? 
                currentMetrics[pipelineStages[index - 1].key as keyof PipelineMetrics] as number : 
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
                      <span className="text-emerald-400 font-medium">
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
  );
};

export default SalesMetricsTable;