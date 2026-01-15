-- Add fields for application flow to members table

-- 1) Add Vipps fields (nullable for existing accepted members)
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS vipps_reference VARCHAR(128),
  ADD COLUMN IF NOT EXISTS vipps_amount_nok INTEGER;

-- 2) Ensure status exists, then normalize it
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS status VARCHAR(16);

ALTER TABLE members
  ALTER COLUMN status TYPE VARCHAR(16),
  ALTER COLUMN status SET DEFAULT 'PENDING';

-- Optional: backfill nulls
UPDATE members
SET status = 'PENDING'
WHERE status IS NULL OR TRIM(status) = '';

-- 3) Ensure handled_at and delete_at exist (nullable, set when admin handles)
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS handled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delete_at  TIMESTAMPTZ;

-- Ensure they're nullable (safe even if already nullable)
ALTER TABLE members
  ALTER COLUMN handled_at DROP NOT NULL,
  ALTER COLUMN delete_at DROP NOT NULL;

-- Remove defaults if any exist (Postgres supports DROP DEFAULT even if none)
ALTER TABLE members
  ALTER COLUMN handled_at DROP DEFAULT,
  ALTER COLUMN delete_at DROP DEFAULT;

-- 4) Convert timestamps to timestamptz (only if columns exist + are not already timestamptz)
DO $$
BEGIN
  -- created_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='members' AND column_name='created_at'
  ) THEN
    ALTER TABLE members
      ALTER COLUMN created_at TYPE TIMESTAMPTZ
      USING created_at AT TIME ZONE 'UTC';
  END IF;

  -- updated_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='members' AND column_name='updated_at'
  ) THEN
    ALTER TABLE members
      ALTER COLUMN updated_at TYPE TIMESTAMPTZ
      USING updated_at AT TIME ZONE 'UTC';
  END IF;

  -- handled_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='members' AND column_name='handled_at'
  ) THEN
    ALTER TABLE members
      ALTER COLUMN handled_at TYPE TIMESTAMPTZ
      USING handled_at AT TIME ZONE 'UTC';
  END IF;

  -- delete_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='members' AND column_name='delete_at'
  ) THEN
    ALTER TABLE members
      ALTER COLUMN delete_at TYPE TIMESTAMPTZ
      USING delete_at AT TIME ZONE 'UTC';
  END IF;
END $$;

-- 5) Add status constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_members_status'
  ) THEN
    ALTER TABLE members
      ADD CONSTRAINT chk_members_status
      CHECK (status IN ('PENDING','ACCEPTED','REJECTED'));
  END IF;
END $$;

-- 6) Useful indexes for admin lists
CREATE INDEX IF NOT EXISTS idx_members_status_created
  ON members (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_members_delete_at
  ON members (delete_at);

CREATE INDEX IF NOT EXISTS idx_members_vipps_reference
  ON members (vipps_reference);
