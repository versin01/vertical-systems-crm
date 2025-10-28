import React, { useState } from 'react';
import { X, Save, User, Briefcase, Phone, Calendar, Users, MessageSquare, Video, Target } from 'lucide-react';
import { SetterReportFormData } from '../../types/setterReports';
import { useAuth } from '../../contexts/AuthContext';

interface SetterReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reportData: SetterReportFormData) => void;
  loading?: boolean;
}

const SetterReportForm: React.FC<SetterReportFormProps> = ({
  isOpen,
  onClose,
  onSave,
  loading = false
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<SetterReportFormData>({
    setter_name: user?.user_metadata?.full_name || '',
    setter_role: '',
    new_leads_received: 0,
    calls_expected: 0,
    calls_made: 0,
    cancelled_appointments: 0,
    calls_not_qualified: 0,
    linkedin_connections: 0,
    loom_explanations_sent: 0,
    sales_appointments_booked: 0,
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const resetForm = () => {
    setFormData({
      setter_name: user?.user_metadata?.full_name || '',
      setter_role: '',
      new_leads_received: 0,
      calls_expected: 0,
      calls_made: 0,
      cancelled_appointments: 0,
      calls_not_qualified: 0,
      linkedin_connections: 0,
      loom_explanations_sent: 0,
      sales_appointments_booked: 0,
      notes: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const roleOptions = [
    'Lead Generation Specialist',
    'Appointment Setter',
    'Sales Development Representative',
    'Business Development Representative',
    'Inside Sales Representative',
    'Outbound Sales Specialist',
    'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold gradient-text section-gradient-sales">
            Submit Setter Report
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Your Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="setter_name"
                  value={formData.setter_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Your Role *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="setter_role"
                  value={formData.setter_role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                  required
                >
                  <option value="">Select your role...</option>
                  {roleOptions.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lead and Call Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                New Leads Received
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="new_leads_received"
                  value={formData.new_leads_received}
                  onChange={handleChange}
                  min="0"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Number of Calls Expected
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="calls_expected"
                  value={formData.calls_expected}
                  onChange={handleChange}
                  min="0"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Number of Calls Made
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="calls_made"
                  value={formData.calls_made}
                  onChange={handleChange}
                  min="0"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Number of Cancelled Appointments
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="cancelled_appointments"
                  value={formData.cancelled_appointments}
                  onChange={handleChange}
                  min="0"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Call/Person NOT Qualified
              </label>
              <div className="relative">
                <X className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="calls_not_qualified"
                  value={formData.calls_not_qualified}
                  onChange={handleChange}
                  min="0"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                LinkedIn Connections
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="linkedin_connections"
                  value={formData.linkedin_connections}
                  onChange={handleChange}
                  min="0"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Number of Loom Value/Explanation Sent
              </label>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="loom_explanations_sent"
                  value={formData.loom_explanations_sent}
                  onChange={handleChange}
                  min="0"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Sales Appointments */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Number of Sales Appointments Booked
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="sales_appointments_booked"
                value={formData.sales_appointments_booked}
                onChange={handleChange}
                min="0"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                placeholder="0"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Notes (how was your day?)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
              placeholder="Share how your day went, any challenges, wins, or observations..."
            />
          </div>

          {/* Performance Summary */}
          <div className="p-4 bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border border-orange-500/30 rounded-lg">
            <h3 className="font-semibold text-orange-400 mb-3">Performance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Call Completion:</span>
                <p className="text-white font-semibold">
                  {formData.calls_expected > 0 
                    ? `${Math.round((formData.calls_made / formData.calls_expected) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-400">Qualification Rate:</span>
                <p className="text-white font-semibold">
                  {formData.calls_made > 0 
                    ? `${Math.round(((formData.calls_made - formData.calls_not_qualified) / formData.calls_made) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-400">Booking Rate:</span>
                <p className="text-white font-semibold">
                  {formData.calls_made > 0 
                    ? `${Math.round((formData.sales_appointments_booked / formData.calls_made) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-400">Total Activities:</span>
                <p className="text-white font-semibold">
                  {formData.calls_made + formData.linkedin_connections + formData.loom_explanations_sent}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-orange-400 to-yellow-600 hover:from-orange-500 hover:to-yellow-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Submit Setter Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetterReportForm;