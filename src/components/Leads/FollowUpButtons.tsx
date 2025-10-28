import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useWebhookTracking } from '../../hooks/useWebhookTracking';

interface FollowUpButtonsProps {
  leadId: string;
  followUps: boolean[];
  followUpDates: (string | null)[];
  onUpdate: (newFollowUps: boolean[], newDates: (string | null)[]) => void;
  size?: 'sm' | 'md' | 'lg';
}

const FollowUpButtons: React.FC<FollowUpButtonsProps> = ({
  leadId,
  followUps,
  followUpDates,
  onUpdate,
  size = 'md'
}) => {
  const [loading, setLoading] = useState<number | null>(null);
  const { trackFollowUpUpdate } = useWebhookTracking();

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const toggleFollowUp = async (index: number) => {
    setLoading(index);
    
    try {
      const newFollowUps = [...followUps];
      const newDates = [...followUpDates];
      
      // Store old value for webhook tracking
      const oldValue = newFollowUps[index];
      
      // Toggle the follow-up status
      newFollowUps[index] = !newFollowUps[index];
      
      // Set or clear the date
      if (newFollowUps[index]) {
        newDates[index] = new Date().toISOString();
      } else {
        newDates[index] = null;
      }

      // Update database
      const { error } = await supabase
        .from('leads')
        .update({
          follow_ups_completed: newFollowUps,
          follow_up_dates: newDates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      // Track webhook
      await trackFollowUpUpdate(leadId, index, oldValue, newFollowUps[index]);

      // Update local state
      onUpdate(newFollowUps, newDates);
    } catch (error) {
      console.error('Error updating follow-up:', error);
    } finally {
      setLoading(null);
    }
  };

  const completedCount = followUps.filter(Boolean).length;

  return (
    <div className="flex items-center space-x-1.5">
      {/* Follow-up buttons */}
      <div className="flex space-x-1">
        {followUps.map((completed, index) => (
          <button
            key={index}
            onClick={() => toggleFollowUp(index)}
            disabled={loading === index}
            className={`
              ${sizeClasses[size]} rounded-full font-semibold transition-all duration-300 relative overflow-hidden
              ${completed 
                ? 'bg-gradient-to-br from-teal-400 to-cyan-600 text-white shadow-lg shadow-teal-500/25 ring-2 ring-teal-400/30' 
                : 'bg-gray-700/80 hover:bg-gray-600/80 text-gray-300 border border-gray-600/50 hover:border-gray-500/50'
              }
              ${loading === index ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:shadow-xl cursor-pointer'}
              ${completed ? 'hover:shadow-teal-500/40 hover:ring-teal-400/50' : 'hover:shadow-gray-500/20'}
              group
            `}
            title={`Follow-up #${index + 1}${completed ? ' (Completed)' : ''}`}
          >
            {/* Glow effect for completed buttons */}
            {completed && (
              <div className="absolute inset-0 bg-gradient-to-br from-teal-300/20 to-cyan-500/20 rounded-full animate-pulse" />
            )}
            
            {/* Button content */}
            <span className="relative z-10">
              {loading === index ? (
                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mx-auto" />
              ) : (
                index + 1
              )}
            </span>

            {/* Hover glow effect */}
            <div className={`
              absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
              ${completed 
                ? 'bg-gradient-to-br from-teal-300/30 to-cyan-500/30' 
                : 'bg-gradient-to-br from-gray-400/20 to-gray-500/20'
              }
            `} />
          </button>
        ))}
      </div>
      
      {/* Progress indicator with enhanced styling */}
      <div className="ml-2 flex items-center space-x-1">
        <div className="w-8 bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-teal-400 to-cyan-600 transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${(completedCount / 7) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 font-medium min-w-[2rem]">
          {completedCount}/7
        </span>
      </div>
    </div>
  );
};

export default FollowUpButtons;