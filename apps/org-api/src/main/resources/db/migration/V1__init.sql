-- Albums
create table if not exists albums (
  id              bigserial primary key,
  slug            varchar(120) not null unique,
  title           varchar(200) not null,
  description     CLOB,
  cover_photo_id  bigint,
  is_published    boolean not null default false,
  created_at      timestamp not null default now(),
  updated_at      timestamp not null default now()
);



create table if not exists photos (
  id            bigserial primary key,
  album_id      bigint not null references albums(id) on delete cascade,
  original_name varchar(255) not null,
  file_name     varchar(255) not null,
  content_type  varchar(100),
  size_bytes    bigint not null,
  url           varchar(512) not null,
  caption       varchar(500),
  sort_order    int not null default 0,
  is_published  boolean not null default true,
  created_at    timestamp not null default now(),
  updated_at    timestamp not null default now()
);

-- set optional cover FK after photos exists
alter table albums
  add constraint if not exists fk_albums_cover
  foreign key (cover_photo_id) references photos(id);

create index if not exists idx_photos_album on photos(album_id);
create index if not exists idx_photos_published on photos(is_published);

-- Sikre korrekt skjema for events (H2/Postgres kompatibelt)
create table if not exists events (
  id               bigserial primary key,
  slug             varchar(120) not null unique,
  title            varchar(200) not null,
  summary          varchar(500),
  description      text,
  location         varchar(200),
  cover_image_url  varchar(512),
  rsvp_url         varchar(512),
  is_published     boolean not null default false,
  start_at         timestamp,
  end_at           timestamp,
  gallery_album_id bigint,
  created_at       timestamp not null default now(),
  updated_at       timestamp not null default now()
);

-- Hvis kolonner finnes med feil type fra tidligere, forsøk å rette:
-- (H2 støtter ikke enkelt ALTER TYPE for CLOB i alle moduser; derfor forsøk "add/transfer" kun hvis nødvendig i Postgres.
-- Holdt enkelt her siden du kjører H2 i dev.)
-- Sørg for FK mot albums(id)
alter table events
  add constraint if not exists fk_events_album
  foreign key (gallery_album_id) references albums(id) on delete set null;

-- Indekser
create index if not exists idx_events_published on events(is_published);
create index if not exists idx_events_start_at on events(start_at);
-- Slug unique ble håndtert i V4, men safe:
create unique index if not exists ux_events_slug on events(slug);


-- 2) (Optional but recommended) Add a foreign key constraint
ALTER TABLE events
  ADD CONSTRAINT fk_events_gallery_album
  FOREIGN KEY (gallery_album_id) REFERENCES albums(id);

create index if not exists idx_events_start_at on events(start_at);
create index if not exists idx_events_published on events(is_published);

-- Adverts
create table if not exists adverts (
  id             bigserial primary key,
  slug           varchar(120) not null unique,
  title          varchar(200) not null,
  description    CLOB,
  target_url     varchar(512),
  placement      varchar(40) not null, -- HOME_TOP | SIDEBAR | FOOTER | INLINE
  original_name  varchar(255),
  file_name      varchar(255),
  content_type   varchar(100),
  size_bytes     bigint,
  image_url      varchar(512),
  active         boolean not null default false,
  start_at       timestamp,
  end_at         timestamp,
  created_at     timestamp not null default now(),
  updated_at     timestamp not null default now()
);

create index if not exists idx_adverts_active on adverts(active);
create index if not exists idx_adverts_placement on adverts(placement);

-- Suggestions (Postbox)
create table if not exists suggestions (
  id             bigserial primary key,
  name           varchar(200),
  email          varchar(320),
  message        CLOB,
  status         varchar(20) not null default 'NEW', -- NEW | REVIEWED | ARCHIVED
  internal_notes CLOB,
  created_at     TIMESTAMP not null default now()
);

create index if not exists idx_suggestions_status on suggestions(status);

-- People (Executives)
create table if not exists people (
  id           bigserial primary key,
  name         varchar(200) not null,
  role_title   varchar(200) not null,
  photo_url    text,
  bio          text,
  email        varchar(320),
  order_index  int not null default 0
);

create index if not exists idx_people_order on people(order_index);

-- Pages (editable static sections)
create table if not exists pages (
  id           bigserial primary key,
  slug         varchar(120) not null unique,
  title        varchar(200) not null,
  body         CLOB not null,
  published    boolean not null default false,
  published_at timestamp,
  created_at   timestamp not null default now(),
  updated_at   timestamp not null default now()
);


-- === Membership form submissions ===
create table if not exists membership_applications (
  id              bigserial primary key,
  full_name       varchar(200) not null,
  email           varchar(320) not null,
  phone           varchar(50),
  address         varchar(400),
  occupation      varchar(200),
  message         CLOB,
  created_at      timestamp not null default now()
);
create index if not exists idx_membership_created on membership_applications(created_at);

-- === Admin Users (stub) ===
create table if not exists users (
  id          bigserial primary key,
  username    varchar(100) not null unique,
  password    varchar(200) not null,
  role        varchar(50) not null default 'ADMIN', -- simple single-role model for now
  enabled     boolean not null default true,
  created_at  timestamp not null default now()
);