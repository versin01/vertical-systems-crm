import React from 'react';
import { Proposal } from '../../types/proposals';
import { 
  FileText, User, Building, Calendar, DollarSign, 
  Clock, Eye, Mail, Phone, Briefcase 
} from 'lucide-react';
import ProposalStatusBadge from './ProposalStatusBadge';

interface ProposalCardProps {
  proposal: Proposal;
  onClick: () => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, onClick }) => {
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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString) || '';
    }
  };

  return (
    <div
      onClick={onClick}
      className="glass-card p-4 cursor-pointer transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:bg-gray-700/50 border border-gray-700/50 hover:border-purple-500/30"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm truncate group-hover:text-purple-100 transition-colors">
            {proposal.title}
          </h4>
          {proposal.deal && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              {proposal.deal.deal_name}
            </p>
          )}
        </div>
        
        <ProposalStatusBadge status={proposal.status} size="sm" />
      </div>

      {/* Proposal Value */}
      <div className="flex items-center space-x-2 mb-3">
        <DollarSign className="h-4 w-4 text-purple-400" />
        <span className="font-bold text-purple-400 text-lg">
          {formatCurrency(proposal.proposal_value)}
        </span>
      </div>

      {/* Client Info */}
      {proposal.lead && (
        <div className="space-y-1 mb-3">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <User className="h-3 w-3" />
            <span className="truncate">{proposal.lead.first_name} {proposal.lead.last_name}</span>
          </div>
          
          {proposal.lead.company && (
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Building className="h-3 w-3" />
              <span className="truncate">{proposal.lead.company}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Mail className="h-3 w-3" />
            <span className="truncate">{proposal.lead.email}</span>
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="space-y-1 mb-3">
        {proposal.sent_date && (
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            <span>Sent: {formatDate(proposal.sent_date)}</span>
          </div>
        )}
        
        {proposal.expiration_date && (
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>Expires: {formatDate(proposal.expiration_date)}</span>
          </div>
        )}
        
        {proposal.last_viewed_date && (
          <div className="flex items-center space-x-2 text-xs text-green-400">
            <Eye className="h-3 w-3" />
            <span>Viewed: {formatDate(proposal.last_viewed_date)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{getTimeAgo(proposal.created_at)}</span>
        </div>
        
        <div className="text-xs text-gray-500">
          {proposal.follow_up_count > 0 && (
            <span className="px-2 py-0.5 bg-purple-900/30 text-purple-400 rounded-full">
              {proposal.follow_up_count} follow-up{proposal.follow_up_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-blue-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default ProposalCard;