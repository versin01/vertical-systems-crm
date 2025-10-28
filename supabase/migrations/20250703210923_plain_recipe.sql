/*
  # Update lead checklist to include nurture sequence

  1. Changes
    - Update existing lead_checklist default to include nurture_sequence
    - Update existing checklist_dates default to include nurture_sequence
    - Update existing leads with the new field

  2. Security
    - No changes to RLS policies needed
*/

-- Update the default values for new leads
ALTER TABLE leads 
ALTER COLUMN lead_checklist 
SET DEFAULT '{"warm_lead": false, "quality_conversation": false, "lead_magnet_sent": false, "asset_consumed": false, "booking_requested": false, "nurture_sequence": false}';

ALTER TABLE leads 
ALTER COLUMN checklist_dates 
SET DEFAULT '{"warm_lead": null, "quality_conversation": null, "lead_magnet_sent": null, "asset_consumed": null, "booking_requested": null, "nurture_sequence": null}';

-- Update existing leads to include the new nurture_sequence field
UPDATE leads 
SET 
  lead_checklist = lead_checklist || '{"nurture_sequence": false}',
  checklist_dates = checklist_dates || '{"nurture_sequence": null}'
WHERE lead_checklist IS NOT NULL 
  AND NOT (lead_checklist ? 'nurture_sequence');