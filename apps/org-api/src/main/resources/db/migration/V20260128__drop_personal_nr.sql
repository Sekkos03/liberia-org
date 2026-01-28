-- Remove personal_nr column from members table
-- This field is no longer needed as users don't feel safe sharing it

ALTER TABLE members
  DROP COLUMN IF EXISTS personal_nr;

-- Also drop any indexes that might reference this column
DROP INDEX IF EXISTS idx_members_personal_nr;
