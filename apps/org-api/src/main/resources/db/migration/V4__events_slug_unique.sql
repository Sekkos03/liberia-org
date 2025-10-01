-- V4__events_slug_unique.sql

-- Attach a named UNIQUE constraint to the existing unique index on events(slug).
-- Falls back to creating the index if it wasn't there for some reason.
DO $$
BEGIN
  -- Try to add the constraint using the existing index
  ALTER TABLE public.events
    ADD CONSTRAINT uq_events_slug
    UNIQUE USING INDEX ux_events_slug;

EXCEPTION
  WHEN undefined_object THEN
    -- Index didn't exist; create it, then attach
    CREATE UNIQUE INDEX IF NOT EXISTS ux_events_slug ON public.events(slug);
    ALTER TABLE public.events
      ADD CONSTRAINT uq_events_slug
      UNIQUE USING INDEX ux_events_slug;

  WHEN duplicate_object THEN
    -- Constraint already exists; nothing to do
    NULL;
END $$;

-- Keep the start_at index creation — IF NOT EXISTS is fine on indexes
CREATE INDEX IF NOT EXISTS idx_events_start_at ON public.events(start_at);
