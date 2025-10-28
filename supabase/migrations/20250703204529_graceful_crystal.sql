/*
  # Add Lead Progression Checklist

  1. New Fields
    - `lead_checklist` (jsonb) - Tracks lead progression milestones
      - warm_lead: boolean
      - quality_conversation: boolean  
      - lead_magnet_sent: boolean
      - asset_consumed: boolean
      - booking_requested: boolean
    - `checklist_dates` (jsonb) - Timestamps for when each milestone was completed

  2. Updates
    - Add new lead sources: Skool Group, YouTube
    - Update existing leads with default checklist values
*/

-- Add new columns for lead progression checklist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'lead_checklist'
  ) THEN
    ALTER TABLE leads ADD COLUMN lead_checklist JSONB DEFAULT '{"warm_lead": false, "quality_conversation": false, "lead_magnet_sent": false, "asset_consumed": false, "booking_requested": false}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'checklist_dates'
  ) THEN
    ALTER TABLE leads ADD COLUMN checklist_dates JSONB DEFAULT '{"warm_lead": null, "quality_conversation": null, "lead_magnet_sent": null, "asset_consumed": null, "booking_requested": null}';
  END IF;
END $$;

-- Update existing leads with default checklist values
UPDATE leads 
SET 
  lead_checklist = '{"warm_lead": false, "quality_conversation": false, "lead_magnet_sent": false, "asset_consumed": false, "booking_requested": false}',
  checklist_dates = '{"warm_lead": null, "quality_conversation": null, "lead_magnet_sent": null, "asset_consumed": null, "booking_requested": null}'
WHERE lead_checklist IS NULL OR checklist_dates IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_checklist ON leads USING gin (lead_checklist);
CREATE INDEX IF NOT EXISTS idx_leads_checklist_dates ON leads USING gin (checklist_dates);