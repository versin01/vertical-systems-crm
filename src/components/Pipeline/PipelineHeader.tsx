import React from 'react';
import { Plus, RefreshCw, BarChart3, List, Eye } from 'lucide-react';

interface PipelineHeaderProps {
  lastUpdated: Date;
  loading: boolean;
  viewMode: 'board' | 'list';
  onRefresh: () => void;
  onViewModeChange: (mode: 'board' | 'list') => void;
  onNewDeal: () => void;
}

const PipelineHeader: React.FC<PipelineHeaderProps> = ({
  lastUpdated,
  loading,
  viewMode,
  onRefresh,
  onViewModeChange,
  onNewDeal
}) => {
  return (
    <div className="space-y-4">
      {/* Title and Description */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-br from-emerald-400/20 to-green-600/20 rounded-xl">
          <BarChart3 className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold gradient-text section-gradient-sales">
            Sales Pipeline
          </h1>
          <p className="text-gray-400 text-sm">
            Track deals through your consulting sales process
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        {/* Left side - New Deal Button */}
        <button
          onClick={onNewDeal}
          className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-400 to-green-600 hover:from-emerald-500 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25"
        >
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          <span>New Deal</span>
        </button>

        {/* Right side - Controls */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-xs text-gray-400">Last Updated</p>
            <p className="text-xs font-medium text-white">
              {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
          
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('board')}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-all duration-200 text-sm ${
                viewMode === 'board' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="h-3 w-3" />
              <span>Board</span>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-all duration-200 text-sm ${
                viewMode === 'list' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="h-3 w-3" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineHeader;