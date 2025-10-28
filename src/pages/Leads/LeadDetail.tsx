import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Mail, Phone, Building, 
  Calendar, User, MapPin, Globe, Tag, FileText, DollarSign, UserCheck 
} from 'lucide-react';
import { Lead } from '../../types/leads';
import { supabase } from '../../lib/supabase';
import FollowUpTimeline from '../../components/Leads/FollowUpTimeline';
import FollowUpProgress from '../../components/Leads/FollowUpProgress';
import LeadChecklist from '../../components/Leads/LeadChecklist';
import LeadForm from '../../components/Leads/LeadForm';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [assignedUser, setAssignedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLead(id);
    }
  }, [id]);

  const fetchLead = async (leadId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) throw error;
      setLead(data);

      // Fetch assigned user if exists
      if (data.assigned_to) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, full_name')
          .eq('id', data.assigned_to)
          .single();
        
        setAssignedUser(userData);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lead) return;
    
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', lead.id);

        if (error) throw error;
        navigate('/leads/crm');
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  const handleSaveLead = (updatedLead: Lead) => {
    setLead(updatedLead);
  };

  const handleChecklistUpdate = (newChecklist: any, newDates: any) => {
    if (lead) {
      setLead({
        ...lead,
        lead_checklist: newChecklist,
        checklist_dates: newDates
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      new: 'bg-blue-900/30 text-blue-400',
      contacted: 'bg-yellow-900/30 text-yellow-400',
      qualified: 'bg-green-900/30 text-green-400',
      proposal_sent: 'bg-purple-900/30 text-purple-400',
      closed_won: 'bg-emerald-900/30 text-emerald-400',
      closed_lost: 'bg-red-900/30 text-red-400',
      nurturing: 'bg-orange-900/30 text-orange-400',
      unqualified: 'bg-gray-900/30 text-gray-400'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status as keyof typeof statusColors] || statusColors.new}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      low: 'bg-gray-900/30 text-gray-400',
      medium: 'bg-blue-900/30 text-blue-400',
      high: 'bg-orange-900/30 text-orange-400',
      urgent: 'bg-red-900/30 text-red-400'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/leads/crm')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Leads</span>
          </button>
        </div>
        <div className="glass-card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-300 mb-4">
            {error ? 'Error Loading Lead' : 'Lead Not Found'}
          </h2>
          <p className="text-gray-400">
            {error || 'The lead you are looking for does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/leads/crm')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Leads</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold gradient-text section-gradient-leads">
              {lead.first_name} {lead.last_name}
            </h1>
            <p className="text-gray-400 mt-1">{lead.email}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowEditForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Lead Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white">{lead.email}</p>
                </div>
              </div>
              
              {lead.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <p className="text-white">{lead.phone}</p>
                  </div>
                </div>
              )}
              
              {lead.company && (
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Company</p>
                    <p className="text-white">{lead.company}</p>
                  </div>
                </div>
              )}
              
              {lead.job_title && (
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Job Title</p>
                    <p className="text-white">{lead.job_title}</p>
                  </div>
                </div>
              )}
              
              {assignedUser && (
                <div className="flex items-center space-x-3">
                  <UserCheck className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Assigned To</p>
                    <p className="text-white">{assignedUser.full_name || assignedUser.email}</p>
                  </div>
                </div>
              )}
              
              {lead.website && (
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Website</p>
                    <a 
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      {lead.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-400" />
              Financial Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                <p className="text-sm text-gray-400">Revenue Generated</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${lead.revenue_generated?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-400">Cash Collected</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  ${lead.cash_collected?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className="text-center p-4 bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-gray-400">Outstanding</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">
                  ${((lead.revenue_generated || 0) - (lead.cash_collected || 0)).toFixed(2)}
                </p>
              </div>
            </div>
            
            {(lead.revenue_generated || 0) > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Collection Rate</span>
                  <span>{(((lead.cash_collected || 0) / (lead.revenue_generated || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="h-3 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${((lead.cash_collected || 0) / (lead.revenue_generated || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lead Details */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Lead Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <div className="mt-1">{getStatusBadge(lead.status)}</div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Priority</p>
                <div className="mt-1">{getPriorityBadge(lead.priority)}</div>
              </div>
              
              {lead.lead_source && (
                <div>
                  <p className="text-sm text-gray-400">Lead Source</p>
                  <p className="text-white mt-1">{lead.lead_source}</p>
                </div>
              )}
              
              {lead.lead_type && (
                <div>
                  <p className="text-sm text-gray-400">Lead Type</p>
                  <p className="text-white mt-1 capitalize">{lead.lead_type}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-400">Probability</p>
                <p className="text-white mt-1">{lead.probability}%</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Created</p>
                <p className="text-white mt-1">
                  {new Date(lead.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Lead Progression Checklist */}
          {lead.lead_checklist && (
            <div className="glass-card p-6">
              <LeadChecklist
                leadId={lead.id}
                checklist={lead.lead_checklist}
                checklistDates={lead.checklist_dates}
                onUpdate={handleChecklistUpdate}
                size="lg"
                showLabels={true}
              />
            </div>
          )}

          {/* Address */}
          {(lead.address || lead.city || lead.state || lead.country) && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Address
              </h2>
              <div className="text-gray-300">
                {lead.address && <p>{lead.address}</p>}
                <p>
                  {[lead.city, lead.state, lead.zip_code].filter(Boolean).join(', ')}
                </p>
                {lead.country && <p>{lead.country}</p>}
              </div>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Notes
              </h2>
              <div className="text-gray-300 whitespace-pre-wrap">
                {lead.notes}
              </div>
            </div>
          )}

          {/* Tags */}
          {lead.tags && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {lead.tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Follow-up Progress */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Follow-up Progress</h3>
            <FollowUpProgress 
              followUps={lead.follow_ups_completed} 
              showDetails={true}
              size="lg"
            />
          </div>

          {/* Follow-up Timeline */}
          <div className="glass-card p-6">
            <FollowUpTimeline 
              followUps={lead.follow_ups_completed}
              followUpDates={lead.follow_up_dates}
            />
          </div>

          {/* Important Dates */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Important Dates
            </h3>
            <div className="space-y-3">
              {lead.first_contact_date && (
                <div>
                  <p className="text-sm text-gray-400">First Contact</p>
                  <p className="text-white">
                    {new Date(lead.first_contact_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {lead.last_contact_date && (
                <div>
                  <p className="text-sm text-gray-400">Last Contact</p>
                  <p className="text-white">
                    {new Date(lead.last_contact_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {lead.next_follow_up_date && (
                <div>
                  <p className="text-sm text-gray-400">Next Follow-up</p>
                  <p className="text-white">
                    {new Date(lead.next_follow_up_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {lead.conversion_date && (
                <div>
                  <p className="text-sm text-gray-400">Conversion Date</p>
                  <p className="text-white">
                    {new Date(lead.conversion_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      <LeadForm
        lead={lead}
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSave={handleSaveLead}
      />
    </div>
  );
};

export default LeadDetail;