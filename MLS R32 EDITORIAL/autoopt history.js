// Historical evidence is NOT replayed into the live AUTOOPT event stream.
const MLS_AUTOOPT_HISTORY_VERSION = '1.0';
function mlsAutooptHistoryEnabled(env) { return env.AUTOOPT_HISTORY_ENABLED === 'true' || env.AUTOOPT_HISTORY_ENABLED === true; }
function mlsAutooptHistoryProfileKey(context, bounds) {
  return [bounds.min,bounds.max,Number(context.profile?.headings?.max)||0].join(':');
}
function mlsAutooptHistorySchema() {
  return [
    `CREATE TABLE IF NOT EXISTS wiki_autoopt_history_batches (
      id TEXT PRIMARY KEY, digest TEXT NOT NULL UNIQUE, cutoff TEXT NOT NULL,
      expected INTEGER NOT NULL, state TEXT NOT NULL CHECK(state IN ('staged','active','rolled_back')),
      created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS wiki_autoopt_history_items (
      source_id TEXT PRIMARY KEY, batch_id TEXT NOT NULL, version TEXT NOT NULL, prompt TEXT NOT NULL,
      family_key TEXT NOT NULL, profile_key TEXT NOT NULL, kind TEXT NOT NULL,
      source_at TEXT NOT NULL, fingerprint TEXT NOT NULL, data TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS wiki_autoopt_history_batch_items ON wiki_autoopt_history_items(batch_id)`,
    `CREATE TABLE IF NOT EXISTS wiki_autoopt_history_stats (
      batch_id TEXT NOT NULL, version TEXT NOT NULL, prompt TEXT NOT NULL,
      family_key TEXT NOT NULL, profile_key TEXT NOT NULL, publications INTEGER NOT NULL DEFAULT 0,
      incidents INTEGER NOT NULL DEFAULT 0, words_sum INTEGER NOT NULL DEFAULT 0,
      sections_sum INTEGER NOT NULL DEFAULT 0, references_sum INTEGER NOT NULL DEFAULT 0,
      activity_like INTEGER NOT NULL DEFAULT 0, length_errors INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(batch_id,version,prompt,family_key,profile_key))`,
    `CREATE INDEX IF NOT EXISTS wiki_autoopt_history_lookup ON wiki_autoopt_history_stats(version,prompt,family_key,profile_key)`,
    `CREATE TRIGGER IF NOT EXISTS wiki_autoopt_history_accumulate AFTER INSERT ON wiki_autoopt_history_items BEGIN
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
    END`
  ];
}
function mlsAutooptHistoryBlend(base, context, evidence, bounds) {
  const publications=evidence.publications||0, incidents=evidence.incidents||0;
  if(!publications && !incidents) return base;
  const result=JSON.parse(JSON.stringify(base));
  // At most 20% initial influence, diminishing with new confirmed publications.
  const weight=Math.min(0.2,publications/20)/(1+(base.publications||0)/4);
  result.historicalEvidence={version:MLS_AUTOOPT_HISTORY_VERSION,publications,incidents,
    weight:Math.round(weight*1000)/1000,firstPassSuccessRate:null,attemptsPerPublication:null,
    meanPublishedWords:publications?Math.round(evidence.words_sum/publications):null,
    activityLikeIncidents:evidence.activity_like||0,lengthIncidents:evidence.length_errors||0,
    linguisticCorrectness:'not-certified'};
  if(publications>=3 && result.recommendedWordRange && !bounds.conflict) {
    const range=result.recommendedWordRange;
    const historicalTarget=Math.max(bounds.min,Math.min(evidence.words_sum/publications,bounds.min*1.15));
    range.target=Math.min(bounds.max,Math.max(range.min,Math.round(range.target*(1-weight)+historicalTarget*weight)));
    range.max=Math.min(bounds.max,Math.max(range.target,range.max));
    if(!result.preferredSectionCount && weight>=0.1 && context.profile?.headings?.max>0)
      result.preferredSectionCount=Math.max(1,Math.min(context.profile.headings.max,Math.round(evidence.sections_sum/publications)));
  }
  if(evidence.activity_like>0) result.recommendations.push('El historial conserva rechazos por actividad/curso: mantener tono enciclopédico sin ejercicios; no demuestra un falso positivo del validador.');
  result.recommendations.push('La evidencia histórica no certifica exactitud lingüística ni aprobación al primer intento; prevalecen el contrato y las referencias actuales.');
  return result;
}
async function mlsAutooptHistoryProfile(env, context, base) {
  try {
    const bounds=mlsAutooptBounds(context);
    const {results}=await env.WIKI_DB.prepare(`SELECT s.* FROM wiki_autoopt_history_stats s
      JOIN wiki_autoopt_history_batches b ON b.id=s.batch_id AND b.state='active'
      WHERE s.version=? AND s.prompt=? AND s.family_key=? AND s.profile_key=? LIMIT 8`)
      .bind(MLS_AUTOOPT_HISTORY_VERSION,context.promptVersion,mlsAutooptKey(context),mlsAutooptHistoryProfileKey(context,bounds)).all();
    const sum={};
    for(const r of results) for(const key of ['publications','incidents','words_sum','sections_sum','references_sum','activity_like','length_errors']) sum[key]=(sum[key]||0)+r[key];
    return mlsAutooptHistoryBlend(base,context,sum,bounds);
  } catch {
    // Historical advice is optional; absent migration must not break live editing.
    console.error('mls-autoopt-history-unavailable');
    return base;
  }
}
if (typeof module !== 'undefined' && module.exports) module.exports={mlsAutooptHistorySchema,mlsAutooptHistoryProfileKey,mlsAutooptHistoryBlend};
