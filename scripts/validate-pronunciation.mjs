#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.argv.find(a => a.startsWith("--root="))?.slice(7) || "docs/pronunciation";
const JSON_MODE = process.argv.includes("--json");
const STRICT = process.argv.includes("--strict");

const ENTRY_FILE_RE = /^SND-[A-Z0-9]+-\d{3}.*\.md$/;
const ENTRY_ID_RE = /SND-[A-Z0-9]+-\d{3}/g;
const SOURCE_ID_RE = /SND-SRC-\d{4}/g;
const CLAIM_ID_RE = /[A-Z0-9]+(?:\d+)?-C\d{2,}/g;

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function uniqueMatches(text, re) {
  return [...new Set(text.match(re) || [])];
}

const registryPath = path.join(ROOT, "MLS-SND-SOURCE-REGISTRY.md");
const inventoryPath = path.join(ROOT, "MLS-SND-MASTER-INVENTORY.md");

if (!fs.existsSync(registryPath) || !fs.existsSync(inventoryPath)) {
  console.error("MLS-SND lint: source registry or master inventory missing.");
  process.exit(2);
}

const registry = read(registryPath);
const inventory = read(inventoryPath);
const knownSources = new Set(uniqueMatches(registry, SOURCE_ID_RE));
const inventoryIds = new Set(uniqueMatches(inventory, ENTRY_ID_RE));

const allFiles = walk(ROOT);
const entryFiles = allFiles.filter(p => ENTRY_FILE_RE.test(path.basename(p)));

const issues = [];
const entryIds = new Map();
const claimIds = new Map();
const contents = new Map();

function issue(severity, rule, file, detail = {}) {
  issues.push({ severity, rule, file: file.replaceAll(path.sep, "/"), ...detail });
}

for (const file of entryFiles) {
  const content = read(file);
  contents.set(file, content);

  const fileId = (path.basename(file).match(/SND-[A-Z0-9]+-\d{3}/) || [])[0] || null;
  const headingId = (content.match(/^#\s+(SND-[A-Z0-9]+-\d{3})\b/m) || [])[1] || null;

  if (!headingId) issue("ERROR", "ID_TITLE_MISSING", file);
  if (fileId && headingId && fileId !== headingId) {
    issue("ERROR", "ID_MISMATCH", file, { file_id: fileId, heading_id: headingId });
  }

  if (fileId) {
    if (entryIds.has(fileId)) {
      issue("ERROR", "DUPLICATE_ENTRY_ID", file, { id: fileId, other: entryIds.get(fileId) });
    } else {
      entryIds.set(fileId, file.replaceAll(path.sep, "/"));
    }
  }

  if (content.includes("\uFFFD")) issue("ERROR", "UNICODE_REPLACEMENT", file);
  if (content !== content.normalize("NFC")) issue("WARN", "NON_NFC", file);

  const status = (content.match(/\*\*Estado:\*\*\s*([^\n]+)/i) || [])[1]?.trim() || "";
  if (!status) issue("WARN", "STATUS_MISSING", file);

  if (/EVIDENCE_CHECKED/.test(status)) {
    if (!/Evidencia R33/i.test(content)) issue("ERROR", "R33_SECTION_MISSING", file);
    if (!/\bVERIFIED\b/.test(content)) issue("WARN", "NO_VERIFIED_CLAIM", file);
  }

  for (const sourceId of uniqueMatches(content, SOURCE_ID_RE)) {
    if (!knownSources.has(sourceId)) {
      issue("ERROR", "UNKNOWN_SOURCE_ID", file, { source_id: sourceId });
    }
  }

  for (const claimId of uniqueMatches(content, CLAIM_ID_RE)) {
    if (claimIds.has(claimId) && claimIds.get(claimId) !== file) {
      issue("ERROR", "DUPLICATE_CLAIM_ID", file, {
        claim_id: claimId,
        other: claimIds.get(claimId).replaceAll(path.sep, "/")
      });
    } else {
      claimIds.set(claimId, file);
    }
  }
}

for (const [file, content] of contents) {
  const fileId = (path.basename(file).match(/SND-[A-Z0-9]+-\d{3}/) || [])[0] || null;
  for (const id of uniqueMatches(content, ENTRY_ID_RE)) {
    if (id === fileId) continue;
    if (!entryIds.has(id) && !inventoryIds.has(id)) {
      issue("WARN", "UNDECLARED_INTERNAL_ID", file, { id });
    }
  }
}

const errors = issues.filter(x => x.severity === "ERROR");
const warnings = issues.filter(x => x.severity === "WARN");
const report = {
  root: ROOT,
  entries_scanned: entryFiles.length,
  unique_entry_ids: entryIds.size,
  source_ids_known: knownSources.size,
  errors: errors.length,
  warnings: warnings.length,
  issues
};

if (JSON_MODE) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`MLS-SND lint: ${report.entries_scanned} entries, ${errors.length} errors, ${warnings.length} warnings.`);
  for (const x of issues) {
    console.log(`[${x.severity}] ${x.rule}: ${x.file}${x.id ? ` (${x.id})` : ""}${x.source_id ? ` (${x.source_id})` : ""}`);
  }
}

if (errors.length > 0 || (STRICT && warnings.length > 0)) process.exit(1);
