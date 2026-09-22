'use strict';
const fs=require('node:fs');

const TARGET='src/index.js';
const MARKER='// MLS R33 EVIDENCE READER VISIBILITY 1.0';

const SERVER_HELPER=`
async function mlsAttachPublicEvidence(env, article) {
  if (!article || typeof MLS_EVIDENCE_CONSUMER === "undefined") return article;
  try {
    const code = String(article.code || "").toUpperCase();
    if (!code) return article;
    const exists = await env.WIKI_DB.prepare("SELECT 1 AS ok FROM wiki_evidence_entry_state WHERE code=? LIMIT 1").bind(code).first();
    if (!exists) return { ...article, evidence: null };
    const context = await MLS_EVIDENCE_CONSUMER.contextForEntry(env, code);
    return { ...article, evidence: MLS_EVIDENCE_CONSUMER.publicSummary(context) };
  } catch (error) {
    console.warn("MLS Evidence reader summary unavailable:", article?.code, error);
    return { ...article, evidence: null };
  }
}
__name(mlsAttachPublicEvidence, "mlsAttachPublicEvidence");
`.trim();

const CLIENT_HELPER=`
  function ensureEvidenceStatus(article, code, target) {
    const evidence = article?.evidence || null;
    let panel = document.getElementById("mls-evidence-status");
    if (!evidence) {
      panel?.remove();
      return;
    }
    if (!target?.parentElement) return;
    if (!panel) {
      panel = document.createElement("aside");
      panel.id = "mls-evidence-status";
      panel.setAttribute("role", "status");
      panel.setAttribute("aria-live", "polite");
      panel.style.margin = "0 0 16px";
      panel.style.padding = "12px 14px";
      panel.style.border = "1px solid #d8dee8";
      panel.style.borderRadius = "12px";
      panel.style.background = "#f7f8fa";
      panel.style.color = "#253041";
      panel.style.fontSize = "0.95rem";
      panel.style.lineHeight = "1.45";
    }
    panel.dataset.mlsEvidenceCode = code;
    panel.dataset.mlsEvidenceStatus = String(evidence.status || "");
    panel.replaceChildren();

    const label = document.createElement("strong");
    label.textContent = String(evidence.label || evidence.status || "Estado de fuentes");
    label.style.display = "block";
    label.style.fontWeight = "700";
    panel.appendChild(label);

    if (evidence.needsReview) {
      const review = document.createElement("span");
      review.textContent = "Revisión pendiente";
      review.style.display = "block";
      review.style.marginTop = "2px";
      review.style.fontWeight = "600";
      panel.appendChild(review);
    }

    if (evidence.disclosure) {
      const detail = document.createElement("span");
      detail.textContent = String(evidence.disclosure);
      detail.style.display = "block";
      detail.style.marginTop = "4px";
      panel.appendChild(detail);
    }

    if (panel.nextElementSibling !== target) target.insertAdjacentElement("beforebegin", panel);
  }
`.trimEnd();

function patchEvidenceReader(source){
  source=String(source);
  if(source.includes(MARKER))return source;

  const serverAnchor='async function materializeWikiEntryOnVisit(request, env, url, code) {';
  if(!source.includes(serverAnchor))throw new Error('No se encontró materializeWikiEntryOnVisit.');
  source=source.replace(serverAnchor,MARKER+'\n'+SERVER_HELPER+'\n'+serverAnchor);

  const materializedPattern=/flag: "materialized",\n\s+article\n/g;
  const count=(source.match(materializedPattern)||[]).length;
  if(count<3)throw new Error('Se esperaban al menos tres respuestas materialized con article.');
  source=source.replace(materializedPattern,'flag: "materialized",\n      article: await mlsAttachPublicEvidence(env, article)\n');

  const articleRoute='return Response.json({ found: true, article }, { headers: { "cache-control": "public, max-age=3600" } });';
  if(!source.includes(articleRoute))throw new Error('No se encontró la respuesta pública /api/wiki/article.');
  source=source.replace(articleRoute,'return Response.json({ found: true, article: await mlsAttachPublicEvidence(env, article) }, { headers: { "cache-control": "private, no-store" } });');

  const clientAnchor='  function replaceVisibleArticle(article, code) {';
  if(!source.includes(clientAnchor))throw new Error('No se encontró replaceVisibleArticle.');
  source=source.replace(clientAnchor,CLIENT_HELPER+'\n\n'+clientAnchor);

  const cacheAnchor='    articleCache.set(code, article);\n    window.__MLS_CURRENT_AI_ARTICLE__ = { code, article };';
  if(!source.includes(cacheAnchor))throw new Error('No se encontró el punto de render para Evidence.');
  source=source.replace(cacheAnchor,'    ensureEvidenceStatus(article, code, target);\n'+cacheAnchor);

  return source;
}

function install(){
  if(!fs.existsSync(TARGET))throw new Error('No existe src/index.js.');
  const source=fs.readFileSync(TARGET,'utf8');
  const patched=patchEvidenceReader(source);
  fs.writeFileSync(TARGET,patched,'utf8');
  console.log('Evidence visible habilitado en el lector.');
}

if(require.main===module)install();
module.exports={MARKER,SERVER_HELPER,CLIENT_HELPER,patchEvidenceReader,install};
