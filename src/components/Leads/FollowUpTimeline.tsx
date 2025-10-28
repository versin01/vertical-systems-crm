import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface FollowUpTimelineProps {
  followUps: boolean[];
  followUpDates: (string | null)[];
}

const FollowUpTimeline: React.FC<FollowUpTimelineProps> = ({
  followUps,
  followUpDates
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Follow-up Timeline</h3>
      
      <div className="space-y-3">
        {followUps.map((completed, index) => (
          <div key={index} className="flex items-center space-x-3">
            {/* Status icon */}
            <div className="flex-shrink-0">
              {completed ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <Circle className="h-6 w-6 text-gray-500" />
              )}
            </div>
            
            {/* Follow-up info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${completed ? 'text-white' : 'text-gray-400'}`}>
                  Follow-up #{index + 1}
                </span>
                {completed && followUpDates[index] && (
                  <span className="text-sm text-gray-400 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(followUpDates[index])}
                  </span>
                )}
              </div>
              
              {completed ? (
                <p className="text-sm text-green-400">Completed</p>
              ) : (
                <p className="text-sm text-gray-500">Pending</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Progress</span>
          <span className="text-white font-semibold">
            {followUps.filter(Boolean).length}/7 completed
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
          <div 
            className="h-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${(followUps.filter(Boolean).length / 7) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default FollowUpTimeline;