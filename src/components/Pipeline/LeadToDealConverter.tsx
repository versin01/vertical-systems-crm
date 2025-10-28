import React, { useState } from 'react';
import { ArrowRight, Zap, DollarSign, Target, Calendar, User } from 'lucide-react';
import { Lead } from '../../types/leads';
import { ServiceType } from '../../types/deals';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';

interface LeadToDealConverterProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onConvert: (dealData: any) => void;
}

const LeadToDealConverter: React.FC<LeadToDealConverterProps> = ({
  lead,
  isOpen,
  onClose,
  onConvert
}) => {
  const { user } = useAuth();
  const { users } = useUsers();
  const [loading, setLoading] = useState(false);
  
  const [conversionData, setConversionData] = useState({
    deal_name: `${lead.company || `${lead.first_name} ${lead.last_name}`} - Consulting Project`,
    deal_value: 15000,
    probability: 60,
    service_type: '' as ServiceType | '',
    deal_owner: user?.id || '',
    expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    notes: `Converted from lead: ${lead.first_name} ${lead.last_name}\nOriginal lead source: ${lead.lead_source || 'Unknown'}\nLead status: ${lead.status}`
  });

  const serviceTypeOptions: { value: ServiceType; label: string; description: string; suggestedValue: number }[] = [
    { 
      value: 'Growth Creator', 
      label: 'Growth Creator Program', 
      description: 'Business growth consulting and strategy',
      suggestedValue: 25000
    },
    { 
      value: 'AIGC Systems', 
      label: 'AIGC Systems Implementation', 
      description: 'AI/automation system setup and optimization',
      suggestedValue: 35000
    },
    { 
      value: 'Custom Projects', 
      label: 'Custom Development Project', 
      description: 'Bespoke system development and integration',
      suggestedValue: 50000
    },
    { 
      value: 'CRM Implementation', 
      label: 'CRM Implementation', 
      description: 'Complete CRM setup and customization',
      suggestedValue: 15000
    },
    { 
      value: 'Business Consulting', 
      label: 'Business Consulting', 
      description: 'Strategic business consulting services',
      suggestedValue: 20000
    },
    { 
      value: 'System Optimization', 
      label: 'System Optimization', 
      description: 'Existing system improvement and optimization',
      suggestedValue: 12000
    },
    { 
      value: 'Ongoing Support', 
      label: 'Ongoing Support Package', 
      description: 'Monthly retainer for ongoing support',
      suggestedValue: 5000
    }
  ];

  const handleServiceTypeChange = (serviceType: ServiceType) => {
    const selectedService = serviceTypeOptions.find(s => s.value === serviceType);
    setConversionData(prev => ({
      ...prev,
      service_type: serviceType,
      deal_value: selectedService?.suggestedValue || prev.deal_value,
      deal_name: `${lead.company || `${lead.first_name} ${lead.last_name}`} - ${selectedService?.label || 'Consulting Project'}`
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setConversionData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleConvert = async () => {
    setLoading(true);
    try {
      await onConvert({
        ...conversionData,
        deal_value: Number(conversionData.deal_value),
        probability: Number(conversionData.probability),
        expected_close_date: conversionData.expected_close_date ? new Date(conversionData.expected_close_date).toISOString() : null,
        service_type: conversionData.service_type || null,
        deal_owner: conversionData.deal_owner || null,
        deal_source: lead.lead_source || 'Lead Conversion',
        stage: 'new_opportunity'
      });
      onClose();
    } catch (error) {
      console.error('Error converting lead:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-900/30 rounded-lg">
                <User className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Lead</h3>
                <p className="text-sm text-gray-400">
                  {lead.first_name} {lead.last_name}
                </p>
              </div>
            </div>
            
            <ArrowRight className="h-6 w-6 text-gray-400" />
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-400/20 to-green-600/20 rounded-lg">
                <Zap className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold gradient-text section-gradient-sales">Deal</h3>
                <p className="text-sm text-gray-400">Sales Opportunity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Summary */}
        <div className="p-6 bg-gray-800/30 border-b border-gray-700">
          <h4 className="font-semibold text-white mb-3">Lead Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Contact:</span>
              <p className="text-white">{lead.first_name} {lead.last_name}</p>
              <p className="text-gray-300">{lead.email}</p>
            </div>
            <div>
              <span className="text-gray-400">Company:</span>
              <p className="text-white">{lead.company || 'Not specified'}</p>
              <p className="text-gray-300">{lead.job_title || ''}</p>
            </div>
            <div>
              <span className="text-gray-400">Source:</span>
              <p className="text-white">{lead.lead_source || 'Unknown'}</p>
              <p className="text-gray-300">Status: {lead.status}</p>
            </div>
          </div>
        </div>

        {/* Conversion Form */}
        <div className="p-6 space-y-6">
          <h4 className="font-semibold text-white">Deal Configuration</h4>

          {/* Service Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Service Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {serviceTypeOptions.map((service) => (
                <button
                  key={service.value}
                  type="button"
                  onClick={() => handleServiceTypeChange(service.value)}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-left
                    ${conversionData.service_type === service.value
                      ? 'border-teal-500 bg-teal-900/20 text-white'
                      : 'border-gray-700 bg-gray-800/30 text-gray-300 hover:border-gray-600 hover:bg-gray-700/30'
                    }
                  `}
                >
                  <div className="font-semibold text-sm">{service.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{service.description}</div>
                  <div className="text-xs text-green-400 mt-2 font-medium">
                    Suggested: ${service.suggestedValue.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deal Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Deal Name *
              </label>
              <input
                type="text"
                name="deal_name"
                value={conversionData.deal_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                required
              />
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
                  value={conversionData.deal_value}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
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
                  value={conversionData.probability}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full transition-all duration-300"
                  style={{ width: `${conversionData.probability}%` }}
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
                  value={conversionData.expected_close_date}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                />
              </div>
            </div>

            {/* Deal Owner */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-300">
                Deal Owner
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="deal_owner"
                  value={conversionData.deal_owner}
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
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Notes
            </label>
            <textarea
              name="notes"
              value={conversionData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
              placeholder="Additional notes about this deal conversion..."
            />
          </div>

          {/* Conversion Summary */}
          <div className="p-4 bg-gradient-to-r from-teal-900/20 to-cyan-900/20 border border-teal-500/30 rounded-lg">
            <h5 className="font-semibold text-teal-400 mb-2">Conversion Summary</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Deal Value:</span>
                <p className="text-white font-semibold">${conversionData.deal_value.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-400">Weighted Value:</span>
                <p className="text-green-400 font-semibold">
                  ${Math.round(conversionData.deal_value * conversionData.probability / 100).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Service:</span>
                <p className="text-white">{conversionData.service_type || 'Not selected'}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConvert}
              disabled={loading || !conversionData.service_type}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-emerald-400 to-green-600 hover:from-emerald-500 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>Convert to Deal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadToDealConverter;