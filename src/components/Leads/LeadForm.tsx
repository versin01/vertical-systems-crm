import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Building, Briefcase, DollarSign, UserCheck } from 'lucide-react';
import { Lead, LeadFormData, LeadStatus, LeadType, Priority } from '../../types/leads';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useWebhookTracking } from '../../hooks/useWebhookTracking';
import LeadChecklist from './LeadChecklist';

interface LeadFormProps {
  lead?: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ lead, isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const { trackLeadCreated, trackLeadUpdated, trackStatusChange } = useWebhookTracking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  // Initialize form data properly when lead changes
  const [formData, setFormData] = useState<LeadFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    status: 'new',
    lead_source: '',
    lead_type: '',
    priority: 'medium',
    revenue_generated: 0,
    cash_collected: 0,
    assigned_to: '',
    notes: ''
  });

  // Fetch users for assignment dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name')
          .order('full_name');

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Update form data when lead prop changes
  useEffect(() => {
    if (lead) {
      setFormData({
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        job_title: lead.job_title || '',
        status: lead.status || 'new',
        lead_source: lead.lead_source || '',
        lead_type: lead.lead_type || '',
        priority: lead.priority || 'medium',
        revenue_generated: lead.revenue_generated || 0,
        cash_collected: lead.cash_collected || 0,
        assigned_to: lead.assigned_to || '',
        notes: lead.notes || ''
      });
    } else {
      // Reset form for new lead
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        job_title: '',
        status: 'new',
        lead_source: '',
        lead_type: '',
        priority: 'medium',
        revenue_generated: 0,
        cash_collected: 0,
        assigned_to: '',
        notes: ''
      });
    }
    setError('');
  }, [lead, isOpen]);

  const statusOptions: { value: LeadStatus; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'closed_won', label: 'Closed Won' },
    { value: 'closed_lost', label: 'Closed Lost' },
    { value: 'nurturing', label: 'Nurturing' },
    { value: 'unqualified', label: 'Unqualified' }
  ];

  const leadTypeOptions: { value: LeadType; label: string }[] = [
    { value: 'inbound', label: 'Inbound' },
    { value: 'outbound', label: 'Outbound' },
    { value: 'referral', label: 'Referral' },
    { value: 'partner', label: 'Partner' }
  ];

  const priorityOptions: { value: Priority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  // Updated lead sources with Skool Group and YouTube
  const leadSourceOptions = [
    'Website', 'Referral', 'Cold Call', 'LinkedIn', 'Facebook', 
    'Google Ads', 'Email Campaign', 'Trade Show', 'Networking', 
    'Skool Group', 'YouTube', 'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleChecklistUpdate = (newChecklist: any, newDates: any) => {
    // This will be handled by the parent component after save
    // For now, we'll just update the lead state if it exists
    if (lead) {
      // Update the lead object with new checklist data
      const updatedLead = {
        ...lead,
        lead_checklist: newChecklist,
        checklist_dates: newDates
      };
      // This will trigger a re-render of the checklist component
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (formData.cash_collected > formData.revenue_generated) {
      setError('Cash collected cannot exceed revenue generated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const leadData = {
        ...formData,
        lead_type: formData.lead_type || null,
        assigned_to: formData.assigned_to || null,
        updated_at: new Date().toISOString()
      };

      if (lead) {
        // Track status change if it changed
        if (lead.status !== formData.status) {
          await trackStatusChange(lead.id, lead.status, formData.status);
        }

        // Prepare changes for webhook tracking
        const changes: Record<string, any> = {};
        Object.keys(formData).forEach(key => {
          const formKey = key as keyof LeadFormData;
          if (lead[formKey as keyof Lead] !== formData[formKey]) {
            changes[key] = {
              old: lead[formKey as keyof Lead],
              new: formData[formKey]
            };
          }
        });

        // Update existing lead
        const { data, error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', lead.id)
          .select()
          .single();

        if (error) throw error;

        // Track webhook for lead update
        if (Object.keys(changes).length > 0) {
          await trackLeadUpdated(lead.id, changes);
        }

        onSave(data);
      } else {
        // Create new lead with default checklist
        const { data, error } = await supabase
          .from('leads')
          .insert({
            ...leadData,
            created_by: user.id,
            follow_ups_completed: [false, false, false, false, false, false, false],
            follow_up_dates: [null, null, null, null, null, null, null],
            lead_checklist: {
              warm_lead: false,
              quality_conversation: false,
              lead_magnet_sent: false,
              asset_consumed: false,
              booking_requested: false,
              nurture_sequence: false
            },
            checklist_dates: {
              warm_lead: null,
              quality_conversation: null,
              lead_magnet_sent: null,
              asset_consumed: null,
              booking_requested: null,
              nurture_sequence: null
            }
          })
          .select()
          .single();

        if (error) throw error;

        // Track webhook for new lead creation
        await trackLeadCreated(data.id);

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
      <div className="glass-card w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold gradient-text section-gradient-leads">
            {lead ? 'Edit Lead' : 'Add New Lead'}
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
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="First name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Email address"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Company Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Company
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Company name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="job_title"
                      value={formData.job_title}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Job title"
                    />
                  </div>
                </div>
              </div>

              {/* Assignment and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Assign To
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      name="assigned_to"
                      value={formData.assigned_to}
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

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financial Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Revenue Generated
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="revenue_generated"
                      value={formData.revenue_generated}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Cash Collected
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-400" />
                    <input
                      type="number"
                      name="cash_collected"
                      value={formData.cash_collected}
                      onChange={handleChange}
                      min="0"
                      max={formData.revenue_generated}
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Cannot exceed revenue generated (${formData.revenue_generated.toFixed(2)})
                  </p>
                </div>
              </div>

              {/* Lead Management Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Lead Type
                  </label>
                  <select
                    name="lead_type"
                    value={formData.lead_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                  >
                    <option value="">Select type...</option>
                    {leadTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Lead Source
                </label>
                <select
                  name="lead_source"
                  value={formData.lead_source}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                >
                  <option value="">Select source...</option>
                  {leadSourceOptions.map(source => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                  placeholder="Additional notes about this lead..."
                />
              </div>
            </div>

            {/* Right Column - Checklist (only for editing existing leads) */}
            {lead && lead.lead_checklist && (
              <div className="space-y-6">
                <div className="glass-card p-4">
                  <LeadChecklist
                    leadId={lead.id}
                    checklist={lead.lead_checklist}
                    checklistDates={lead.checklist_dates}
                    onUpdate={handleChecklistUpdate}
                    size="md"
                    showLabels={true}
                  />
                </div>

                {/* Financial Summary */}
                <div className="glass-card p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-400" />
                    Financial Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Revenue Generated:</span>
                      <span className="text-white font-semibold">
                        ${formData.revenue_generated.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Cash Collected:</span>
                      <span className="text-green-400 font-semibold">
                        ${formData.cash_collected.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                      <span className="text-gray-400">Outstanding:</span>
                      <span className="text-yellow-400 font-semibold">
                        ${(formData.revenue_generated - formData.cash_collected).toFixed(2)}
                      </span>
                    </div>
                    {formData.revenue_generated > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                          <span>Collection Rate</span>
                          <span>{((formData.cash_collected / formData.revenue_generated) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: `${(formData.cash_collected / formData.revenue_generated) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                  <span>{lead ? 'Update Lead' : 'Create Lead'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadForm;