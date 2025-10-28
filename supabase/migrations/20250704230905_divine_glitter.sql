/*
  # Create trigger for automatic proposal creation

  1. New Functions
    - `create_proposal_from_deal()` - Creates a proposal when a deal's stage changes to 'proposal_preparation'

  2. New Triggers
    - `deal_stage_change_trigger` - Monitors deal stage changes and calls the function

  3. Purpose
    - Automatically creates a proposal record when a deal enters the proposal preparation stage
    - Links the proposal to the deal
    - Sets default values based on the deal information
*/

-- Create function to handle proposal creation
CREATE OR REPLACE FUNCTION create_proposal_from_deal()
RETURNS TRIGGER AS $$
DECLARE
  deal_record RECORD;
  lead_record RECORD;
BEGIN
  -- Only proceed if the stage is changing to 'proposal_preparation'
  IF (TG_OP = 'UPDATE' AND NEW.stage = 'proposal_preparation' AND OLD.stage != 'proposal_preparation') OR
     (TG_OP = 'INSERT' AND NEW.stage = 'proposal_preparation') THEN
    
    -- Get the deal information
    SELECT * INTO deal_record FROM deals WHERE id = NEW.id;
    
    -- Get the lead information if available
    IF deal_record.lead_id IS NOT NULL THEN
      SELECT * INTO lead_record FROM leads WHERE id = deal_record.lead_id;
    END IF;
    
    -- Create a proposal title based on deal and lead info
    DECLARE
      proposal_title TEXT;
      proposal_content TEXT;
      client_name TEXT := '';
    BEGIN
      -- Set client name if lead exists
      IF lead_record.id IS NOT NULL THEN
        client_name := lead_record.first_name || ' ' || lead_record.last_name;
        IF lead_record.company IS NOT NULL AND lead_record.company != '' THEN
          client_name := client_name || ' (' || lead_record.company || ')';
        END IF;
      END IF;
      
      -- Create title
      IF client_name != '' THEN
        proposal_title := 'Proposal for ' || client_name;
      ELSE
        proposal_title := 'Proposal for ' || deal_record.deal_name;
      END IF;
      
      -- Create default proposal content
      proposal_content := '# ' || proposal_title || '

## Overview

Thank you for the opportunity to submit this proposal. We are excited to work with you on this project.

## Scope of Work

Please define the scope of work here.

## Investment

$' || deal_record.deal_value || '

## Next Steps

1. Review this proposal
2. Schedule a follow-up call
3. Sign agreement
4. Project kickoff';

      -- Insert the proposal
      INSERT INTO proposals (
        deal_id,
        title,
        proposal_text,
        deliverables,
        timelines,
        proposal_value,
        status,
        created_by,
        assigned_to
      ) VALUES (
        NEW.id,
        proposal_title,
        proposal_content,
        '[]'::jsonb,
        '[]'::jsonb,
        deal_record.deal_value,
        'draft',
        deal_record.created_by,
        deal_record.deal_owner
      );
      
      -- Log the creation
      RAISE NOTICE 'Created proposal for deal %', NEW.id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on deals table
DROP TRIGGER IF EXISTS deal_stage_change_trigger ON deals;
CREATE TRIGGER deal_stage_change_trigger
  AFTER INSERT OR UPDATE OF stage
  ON deals
  FOR EACH ROW
  EXECUTE FUNCTION create_proposal_from_deal();

-- Add a function to handle deal stage updates when proposal status changes
CREATE OR REPLACE FUNCTION update_deal_stage_from_proposal()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the status is changing
  IF (TG_OP = 'UPDATE' AND NEW.status != OLD.status) THEN
    -- Update the deal stage based on proposal status
    IF NEW.status = 'sent' THEN
      UPDATE deals SET 
        stage = 'proposal_sent',
        updated_at = now()
      WHERE id = NEW.deal_id;
    ELSIF NEW.status = 'accepted' THEN
      UPDATE deals SET 
        stage = 'negotiation',
        updated_at = now()
      WHERE id = NEW.deal_id;
    ELSIF NEW.status = 'rejected' THEN
      UPDATE deals SET 
        stage = 'lost',
        lost_date = now(),
        lost_reason = 'Proposal rejected',
        updated_at = now()
      WHERE id = NEW.deal_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on proposals table
DROP TRIGGER IF EXISTS proposal_status_change_trigger ON proposals;
CREATE TRIGGER proposal_status_change_trigger
  AFTER UPDATE OF status
  ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_stage_from_proposal();