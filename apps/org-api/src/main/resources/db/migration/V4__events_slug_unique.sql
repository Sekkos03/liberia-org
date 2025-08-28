alter table events add constraint if not exists uq_events_slug unique (slug);
create index if not exists idx_events_start_at on events(start_at);
