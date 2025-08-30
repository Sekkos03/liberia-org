-- H2-friendly upsert
merge into users (username, password, role, enabled, created_at)
key (username) values ('admin', '{noop}Admin123!', 'ADMIN', true, current_timestamp());