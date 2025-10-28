import React, { useState, useEffect } from 'react';
import { X, Sparkles, FileText, Hash, Zap, AlertCircle, User, Building, Mail, Phone, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { Proposal } from '../../types/proposals';
import { Lead } from '../../types/leads';

interface GenerateAIProposalModalProps {
  isOpen: boolean;
  proposal?: Proposal;
  leads: Lead[];
  onClose: () => void;
  onGenerate: (lead: Lead, input: { transcript?: string; meetingNumber?: string }, existingProposalId?: string) => Promise<void>;
}

const GenerateAIProposalModal: React.FC<GenerateAIProposalModalProps> = ({
  isOpen,
  proposal,
  leads,
  onClose,
  onGenerate
}) => {
  const [currentStep, setCurrentStep] = useState<'leadSelection' | 'inputDetails'>('leadSelection');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [transcript, setTranscript] = useState('');
  const [meetingNumber, setMeetingNumber] = useState('');
  const [inputMode, setInputMode] = useState<'transcript' | 'meeting_number'>('transcript');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter leads based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = leads.filter(lead =>
        lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredLeads(filtered);
    } else {
      setFilteredLeads(leads);
    }
  }, [searchTerm, leads]);

  // Pre-select lead if editing existing proposal
  useEffect(() => {
    if (proposal && proposal.lead && leads.length > 0) {
      const proposalLead = leads.find(lead => lead.id === proposal.lead?.id);
      if (proposalLead) {
        setSelectedLead(proposalLead);
        setCurrentStep('inputDetails');
      }
    }
  }, [proposal, leads]);

  // Reset modal state when opened/closed
  useEffect(() => {
    if (isOpen) {
      if (!proposal || !proposal.lead) {
        setCurrentStep('leadSelection');
        setSelectedLead(null);
      }
      setSearchTerm('');
      setTranscript('');
      setMeetingNumber('');
      setInputMode('transcript');
      setError('');
      setLoading(false);
    }
  }, [isOpen, proposal]);

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    setCurrentStep('inputDetails');
  };

  const handleBack = () => {
    setCurrentStep('leadSelection');
    setError('');
  };

  const handleGenerate = async () => {
    setError('');

    // Validation
    if (inputMode === 'transcript' && !transcript.trim()) {
      setError('Please enter a meeting transcript');
      return;
    }
    if (inputMode === 'meeting_number' && !meetingNumber.trim()) {
      setError('Please enter a meeting number');
      return;
    }
    if (!selectedLead) {
      setError('Please select a lead');
      return;
    }

    setLoading(true);

    try {
      const input = inputMode === 'transcript' 
        ? { transcript: transcript.trim() }
        : { meetingNumber: meetingNumber.trim() };

      await onGenerate(selectedLead, input, proposal?.id);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to generate AI proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('leadSelection');
    setSelectedLead(null);
    setSearchTerm('');
    setTranscript('');
    setMeetingNumber('');
    setError('');
    setLoading(false);
    onClose();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-900/30 text-blue-400',
      contacted: 'bg-yellow-900/30 text-yellow-400',
      qualified: 'bg-green-900/30 text-green-400',
      proposal_sent: 'bg-purple-900/30 text-purple-400',
      closed_won: 'bg-emerald-900/30 text-emerald-400',
      closed_lost: 'bg-red-900/30 text-red-400',
      nurturing: 'bg-orange-900/30 text-orange-400',
      unqualified: 'bg-gray-900/30 text-gray-400'
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl">
              <Sparkles className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold gradient-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Generate AI Proposal
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {proposal ? 'Enhance existing proposal with AI' : 'Create new proposal using AI'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              currentStep === 'leadSelection' ? 'text-cyan-400' : 'text-green-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'leadSelection' 
                  ? 'bg-cyan-400/20 border-2 border-cyan-400' 
                  : 'bg-green-400/20 border-2 border-green-400'
              }`}>
                1
              </div>
              <span className="font-medium">Select Lead</span>
            </div>
            
            <ChevronRight className="h-5 w-5 text-gray-400" />
            
            <div className={`flex items-center space-x-2 ${
              currentStep === 'inputDetails' ? 'text-cyan-400' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'inputDetails' 
                  ? 'bg-cyan-400/20 border-2 border-cyan-400' 
                  : 'bg-gray-700 border-2 border-gray-600'
              }`}>
                2
              </div>
              <span className="font-medium">Meeting Details</span>
            </div>
          </div>
        </div>

        {/* Existing Proposal Info */}
        {proposal && (
          <div className="p-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-purple-500/30">
            <h3 className="font-semibold text-purple-400 mb-3">Current Proposal</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Title:</span>
                <p className="text-white font-semibold">{proposal.title}</p>
              </div>
              <div>
                <span className="text-gray-400">Value:</span>
                <p className="text-white font-semibold">
                  ${proposal.proposal_value.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <p className="text-white capitalize">{proposal.status}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-6 border-b border-gray-700">
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Lead Selection */}
        {currentStep === 'leadSelection' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Select Lead</h3>
              <p className="text-gray-400 text-sm">
                Choose the lead/client for whom you want to generate the AI proposal.
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400"
                autoFocus
              />
            </div>

            {/* Leads List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredLeads.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {searchTerm ? 'No leads found matching your search.' : 'No leads available.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => handleLeadSelect(lead)}
                      className={`text-left p-4 border-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                        selectedLead?.id === lead.id
                          ? 'border-cyan-500 bg-cyan-900/20 text-white'
                          : 'border-gray-700/50 bg-gray-800/30 text-gray-300 hover:border-gray-600/50 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-cyan-900/30 rounded-lg">
                          <User className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white">
                            {lead.first_name} {lead.last_name}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center space-x-1 mt-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                          {lead.company && (
                            <div className="text-sm text-gray-400 flex items-center space-x-1 mt-1">
                              <Building className="h-3 w-3" />
                              <span className="truncate">{lead.company}</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="text-sm text-gray-400 flex items-center space-x-1 mt-1">
                              <Phone className="h-3 w-3" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                              {lead.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {lead.revenue_generated > 0 && (
                              <span className="text-xs text-green-400 font-medium">
                                ${lead.revenue_generated.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 1 Actions */}
            <div className="flex justify-between pt-4 border-t border-gray-700">
              <button
                onClick={handleClose}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setCurrentStep('inputDetails')}
                disabled={!selectedLead}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Input Details */}
        {currentStep === 'inputDetails' && (
          <div className="p-6 space-y-6">
            {/* Selected Lead Summary */}
            {selectedLead && (
              <div className="p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg">
                <h3 className="font-semibold text-cyan-400 mb-3">Selected Lead</h3>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-cyan-900/30 rounded-lg">
                    <User className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {selectedLead.first_name} {selectedLead.last_name}
                    </div>
                    <div className="text-sm text-gray-400">{selectedLead.email}</div>
                    {selectedLead.company && (
                      <div className="text-sm text-gray-400">{selectedLead.company}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Meeting Information</h3>
              <p className="text-gray-400 text-sm">
                Provide either the meeting transcript or meeting number for AI analysis.
              </p>
            </div>

            {/* Input Mode Selection */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-white">Choose Input Method</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setInputMode('transcript')}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${inputMode === 'transcript'
                      ? 'border-cyan-500 bg-cyan-900/20 text-white'
                      : 'border-gray-700 bg-gray-800/30 text-gray-300 hover:border-gray-600 hover:bg-gray-700/30'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="h-6 w-6 text-cyan-400" />
                    <span className="font-semibold">Meeting Transcript</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Paste the full transcript from your meeting with the client
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode('meeting_number')}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${inputMode === 'meeting_number'
                      ? 'border-cyan-500 bg-cyan-900/20 text-white'
                      : 'border-gray-700 bg-gray-800/30 text-gray-300 hover:border-gray-600 hover:bg-gray-700/30'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Hash className="h-6 w-6 text-blue-400" />
                    <span className="font-semibold">Meeting Number</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Enter the meeting ID or reference number
                  </p>
                </button>
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              {inputMode === 'transcript' ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Meeting Transcript *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      rows={12}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400 resize-none font-mono text-sm"
                      placeholder="Paste the meeting transcript here...

Example:
[00:00] John: Hi, thanks for taking the time to meet with us today.
[00:15] Client: Of course, I'm excited to learn more about your services.
[00:30] John: Let me start by understanding your current challenges..."
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Include timestamps and speaker names for best AI analysis results.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Meeting Number *
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={meetingNumber}
                      onChange={(e) => setMeetingNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Enter meeting ID, reference number, or identifier"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    This should be a unique identifier for the meeting in your system.
                  </p>
                </div>
              )}
            </div>

            {/* AI Generation Info */}
            <div className="p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-cyan-400 mb-2">AI Proposal Generation</h4>
                  <p className="text-sm text-gray-300 mb-2">
                    Our AI will analyze the meeting content and generate a customized proposal including:
                  </p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Identified client needs and pain points</li>
                    <li>• Recommended service packages and solutions</li>
                    <li>• Customized pricing and timeline</li>
                    <li>• Relevant deliverables and project scope</li>
                    <li>• Personalized proposal content and messaging</li>
                    <li>• Shareable proposal link for client access</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="flex justify-between pt-4 border-t border-gray-700">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || (inputMode === 'transcript' && !transcript.trim()) || (inputMode === 'meeting_number' && !meetingNumber.trim())}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    <span>Generate AI Proposal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateAIProposalModal;