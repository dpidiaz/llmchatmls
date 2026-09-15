CREATE TABLE IF NOT EXISTS wiki_autoopt_history_batches (
  id TEXT PRIMARY KEY, digest TEXT NOT NULL UNIQUE, cutoff TEXT NOT NULL,
  expected INTEGER NOT NULL, state TEXT NOT NULL CHECK(state IN ('staged','active','rolled_back')),
  created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS wiki_autoopt_history_items (
  source_id TEXT PRIMARY KEY, batch_id TEXT NOT NULL, version TEXT NOT NULL, prompt TEXT NOT NULL,
  family_key TEXT NOT NULL, profile_key TEXT NOT NULL, kind TEXT NOT NULL,
  source_at TEXT NOT NULL, fingerprint TEXT NOT NULL, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS wiki_autoopt_history_batch_items ON wiki_autoopt_history_items(batch_id);
CREATE TABLE IF NOT EXISTS wiki_autoopt_history_stats (
  batch_id TEXT NOT NULL, version TEXT NOT NULL, prompt TEXT NOT NULL,
  family_key TEXT NOT NULL, profile_key TEXT NOT NULL, publications INTEGER NOT NULL DEFAULT 0,
  incidents INTEGER NOT NULL DEFAULT 0, words_sum INTEGER NOT NULL DEFAULT 0,
  sections_sum INTEGER NOT NULL DEFAULT 0, references_sum INTEGER NOT NULL DEFAULT 0,
  activity_like INTEGER NOT NULL DEFAULT 0, length_errors INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(batch_id,version,prompt,family_key,profile_key));
CREATE INDEX IF NOT EXISTS wiki_autoopt_history_lookup ON wiki_autoopt_history_stats(version,prompt,family_key,profile_key);
CREATE TRIGGER IF NOT EXISTS wiki_autoopt_history_accumulate AFTER INSERT ON wiki_autoopt_history_items BEGIN
  INSERT OR IGNORE INTO wiki_autoopt_history_stats(batch_id,version,prompt,family_key,profile_key)
    VALUES(NEW.batch_id,NEW.version,NEW.prompt,NEW.family_key,NEW.profile_key);
  UPDATE wiki_autoopt_history_stats SET
    publications=publications+(NEW.kind='publication'), incidents=incidents+(NEW.kind='incident'),
    words_sum=words_sum+CASE WHEN NEW.kind='publication' THEN json_extract(NEW.data,'$.words') ELSE 0 END,
    sections_sum=sections_sum+CASE WHEN NEW.kind='publication' THEN json_extract(NEW.data,'$.sections') ELSE 0 END,
    references_sum=references_sum+CASE WHEN NEW.kind='publication' THEN json_extract(NEW.data,'$.references') ELSE 0 END,
    activity_like=activity_like+COALESCE(json_extract(NEW.data,'$.activityLike'),0),
    length_errors=length_errors+COALESCE(json_extract(NEW.data,'$.lengthError'),0)
  WHERE batch_id=NEW.batch_id AND version=NEW.version AND prompt=NEW.prompt
    AND family_key=NEW.family_key AND profile_key=NEW.profile_key;
END;
