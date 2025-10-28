import React, { useState } from 'react';
import { X, Save, User, Briefcase, Phone, Calendar, DollarSign, Users, MessageSquare, Target, Award, TrendingUp } from 'lucide-react';
import { CloserReportFormData } from '../../types/closerReports';
import { useAuth } from '../../contexts/AuthContext';

interface CloserReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reportData: CloserReportFormData) => void;
  loading?: boolean;
}

const CloserReportForm: React.FC<CloserReportFormProps> = ({
  isOpen,
  onClose,
  onSave,
  loading = false
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CloserReportFormData>({
    closer_name: user?.user_metadata?.full_name || '',
    closer_role: '',
    total_calls_scheduled: 0,
    calls_completed: 0,
    follow_up_calls_scheduled: 0,
    revenue_generated: 0,
    cash_collected: 0,
    deposits: 0,
    sales_team_meetings: 0,
    leadership_meetings: 0,
    training_sessions: 0,
    follow_up_actions_required: '',
    challenges_faced: '',
    key_achievements: '',
    next_day_priorities: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (name.includes('revenue') || name.includes('cash') || name.includes('deposits') ? parseFloat(value) || 0 : parseInt(value) || 0) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const resetForm = () => {
    setFormData({
      closer_name: user?.user_metadata?.full_name || '',
      closer_role: '',
      total_calls_scheduled: 0,
      calls_completed: 0,
      follow_up_calls_scheduled: 0,
      revenue_generated: 0,
      cash_collected: 0,
      deposits: 0,
      sales_team_meetings: 0,
      leadership_meetings: 0,
      training_sessions: 0,
      follow_up_actions_required: '',
      challenges_faced: '',
      key_achievements: '',
      next_day_priorities: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const roleOptions = [
    'Sales Closer',
    'Senior Sales Closer',
    'Sales Manager',
    'Account Executive',
    'Business Development Manager',
    'Sales Director',
    'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold gradient-text section-gradient-sales">
            Submit Closer Report
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
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
                  name="closer_name"
                  value={formData.closer_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
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
                  name="closer_role"
                  value={formData.closer_role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
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

          {/* Call Statistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Phone className="h-5 w-5 mr-2 text-purple-400" />
              Call Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Total Calls Scheduled
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="total_calls_scheduled"
                    value={formData.total_calls_scheduled}
                    onChange={handleChange}
                    min="0"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Calls Completed
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="calls_completed"
                    value={formData.calls_completed}
                    onChange={handleChange}
                    min="0"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Follow-up Calls Scheduled
                </label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="follow_up_calls_scheduled"
                    value={formData.follow_up_calls_scheduled}
                    onChange={handleChange}
                    min="0"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sales Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-400" />
              Sales Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
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
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Deposits
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                  <input
                    type="number"
                    name="deposits"
                    value={formData.deposits}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Meeting Attendance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-400" />
              Meeting Attendance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Sales Team Meetings
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="sales_team_meetings"
                    value={formData.sales_team_meetings}
                    onChange={handleChange}
                    min="0"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Leadership Meetings
                </label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="leadership_meetings"
                    value={formData.leadership_meetings}
                    onChange={handleChange}
                    min="0"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Training Sessions
                </label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="training_sessions"
                    value={formData.training_sessions}
                    onChange={handleChange}
                    min="0"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-yellow-400" />
              Notes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Follow-up Actions Required
                </label>
                <textarea
                  name="follow_up_actions_required"
                  value={formData.follow_up_actions_required}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                  placeholder="List any follow-up actions needed..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Challenges Faced
                </label>
                <textarea
                  name="challenges_faced"
                  value={formData.challenges_faced}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                  placeholder="Describe any challenges you encountered..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Key Achievements
                </label>
                <textarea
                  name="key_achievements"
                  value={formData.key_achievements}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                  placeholder="Share your key wins and achievements..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Next Day Priorities
                </label>
                <textarea
                  name="next_day_priorities"
                  value={formData.next_day_priorities}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                  placeholder="What are your priorities for tomorrow?"
                />
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
            <h3 className="font-semibold text-purple-400 mb-3">Performance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Call Completion:</span>
                <p className="text-white font-semibold">
                  {formData.total_calls_scheduled > 0 
                    ? `${Math.round((formData.calls_completed / formData.total_calls_scheduled) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-400">Collection Rate:</span>
                <p className="text-white font-semibold">
                  {formData.revenue_generated > 0 
                    ? `${Math.round((formData.cash_collected / formData.revenue_generated) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-400">Outstanding:</span>
                <p className="text-white font-semibold">
                  ${(formData.revenue_generated - formData.cash_collected).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Total Meetings:</span>
                <p className="text-white font-semibold">
                  {formData.sales_team_meetings + formData.leadership_meetings + formData.training_sessions}
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
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-400 to-blue-600 hover:from-purple-500 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Submit Closer Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CloserReportForm;