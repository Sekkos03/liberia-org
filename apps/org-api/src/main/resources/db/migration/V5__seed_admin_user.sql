INSERT INTO users (username, password, role, enabled, created_at)
VALUES ('admin', '{noop}Admin123!', 'ADMIN', true, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO UPDATE
SET password = EXCLUDED.password,
    role     = EXCLUDED.role,
    enabled  = EXCLUDED.enabled;
