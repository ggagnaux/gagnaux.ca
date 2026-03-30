CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  alt_text TEXT,
  media_role TEXT NOT NULL DEFAULT 'library',
  post_id INTEGER,
  project_id INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  body_html TEXT NOT NULL,
  cover_image_id INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  is_featured INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (cover_image_id) REFERENCES media(id)
);

CREATE TABLE IF NOT EXISTS post_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_draft_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_session_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  description_markdown TEXT NOT NULL,
  description_html TEXT NOT NULL,
  thumbnail_image_id INTEGER,
  cover_image_id INTEGER,
  project_type TEXT NOT NULL,
  external_url TEXT,
  internal_url TEXT,
  is_featured INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (thumbnail_image_id) REFERENCES media(id),
  FOREIGN KEY (cover_image_id) REFERENCES media(id)
);

CREATE TABLE IF NOT EXISTS project_draft_screenshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_session_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS distribution_destinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  destination_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  destination_type TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 0,
  posting_mode TEXT NOT NULL DEFAULT 'manual',
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS post_distributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  destination_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  payload_json TEXT NOT NULL DEFAULT '{}',
  share_text TEXT NOT NULL DEFAULT '',
  external_post_id TEXT,
  external_url TEXT,
  last_attempted_at TEXT,
  published_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES distribution_destinations(id) ON DELETE CASCADE,
  UNIQUE (post_id, destination_id)
);

CREATE TABLE IF NOT EXISTS distribution_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_distribution_id INTEGER NOT NULL,
  destination_key TEXT NOT NULL,
  attempt_type TEXT NOT NULL,
  status TEXT NOT NULL,
  request_payload TEXT,
  response_payload TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (post_distribution_id) REFERENCES post_distributions(id) ON DELETE CASCADE
);


