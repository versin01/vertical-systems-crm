import React from 'react';
import { 
  Clock, BarChart3, TrendingUp, Target, DollarSign, Award 
} from 'lucide-react';

interface PipelineMetrics {
  totalDeals: number;
  contractSigned: number;
  totalValue: number;
  weightedValue: number;
  wonValue: number;
  lostValue: number;
  averageDealSize: number;
  conversionRate: number;
  negotiation: number;
  proposalSent: number;
}

interface SalesMetricsInsightsProps {
  currentMetrics: PipelineMetrics;
  previousMetrics: PipelineMetrics;
}

const SalesMetricsInsights: React.FC<SalesMetricsInsightsProps> = ({
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

  const getTopPerformingStage = () => {
    if (currentMetrics.contractSigned > 0) return 'Closing';
    if (currentMetrics.negotiation > 0) return 'Negotiation';
    if (currentMetrics.proposalSent > 0) return 'Proposal';
    return 'Discovery';
  };

  const getNeedsAttentionStage = () => {
    const proposalToNegotiation = currentMetrics.proposalSent > currentMetrics.negotiation;
    const negotiationToClose = currentMetrics.negotiation > currentMetrics.contractSigned;
    
    if (proposalToNegotiation && negotiationToClose) return 'Negotiation';
    if (proposalToNegotiation) return 'Proposal Follow-up';
    if (negotiationToClose) return 'Closing';
    return 'Lead Generation';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pipeline Velocity */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-emerald-400" />
          Pipeline Velocity Insights
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
            <span className="text-gray-300">Deal to Close Rate</span>
            <span className="text-white font-semibold">
              {currentMetrics.totalDeals > 0 ? ((currentMetrics.contractSigned / currentMetrics.totalDeals) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
            <span className="text-gray-300">Average Deal Size</span>
            <span className="text-white font-semibold">
              {formatCurrency(currentMetrics.averageDealSize)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
            <span className="text-gray-300">Pipeline Efficiency</span>
            <span className="text-white font-semibold">
              {currentMetrics.totalValue > 0 ? ((currentMetrics.weightedValue / currentMetrics.totalValue) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
            <span className="text-gray-300">Win/Loss Ratio</span>
            <span className="text-green-400 font-semibold">
              {currentMetrics.lostValue > 0 ? (currentMetrics.wonValue / currentMetrics.lostValue).toFixed(2) : '∞'}:1
            </span>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-emerald-400" />
          Performance Summary
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-green-400 font-medium">Top Performing Stage</span>
              <span className="text-white font-semibold">
                {getTopPerformingStage()}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Highest conversion rate in the pipeline
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-yellow-400 font-medium">Needs Attention</span>
              <span className="text-white font-semibold">
                {getNeedsAttentionStage()}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Stage with highest drop-off rate
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-medium">Pipeline Health</span>
              <span className="text-white font-semibold">
                {currentMetrics.conversionRate > 20 ? 'Excellent' : 
                 currentMetrics.conversionRate > 10 ? 'Good' : 
                 currentMetrics.conversionRate > 5 ? 'Fair' : 'Needs Improvement'}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Overall pipeline performance rating
            </p>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-purple-400 font-medium">Revenue Forecast</span>
              <span className="text-white font-semibold">
                {formatCurrency(currentMetrics.weightedValue)}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Probability-weighted pipeline value
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesMetricsInsights;