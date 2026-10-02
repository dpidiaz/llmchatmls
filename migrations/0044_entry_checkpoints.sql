-- R44 durable entry protocol v1. Run after the legacy R44 schema/pool is ready.
-- A boundary comment separates one D1 prepared statement, including triggers.
CREATE TABLE IF NOT EXISTS r44_ticket_progress (
 ticket_id TEXT PRIMARY KEY REFERENCES r44_tickets(ticket_id),
 state TEXT NOT NULL CHECK(state IN ('CLAIMABLE','LEASED','PARTIAL_DURABLE','COMPLETE','QUARANTINED')),
 migration_note TEXT
);
-- statement boundary
CREATE TABLE IF NOT EXISTS r44_entries (
 ticket_id TEXT NOT NULL REFERENCES r44_ticket_progress(ticket_id),
 code TEXT NOT NULL UNIQUE, ordinal INTEGER NOT NULL, source_json TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','IN_PROGRESS','AUDITED_DURABLE','FAILED_RETRYABLE','QUARANTINED')),
 PRIMARY KEY(ticket_id,code), UNIQUE(ticket_id,ordinal)
);
-- statement boundary
CREATE TABLE IF NOT EXISTS r44_leases (
 ticket_id TEXT PRIMARY KEY REFERENCES r44_ticket_progress(ticket_id),
 worker_id TEXT, lease_token TEXT UNIQUE, generation INTEGER NOT NULL DEFAULT 0 CHECK(generation>=0),
 expires_ms INTEGER NOT NULL DEFAULT 0, renewed_ms INTEGER NOT NULL DEFAULT 0
);
-- statement boundary
CREATE INDEX IF NOT EXISTS r44_leases_worker ON r44_leases(worker_id,expires_ms);
-- statement boundary
CREATE TRIGGER IF NOT EXISTS r44_lease_legacy_projection AFTER UPDATE OF expires_ms ON r44_leases BEGIN
 UPDATE r44_tickets SET lease_expires_at=NEW.expires_ms WHERE ticket_id=NEW.ticket_id;
END;
-- statement boundary
CREATE TABLE IF NOT EXISTS r44_claims (
 worker_id TEXT NOT NULL, idempotency_key TEXT NOT NULL,
 ticket_id TEXT NOT NULL REFERENCES r44_leases(ticket_id),
 lease_token TEXT NOT NULL, generation INTEGER NOT NULL DEFAULT 0,
 created_ms INTEGER NOT NULL, expires_ms INTEGER NOT NULL,
 PRIMARY KEY(worker_id,idempotency_key)
);
-- statement boundary
CREATE TABLE IF NOT EXISTS r44_receipts (
 receipt_id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL, code TEXT NOT NULL,
 idempotency_key TEXT NOT NULL, worker_id TEXT NOT NULL, lease_token TEXT NOT NULL,
 generation INTEGER NOT NULL, outcome TEXT NOT NULL CHECK(outcome IN ('PASS_NO_CHANGE','CORRECTED')),
 payload_json TEXT NOT NULL CHECK(json_valid(payload_json)), payload_sha256 TEXT NOT NULL,
 source_sha256 TEXT NOT NULL, receipt_json TEXT NOT NULL CHECK(json_valid(receipt_json)),
 receipt_sha256 TEXT NOT NULL, committed_ms INTEGER NOT NULL,
 UNIQUE(ticket_id,code), UNIQUE(ticket_id,idempotency_key),
 FOREIGN KEY(ticket_id,code) REFERENCES r44_entries(ticket_id,code)
);
-- statement boundary
CREATE TRIGGER IF NOT EXISTS r44_claim_acquire AFTER INSERT ON r44_claims BEGIN
 UPDATE r44_leases SET
 generation=CASE WHEN worker_id=NEW.worker_id AND expires_ms>MAX(NEW.created_ms,CAST(unixepoch('subsec')*1000 AS INTEGER)) THEN generation ELSE generation+1 END,
 lease_token=CASE WHEN worker_id=NEW.worker_id AND expires_ms>MAX(NEW.created_ms,CAST(unixepoch('subsec')*1000 AS INTEGER)) THEN lease_token ELSE NEW.lease_token END,
 worker_id=NEW.worker_id,expires_ms=NEW.expires_ms,renewed_ms=NEW.created_ms
 WHERE ticket_id=NEW.ticket_id AND (expires_ms<=NEW.created_ms OR worker_id=NEW.worker_id);
 SELECT CASE WHEN changes()!=1 THEN RAISE(ABORT,'LEASE_CONFLICT') END;
 UPDATE r44_claims SET generation=(SELECT generation FROM r44_leases WHERE ticket_id=NEW.ticket_id),
 lease_token=(SELECT lease_token FROM r44_leases WHERE ticket_id=NEW.ticket_id)
 WHERE worker_id=NEW.worker_id AND idempotency_key=NEW.idempotency_key;
 UPDATE r44_ticket_progress SET state=CASE WHEN state='PARTIAL_DURABLE' THEN state ELSE 'LEASED' END WHERE ticket_id=NEW.ticket_id;
 UPDATE r44_tickets SET state='leased',worker_id=NEW.worker_id,
 lease_token=(SELECT lease_token FROM r44_leases WHERE ticket_id=NEW.ticket_id),
 lease_expires_at=NEW.expires_ms,attempts=attempts+1 WHERE ticket_id=NEW.ticket_id;
END;
-- statement boundary
CREATE TRIGGER IF NOT EXISTS r44_receipt_fence BEFORE INSERT ON r44_receipts BEGIN
 SELECT CASE WHEN NOT EXISTS(
 SELECT 1 FROM r44_leases l JOIN r44_ticket_progress t USING(ticket_id)
 JOIN r44_entries e ON e.ticket_id=l.ticket_id AND e.code=NEW.code
 WHERE l.ticket_id=NEW.ticket_id AND l.worker_id=NEW.worker_id AND l.lease_token=NEW.lease_token
 AND l.generation=NEW.generation AND l.expires_ms>MAX(NEW.committed_ms,CAST(unixepoch('subsec')*1000 AS INTEGER))
 AND t.state IN ('LEASED','PARTIAL_DURABLE') AND e.state IN ('PENDING','IN_PROGRESS','FAILED_RETRYABLE')
 AND json_extract(e.source_json,'$.sha256')=NEW.source_sha256
 ) THEN RAISE(ABORT,'LEASE_INVALID_OR_EXPIRED') END;
END;
-- statement boundary
CREATE TRIGGER IF NOT EXISTS r44_receipt_immutable BEFORE UPDATE ON r44_receipts BEGIN
 SELECT RAISE(ABORT,'RECEIPT_IMMUTABLE');
END;
-- statement boundary
CREATE TRIGGER IF NOT EXISTS r44_receipt_keep BEFORE DELETE ON r44_receipts BEGIN
 SELECT RAISE(ABORT,'RECEIPT_IMMUTABLE');
END;
-- statement boundary
CREATE TRIGGER IF NOT EXISTS r44_entry_quarantine AFTER UPDATE OF state ON r44_entries
WHEN NEW.state='QUARANTINED' BEGIN
 UPDATE r44_ticket_progress SET state='QUARANTINED' WHERE ticket_id=NEW.ticket_id;
 UPDATE r44_tickets SET state='quarantined' WHERE ticket_id=NEW.ticket_id;
END;
-- statement boundary
CREATE TRIGGER IF NOT EXISTS r44_receipt_commit AFTER INSERT ON r44_receipts BEGIN
 UPDATE r44_entries SET state='AUDITED_DURABLE' WHERE ticket_id=NEW.ticket_id AND code=NEW.code;
 INSERT INTO r44_preview_articles(code,ticket_id,payload_json,result_sha256,updated_at)
 SELECT NEW.code,NEW.ticket_id,NEW.payload_json,NEW.payload_sha256,CAST(NEW.committed_ms AS TEXT)
 WHERE NEW.outcome='CORRECTED'
 ON CONFLICT(code) DO UPDATE SET ticket_id=excluded.ticket_id,payload_json=excluded.payload_json,
 result_sha256=excluded.result_sha256,updated_at=excluded.updated_at;
 UPDATE r44_ticket_progress SET state=CASE WHEN NOT EXISTS(
 SELECT 1 FROM r44_entries WHERE ticket_id=NEW.ticket_id AND state!='AUDITED_DURABLE'
 ) THEN 'COMPLETE' ELSE 'PARTIAL_DURABLE' END WHERE ticket_id=NEW.ticket_id;
 UPDATE r44_leases SET expires_ms=NEW.committed_ms+300000,renewed_ms=NEW.committed_ms WHERE ticket_id=NEW.ticket_id;
 UPDATE r44_tickets SET state=CASE WHEN (SELECT state FROM r44_ticket_progress WHERE ticket_id=NEW.ticket_id)='COMPLETE' THEN 'audited' ELSE 'leased' END,
 result_stage=CASE WHEN (SELECT state FROM r44_ticket_progress WHERE ticket_id=NEW.ticket_id)='COMPLETE' THEN 'audited' ELSE result_stage END,
 lease_expires_at=NEW.committed_ms+300000 WHERE ticket_id=NEW.ticket_id;
 INSERT INTO r44_events(ticket_id,event_type,worker_id,lease_token,detail,created_at)
 VALUES(NEW.ticket_id,'ENTRY_CHECKPOINT',NEW.worker_id,NEW.lease_token,NEW.receipt_sha256,CAST(NEW.committed_ms AS TEXT));
END;
-- statement boundary
INSERT OR IGNORE INTO r44_ticket_progress(ticket_id,state,migration_note)
SELECT ticket_id,CASE WHEN state IN ('audited','verified','quarantined') THEN 'QUARANTINED'
 WHEN state='leased' THEN 'LEASED' ELSE 'CLAIMABLE' END,
 CASE WHEN state IN ('audited','verified') THEN 'LEGACY_TICKET_RECEIPT_REQUIRES_ENTRY_RECONCILIATION' ELSE NULL END
FROM r44_tickets;
-- statement boundary
INSERT OR IGNORE INTO r44_entries(ticket_id,code,ordinal,source_json,state)
SELECT t.ticket_id,json_extract(j.value,'$.code'),CAST(j.key AS INTEGER),j.value,
 CASE WHEN p.state='QUARANTINED' THEN 'QUARANTINED' ELSE 'PENDING' END
FROM r44_tickets t JOIN r44_ticket_progress p USING(ticket_id),json_each(t.entries_json) j;
-- statement boundary
INSERT OR IGNORE INTO r44_leases(ticket_id,worker_id,lease_token,generation,expires_ms)
SELECT ticket_id,worker_id,lease_token,CASE WHEN lease_token IS NULL THEN 0 ELSE 1 END,COALESCE(lease_expires_at,0) FROM r44_tickets;
-- statement boundary
INSERT OR REPLACE INTO r44_meta(key,value) VALUES('durable_entry_schema','1');
