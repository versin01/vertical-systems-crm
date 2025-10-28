import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { ProposalFilters, ProposalStatus } from '../../types/proposals';

interface ProposalFiltersProps {
  filters: ProposalFilters;
  onFilterChange: (key: keyof ProposalFilters, value: string) => void;
  onDateRangeChange: (range: ProposalFilters['date_range']) => void;
  users: any[];
  deals: any[];
}

const ProposalFiltersComponent: React.FC<ProposalFiltersProps> = ({ 
  filters, 
  onFilterChange, 
  onDateRangeChange,
  users,
  deals
}) => {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-300">Filters</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search proposals..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="approved">Approved</option>
          <option value="sent">Sent</option>
          <option value="viewed">Viewed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
          <option value="revised">Revised</option>
        </select>

        {/* Deal Filter */}
        <select
          value={filters.deal_id}
          onChange={(e) => onFilterChange('deal_id', e.target.value)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
        >
          <option value="">All Deals</option>
          {deals.map(deal => (
            <option key={deal.id} value={deal.id}>
              {deal.deal_name}
            </option>
          ))}
        </select>

        {/* Assigned To Filter */}
        <select
          value={filters.assigned_to}
          onChange={(e) => onFilterChange('assigned_to', e.target.value)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
        >
          <option value="">All Users</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.full_name || user.email}
            </option>
          ))}
        </select>

        {/* Date Range Filter */}
        <select
          value={filters.date_range}
          onChange={(e) => onDateRangeChange(e.target.value as ProposalFilters['date_range'])}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
        >
          <option value="all">All Time</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="last_30_days">Last 30 Days</option>
          <option value="last_90_days">Last 90 Days</option>
          <option value="custom">Custom Range</option>
        </select>

        {/* Value Range Filter */}
        <select
          value={filters.value_range}
          onChange={(e) => onFilterChange('value_range', e.target.value)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
        >
          <option value="all">All Values</option>
          <option value="under_10k">Under $10K</option>
          <option value="10k_50k">$10K - $50K</option>
          <option value="50k_100k">$50K - $100K</option>
          <option value="over_100k">Over $100K</option>
        </select>
      </div>
      
      {/* Custom Date Range (conditionally rendered) */}
      {filters.date_range === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => onFilterChange('start_date', e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-gray-400">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => onFilterChange('end_date', e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalFiltersComponent;