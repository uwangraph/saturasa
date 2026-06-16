CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  is_public INTEGER DEFAULT 1,
  participant_count INTEGER DEFAULT 0,
  chat_mode TEXT DEFAULT 'free'
);

CREATE INDEX IF NOT EXISTS idx_rooms_public ON rooms(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_host ON rooms(host_id);
