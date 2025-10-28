import React from 'react';
import { Search, Filter } from 'lucide-react';
import { DealFilters } from '../../types/deals';

interface PipelineFiltersProps {
  filters: DealFilters;
  onFilterChange: (key: keyof DealFilters, value: string) => void;
}

const PipelineFilters: React.FC<PipelineFiltersProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-300">Filters</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search deals..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
          />
        </div>

        {/* Stage Filter */}
        <select
          value={filters.stage}
          onChange={(e) => onFilterChange('stage', e.target.value)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white text-sm"
        >
          <option value="">All Stages</option>
          <option value="new_opportunity">New Opportunity</option>
          <option value="discovery_call_scheduled">Discovery Scheduled</option>
          <option value="discovery_call_completed">Discovery Completed</option>
          <option value="proposal_preparation">Proposal Prep</option>
          <option value="proposal_sent">Proposal Sent</option>
          <option value="proposal_review">Proposal Review</option>
          <option value="negotiation">Negotiation</option>
          <option value="contract_sent">Contract Sent</option>
          <option value="contract_signed">Contract Signed</option>
          <option value="project_kickoff">Project Kickoff</option>
          <option value="on_hold">On Hold</option>
          <option value="lost">Lost</option>
        </select>

        {/* Service Type Filter */}
        <select
          value={filters.service_type}
          onChange={(e) => onFilterChange('service_type', e.target.value)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white text-sm"
        >
          <option value="">All Services</option>
          <option value="Growth Creator">Growth Creator</option>
          <option value="AIGC Systems">AIGC Systems</option>
          <option value="Custom Projects">Custom Projects</option>
          <option value="Ongoing Support">Ongoing Support</option>
          <option value="Business Consulting">Business Consulting</option>
          <option value="System Optimization">System Optimization</option>
          <option value="CRM Implementation">CRM Implementation</option>
        </select>

        {/* Value Range Filter */}
        <select
          value={filters.value_range}
          onChange={(e) => onFilterChange('value_range', e.target.value)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white text-sm"
        >
          <option value="all">All Values</option>
          <option value="under_10k">Under $10K</option>
          <option value="10k_50k">$10K - $50K</option>
          <option value="50k_100k">$50K - $100K</option>
          <option value="over_100k">Over $100K</option>
        </select>

        {/* Probability Range Filter */}
        <select
          value={filters.probability_range}
          onChange={(e) => onFilterChange('probability_range', e.target.value)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white text-sm"
        >
          <option value="all">All Probabilities</option>
          <option value="low">Low (0-39%)</option>
          <option value="medium">Medium (40-79%)</option>
          <option value="high">High (80-100%)</option>
        </select>

        {/* Export Button */}
        <button className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm">
          <span>Export</span>
        </button>
      </div>
    </div>
  );
};

export default PipelineFilters;