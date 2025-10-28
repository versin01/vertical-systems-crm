import { useAuth } from '../contexts/AuthContext';
import webhookService from '../services/webhookService';

/**
 * Custom hook for webhook tracking with user context
 */
export const useWebhookTracking = () => {
  const { user } = useAuth();

  const trackStatusChange = async (leadId: string, oldStatus: string, newStatus: string) => {
    if (!user) return;
    await webhookService.trackStatusChange(leadId, oldStatus, newStatus, user.id);
  };

  const trackChecklistUpdate = async (
    leadId: string, 
    checklistItem: string, 
    oldValue: boolean, 
    newValue: boolean
  ) => {
    if (!user) return;
    await webhookService.trackChecklistUpdate(leadId, checklistItem, oldValue, newValue, user.id);
  };

  const trackFollowUpUpdate = async (
    leadId: string, 
    followUpIndex: number, 
    oldValue: boolean, 
    newValue: boolean
  ) => {
    if (!user) return;
    await webhookService.trackFollowUpUpdate(leadId, followUpIndex, oldValue, newValue, user.id);
  };

  const trackLeadCreated = async (leadId: string) => {
    if (!user) return;
    await webhookService.trackLeadCreated(leadId, user.id);
  };

  const trackLeadUpdated = async (leadId: string, changes: Record<string, any>) => {
    if (!user) return;
    await webhookService.trackLeadUpdated(leadId, changes, user.id);
  };

  const trackLeadDeleted = async (leadId: string) => {
    if (!user) return;
    await webhookService.trackLeadDeleted(leadId, user.id);
  };

  return {
    trackStatusChange,
    trackChecklistUpdate,
    trackFollowUpUpdate,
    trackLeadCreated,
    trackLeadUpdated,
    trackLeadDeleted
  };
};