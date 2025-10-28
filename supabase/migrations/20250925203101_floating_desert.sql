/*
  # Add proposal_link column to proposals table

  1. Schema Changes
    - Add `proposal_link` column to `proposals` table
      - `proposal_link` (text, nullable) - URL for sharing the proposal externally

  2. Index
    - Add index on `proposal_link` for efficient lookups

  3. Notes
    - Column is nullable to allow existing proposals without links
    - Can be populated with generated URLs or custom links
*/

-- Add proposal_link column to proposals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'proposal_link'
  ) THEN
    ALTER TABLE proposals ADD COLUMN proposal_link text;
  END IF;
END $$;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_proposals_proposal_link 
ON proposals USING btree (proposal_link);

-- Add comment for documentation
COMMENT ON COLUMN proposals.proposal_link IS 'Shareable URL for the proposal';