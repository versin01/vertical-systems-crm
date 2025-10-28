import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Deal, DealStage, PipelineStage } from '../../types/deals';
import { useDeals } from '../../hooks/useDeals';
import DealCard from './DealCard';
import { TrendingUp, DollarSign, Target, Clock } from 'lucide-react';

interface PipelineBoardProps {
  deals: Deal[];
  onDealUpdate: (dealId: string, updates: Partial<Deal>) => void;
  onDealClick: (deal: Deal) => void;
}

const PipelineBoard: React.FC<PipelineBoardProps> = ({
  deals,
  onDealUpdate,
  onDealClick
}) => {
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);

  const stageDefinitions = [
    {
      id: 'new_opportunity' as DealStage,
      label: 'New Opportunity',
      color: 'bg-blue-500',
      description: 'Lead converted to active opportunity'
    },
    {
      id: 'discovery_call_scheduled' as DealStage,
      label: 'Discovery Scheduled',
      color: 'bg-cyan-500',
      description: 'Initial consultation booked'
    },
    {
      id: 'discovery_call_completed' as DealStage,
      label: 'Discovery Completed',
      color: 'bg-teal-500',
      description: 'Needs assessment finished'
    },
    {
      id: 'proposal_preparation' as DealStage,
      label: 'Proposal Prep',
      color: 'bg-indigo-500',
      description: 'Creating custom proposal'
    },
    {
      id: 'proposal_sent' as DealStage,
      label: 'Proposal Sent',
      color: 'bg-purple-500',
      description: 'Proposal delivered to prospect'
    },
    {
      id: 'proposal_review' as DealStage,
      label: 'Proposal Review',
      color: 'bg-pink-500',
      description: 'Client reviewing proposal'
    },
    {
      id: 'negotiation' as DealStage,
      label: 'Negotiation',
      color: 'bg-orange-500',
      description: 'Discussing terms and pricing'
    },
    {
      id: 'contract_sent' as DealStage,
      label: 'Contract Sent',
      color: 'bg-yellow-500',
      description: 'Legal documents sent'
    },
    {
      id: 'contract_signed' as DealStage,
      label: 'Contract Signed',
      color: 'bg-green-500',
      description: 'Deal closed won'
    },
    {
      id: 'project_kickoff' as DealStage,
      label: 'Project Kickoff',
      color: 'bg-emerald-500',
      description: 'Implementation started'
    },
    {
      id: 'on_hold' as DealStage,
      label: 'On Hold',
      color: 'bg-gray-500',
      description: 'Deal temporarily paused'
    },
    {
      id: 'lost' as DealStage,
      label: 'Lost',
      color: 'bg-red-500',
      description: 'Deal closed lost'
    }
  ];

  useEffect(() => {
    const stages = stageDefinitions.map(stageDef => {
      const stageDeals = deals.filter(deal => deal.stage === stageDef.id);
      const totalValue = stageDeals.reduce((sum, deal) => sum + deal.deal_value, 0);
      const averageProbability = stageDeals.length > 0 
        ? stageDeals.reduce((sum, deal) => sum + deal.probability, 0) / stageDeals.length 
        : 0;

      return {
        ...stageDef,
        deals: stageDeals,
        totalValue,
        averageProbability
      };
    });

    setPipelineStages(stages);
  }, [deals]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStage = destination.droppableId as DealStage;
    const dealId = draggableId;

    // Update deal stage
    const updates: Partial<Deal> = { stage: newStage };

    // Set dates based on stage
    if (newStage === 'contract_signed') {
      updates.won_date = new Date().toISOString();
      updates.actual_close_date = new Date().toISOString();
    } else if (newStage === 'lost') {
      updates.lost_date = new Date().toISOString();
    }

    onDealUpdate(dealId, updates);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4 h-full">
          {pipelineStages.map((stage) => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    flex-shrink-0 w-80 bg-gray-800/40 rounded-xl border border-gray-700/50 
                    transition-all duration-200 h-full flex flex-col
                    ${snapshot.isDraggingOver ? 'bg-gray-700/60 border-teal-500/50' : ''}
                  `}
                >
                  {/* Stage Header */}
                  <div className="p-4 border-b border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                        <h3 className="font-semibold text-white text-sm">
                          {stage.label}
                        </h3>
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                          {stage.deals.length}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 mb-3">
                      {stage.description}
                    </p>

                    {/* Stage Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3 text-green-400" />
                        <span className="text-gray-300">
                          {formatCurrency(stage.totalValue)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="h-3 w-3 text-blue-400" />
                        <span className="text-gray-300">
                          {Math.round(stage.averageProbability)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deals List */}
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                    {stage.deals.map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              transition-all duration-200
                              ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl' : ''}
                            `}
                          >
                            <DealCard 
                              deal={deal} 
                              onClick={() => onDealClick(deal)}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {stage.deals.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-700/50 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6" />
                        </div>
                        <p className="text-sm">No deals in this stage</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default PipelineBoard;