import React from 'react';
import { ProposalStatus } from '../../types/proposals';

interface ProposalStatusBadgeProps {
  status: ProposalStatus;
  size?: 'sm' | 'md' | 'lg';
}

const ProposalStatusBadge: React.FC<ProposalStatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusColor = (status: ProposalStatus) => {
    const colors = {
      draft: 'bg-gray-900/30 text-gray-400 border-gray-500/30',
      review: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
      approved: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
      sent: 'bg-purple-900/30 text-purple-400 border-purple-500/30',
      viewed: 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30',
      accepted: 'bg-green-900/30 text-green-400 border-green-500/30',
      rejected: 'bg-red-900/30 text-red-400 border-red-500/30',
      expired: 'bg-orange-900/30 text-orange-400 border-orange-500/30',
      revised: 'bg-teal-900/30 text-teal-400 border-teal-500/30'
    };
    return colors[status] || colors.draft;
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium border
      ${getStatusColor(status)}
      ${sizeClasses[size]}
    `}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default ProposalStatusBadge;