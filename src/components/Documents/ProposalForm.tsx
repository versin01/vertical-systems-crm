import React, { useState, useEffect } from 'react';
import { X, Save, FileText, DollarSign, Calendar, User, Plus, Trash2, Clock } from 'lucide-react';
import { Proposal, ProposalFormData, DeliverableItem, TimelineItem, ProposalStatus } from '../../types/proposals';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import { v4 as uuidv4 } from 'uuid';

interface ProposalFormProps {
  proposal?: Proposal;
  dealId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (proposal: Proposal) => void;
}

const ProposalForm: React.FC<ProposalFormProps> = ({ 
  proposal, 
  dealId,
  isOpen, 
  onClose, 
  onSave 
}) => {
  const { user } = useAuth();
  const { users, fetchUsers } = useUsers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dealData, setDealData] = useState<any>(null);

  const [formData, setFormData] = useState<ProposalFormData>({
    title: '',
    proposal_text: '',
    deliverables: [],
    timelines: [],
    proposal_value: 0,
    assigned_to: '',
    expiration_date: '',
    client_notes: '',
    internal_notes: '',
    proposal_link: ''
  });

  // Fetch users for assignment dropdown
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, fetchUsers]);

  // Fetch deal data if dealId is provided
  useEffect(() => {
    const fetchDealData = async () => {
      if (!dealId) return;
      
      try {
        const { data, error } = await supabase
          .from('deals')
          .select(`
            *,
            lead:leads(id, first_name, last_name, email, company)
          `)
          .eq('id', dealId)
          .single();
        
        if (error) throw error;
        setDealData(data);
        
        // Pre-populate form with deal data
        setFormData(prev => ({
          ...prev,
          title: `Proposal for ${data.deal_name}`,
          proposal_value: data.deal_value,
          assigned_to: data.deal_owner || user?.id || '',
          proposal_text: `# Proposal for ${data.deal_name}\n\n## Overview\n\nThank you for the opportunity to submit this proposal. We are excited to work with you on this project.\n\n## Scope of Work\n\nPlease define the scope of work here.\n\n## Investment\n\n$${data.deal_value.toLocaleString()}`
        }));
      } catch (error: any) {
        console.error('Error fetching deal data:', error);
      }
    };

    if (dealId) {
      fetchDealData();
    }
  }, [dealId, user]);

  // Update form data when proposal prop changes
  useEffect(() => {
    if (proposal) {
      setFormData({
        title: proposal.title || '',
        proposal_text: proposal.proposal_text || '',
        deliverables: proposal.deliverables || [],
        timelines: proposal.timelines || [],
        proposal_value: proposal.proposal_value || 0,
        assigned_to: proposal.assigned_to || '',
        expiration_date: proposal.expiration_date ? proposal.expiration_date.split('T')[0] : '',
        client_notes: proposal.client_notes || '',
        internal_notes: proposal.internal_notes || '',
        proposal_link: proposal.proposal_link || ''
      });
    } else {
      // Reset form for new proposal
      setFormData({
        title: dealData ? `Proposal for ${dealData.deal_name}` : '',
        proposal_text: dealData ? 
          `# Proposal for ${dealData.deal_name}\n\n## Overview\n\nThank you for the opportunity to submit this proposal. We are excited to work with you on this project.\n\n## Scope of Work\n\nPlease define the scope of work here.\n\n## Investment\n\n$${dealData.deal_value.toLocaleString()}` : 
          '',
        deliverables: [],
        timelines: [],
        proposal_value: dealData ? dealData.deal_value : 0,
        assigned_to: dealData ? dealData.deal_owner || user?.id || '' : user?.id || '',
        expiration_date: '',
        client_notes: '',
        internal_notes: '',
        proposal_link: ''
      });
    }
    setError('');
  }, [proposal, isOpen, dealData, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddDeliverable = () => {
    const newDeliverable: DeliverableItem = {
      id: uuidv4(),
      title: '',
      description: '',
      included: true,
      price: 0
    };
    
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, newDeliverable]
    }));
  };

  const handleRemoveDeliverable = (id: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter(item => item.id !== id)
    }));
  };

  const handleDeliverableChange = (id: string, field: keyof DeliverableItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map(item => 
        item.id === id ? { ...item, [field]: field === 'price' ? (parseFloat(value) || 0) : value } : item
      )
    }));
  };

  const handleAddTimeline = () => {
    const newTimeline: TimelineItem = {
      id: uuidv4(),
      title: '',
      description: '',
      duration: 7,
      start_offset: 0
    };
    
    setFormData(prev => ({
      ...prev,
      timelines: [...prev.timelines, newTimeline]
    }));
  };

  const handleRemoveTimeline = (id: string) => {
    setFormData(prev => ({
      ...prev,
      timelines: prev.timelines.filter(item => item.id !== id)
    }));
  };

  const handleTimelineChange = (id: string, field: keyof TimelineItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      timelines: prev.timelines.map(item => 
        item.id === id ? { ...item, [field]: field === 'duration' || field === 'start_offset' ? (parseInt(value) || 0) : value } : item
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const proposalData = {
        ...formData,
        deal_id: dealId || proposal?.deal_id,
        status: proposal?.status || 'draft' as ProposalStatus,
        expiration_date: formData.expiration_date ? new Date(formData.expiration_date).toISOString() : null,
        updated_at: new Date().toISOString()
      };

      if (proposal) {
        // Update existing proposal
        const { data, error } = await supabase
          .from('proposals')
          .update(proposalData)
          .eq('id', proposal.id)
          .select(`
            *,
            deals:deal_id(id, deal_name, deal_value, stage, lead_id),
            lead:deals!inner(lead_id(id, first_name, last_name, email, company)),
            creator:created_by(id, email, full_name),
            assignee:assigned_to(id, email, full_name)
          `)
          .single();

        if (error) throw error;
        onSave(data);
      } else {
        // Create new proposal
        const { data, error } = await supabase
          .from('proposals')
          .insert({
            ...proposalData,
            created_by: user.id
          })
          .select(`
            *,
            deals:deal_id(id, deal_name, deal_value, stage, lead_id),
            lead:deals!inner(lead_id(id, first_name, last_name, email, company)),
            creator:created_by(id, email, full_name),
            assignee:assigned_to(id, email, full_name)
          `)
          .single();

        if (error) throw error;

        // If creating from a deal in proposal_preparation stage, update the deal stage
        if (dealId && dealData?.stage === 'proposal_preparation') {
          await supabase
            .from('deals')
            .update({ 
              stage: 'proposal_sent',
              updated_at: new Date().toISOString()
            })
            .eq('id', dealId);
        }

        onSave(data);
      }

      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold gradient-text section-gradient-documents">
            {proposal ? 'Edit Proposal' : 'Create New Proposal'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Deal Information (if available) */}
          {dealData && (
            <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
              <h3 className="font-semibold text-purple-400 mb-3">Deal Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Deal:</span>
                  <p className="text-white font-semibold">{dealData.deal_name}</p>
                </div>
                <div>
                  <span className="text-gray-400">Value:</span>
                  <p className="text-white font-semibold">${dealData.deal_value.toLocaleString()}</p>
                </div>
                {dealData.lead && (
                  <>
                    <div>
                      <span className="text-gray-400">Client:</span>
                      <p className="text-white">{dealData.lead.first_name} {dealData.lead.last_name}</p>
                    </div>
                    {dealData.lead.company && (
                      <div>
                        <span className="text-gray-400">Company:</span>
                        <p className="text-white">{dealData.lead.company}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Proposal Title *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Enter proposal title"
                    required
                  />
                </div>
              </div>

              {/* Proposal Text */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Proposal Content
                </label>
                <textarea
                  name="proposal_text"
                  value={formData.proposal_text}
                  onChange={handleChange}
                  rows={12}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 font-mono text-sm"
                  placeholder="Enter proposal content (supports Markdown)"
                />
                <p className="text-xs text-gray-500">
                  Supports Markdown formatting for rich text content.
                </p>
              </div>

              {/* Deliverables */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    Deliverables
                  </label>
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="flex items-center space-x-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Deliverable</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.deliverables.map((deliverable, index) => (
                    <div key={deliverable.id} className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                      <div className="flex justify-between mb-3">
                        <h4 className="text-sm font-medium text-white">Deliverable {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveDeliverable(deliverable.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs text-gray-400">
                            Title
                          </label>
                          <input
                            type="text"
                            value={deliverable.title}
                            onChange={(e) => handleDeliverableChange(deliverable.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
                            placeholder="Deliverable title"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-xs text-gray-400">
                            Price (Optional)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="number"
                              value={deliverable.price || ''}
                              onChange={(e) => handleDeliverableChange(deliverable.id, 'price', e.target.value)}
                              className="w-full pl-8 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <label className="block text-xs text-gray-400">
                          Description
                        </label>
                        <textarea
                          value={deliverable.description}
                          onChange={(e) => handleDeliverableChange(deliverable.id, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-sm resize-none"
                          placeholder="Describe this deliverable"
                        />
                      </div>
                      
                      <div className="mt-3 flex items-center">
                        <input
                          type="checkbox"
                          id={`included-${deliverable.id}`}
                          checked={deliverable.included}
                          onChange={(e) => handleDeliverableChange(deliverable.id, 'included', e.target.checked)}
                          className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                        />
                        <label htmlFor={`included-${deliverable.id}`} className="ml-2 text-xs text-gray-300">
                          Included in proposal
                        </label>
                      </div>
                    </div>
                  ))}
                  
                  {formData.deliverables.length === 0 && (
                    <div className="text-center p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                      <p className="text-gray-400 text-sm">No deliverables added yet.</p>
                      <button
                        type="button"
                        onClick={handleAddDeliverable}
                        className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Add First Deliverable
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Timelines */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    Project Timeline
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTimeline}
                    className="flex items-center space-x-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Timeline Item</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.timelines.map((timeline, index) => (
                    <div key={timeline.id} className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                      <div className="flex justify-between mb-3">
                        <h4 className="text-sm font-medium text-white">Phase {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeline(timeline.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs text-gray-400">
                            Phase Title
                          </label>
                          <input
                            type="text"
                            value={timeline.title}
                            onChange={(e) => handleTimelineChange(timeline.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
                            placeholder="Phase title"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <label className="block text-xs text-gray-400">
                              Start (days from kickoff)
                            </label>
                            <input
                              type="number"
                              value={timeline.start_offset}
                              onChange={(e) => handleTimelineChange(timeline.id, 'start_offset', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-xs text-gray-400">
                              Duration (days)
                            </label>
                            <input
                              type="number"
                              value={timeline.duration}
                              onChange={(e) => handleTimelineChange(timeline.id, 'duration', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
                              placeholder="7"
                              min="1"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <label className="block text-xs text-gray-400">
                          Description
                        </label>
                        <textarea
                          value={timeline.description}
                          onChange={(e) => handleTimelineChange(timeline.id, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-sm resize-none"
                          placeholder="Describe this phase"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {formData.timelines.length === 0 && (
                    <div className="text-center p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                      <p className="text-gray-400 text-sm">No timeline items added yet.</p>
                      <button
                        type="button"
                        onClick={handleAddTimeline}
                        className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Add First Timeline Item
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Settings */}
            <div className="space-y-6">
              {/* Proposal Value */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Proposal Value *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="proposal_value"
                    value={formData.proposal_value}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Assigned To */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Assigned To
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expiration Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Expiration Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    name="expiration_date"
                    value={formData.expiration_date}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Date after which this proposal is no longer valid.
                </p>
              </div>

              {/* Client Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Client Notes
                </label>
                <textarea
                  name="client_notes"
                  value={formData.client_notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                  placeholder="Notes visible to the client..."
                />
              </div>

              {/* Internal Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Internal Notes
                </label>
                <textarea
                  name="internal_notes"
                  value={formData.internal_notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                  placeholder="Private notes for internal use only..."
                />
              </div>

              {/* Proposal Link */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Proposal Link (Optional)
                </label>
                <input
                  type="url"
                  name="proposal_link"
                  value={formData.proposal_link}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="https://example.com/proposal/..."
                />
                <p className="text-xs text-gray-500">
                  Custom URL for sharing this proposal externally.
                </p>
              </div>

              {/* Status Information */}
              {proposal && (
                <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
                  <h3 className="font-semibold text-purple-400 mb-3">Proposal Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-white font-semibold capitalize">{proposal.status}</span>
                    </div>
                    
                    {proposal.sent_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sent:</span>
                        <span className="text-white">
                          {new Date(proposal.sent_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {proposal.last_viewed_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Viewed:</span>
                        <span className="text-white">
                          {new Date(proposal.last_viewed_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Follow-ups:</span>
                      <span className="text-white">{proposal.follow_up_count || 0}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white">
                        {new Date(proposal.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-400 to-blue-600 hover:from-purple-500 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>{proposal ? 'Update Proposal' : 'Create Proposal'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposalForm;