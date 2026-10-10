#!/usr/bin/env node
"use strict";

// Read-only R33 preflight for entries absent from the canonical verified index.
// It checks identity, hashes, source/APA structure and conflicts. It never
// judges source-to-claim meaning and never writes Evidence or VERIFIED status.

const fs = require("node:fs");
const path = require("node:path");
const store = require("../../MLS R32 EDITORIAL/evidence git.js");

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--") || !argv[i + 1]) throw new Error(`Argumento inválido: ${token}`);
    options[token.slice(2)] = argv[++i];
  }
  return options;
}

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }

function findArticles(root) {
  const base = path.join(root, "content");
  const found = [];
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) walk(fullPath);
      else if (item.isFile() && /^MLS-V\d{2}-\d{4}\.json$/i.test(item.name)) found.push(fullPath);
    }
  }
  walk(base);
  return found.sort();
}

function relative(root, file) { return path.relative(root, file).replace(/\\/g, "/"); }

function addReason(reasons, reason) { if (!reasons.includes(reason)) reasons.push(reason); }

async function inspect(root, articlePath, verified) {
  const article = readJson(articlePath);
  const code = String(article.code || "").toUpperCase();
  if (verified.has(code)) return null;

  const result = {
    code,
    content_path: relative(root, articlePath),
    article_generated_at: article.generatedAt || null,
    article_sha256: null,
    evidence_path: null,
    evidence_status: null,
    claims_total: 0,
    claims_structurally_covered: 0,
    source_count: 0,
    unresolved_conflicts: [],
    structural_errors: [],
    disposition: "NO_CANONICAL_EVIDENCE",
    reasons: [],
    semantic_review: "REQUIRED",
    verified: false,
  };

  const evidencePath = store.entryPath(article.language, code);
  const evidenceFile = path.join(root, evidencePath);
  result.evidence_path = evidencePath;
  if (!fs.existsSync(evidenceFile)) {
    addReason(result.reasons, "Evidence canónica inexistente; el recibo R44 o una cita candidata no la reemplaza.");
    return result;
  }

  const evidence = store.readJson(root, evidencePath);
  result.evidence_status = evidence.status || null;
  const assessment = await store.assessEntry(root, evidence);
  result.article_sha256 = assessment.article.articleHash;
  result.claims_total = assessment.claimsTotal;
  result.claims_structurally_covered = assessment.claimsVerified;
  result.source_count = assessment.sourcesTotal;
  result.structural_errors = assessment.errors;
  result.unresolved_conflicts = (evidence.conflicts || [])
    .filter((conflict) => String(conflict.status || "").toLowerCase() === "unresolved");

  if (assessment.errors.length) {
    result.disposition = "BLOCKED_STRUCTURAL_VALIDATION";
    for (const error of assessment.errors) addReason(result.reasons, error);
    return result;
  }
  if (result.unresolved_conflicts.length) {
    result.disposition = "BLOCKED_UNRESOLVED_CONFLICT";
    addReason(result.reasons, "Hay al menos un conflicto sin resolver; el preflight lo bloquea aunque el validador base no lo clasifique como contradicción.");
    return result;
  }
  if (!assessment.coverageComplete || !assessment.citationReady) {
    result.disposition = "BLOCKED_INCOMPLETE_EVIDENCE";
    if (!assessment.coverageComplete) addReason(result.reasons, "La cobertura estructural de afirmaciones no está completa.");
    if (!assessment.citationReady) addReason(result.reasons, "Las fuentes o referencias APA no están listas.");
    return result;
  }

  result.disposition = "STRUCTURE_PASS_SEMANTIC_REVIEW_REQUIRED";
  addReason(result.reasons, "Hashes, cobertura y citas pasan el preflight; todavía hace falta validar que cada fuente sostenga el significado de cada afirmación.");
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const root = path.resolve(options.root || path.join(__dirname, "..", ".."));
  const indexPath = path.join(root, "MLS R32 EDITORIAL", "evidence git", "indexes", "verified.json");
  const verified = new Set(readJson(indexPath).map((code) => String(code).toUpperCase()));
  const articles = findArticles(root);
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const defaultDir = path.join(root, "tools", "r33-local", "workspace", "output", "r33-preflight");
  const outputDir = path.resolve(options.output || defaultDir);
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonlPath = path.join(outputDir, `pending-${runId}.jsonl`);
  const summaryPath = path.join(outputDir, `pending-${runId}.summary.json`);
  const counts = {};
  let pending = 0;
  for (const articlePath of articles) {
    const row = await inspect(root, articlePath, verified);
    if (!row) continue;
    pending += 1;
    counts[row.disposition] = (counts[row.disposition] || 0) + 1;
    fs.appendFileSync(jsonlPath, `${JSON.stringify(row)}\n`, "utf8");
  }
  const summary = {
    schema: "MLS-R33-LOCAL-PREFLIGHT-1",
    generated_at: new Date().toISOString(),
    root,
    canonical_verified_index_entries: verified.size,
    corpus_articles: articles.length,
    pending_entries_scanned: pending,
    dispositions: counts,
    new_verified: 0,
    canonical_files_modified: false,
    cloudflare_interactions: 0,
    d1_reads: 0,
    d1_writes: 0,
    per_entry_report: jsonlPath,
    limitation: "Este preflight valida estructura e identidad, no el entailment semántico fuente-afirmación. Nunca marca VERIFIED.",
  };
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
