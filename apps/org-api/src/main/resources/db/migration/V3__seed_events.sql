insert into events (slug, title, summary, description, location, cover_image_url, rsvp_url,
                    start_at, end_at, is_published, gallery_album_id, created_at, updated_at)
values
('welcome-day', 'Welcome Day', 'Meet & greet',
 'Welcome to the org!', 'Monrovia HQ', null, null,
 timestamp '2025-09-01 10:00:00', timestamp '2025-09-01 12:00:00',
 true, null, now(), now());