CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  host_id TEXT,
  created_at INTEGER,
  is_public INTEGER DEFAULT 1,
  participant_count INTEGER DEFAULT 0,
  chat_mode TEXT DEFAULT 'free'
);
