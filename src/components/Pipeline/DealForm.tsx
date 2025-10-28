import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, User, Briefcase, Target, FileText } from 'lucide-react';
import { Deal, DealFormData, DealStage, ServiceType } from '../../types/deals';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import LeadSelector from './LeadSelector';
import LeadForm from '../Leads/LeadForm';

interface DealFormProps {
  deal?: Deal;
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: Deal) => void;
  leadId?: string; // For lead-to-deal conversion
}

const DealForm: React.FC<DealFormProps> = ({ deal, isOpen, onClose, onSave, leadId }) => {
  const { user } = useAuth();
  const { users, fetchUsers } = useUsers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLeadForm, setShowLeadForm] = useState(false);

  const [formData, setFormData] = useState<DealFormData & { lead_id?: string }>({
    deal_name: '',
    deal_value: 0,
    probability: 50,
    expected_close_date: '',
    stage: 'new_opportunity',
    deal_owner: '',
    service_type: '',
    deal_source: '',
    notes: '',
    lead_id: leadId || ''
  });

  // Fetch users for assignment dropdown
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, fetchUsers]);

  // Update form data when deal prop changes
  useEffect(() => {
    if (deal) {
      setFormData({
        deal_name: deal.deal_name || '',
        deal_value: deal.deal_value || 0,
        probability: deal.probability || 50,
        expected_close_date: deal.expected_close_date ? deal.expected_close_date.split('T')[0] : '',
        stage: deal.stage || 'new_opportunity',
        deal_owner: deal.deal_owner || '',
        service_type: deal.service_type || '',
        deal_source: deal.deal_source || '',
        notes: deal.notes || '',
        lead_id: deal.lead_id || ''
      });
    } else {
      // Reset form for new deal
      setFormData({
        deal_name: '',
        deal_value: 0,
        probability: 50,
        expected_close_date: '',
        stage: 'new_opportunity',
        deal_owner: user?.id || '',
        service_type: '',
        deal_source: '',
        notes: '',
        lead_id: leadId || ''
      });
    }
    setError('');
  }, [deal, isOpen, user, leadId]);

  const stageOptions: { value: DealStage; label: string }[] = [
    { value: 'new_opportunity', label: 'New Opportunity' },
    { value: 'discovery_call_scheduled', label: 'Discovery Call Scheduled' },
    { value: 'discovery_call_completed', label: 'Discovery Call Completed' },
    { value: 'proposal_preparation', label: 'Proposal Preparation' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'proposal_review', label: 'Proposal Review' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'contract_sent', label: 'Contract Sent' },
    { value: 'contract_signed', label: 'Contract Signed' },
    { value: 'project_kickoff', label: 'Project Kickoff' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'lost', label: 'Lost' }
  ];

  const serviceTypeOptions: { value: ServiceType; label: string }[] = [
    { value: 'Growth Creator', label: 'Growth Creator' },
    { value: 'AIGC Systems', label: 'AIGC Systems' },
    { value: 'Custom Projects', label: 'Custom Projects' },
    { value: 'Ongoing Support', label: 'Ongoing Support' },
    { value: 'Business Consulting', label: 'Business Consulting' },
    { value: 'System Optimization', label: 'System Optimization' },
    { value: 'CRM Implementation', label: 'CRM Implementation' }
  ];

  const dealSourceOptions = [
    'Website', 'Referral', 'Cold Outreach', 'LinkedIn', 'Facebook', 
    'Google Ads', 'Email Campaign', 'Trade Show', 'Networking', 
    'Skool Group', 'YouTube', 'Existing Client', 'Partner', 'Lead Conversion', 'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleLeadSelect = (leadId: string | null) => {
    setFormData(prev => ({
      ...prev,
      lead_id: leadId || ''
    }));
  };

  const handleCreateNewLead = () => {
    setShowLeadForm(true);
  };

  const handleLeadSaved = (savedLead: any) => {
    // Auto-select the newly created lead
    setFormData(prev => ({
      ...prev,
      lead_id: savedLead.id,
      deal_name: prev.deal_name || `${savedLead.company || `${savedLead.first_name} ${savedLead.last_name}`} - Consulting Project`
    }));
    setShowLeadForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const dealData = {
        ...formData,
        deal_value: Number(formData.deal_value),
        probability: Number(formData.probability),
        expected_close_date: formData.expected_close_date ? new Date(formData.expected_close_date).toISOString() : null,
        service_type: formData.service_type || null,
        deal_owner: formData.deal_owner || null,
        lead_id: formData.lead_id || null,
        updated_at: new Date().toISOString()
      };

      if (deal) {
        // Update existing deal
        const { data, error } = await supabase
          .from('deals')
          .update(dealData)
          .eq('id', deal.id)
          .select(`
            *,
            lead:leads(id, first_name, last_name, email, company, phone),
            owner:deal_owner(id, email, full_name, role)
          `)
          .single();

        if (error) throw error;
        onSave(data);
      } else {
        // Create new deal
        const { data, error } = await supabase
          .from('deals')
          .insert({
            ...dealData,
            created_by: user.id
          })
          .select(`
            *,
            lead:leads(id, first_name, last_name, email, company, phone),
            owner:deal_owner(id, email, full_name, role)
          `)
          .single();

        if (error) throw error;

        // If converting from lead, update lead status
        if (formData.lead_id) {
          await supabase
            .from('leads')
            .update({ 
              status: 'qualified',
              conversion_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', formData.lead_id);
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
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="glass-card w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold gradient-text section-gradient-sales">
              {deal ? 'Edit Deal' : leadId ? 'Convert Lead to Deal' : 'Create New Deal'}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Lead Connection */}
                <LeadSelector
                  selectedLeadId={formData.lead_id}
                  onLeadSelect={handleLeadSelect}
                  onCreateNewLead={handleCreateNewLead}
                  disabled={loading}
                />

                {/* Deal Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Deal Name *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="deal_name"
                      value={formData.deal_name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Enter deal name"
                      required
                    />
                  </div>
                </div>

                {/* Deal Value */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Deal Value *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="deal_value"
                      value={formData.deal_value}
                      onChange={handleChange}
                      min="0"
                      step="100"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                {/* Probability */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Close Probability (%)
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="probability"
                      value={formData.probability}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full transition-all duration-300"
                      style={{ width: `${formData.probability}%` }}
                    />
                  </div>
                </div>

                {/* Expected Close Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Expected Close Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="expected_close_date"
                      value={formData.expected_close_date}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Stage */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Stage
                  </label>
                  <select
                    name="stage"
                    value={formData.stage}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                  >
                    {stageOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deal Owner */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Deal Owner
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      name="deal_owner"
                      value={formData.deal_owner}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
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

                {/* Service Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Service Type
                  </label>
                  <select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                  >
                    <option value="">Select service type...</option>
                    {serviceTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deal Source */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Deal Source
                  </label>
                  <select
                    name="deal_source"
                    value={formData.deal_source}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                  >
                    <option value="">Select source...</option>
                    {dealSourceOptions.map(source => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Notes
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                  placeholder="Additional notes about this deal..."
                />
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
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-teal-400 to-cyan-600 hover:from-teal-500 hover:to-cyan-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>{deal ? 'Update Deal' : 'Create Deal'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lead Form Modal */}
      <LeadForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSave={handleLeadSaved}
      />
    </>
  );
};

export default DealForm;