
-- Seed a couple of published events
INSERT INTO events
  (slug, title, summary, description, location, cover_image_url, rsvp_url, gallery_album_id, start_at, end_at, is_published)
VALUES
  ('founders-day',
   'Founders Day',
   'Annual celebration',
   'Join us for the annual celebration.',
   'Monrovia City Hall',
   NULL, NULL, NULL,
   TIMESTAMP '2025-12-10 18:00:00',
   TIMESTAMP '2025-12-10 21:00:00',
   TRUE),
  ('youth-mentorship',
   'Youth Mentorship Kickoff',
   'Kickoff session',
   'Orientation for mentors and mentees.',
   'Zoom',
   NULL, NULL, NULL,
   TIMESTAMP '2025-09-05 17:00:00',
   TIMESTAMP '2025-09-05 18:30:00',
   TRUE);

-- Seed a couple of suggestions
INSERT INTO suggestions (name, email, message) VALUES
  ('Sekou', 'sekou@example.com', 'Loving the site!'),
  ('Awa',   'awa@example.com',   'Please add a contact form.');

-- album fake data
INSERT INTO albums (slug, title, description, cover_photo_id, is_published, created_at, updated_at) VALUES
('album-1', 'Album #1', 'This is a fake album number 1.', NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('album-2', 'Album #2', 'This is a fake album number 2.', NULL, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('album-3', 'Album #3', 'This is a fake album number 3.', NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('album-4', 'Album #4', 'This is a fake album number 4.', NULL, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('album-5', 'Album #5', 'This is a fake album number 5.', NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
