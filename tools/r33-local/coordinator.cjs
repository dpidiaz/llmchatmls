#!/usr/bin/env node
"use strict";

// Local-only R33 work allocator. It allocates review work; it never evaluates
// semantics, creates canonical Evidence, or changes VERIFIED status.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const store = require("../../MLS R32 EDITORIAL/evidence git.js");

const LIMIT = 10;
const PILOT_LIMIT = 5;
const PILOT_BATCH = 20;
const SCALE_BATCH = 25;
const LEASE_MS = 60 * 60 * 1000;
const REVIEW_DIR = path.join("docs", "r33-local", "reviews");
const INDEX_PATH = path.join("MLS R32 EDITORIAL", "evidence git", "indexes", "verified.json");
let articlePaths = null;

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}
function findPaths() {
  const root = git(process.cwd(), "rev-parse", "--show-toplevel");
  const common = path.resolve(root, git(root, "rev-parse", "--git-common-dir"));
  const dir = path.join(common, "r33-local-coordinator");
  return { root, dir, statePath: path.join(dir, "state.json"), lockPath: path.join(dir, "lock") };
}
function sha256(data) { return crypto.createHash("sha256").update(data).digest("hex"); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function writeJson(p, value) { fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function sleep(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
function withLock(paths, fn) {
  fs.mkdirSync(paths.dir, { recursive: true });
  const deadline = Date.now() + 15000;
  let held = false;
  while (!held) {
    try { fs.mkdirSync(paths.lockPath); held = true; }
    catch (error) {
      if (error.code !== "EEXIST") throw error;
      try {
        const age = Date.now() - fs.statSync(paths.lockPath).mtimeMs;
        if (age > 600000) fs.rmSync(paths.lockPath, { recursive: true, force: true });
      } catch { /* Another process may have released it. */ }
      if (Date.now() > deadline) throw new Error("COORDINATOR_LOCK_TIMEOUT");
      sleep(40 + Math.floor(Math.random() * 30));
    }
  }
  try { return fn(); }
  finally { if (held) fs.rmSync(paths.lockPath, { recursive: true, force: true }); }
}
async function withLockAsync(paths, fn) {
  fs.mkdirSync(paths.dir, { recursive: true });
  const deadline = Date.now() + 30000;
  let held = false;
  while (!held) {
    try { fs.mkdirSync(paths.lockPath); held = true; }
    catch (error) {
      if (error.code !== "EEXIST") throw error;
      try {
        const age = Date.now() - fs.statSync(paths.lockPath).mtimeMs;
        if (age > 600000) fs.rmSync(paths.lockPath, { recursive: true, force: true });
      } catch { /* Another process may have released it. */ }
      if (Date.now() > deadline) throw new Error("COORDINATOR_LOCK_TIMEOUT");
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
  }
  try { return await fn(); }
  finally { if (held) fs.rmSync(paths.lockPath, { recursive: true, force: true }); }
}
function saveState(paths, state) {
  const temp = `${paths.statePath}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  writeJson(temp, state);
  fs.renameSync(temp, paths.statePath);
}
function parseArgs(args) {
  const out = { positional: [] };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      if (!args[i + 1] || args[i + 1].startsWith("--")) throw new Error(`Falta valor para --${key}`);
      out[key] = args[++i];
    } else out.positional.push(args[i]);
  }
  return out;
}
function currentIndex(root) { return new Set(readJson(path.join(root, INDEX_PATH)).map((x) => String(x).toUpperCase())); }
function articlePath(root, code) {
  if (!articlePaths) {
    articlePaths = new Map();
    for (const article of contentEntries(root)) articlePaths.set(String(article.code).toUpperCase(), path.join(root, "content", article.language, `${article.code}.json`));
  }
  const found = articlePaths.get(code);
  if (!found || !fs.existsSync(found)) throw new Error(`ARTICLE_NOT_FOUND:${code}`);
  return found;
}
function reviewFor(root, code) {
  const file = path.join(root, REVIEW_DIR, `${code}-revision.json`);
  if (!fs.existsSync(file)) return null;
  try { return { file, value: readJson(file) }; } catch { return null; }
}
function articleTextHash(root, code) {
  const article = readJson(articlePath(root, code));
  return sha256(article.articleMarkdown || "");
}
function isRecordedPendingReview(root, code) {
  const r = reviewFor(root, code)?.value;
  if (!r || !["PENDING_SOURCE_SUPPORT", "PENDING_CONFLICT", "PENDING_SOURCE"].includes(r.status)) return false;
  if (r.code !== code || !r.semanticReview?.findings?.length || !r.semanticReview?.limitations?.length) return false;
  const current = articleTextHash(root, code);
  return [r.originalArticleSha256, r.verifiedArticleSha256].includes(current);
}
function contentEntries(root) {
  const base = path.join(root, "content");
  const files = [];
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, item.name);
      if (item.isDirectory()) walk(p);
      else if (item.isFile() && /^MLS-V\d{2}-\d{4}\.json$/i.test(item.name)) files.push(p);
    }
  }
  walk(base);
  return files.map((p) => readJson(p)).sort((a, b) => a.code.localeCompare(b.code));
}
function buildState(root) {
  const verified = currentIndex(root);
  const alreadyReviewed = {};
  const pending = [];
  for (const article of contentEntries(root)) {
    const code = String(article.code || "").toUpperCase();
    if (!code || verified.has(code)) continue;
    if (isRecordedPendingReview(root, code)) {
      const r = reviewFor(root, code);
      alreadyReviewed[code] = { status: r.value.status, reviewPath: path.relative(root, r.file).replace(/\\/g, "/"), sha256: sha256(fs.readFileSync(r.file)), completedAt: r.value.reviewedAt || null };
    } else pending.push(code);
  }
  const partitions = Array.from({ length: LIMIT }, (_, i) => ({ id: `R33-${String(i + 1).padStart(2, "0")}`, codes: [] }));
  pending.forEach((code, i) => partitions[i % LIMIT].codes.push(code));
  return {
    schema: "MLS-R33-LOCAL-COORDINATOR-1",
    createdAt: new Date().toISOString(),
    branch: git(root, "branch", "--show-current"),
    coordinatorRoot: root,
    sourceVerifiedIndexEntries: verified.size,
    sourcePendingEntries: pending.length + Object.keys(alreadyReviewed).length,
    reviewedAtInit: Object.keys(alreadyReviewed).length,
    baseArticleHashes: Object.fromEntries(pending.map((code) => [code, articleTextHash(root, code)])),
    activeLimit: PILOT_LIMIT,
    batchSize: PILOT_BATCH,
    leaseMs: LEASE_MS,
    partitions,
    completed: alreadyReviewed,
    leases: {},
    history: [],
    safety: { cloudflareInteractions: 0, d1Reads: 0, d1Writes: 0, apiCalls: 0, pushes: 0, merges: 0, deployments: 0 },
  };
}
function stateOrFail(paths) {
  if (!fs.existsSync(paths.statePath)) throw new Error("COORDINATOR_NOT_INITIALIZED — ejecute `node tools/r33-local/coordinator.cjs init` una vez en la rama base.");
  return readJson(paths.statePath);
}
function countPending(state) { return state.partitions.reduce((n, p) => n + p.codes.filter((c) => !state.completed[c]).length, 0); }
function expireLeases(state, now = Date.now()) {
  for (const [token, lease] of Object.entries(state.leases)) {
    if (Date.parse(lease.expiresAt) <= now) {
      state.history.push({ event: "expired", workerId: lease.workerId, assignmentId: lease.assignmentId, codes: lease.codes, at: new Date(now).toISOString() });
      delete state.leases[token];
    }
  }
}
function makeWorkerId() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `R33W-local-${stamp}-${crypto.randomBytes(3).toString("hex")}`;
}
function assignmentFor(state, workerId) {
  const leasedCodes = new Set(Object.values(state.leases).flatMap((x) => x.codes));
  const available = state.partitions.map((p) => ({
    partition: p,
    codes: p.codes.filter((c) => !state.completed[c] && !leasedCodes.has(c)),
  })).filter((x) => x.codes.length);
  available.sort((a, b) => a.codes.length - b.codes.length || a.partition.id.localeCompare(b.partition.id));
  const chosen = available[0];
  if (!chosen) return null;
  const codes = chosen.codes.slice(0, state.batchSize);
  const leaseToken = crypto.randomBytes(24).toString("hex");
  const assignmentId = `R33A-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const expiresAt = new Date(Date.now() + state.leaseMs).toISOString();
  const lease = { assignmentId, workerId, partitionId: chosen.partition.id, codes, leaseToken, issuedAt: new Date().toISOString(), expiresAt, heartbeatAt: new Date().toISOString() };
  state.leases[leaseToken] = lease;
  state.history.push({ event: "claimed", assignmentId, workerId, partitionId: chosen.partition.id, codes, at: lease.issuedAt });
  return lease;
}
function findLease(state, args) {
  const token = args.token;
  const lease = token && state.leases[token];
  if (!lease) throw new Error("LEASE_NOT_FOUND_OR_EXPIRED");
  if (args.worker !== lease.workerId) throw new Error("WORKER_ID_MISMATCH");
  if (Date.parse(lease.expiresAt) <= Date.now()) throw new Error("LEASE_EXPIRED");
  return lease;
}
function summarize(state) {
  return {
    schema: state.schema,
    branch: state.branch,
    verifiedAtInit: state.sourceVerifiedIndexEntries,
    pendingAtInit: state.sourcePendingEntries,
    reviewedPendingAtInit: Object.keys(state.completed).length,
    remaining: countPending(state),
    reviewedSinceInit: Object.keys(state.completed).length - Number(state.reviewedAtInit || 0),
    activeLeases: Object.values(state.leases).length,
    activeLimit: state.activeLimit,
    batchSize: state.batchSize,
    partitions: state.partitions.map((p) => ({ id: p.id, size: p.codes.length, remaining: p.codes.filter((c) => !state.completed[c]).length })),
    safety: state.safety,
  };
}

async function validateCompletion(root, lease) {
  const verified = currentIndex(root);
  const outcomes = [];
  for (const code of lease.codes) {
    const found = reviewFor(root, code);
    if (!found) throw new Error(`REVIEW_ARTIFACT_MISSING:${code}`);
    const r = found.value;
    if (r.code !== code) throw new Error(`REVIEW_CODE_MISMATCH:${code}`);
    const currentHash = articleTextHash(root, code);
    if (![r.originalArticleSha256, r.verifiedArticleSha256].includes(currentHash)) throw new Error(`REVIEW_ARTICLE_HASH_MISMATCH:${code}`);
    if (r.status === "VERIFIED") {
      if (!verified.has(code)) throw new Error(`VERIFIED_NOT_IN_CANONICAL_INDEX:${code}`);
      const evidencePath = store.entryPath(readJson(articlePath(root, code)).language, code);
      const evidence = store.readJson(root, evidencePath);
      const assessment = await store.assessEntry(root, evidence);
      if (!assessment.ok || evidence.status !== "VERIFIED" || !r.preflight?.ok) throw new Error(`CANONICAL_EVIDENCE_INVALID:${code}`);
      outcomes.push({ code, status: "VERIFIED", reviewPath: path.relative(root, found.file).replace(/\\/g, "/"), sha256: sha256(fs.readFileSync(found.file)), completedAt: new Date().toISOString() });
    } else if (["PENDING_SOURCE_SUPPORT", "PENDING_CONFLICT", "PENDING_SOURCE"].includes(r.status)) {
      if (!r.semanticReview?.findings?.length || !r.semanticReview?.limitations?.length) throw new Error(`PENDING_REVIEW_INCOMPLETE:${code}`);
      outcomes.push({ code, status: r.status, reviewPath: path.relative(root, found.file).replace(/\\/g, "/"), sha256: sha256(fs.readFileSync(found.file)), completedAt: new Date().toISOString() });
    } else throw new Error(`REVIEW_NOT_TERMINAL:${code}:${r.status}`);
  }
  return outcomes;
}

function atomicWrite(file, bytes) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  fs.writeFileSync(temp, bytes);
  fs.renameSync(temp, file);
}

async function integrateBatch(workerRoot, state, lease, outcomes) {
  const baseRoot = state.coordinatorRoot;
  const backups = new Map();
  const remember = (file) => { if (!backups.has(file)) backups.set(file, fs.existsSync(file) ? fs.readFileSync(file) : null); };
  const put = (source, dest) => { remember(dest); atomicWrite(dest, fs.readFileSync(source)); };
  try {
    for (const outcome of outcomes) {
      const code = outcome.code;
      const baseArticle = articlePath(baseRoot, code);
      if (articleTextHash(baseRoot, code) !== state.baseArticleHashes[code]) throw new Error(`BASE_ARTICLE_DRIFT:${code}`);
      const workerArticle = articlePath(workerRoot, code);
      const reviewSource = path.join(workerRoot, outcome.reviewPath);
      const reviewDest = path.join(baseRoot, outcome.reviewPath);
      if (outcome.status === "VERIFIED") {
        const article = readJson(workerArticle);
        const evidencePath = store.entryPath(article.language, code);
        const workerEvidencePath = path.join(workerRoot, evidencePath);
        if (!fs.existsSync(workerEvidencePath)) throw new Error(`WORKER_EVIDENCE_MISSING:${code}`);
        const evidence = readJson(workerEvidencePath);
        for (const sourceId of [...new Set((evidence.links || []).map((x) => x.sourceId).filter(Boolean))]) {
          const sourcePath = store.sourcePath(sourceId);
          const from = path.join(workerRoot, sourcePath), to = path.join(baseRoot, sourcePath);
          if (!fs.existsSync(from)) throw new Error(`WORKER_SOURCE_MISSING:${code}:${sourceId}`);
          if (!fs.existsSync(to)) put(from, to);
          else {
            const oldSource = await store.normalizeStoredSource(readJson(to));
            const newSource = await store.normalizeStoredSource(readJson(from));
            if (oldSource.identityKind !== newSource.identityKind || oldSource.identityKey !== newSource.identityKey) throw new Error(`SOURCE_IDENTITY_CONFLICT:${sourceId}`);
          }
        }
        put(workerArticle, baseArticle);
        put(workerEvidencePath, path.join(baseRoot, evidencePath));
        put(reviewSource, reviewDest);
        store.writeIndexes(baseRoot);
        const baseEvidence = store.readJson(baseRoot, evidencePath);
        const assessment = await store.assessEntry(baseRoot, baseEvidence);
        if (!assessment.ok || baseEvidence.status !== "VERIFIED") throw new Error(`INTEGRATED_EVIDENCE_INVALID:${code}:${assessment.errors.join(",")}`);
      } else {
        const workerOriginalHash = articleTextHash(workerRoot, code);
        if (workerOriginalHash !== state.baseArticleHashes[code]) throw new Error(`UNVERIFIED_ARTICLE_EDIT_REJECTED:${code}`);
        put(reviewSource, reviewDest);
      }
      outcome.reviewPath = path.relative(baseRoot, reviewDest).replace(/\\/g, "/");
      outcome.sha256 = sha256(fs.readFileSync(reviewDest));
      outcome.integratedAt = new Date().toISOString();
    }

    const checkpointPath = path.join(baseRoot, "docs", "r33-local", "checkpoint.json");
    if (fs.existsSync(checkpointPath)) {
      remember(checkpointPath);
      const c = readJson(checkpointPath);
      for (const outcome of outcomes) {
        c.reviewed_locally = [...new Set([...(c.reviewed_locally || []), outcome.code])];
        c.latest_review_artifact_hashes = c.latest_review_artifact_hashes || {};
        c.latest_review_artifact_hashes[outcome.code] = outcome.sha256;
        if (outcome.status === "VERIFIED" && Array.isArray(c.pending_semantic_review_entries)) {
          c.pending_semantic_review_entries = c.pending_semantic_review_entries.filter((x) => x !== outcome.code);
          c.local_recovery_progress.latest_verified_entry = outcome.code;
        }
        c.local_recovery_progress.latest_local_review_entry = outcome.code;
        c.local_recovery_progress.latest_reviewed_entry = outcome.code;
        c.local_recovery_progress.latest_review_artifact = outcome.reviewPath;
        c.local_recovery_progress.latest_review_artifact_sha256 = outcome.sha256;
        c.local_recovery_progress.claims_reviewed_this_batch = outcomes.length;
      }
      c.local_recovery_progress.entry_review_batch.entries_with_local_review_records = [...new Set([...(c.local_recovery_progress.entry_review_batch.entries_with_local_review_records || []), ...outcomes.map((x) => x.code)])];
      c.local_recovery_progress.latest_local_review_batch = outcomes.map((x) => x.code).join(", ");
      c.latest_local_review_batch = {
        date: new Date().toISOString().slice(0, 10),
        first_entry: outcomes[0].code,
        last_entry: outcomes.at(-1).code,
        entries: outcomes.map((x) => x.code),
        review_artifacts: outcomes.map((x) => x.reviewPath),
        claims_reviewed: outcomes.length,
        new_verified: outcomes.filter((x) => x.status === "VERIFIED").length,
        pending_correction: outcomes.filter((x) => x.status !== "VERIFIED").map((x) => x.code),
        canonical_article_modified: outcomes.some((x) => x.status === "VERIFIED"),
        canonical_evidence_modified: outcomes.some((x) => x.status === "VERIFIED"),
        pdfs_regenerated: false,
        cloudflareEditorialInteractions: 0,
        d1Reads: 0,
        d1Writes: 0,
        canonical_validation: "Cada entrada VERIFIED integrada pasó assessEntry; pendiente validación global del lote.",
      };
      atomicWrite(checkpointPath, Buffer.from(`${JSON.stringify(c, null, 2)}\n`, "utf8"));
    }
    return outcomes;
  } catch (error) {
    for (const [file, previous] of [...backups.entries()].reverse()) {
      if (previous === null) fs.rmSync(file, { force: true });
      else atomicWrite(file, previous);
    }
    store.writeIndexes(baseRoot);
    throw error;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args.positional[0] || "help";
  const paths = findPaths();
  if (command === "help") {
    console.log("R33 local coordinator: init | status | next | renew --worker ID --token TOKEN | complete --worker ID --token TOKEN | release --worker ID --token TOKEN | scale 5|10 | self-check");
    return;
  }
  if (command === "init") {
    const state = buildState(paths.root);
    withLock(paths, () => {
      if (fs.existsSync(paths.statePath)) throw new Error("COORDINATOR_ALREADY_INITIALIZED — no se sobrescribe el estado existente.");
      saveState(paths, state);
    });
    console.log(JSON.stringify(summarize(state), null, 2));
    return;
  }
  if (command === "self-check") {
    const simulated = buildState(paths.root);
    const seen = new Set();
    for (let i = 0; i < PILOT_LIMIT; i += 1) {
      const lease = assignmentFor(simulated, `R33W-pilot-${i + 1}`);
      if (!lease || lease.codes.length !== PILOT_BATCH) throw new Error("SELF_CHECK_ASSIGNMENT_SIZE_FAILED");
      for (const code of lease.codes) { if (seen.has(code)) throw new Error(`SELF_CHECK_DUPLICATE:${code}`); seen.add(code); }
    }
    if (Object.keys(simulated.leases).length !== PILOT_LIMIT) throw new Error("SELF_CHECK_ACTIVE_LEASE_COUNT_FAILED");
    if (seen.size !== PILOT_LIMIT * PILOT_BATCH) throw new Error("SELF_CHECK_TOTAL_ASSIGNED_FAILED");
    console.log(JSON.stringify({ ok: true, simulatedWorkers: PILOT_LIMIT, uniqueEntries: seen.size, assignmentSize: PILOT_BATCH, actualQueueStateChanged: false, cloudflareInteractions: 0, d1Reads: 0, d1Writes: 0 }, null, 2));
    return;
  }
  if (command === "status") {
    const out = withLock(paths, () => { const state = stateOrFail(paths); expireLeases(state); saveState(paths, state); return summarize(state); });
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  if (command === "scale") {
    const n = Number(args.positional[1]);
    if (![PILOT_LIMIT, LIMIT].includes(n)) throw new Error("CONCURRENCY_ALLOWED_VALUES:5,10");
    const out = withLock(paths, () => {
      const state = stateOrFail(paths); expireLeases(state);
      if (Object.keys(state.leases).length) throw new Error("SCALE_REQUIRES_ZERO_ACTIVE_LEASES");
      state.activeLimit = n; state.batchSize = n === LIMIT ? SCALE_BATCH : PILOT_BATCH;
      state.history.push({ event: "scaled", activeLimit: n, batchSize: state.batchSize, at: new Date().toISOString() });
      saveState(paths, state); return summarize(state);
    });
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  if (["next", "claim"].includes(command)) {
    const out = withLock(paths, () => {
      const state = stateOrFail(paths); expireLeases(state);
      if (Object.keys(state.leases).length >= state.activeLimit) throw new Error("CAPACITY_BUSY");
      const workerId = makeWorkerId();
      const lease = assignmentFor(state, workerId);
      if (!lease) { saveState(paths, state); return { status: "NO_WORK", remaining: countPending(state) }; }
      saveState(paths, state);
      return { status: "LEASED", ...lease, instruction: "Revise semánticamente cada entrada; guarde revisión/checkpoint por entrada. Solo complete después de verificar los artefactos. Mantenga VERIFIED sujeto al validador canónico." };
    });
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  if (["renew", "release", "complete"].includes(command)) {
    if (!args.worker || !args.token) throw new Error("WORKER_AND_TOKEN_REQUIRED");
    if (command === "complete") {
      const lease = withLock(paths, () => findLease(stateOrFail(paths), args));
      const outcomes = await validateCompletion(paths.root, lease);
      const summary = await withLockAsync(paths, async () => {
        const state = stateOrFail(paths); const live = findLease(state, args);
        await integrateBatch(paths.root, state, live, outcomes);
        for (const outcome of outcomes) state.completed[outcome.code] = outcome;
        delete state.leases[live.leaseToken];
        state.history.push({ event: "completed", assignmentId: live.assignmentId, workerId: live.workerId, outcomes, at: new Date().toISOString() });
        saveState(paths, state); return { outcomes, ...summarize(state) };
      });
      console.log(JSON.stringify(summary, null, 2));
      return;
    }
    const out = withLock(paths, () => {
      const state = stateOrFail(paths); expireLeases(state); const lease = findLease(state, args);
      if (command === "renew") { lease.heartbeatAt = new Date().toISOString(); lease.expiresAt = new Date(Date.now() + state.leaseMs).toISOString(); }
      else { delete state.leases[lease.leaseToken]; state.history.push({ event: "released", assignmentId: lease.assignmentId, workerId: lease.workerId, codes: lease.codes, at: new Date().toISOString() }); }
      saveState(paths, state); return { status: command === "renew" ? "RENEWED" : "RELEASED", assignmentId: lease.assignmentId, workerId: lease.workerId, expiresAt: command === "renew" ? lease.expiresAt : null, codes: lease.codes };
    });
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  throw new Error(`UNKNOWN_COMMAND:${command}`);
}

main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
