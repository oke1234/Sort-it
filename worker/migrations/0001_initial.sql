CREATE TABLE IF NOT EXISTS user_state (
  uid TEXT PRIMARY KEY,
  entitlement_json TEXT,
  entitlement_event_at INTEGER NOT NULL DEFAULT 0,
  consent_json TEXT,
  preferences_json TEXT,
  profile_json TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS suggestion_sets (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS suggestion_sets_uid_created
  ON suggestion_sets(uid, created_at);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  suggestion_set_id TEXT NOT NULL,
  suggestion_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS feedback_uid_created
  ON feedback(uid, created_at);

CREATE TABLE IF NOT EXISTS daily_usage (
  uid TEXT NOT NULL,
  date_key TEXT NOT NULL,
  count INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (uid, date_key)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at INTEGER NOT NULL
);
