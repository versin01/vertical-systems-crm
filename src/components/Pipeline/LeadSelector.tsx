import React, { useState, useEffect } from 'react';
import { Search, User, Building, Mail, Phone, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Lead } from '../../types/leads';

interface LeadSelectorProps {
  selectedLeadId?: string;
  onLeadSelect: (leadId: string | null) => void;
  onCreateNewLead?: () => void;
  disabled?: boolean;
}

const LeadSelector: React.FC<LeadSelectorProps> = ({
  selectedLeadId,
  onLeadSelect,
  onCreateNewLead,
  disabled = false
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedLead = leads.find(lead => lead.id === selectedLeadId);

  useEffect(() => {
    fetchLeads();
  }, []);

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

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
      setFilteredLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSelect = (lead: Lead) => {
    onLeadSelect(lead.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    onLeadSelect(null);
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

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Link to Lead (Optional)
      </label>
      
      <div className="relative">
        {/* Selected Lead Display */}
        {selectedLead ? (
          <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-900/30 rounded-lg">
                <User className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <div className="font-semibold text-white">
                  {selectedLead.first_name} {selectedLead.last_name}
                </div>
                <div className="text-sm text-gray-400">{selectedLead.email}</div>
                {selectedLead.company && (
                  <div className="text-sm text-gray-500">{selectedLead.company}</div>
                )}
                <div className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLead.status)}`}>
                    {selectedLead.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                disabled={disabled}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Change
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                disabled={disabled}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Lead Selection Button */
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            disabled={disabled}
            className="w-full flex items-center justify-center space-x-2 p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-700/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <User className="h-5 w-5 text-gray-400" />
            <span className="text-gray-300">Select Lead to Link</span>
          </button>
        )}

        {/* Lead Selection Modal */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="glass-card w-full max-w-4xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <User className="h-6 w-6 text-teal-400" />
                    <h3 className="text-lg font-semibold text-white">Select Lead</h3>
                  </div>
                  <div className="flex items-center space-x-3">
                    {onCreateNewLead && (
                      <button
                        onClick={() => {
                          onCreateNewLead();
                          setIsOpen(false);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create New Lead</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search leads by name, email, or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Leads List */}
                <div className="p-6 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
                    </div>
                  ) : filteredLeads.length === 0 ? (
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
                          className="text-left p-4 bg-gray-800/30 hover:bg-gray-700/50 border border-gray-700/50 hover:border-teal-500/50 rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-teal-900/30 rounded-lg">
                              <User className="h-5 w-5 text-teal-400" />
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

                {/* Footer */}
                <div className="p-6 border-t border-gray-700 bg-gray-800/30">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                      {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} available
                    </p>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        Link this deal to an existing lead to track the complete sales journey.
      </p>
    </div>
  );
};

export default LeadSelector;