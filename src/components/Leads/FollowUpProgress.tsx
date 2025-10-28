import React from 'react';

interface FollowUpProgressProps {
  followUps: boolean[];
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const FollowUpProgress: React.FC<FollowUpProgressProps> = ({
  followUps,
  showDetails = false,
  size = 'md'
}) => {
  const completedCount = followUps.filter(Boolean).length;
  const percentage = (completedCount / 7) * 100;

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const getProgressColor = () => {
    if (percentage === 100) return 'from-green-500 to-emerald-600';
    if (percentage >= 70) return 'from-blue-500 to-cyan-600';
    if (percentage >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div className="space-y-1">
      {/* Progress bar */}
      <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className={`${sizeClasses[size]} bg-gradient-to-r ${getProgressColor()} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Details */}
      {showDetails && (
        <div className={`flex justify-between items-center ${textSizeClasses[size]} text-gray-400`}>
          <span>{completedCount}/7 completed</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
};

export default FollowUpProgress;