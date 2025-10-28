import React, { useState } from 'react';
import { Check, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { LeadChecklist as LeadChecklistType, ChecklistDates } from '../../types/leads';
import { supabase } from '../../lib/supabase';
import { useWebhookTracking } from '../../hooks/useWebhookTracking';

interface LeadChecklistProps {
  leadId: string;
  checklist: LeadChecklistType;
  checklistDates: ChecklistDates;
  onUpdate: (newChecklist: LeadChecklistType, newDates: ChecklistDates) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const LeadChecklist: React.FC<LeadChecklistProps> = ({
  leadId,
  checklist,
  checklistDates,
  onUpdate,
  size = 'md',
  showLabels = true
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { trackChecklistUpdate } = useWebhookTracking();

  const checklistItems = [
    { key: 'warm_lead', label: 'Warm Lead', description: 'Lead shows genuine interest', icon: '🔥' },
    { key: 'quality_conversation', label: 'Quality Conversation', description: 'Had meaningful discussion', icon: '💬' },
    { key: 'lead_magnet_sent', label: 'Lead Magnet Sent', description: 'Sent valuable resource/content', icon: '🧲' },
    { key: 'asset_consumed', label: 'Asset Consumed', description: 'Lead engaged with content', icon: '📖' },
    { key: 'booking_requested', label: 'Booking Requested', description: 'Lead requested meeting/call', icon: '📅' },
    { key: 'nurture_sequence', label: 'Nurture Sequence', description: 'Added to nurture campaign', icon: '🌱' }
  ];

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const toggleChecklistItem = async (key: keyof LeadChecklistType) => {
    setLoading(key);
    
    try {
      const newChecklist = { ...checklist };
      const newDates = { ...checklistDates };
      
      // Store old value for webhook tracking
      const oldValue = newChecklist[key];
      
      // Toggle the checklist item
      newChecklist[key] = !newChecklist[key];
      
      // Set or clear the date
      if (newChecklist[key]) {
        newDates[key] = new Date().toISOString();
      } else {
        newDates[key] = null;
      }

      // Update database
      const { error } = await supabase
        .from('leads')
        .update({
          lead_checklist: newChecklist,
          checklist_dates: newDates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      // Track webhook
      await trackChecklistUpdate(leadId, key, oldValue, newChecklist[key]);

      // Update local state
      onUpdate(newChecklist, newDates);
    } catch (error) {
      console.error('Error updating checklist:', error);
    } finally {
      setLoading(null);
    }
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalItems = checklistItems.length;
  const completionPercentage = (completedCount / totalItems) * 100;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // For small size without labels, show compact grid
  if (size === 'sm' && !showLabels) {
    return (
      <div className="flex items-center space-x-2">
        <div className="grid grid-cols-3 gap-1">
          {checklistItems.map((item) => {
            const isCompleted = checklist[item.key as keyof LeadChecklistType];
            const isLoading = loading === item.key;

            return (
              <button
                key={item.key}
                onClick={() => toggleChecklistItem(item.key as keyof LeadChecklistType)}
                disabled={isLoading}
                className={`
                  w-6 h-6 rounded-lg border transition-all duration-200 flex items-center justify-center text-xs
                  ${isCompleted 
                    ? 'bg-gradient-to-br from-teal-400 to-cyan-600 border-teal-400 text-white shadow-sm' 
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/80 hover:bg-gray-700/80 text-gray-400'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 cursor-pointer'}
                `}
                title={`${item.label}${isCompleted ? ' (Completed)' : ''}`}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-2 w-2 border border-white border-t-transparent" />
                ) : isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="opacity-60">{item.icon}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="text-xs text-gray-400 font-medium">
          {completedCount}/{totalItems}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showLabels && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-teal-400" />
            <h3 className={`font-semibold gradient-text section-gradient-leads ${textSizeClasses[size]}`}>
              Lead Progression Checklist
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-400 font-medium">
              {completedCount}/{totalItems} completed
            </span>
            <div className="w-20 bg-gray-700 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-cyan-600 rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="text-sm font-bold text-teal-400">
              {Math.round(completionPercentage)}%
            </span>
          </div>
        </div>
      )}

      <div className={`grid ${showLabels ? 'grid-cols-1 lg:grid-cols-2 gap-3' : 'grid-cols-2 gap-2'}`}>
        {checklistItems.map((item, index) => {
          const isCompleted = checklist[item.key as keyof LeadChecklistType];
          const isLoading = loading === item.key;
          const completedDate = checklistDates[item.key as keyof ChecklistDates];

          return (
            <div 
              key={item.key} 
              className={`
                flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group cursor-pointer
                ${isCompleted 
                  ? 'bg-gradient-to-r from-teal-900/30 to-cyan-900/30 border border-teal-500/30 shadow-lg shadow-teal-500/10' 
                  : 'bg-gray-800/40 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50'
                }
                hover:scale-[1.02] hover:shadow-xl
                ${isCompleted ? 'hover:shadow-teal-500/20' : 'hover:shadow-gray-500/10'}
              `}
              onClick={() => toggleChecklistItem(item.key as keyof LeadChecklistType)}
            >
              {/* Checkbox with enhanced styling */}
              <div className="relative">
                <button
                  disabled={isLoading}
                  className={`
                    ${sizeClasses[size]} rounded-lg border-2 transition-all duration-300 flex items-center justify-center relative overflow-hidden
                    ${isCompleted 
                      ? 'bg-gradient-to-br from-teal-400 to-cyan-600 border-teal-400 text-white shadow-lg shadow-teal-500/30' 
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800/80 hover:bg-gray-700/80'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 cursor-pointer'}
                    group-hover:shadow-xl
                  `}
                >
                  {/* Animated background for completed items */}
                  {isCompleted && (
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-300/20 to-cyan-500/20 rounded-lg animate-pulse" />
                  )}
                  
                  {/* Icon content */}
                  <span className="relative z-10">
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
                    ) : isCompleted ? (
                      <Check className="h-3 w-3 drop-shadow-sm" />
                    ) : (
                      <span className={`${textSizeClasses[size]} opacity-60`}>{item.icon}</span>
                    )}
                  </span>

                  {/* Hover glow effect */}
                  <div className={`
                    absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    ${isCompleted 
                      ? 'bg-gradient-to-br from-teal-300/30 to-cyan-500/30' 
                      : 'bg-gradient-to-br from-gray-400/20 to-gray-500/20'
                    }
                  `} />
                </button>
              </div>

              {/* Label and Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`
                    font-semibold transition-all duration-300
                    ${isCompleted ? 'text-white' : 'text-gray-300 group-hover:text-white'}
                    ${textSizeClasses[size]}
                  `}>
                    {item.label}
                  </span>
                  
                  {isCompleted && completedDate && showLabels && (
                    <div className="flex items-center space-x-1 text-xs text-teal-400 bg-teal-900/30 px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">{formatDate(completedDate)}</span>
                    </div>
                  )}
                </div>
                
                {showLabels && (
                  <p className={`
                    text-xs mt-1 transition-colors duration-300
                    ${isCompleted ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-400'}
                  `}>
                    {item.description}
                  </p>
                )}
              </div>

              {/* Completion indicator */}
              {isCompleted && (
                <div className="flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-teal-400 animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enhanced Summary */}
      {showLabels && (
        <div className={`
          mt-6 p-4 rounded-xl transition-all duration-300
          ${completedCount === totalItems 
            ? 'bg-gradient-to-r from-teal-900/40 to-cyan-900/40 border border-teal-500/40 shadow-lg shadow-teal-500/20' 
            : 'bg-gray-800/40 border border-gray-700/50'
          }
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className={`
                h-6 w-6 transition-colors duration-300
                ${completedCount === totalItems ? 'text-teal-400 animate-pulse' : 'text-gray-400'}
              `} />
              <div>
                <span className="text-base font-semibold text-gray-200">
                  Progress: {Math.round(completionPercentage)}%
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  {completedCount} of {totalItems} milestones completed
                </p>
              </div>
            </div>
            
            {completedCount === totalItems && (
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                <span className="text-sm bg-gradient-to-r from-teal-400 to-cyan-600 bg-clip-text text-transparent font-bold">
                  All milestones completed!
                </span>
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 w-full bg-gray-700 rounded-full h-2 overflow-hidden shadow-inner">
            <div 
              className={`
                h-full rounded-full transition-all duration-700 ease-out
                ${completedCount === totalItems 
                  ? 'bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-400 animate-pulse shadow-lg shadow-teal-500/30' 
                  : 'bg-gradient-to-r from-teal-400 to-cyan-600 shadow-sm'
                }
              `}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadChecklist;