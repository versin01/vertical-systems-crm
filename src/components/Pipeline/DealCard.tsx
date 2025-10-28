import React from 'react';
import { Deal } from '../../types/deals';
import { 
  Building, User, Calendar, DollarSign, Target, 
  Clock, Phone, Mail, Briefcase 
} from 'lucide-react';

interface DealCardProps {
  deal: Deal;
  onClick: () => void;
  isDragging?: boolean;
}

const DealCard: React.FC<DealCardProps> = ({ deal, onClick, isDragging = false }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-400 bg-green-900/30';
    if (probability >= 60) return 'text-yellow-400 bg-yellow-900/30';
    if (probability >= 40) return 'text-orange-400 bg-orange-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  const getServiceTypeColor = (serviceType?: string) => {
    const colors = {
      'Growth Creator': 'bg-blue-900/30 text-blue-400',
      'AIGC Systems': 'bg-purple-900/30 text-purple-400',
      'Custom Projects': 'bg-green-900/30 text-green-400',
      'Ongoing Support': 'bg-orange-900/30 text-orange-400',
      'Business Consulting': 'bg-teal-900/30 text-teal-400',
      'System Optimization': 'bg-indigo-900/30 text-indigo-400',
      'CRM Implementation': 'bg-pink-900/30 text-pink-400'
    };
    return colors[serviceType as keyof typeof colors] || 'bg-gray-900/30 text-gray-400';
  };

  const daysInStage = deal.updated_at 
    ? Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div
      onClick={onClick}
      className={`
        glass-card p-4 cursor-pointer transition-all duration-300 group hover:scale-105 hover:shadow-xl
        ${isDragging ? 'shadow-2xl shadow-teal-500/20 bg-gray-800/80' : 'hover:bg-gray-700/50'}
        border border-gray-700/50 hover:border-teal-500/30
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm truncate group-hover:text-teal-100 transition-colors">
            {deal.deal_name}
          </h4>
          {deal.lead && (
            <p className="text-xs text-gray-400 mt-1">
              {deal.lead.first_name} {deal.lead.last_name}
            </p>
          )}
        </div>
        
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(deal.probability)}`}>
          {deal.probability}%
        </div>
      </div>

      {/* Deal Value */}
      <div className="flex items-center space-x-2 mb-3">
        <DollarSign className="h-4 w-4 text-green-400" />
        <span className="font-bold text-green-400 text-lg">
          {formatCurrency(deal.deal_value)}
        </span>
      </div>

      {/* Service Type */}
      {deal.service_type && (
        <div className="mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceTypeColor(deal.service_type)}`}>
            {deal.service_type}
          </span>
        </div>
      )}

      {/* Contact Info */}
      {deal.lead && (
        <div className="space-y-1 mb-3">
          {deal.lead.company && (
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Building className="h-3 w-3" />
              <span className="truncate">{deal.lead.company}</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Mail className="h-3 w-3" />
            <span className="truncate">{deal.lead.email}</span>
          </div>
          {deal.lead.phone && (
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Phone className="h-3 w-3" />
              <span>{deal.lead.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Deal Owner */}
      {deal.owner && (
        <div className="flex items-center space-x-2 text-xs text-gray-400 mb-3">
          <User className="h-3 w-3" />
          <span className="truncate">
            {deal.owner.full_name || deal.owner.email}
          </span>
        </div>
      )}

      {/* Expected Close Date */}
      {deal.expected_close_date && (
        <div className="flex items-center space-x-2 text-xs text-gray-400 mb-3">
          <Calendar className="h-3 w-3" />
          <span>Close: {formatDate(deal.expected_close_date)}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{daysInStage} days in stage</span>
        </div>
        
        {deal.deal_source && (
          <div className="text-xs text-gray-500 truncate max-w-20">
            {deal.deal_source}
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-400/5 to-cyan-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default DealCard;