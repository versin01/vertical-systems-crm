import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DealStage } from '../../types/deals';

interface DealStatusDropdownProps {
  deal: {
    id: string;
    stage: DealStage;
  };
  onStatusChange: (dealId: string, newStage: DealStage) => void;
}

const DealStatusDropdown: React.FC<DealStatusDropdownProps> = ({ deal, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const stageOptions = [
    { value: 'new_opportunity', label: 'New Opportunity', color: 'bg-blue-900/30 text-blue-400 border-blue-500/30' },
    { value: 'discovery_call_scheduled', label: 'Discovery Scheduled', color: 'bg-cyan-900/30 text-cyan-400 border-cyan-500/30' },
    { value: 'discovery_call_completed', label: 'Discovery Completed', color: 'bg-teal-900/30 text-teal-400 border-teal-500/30' },
    { value: 'proposal_preparation', label: 'Proposal Prep', color: 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30' },
    { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-purple-900/30 text-purple-400 border-purple-500/30' },
    { value: 'proposal_review', label: 'Proposal Review', color: 'bg-pink-900/30 text-pink-400 border-pink-500/30' },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-900/30 text-orange-400 border-orange-500/30' },
    { value: 'contract_sent', label: 'Contract Sent', color: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30' },
    { value: 'contract_signed', label: 'Contract Signed', color: 'bg-green-900/30 text-green-400 border-green-500/30' },
    { value: 'project_kickoff', label: 'Project Kickoff', color: 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-gray-900/30 text-gray-400 border-gray-500/30' },
    { value: 'lost', label: 'Lost', color: 'bg-red-900/30 text-red-400 border-red-500/30' }
  ];

  const currentStage = stageOptions.find(s => s.value === deal.stage);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 
          hover:scale-105 hover:shadow-lg cursor-pointer
          ${currentStage?.color || stageOptions[0].color}
        `}
      >
        <span>{currentStage?.label || 'New Opportunity'}</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
            {stageOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onStatusChange(deal.id, option.value as DealStage);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-4 py-3 text-sm transition-all duration-200 hover:bg-gray-700/50
                  ${option.value === deal.stage ? 'bg-gray-700/30' : ''}
                  ${option.color.includes('blue') ? 'hover:bg-blue-900/20' : ''}
                  ${option.color.includes('cyan') ? 'hover:bg-cyan-900/20' : ''}
                  ${option.color.includes('teal') ? 'hover:bg-teal-900/20' : ''}
                  ${option.color.includes('indigo') ? 'hover:bg-indigo-900/20' : ''}
                  ${option.color.includes('purple') ? 'hover:bg-purple-900/20' : ''}
                  ${option.color.includes('pink') ? 'hover:bg-pink-900/20' : ''}
                  ${option.color.includes('orange') ? 'hover:bg-orange-900/20' : ''}
                  ${option.color.includes('yellow') ? 'hover:bg-yellow-900/20' : ''}
                  ${option.color.includes('green') ? 'hover:bg-green-900/20' : ''}
                  ${option.color.includes('emerald') ? 'hover:bg-emerald-900/20' : ''}
                  ${option.color.includes('red') ? 'hover:bg-red-900/20' : ''}
                  ${option.color.includes('gray') ? 'hover:bg-gray-700/20' : ''}
                `}
              >
                <span className={`font-medium ${option.color.split(' ')[1]}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DealStatusDropdown;