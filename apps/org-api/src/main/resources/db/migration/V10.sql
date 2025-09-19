-- Legg til kolonner som entiteten forventer
ALTER TABLE album_items
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(2048);

ALTER TABLE album_items
  ADD COLUMN IF NOT EXISTS video_url VARCHAR(2048);


ALTER TABLE albums
  ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT FALSE;
