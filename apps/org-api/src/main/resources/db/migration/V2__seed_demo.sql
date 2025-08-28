insert into albums(name, description, cover_image_url)
values ('Launch Day', 'Photos from kickoff', null);

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
