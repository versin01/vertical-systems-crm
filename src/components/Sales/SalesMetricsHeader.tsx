import React from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';

interface SalesMetricsHeaderProps {
  lastUpdated: Date;
  loading: boolean;
  onRefresh: () => void;
}

const SalesMetricsHeader: React.FC<SalesMetricsHeaderProps> = ({
  lastUpdated,
  loading,
  onRefresh
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-emerald-400/20 to-green-600/20 rounded-xl">
            <BarChart3 className="h-8 w-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text section-gradient-sales">
              Sales Metrics Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Comprehensive sales pipeline analytics with advanced data visualization
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
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};

export default SalesMetricsHeader;