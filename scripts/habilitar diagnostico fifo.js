'use strict';

const fs = require('fs');

const backendPath = 'src/index.js';
let source = fs.readFileSync(backendPath, 'utf8');

const marker = 'async function handleMlsChat(request, env, url) {';
if (!source.includes(marker)) {
  throw new Error('No se encontró handleMlsChat. Ejecutar primero habilitar chat editorial.js.');
}

const diagnosticFunction = String.raw`
async function mlsFifoDiagnostic(env, requestedDetailLimit) {
  const detailLimit = Math.max(10, Math.min(1000, Number(requestedDetailLimit) || 200));
  const canonical = [];
  const canonicalByCode = new Map();
  for (let globalIndex = 0; globalIndex < WIKI_TOTAL_ENTRIES; globalIndex++) {
    const job = jobFromGlobalIndex(globalIndex);
    if (!job) continue;
    const item = {globalIndex, code: job.code, language: job.language, languageName: job.languageName, n: job.n, seedPath: job.seedPath};
    canonical.push(item);
    canonicalByCode.set(item.code, item);
  }

  const [jobsResult, articlesResult, reservationsResult, specialItemsResult, incidentsResult, historyResult] = await Promise.all([
    env.WIKI_DB.prepare('SELECT code, language, n, status, attempts, enqueued_at, started_at, updated_at, last_error FROM wiki_jobs').all(),
    env.WIKI_DB.prepare('SELECT code, language, n, generated_at FROM wiki_articles').all(),
    env.WIKI_DB.prepare(`SELECT i.code, i.run_id, i.position, i.status AS item_status,
      r.status AS run_status, r.created_at AS run_created_at, r.updated_at AS run_updated_at
      FROM wiki_chat_items i LEFT JOIN wiki_chat_runs r ON r.id = i.run_id
      WHERE i.status = 'pending'`).all(),
    env.WIKI_DB.prepare("SELECT code, run_id, position, status FROM wiki_chat_items WHERE status IN ('deferred', 'needs_review')").all(),
    env.WIKI_DB.prepare(`SELECT id, code, source_run_id, original_position, editorial_attempts, rescue_state,
      runner_eligible, runner_attempts, created_at, updated_at FROM wiki_chat_incidents
      WHERE rescue_state IN ('pending', 'claimed', 'chat_claimed', 'needs_review')`).all(),
    env.WIKI_DB.prepare('SELECT code, COUNT(*) AS appearances FROM wiki_chat_items GROUP BY code').all()
  ]);

  const jobs = jobsResult.results || [];
  const articles = articlesResult.results || [];
  const jobsByCode = new Map(jobs.map(row => [String(row.code), row]));
  const articlesByCode = new Map(articles.map(row => [String(row.code), row]));
  const history = new Map((historyResult.results || []).map(row => [String(row.code), Number(row.appearances || 0)]));

  const activeReservations = new Map();
  const orphanReservations = [];
  for (const row of reservationsResult.results || []) {
    const code = String(row.code);
    if (row.run_status === 'active') {
      if (!activeReservations.has(code)) activeReservations.set(code, []);
      activeReservations.get(code).push(row);
    } else {
      orphanReservations.push({
        code,
        runId: row.run_id,
        runStatus: row.run_status || null,
        position: Number(row.position),
        reason: row.run_status ? 'pending reservation attached to non-active run' : 'pending reservation without matching run'
      });
    }
  }

  const specialByCode = new Map();
  const addSpecial = (code, type, data) => {
    code = String(code);
    if (!specialByCode.has(code)) specialByCode.set(code, []);
    specialByCode.get(code).push({type, ...data});
  };
  for (const row of specialItemsResult.results || []) {
    addSpecial(row.code, row.status, {source: 'wiki_chat_items', runId: row.run_id, position: Number(row.position)});
  }
  for (const row of incidentsResult.results || []) {
    const type = row.rescue_state === 'needs_review' ? 'needs_review' : 'deferred';
    addSpecial(row.code, type, {
      source: 'wiki_chat_incidents', incidentId: row.id, sourceRunId: row.source_run_id,
      rescueState: row.rescue_state, editorialAttempts: Number(row.editorial_attempts || 0),
      runnerAttempts: Number(row.runner_attempts || 0), runnerEligible: Number(row.runner_eligible || 0)
    });
  }

  const cursorRow = await env.WIKI_DB.prepare("SELECT value FROM wiki_meta WHERE key = 'enqueue_cursor'").first();
  const enqueueCursor = Math.max(0, Number(cursorRow?.value || 0));
  const knownStatuses = new Set(['pending', 'enqueued', 'queued', 'processing', 'published', 'failed']);
  const normalEligibleStatuses = new Set(['pending', 'enqueued', 'queued']);

  const neverMaterialized = [];
  const beforeCursorNeverMaterialized = [];
  const afterCursorNeverMaterialized = [];
  const likelyNeverWorked = [];
  const materializedNoAttempt = [];
  const safeEligible = [];
  const currentSelectorEligible = [];
  const blockedByActiveReservation = [];
  const deferred = [];
  const needsReview = [];
  const excludedByStatus = [];
  const inconsistentPublishedJob = [];
  const articleJobMismatch = [];
  const unexpectedStatuses = [];

  for (const item of canonical) {
    const job = jobsByCode.get(item.code);
    const article = articlesByCode.get(item.code);
    const activeReservation = activeReservations.get(item.code) || [];
    const specials = specialByCode.get(item.code) || [];
    const historyCount = history.get(item.code) || 0;
    const hasDeferred = specials.some(value => value.type === 'deferred');
    const hasNeedsReview = specials.some(value => value.type === 'needs_review');

    if (article) {
      if (job && job.status !== 'published') {
        articleJobMismatch.push({code: item.code, globalIndex: item.globalIndex, jobStatus: job.status});
      }
      continue;
    }

    if (!job) {
      const evidence = {code: item.code, globalIndex: item.globalIndex, language: item.language, n: item.n};
      neverMaterialized.push(evidence);
      if (item.globalIndex < enqueueCursor) beforeCursorNeverMaterialized.push(evidence);
      else afterCursorNeverMaterialized.push(evidence);
      if (historyCount === 0 && !hasDeferred && !hasNeedsReview) {
        likelyNeverWorked.push({...evidence, evidence: 'absent from wiki_jobs, wiki_articles and wiki_chat_items'});
      }
      continue;
    }

    const status = String(job.status || '');
    if (!knownStatuses.has(status)) unexpectedStatuses.push({code: item.code, globalIndex: item.globalIndex, status});
    if (status === 'published') {
      inconsistentPublishedJob.push({code: item.code, globalIndex: item.globalIndex, attempts: Number(job.attempts || 0)});
      continue;
    }

    if (Number(job.attempts || 0) === 0 && historyCount === 0 && !job.started_at) {
      materializedNoAttempt.push({code: item.code, globalIndex: item.globalIndex, status});
    }

    const currentVisible = !activeReservation.length;
    if (currentVisible) {
      currentSelectorEligible.push({code: item.code, globalIndex: item.globalIndex, language: item.language, n: item.n, jobStatus: status});
    }

    if (hasNeedsReview) {
      needsReview.push({code: item.code, globalIndex: item.globalIndex, states: specials});
      continue;
    }
    if (hasDeferred) {
      deferred.push({code: item.code, globalIndex: item.globalIndex, states: specials});
      continue;
    }
    if (activeReservation.length) {
      blockedByActiveReservation.push({code: item.code, globalIndex: item.globalIndex,
        reservations: activeReservation.map(row => ({runId: row.run_id, position: Number(row.position), runStatus: row.run_status}))});
      continue;
    }
    if (!normalEligibleStatuses.has(status)) {
      excludedByStatus.push({code: item.code, globalIndex: item.globalIndex, status, attempts: Number(job.attempts || 0)});
      continue;
    }

    safeEligible.push({code: item.code, globalIndex: item.globalIndex, language: item.language, n: item.n,
      jobStatus: status, attempts: Number(job.attempts || 0)});
  }

  const nonCanonicalJobs = jobs.filter(row => !canonicalByCode.has(String(row.code)))
    .map(row => ({code: row.code, status: row.status, language: row.language, n: row.n}));
  const nonCanonicalArticles = articles.filter(row => !canonicalByCode.has(String(row.code)))
    .map(row => ({code: row.code, language: row.language, n: row.n}));

  const missingRanges = [];
  for (const item of neverMaterialized) {
    const last = missingRanges[missingRanges.length - 1];
    if (last && last.endGlobalIndex + 1 === item.globalIndex && last.language === item.language) {
      last.endGlobalIndex = item.globalIndex;
      last.endCode = item.code;
      last.count += 1;
    } else {
      missingRanges.push({language: item.language, startGlobalIndex: item.globalIndex, endGlobalIndex: item.globalIndex,
        startCode: item.code, endCode: item.code, count: 1});
    }
  }

  const sample = array => array.slice(0, detailLimit);
  return {
    ok: true,
    readOnly: true,
    standard: 'MLS R32',
    promptVersion: '32.0',
    diagnostic: {
      canonicalTotal: canonical.length,
      enqueueCursor,
      counts: {
        jobsMaterialized: jobs.length,
        publishedArticles: articles.length,
        neverMaterialized: neverMaterialized.length,
        beforeCursorNeverMaterialized: beforeCursorNeverMaterialized.length,
        afterCursorNeverMaterialized: afterCursorNeverMaterialized.length,
        likelyNeverWorked: likelyNeverWorked.length,
        materializedNoAttempt: materializedNoAttempt.length,
        safeEligible: safeEligible.length,
        currentSelectorEligible: currentSelectorEligible.length,
        blockedByActiveReservation: blockedByActiveReservation.length,
        orphanReservations: orphanReservations.length,
        deferred: deferred.length,
        needsReview: needsReview.length,
        excludedByStatus: excludedByStatus.length,
        inconsistentPublishedJob: inconsistentPublishedJob.length,
        articleJobMismatch: articleJobMismatch.length,
        unexpectedStatuses: unexpectedStatuses.length,
        nonCanonicalJobs: nonCanonicalJobs.length,
        nonCanonicalArticles: nonCanonicalArticles.length,
        missingRanges: missingRanges.length
      },
      fifo: {
        currentSelectorUniverse: 'wiki_jobs',
        canonicalUniverse: 'jobFromGlobalIndex(0..WIKI_TOTAL_ENTRIES-1)',
        firstSafeEligible: safeEligible[0] || null,
        firstCurrentSelectorEligible: currentSelectorEligible[0] || null,
        cursorPastMissingEntries: beforeCursorNeverMaterialized.length > 0,
        materializationIncomplete: neverMaterialized.length > 0,
        currentSelectorAdmitsSpecialStates: currentSelectorEligible.some(item => specialByCode.has(item.code)),
        currentSelectorAdmitsNonNormalStatuses: currentSelectorEligible.some(item => !normalEligibleStatuses.has(item.jobStatus))
      },
      samples: {
        neverMaterialized: sample(neverMaterialized),
        beforeCursorNeverMaterialized: sample(beforeCursorNeverMaterialized),
        afterCursorNeverMaterialized: sample(afterCursorNeverMaterialized),
        missingRanges: sample(missingRanges),
        likelyNeverWorked: sample(likelyNeverWorked),
        materializedNoAttempt: sample(materializedNoAttempt),
        safeEligible: sample(safeEligible),
        currentSelectorEligible: sample(currentSelectorEligible),
        blockedByActiveReservation: sample(blockedByActiveReservation),
        orphanReservations: sample(orphanReservations),
        deferred: sample(deferred),
        needsReview: sample(needsReview),
        excludedByStatus: sample(excludedByStatus),
        inconsistentPublishedJob: sample(inconsistentPublishedJob),
        articleJobMismatch: sample(articleJobMismatch),
        unexpectedStatuses: sample(unexpectedStatuses),
        nonCanonicalJobs: sample(nonCanonicalJobs),
        nonCanonicalArticles: sample(nonCanonicalArticles)
      }
    }
  };
}
`;

if (!source.includes('async function mlsFifoDiagnostic(')) {
  source = source.replace(marker, diagnosticFunction + '\n' + marker);
}

const authMarker = `    await mlsChatAuthenticate(request, env);\n    await ensureWikiDb(env); await mlsChatEnsureDb(env);`;
const authReplacement = `    await mlsChatAuthenticate(request, env);\n    if (route === '/fifo/diagnostic' && request.method === 'GET') {\n      return mlsChatJson(await mlsFifoDiagnostic(env, url.searchParams.get('limit')));\n    }\n    await ensureWikiDb(env); await mlsChatEnsureDb(env);`;

if (!source.includes("route === '/fifo/diagnostic'")) {
  if (!source.includes(authMarker)) throw new Error('No se encontró el punto de inserción de la ruta FIFO diagnóstica.');
  source = source.replace(authMarker, authReplacement);
}

fs.writeFileSync(backendPath, source, 'utf8');
console.log('Diagnóstico FIFO de solo lectura habilitado en /api/wiki/editorial/chat/fifo/diagnostic.');
