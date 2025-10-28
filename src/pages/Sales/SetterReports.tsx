import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Users, Phone, Target, TrendingUp, 
  BarChart3, Clock, Award, Sparkles, RefreshCw, Download,
  ChevronLeft, ChevronRight, Eye, Edit, Trash2
} from 'lucide-react';
import { SetterReport, SetterReportFormData, DailySetterSummary } from '../../types/setterReports';
import { useSetterReports } from '../../hooks/useSetterReports';
import { useAuth } from '../../contexts/AuthContext';
import SetterReportForm from '../../components/SetterReports/SetterReportForm';
import RoleGuard from '../../components/RoleGuard';

const SetterReports: React.FC = () => {
  const { user } = useAuth();
  const { reports, loading, error, fetchReports, createReport, fetchDailySummary } = useSetterReports();
  const [showForm, setShowForm] = useState(false);
  const [dailySummary, setDailySummary] = useState<DailySetterSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    await fetchReports(selectedDate);
    const summary = await fetchDailySummary();
    setDailySummary(summary);
    setLastUpdated(new Date());
  };

  const handleSaveReport = async (reportData: SetterReportFormData) => {
    try {
      const result = await createReport({
        ...reportData,
        submitted_by: user?.id || '',
        report_date: new Date().toISOString().split('T')[0]
      });

      if (result.error) {
        console.error('Error creating report:', result.error);
        return;
      }

      setShowForm(false);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  // Calculate today's metrics
  const todayReports = reports.filter(report => {
    const reportDate = new Date(report.report_date);
    const today = new Date();
    return reportDate.toDateString() === today.toDateString();
  });

  const todayMetrics = todayReports.reduce((acc, report) => ({
    totalReports: acc.totalReports + 1,
    totalLeads: acc.totalLeads + report.new_leads_received,
    totalCalls: acc.totalCalls + report.calls_made,
    totalAppointments: acc.totalAppointments + report.sales_appointments_booked,
    totalLinkedInConnections: acc.totalLinkedInConnections + report.linkedin_connections,
    totalLoomsSent: acc.totalLoomsSent + report.loom_explanations_sent
  }), {
    totalReports: 0,
    totalLeads: 0,
    totalCalls: 0,
    totalAppointments: 0,
    totalLinkedInConnections: 0,
    totalLoomsSent: 0
  });

  // Pagination
  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReports = reports.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-400/30 border-t-orange-400"></div>
          <div className="absolute inset-0 rounded-full bg-orange-400/10 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard section="sales">
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-orange-400/20 to-yellow-600/20 rounded-xl">
                <BarChart3 className="h-8 w-8 text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text section-gradient-sales">
                  Setter Reports
                </h1>
                <p className="text-gray-400 mt-1">
                  Track daily performance and appointment setting activities.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Last Updated</p>
              <p className="text-sm font-semibold text-white">
                {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-400 to-yellow-600 hover:from-orange-500 hover:to-yellow-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/25"
            >
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Submit Report</span>
            </button>
          </div>
        </div>

        {/* Today's Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-orange-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Reports Today</p>
                <p className="text-3xl font-bold text-white mt-1">{todayMetrics.totalReports}</p>
                <p className="text-xs text-orange-400 mt-1 flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  Team submissions
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-400/20 to-yellow-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-orange-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">New Leads</p>
                <p className="text-3xl font-bold text-white mt-1">{todayMetrics.totalLeads}</p>
                <p className="text-xs text-blue-400 mt-1 flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Fresh prospects
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-green-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Calls Made</p>
                <p className="text-3xl font-bold text-white mt-1">{todayMetrics.totalCalls}</p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  Outreach activity
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Phone className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Appointments</p>
                <p className="text-3xl font-bold text-white mt-1">{todayMetrics.totalAppointments}</p>
                <p className="text-xs text-purple-400 mt-1 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Booked today
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">LinkedIn</p>
                <p className="text-3xl font-bold text-white mt-1">{todayMetrics.totalLinkedInConnections}</p>
                <p className="text-xs text-cyan-400 mt-1 flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  Connections
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Looms Sent</p>
                <p className="text-3xl font-bold text-white mt-1">{todayMetrics.totalLoomsSent}</p>
                <p className="text-xs text-yellow-400 mt-1 flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  Video explanations
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="glass-card p-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'today', label: 'Today' },
              { key: 'this_week', label: 'This Week' },
              { key: 'this_month', label: 'This Month' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedDate(period.key)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105
                  ${selectedDate === period.key
                    ? 'bg-gradient-to-r from-orange-400 to-yellow-600 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }
                `}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg animate-pulse">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Reports Table */}
        <div className="glass-card overflow-hidden hover:bg-gray-800/30 transition-all duration-300">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold gradient-text section-gradient-sales">
                Setter Reports - {selectedDate.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">
                  {reports.length} report{reports.length !== 1 ? 's' : ''}
                </span>
                <button className="flex items-center space-x-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/60 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Setter</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Leads</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Calls</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Appointments</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">LinkedIn</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Looms</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {paginatedReports.map((report) => (
                  <tr 
                    key={report.id} 
                    className="hover:bg-gray-800/40 transition-all duration-300 group hover:shadow-lg hover:shadow-gray-900/20"
                  >
                    <td className="px-6 py-5">
                      <div className="group-hover:scale-105 transition-transform duration-200">
                        <div className="font-semibold text-white group-hover:text-orange-100 transition-colors">
                          {report.setter_name}
                        </div>
                        <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                          {report.submitter?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-300 group-hover:text-white transition-colors">
                      {report.setter_role}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-blue-400 font-semibold">
                        {report.new_leads_received}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-white font-semibold">
                          {report.calls_made}/{report.calls_expected}
                        </div>
                        <div className="text-xs text-green-400">
                          {report.calls_expected > 0 
                            ? `${Math.round((report.calls_made / report.calls_expected) * 100)}%`
                            : '0%'
                          } completion
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-purple-400 font-semibold">
                        {report.sales_appointments_booked}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-cyan-400 font-semibold">
                        {report.linkedin_connections}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-yellow-400 font-semibold">
                        {report.loom_explanations_sent}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                        <div>{formatDate(report.report_date)}</div>
                        <div className="text-xs">{formatTime(report.created_at)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-gray-400 hover:text-orange-400 transition-all duration-200 hover:scale-110 p-2 rounded-lg hover:bg-gray-700/50"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-800/50 flex items-center justify-between bg-gray-800/20">
              <div className="text-sm text-gray-400">
                Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-white">{Math.min(startIndex + itemsPerPage, reports.length)}</span> of{' '}
                <span className="font-semibold text-white">{reports.length}</span> reports
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 hover:bg-gray-700/50 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-300 px-3 py-1 bg-gray-700/50 rounded-lg">
                  Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
                  <span className="font-semibold text-white">{totalPages}</span>
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 hover:bg-gray-700/50 rounded-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Setter Report Form Modal */}
        <SetterReportForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSave={handleSaveReport}
          loading={loading}
        />
      </div>
    </RoleGuard>
  );
};

export default SetterReports;