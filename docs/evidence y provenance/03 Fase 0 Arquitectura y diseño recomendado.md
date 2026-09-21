# Fase 0 — Arquitectura y diseño recomendado

Programa: MLS Evidence & Provenance R33  
Evidence version propuesta: `1.0`  
Estado: diseño de Foundation  
Repositorio auditado: `dpidiaz/llmchatmls`  
Base auditada: `main@47c720005bfc0a3ceab1aad46079d4db913ffb61`  
Fecha: 2026-09-21

---

## 1. RESULTADO EJECUTIVO

La arquitectura R32 permite añadir Evidence & Provenance sin reestructurar el corpus ni convertir `wiki_articles` en una tabla bibliográfica.

La recomendación es una **capa normalizada y separada en D1**, ligada a la versión exacta del artículo mediante `code + generated_at + article_hash`.

Principio de implementación:

```
wiki_articles
    │
    ├── wiki_article_provenance        ← origen editorial/staging R32 existente
    │
    ├── wiki_evidence_entry_state      ← estado efectivo R33
    ├── wiki_evidence_claims           ← claim clusters
    ├── wiki_evidence_links            ← claim ↔ source
    ├── wiki_evidence_conflicts        ← contradicciones/variación pendiente
    ├── wiki_evidence_reviews          ← historial de verificación
    └── wiki_article_revisions         ← solo cuando el texto realmente cambia

wiki_sources                         ← Source Registry deduplicado
```

No se recomienda añadir columnas Evidence a `wiki_articles` durante Foundation.

Una entrada sin fila vigente en `wiki_evidence_entry_state`, o cuya versión no coincida con el artículo canónico actual, se interpreta como:

`UNSOURCED`

sin modificar R32.

---

# 2. CURRENT ARCHITECTURE

## 2.1 Artículo canónico

`wiki_articles` contiene actualmente:

- code;
- language;
- language_name;
- n;
- title;
- level;
- part;
- chapter;
- article_markdown;
- provider;
- model;
- audit_provider;
- audit_model;
- prompt_version;
- generated_at.

`code` es PRIMARY KEY.

El flujo R32 publica con `ON CONFLICT(code) DO NOTHING`. La arquitectura vigente está diseñada para no sobrescribir silenciosamente una entrada ya existente.

## 2.2 Corpus canónico GitHub

El corpus exportado bajo `content/` contiene 10,133 entradas.

Medición del árbol Git en Fase 0:

- entradas canónicas: 10,133;
- payload de archivos de entrada, excluyendo manifests: aproximadamente **31.3 MB**;
- media aproximada por entrada: **3.1 KB**;
- mediana observada de archivos JSON: ~2.7 KB;
- P95 observado: ~4.6 KB.

El manifiesto principal es mucho mayor y no debe utilizarse como referencia de tamaño por entrada.

Conclusión: duplicar artículos completos dentro de Evidence de forma rutinaria sería innecesario. Las revisiones con snapshot completo deben crearse únicamente cuando exista una modificación real que requiera auditoría.

## 2.3 Provenance editorial existente

R32 ya contiene `wiki_article_provenance`:

```text
code PRIMARY KEY
origin
standard
prompt_version
staging_run_id
snapshot_version
snapshot_commit
staged_at
integrated_at
source_audit_model
recorded_at
```

La tabla registra actualmente provenance de GitHub Staging.

No debe convertirse en una tabla de Evidence ni reemplazarse.

## 2.4 AUTOOPT

AUTOOPT 1.0:

- observa eventos editoriales;
- mide intentos, longitudes y resultados;
- no almacena el artículo;
- no certifica exactitud;
- no debe reinterpretarse como evidence;
- ya separa `autooptVersion` de `promptVersion`.

R33 añadirá `evidenceVersion` sin modificar la semántica histórica de AUTOOPT.

## 2.5 Semantic Audit

Existe `wiki_semantic_audits`, ligado a:

`code + article_generated_at`

Su contrato declara explícitamente:

- diagnostic only;
- no automatic correction;
- no automatic publish;
- no certificación de exactitud.

Por tanto:

**Semantic Audit ≠ Evidence Verification.**

Puede utilizarse en el futuro como señal de priorización del backlog de Evidence, pero nunca como sustituto de fuentes.

## 2.6 Style references

El flujo editorial R32 utiliza `references/referenceCodes` y `styleAuthority = published-corpus`.

Sirven para calibrar:

- longitud;
- densidad;
- estructura;
- headings;
- ejemplos;
- estilo.

No constituyen bibliografía.

R33 conservará estos campos por compatibilidad y añadirá nomenclatura Evidence independiente.

## 2.7 GitHub Staging

Staging ya proporciona:

- snapshot versionado;
- snapshot commit inmutable;
- selección/reserva;
- validación R32;
- commit con HEAD esperado;
- `force:false`;
- reconciliación;
- `preservedExisting`;
- provenance de integración.

Evidence debe aprovechar estos patrones de concurrencia e idempotencia, no crear un segundo staging general.

## 2.8 Profesor IA

Profesor IA recibe actualmente contexto estructurado de la entrada desde el cliente.

No consulta Evidence ni D1 para fundamentación.

Punto de integración futuro recomendado:

```
entry context
+ evidence summary
+ evidenceStatus
+ principales source titles
```

No enviar bibliografías extensas ni todos los claims al modelo por defecto.

## 2.9 Virtuoso

Virtuoso:

- recupera candidatos desde índices/catálogos canónicos;
- valida códigos contra el catálogo;
- usa Gemma para reranking;
- tiene fallback determinista.

Punto de integración futuro recomendado:

- añadir `evidenceStatus` a metadata de candidato;
- usar VERIFIED únicamente como desempate cuando relevancia sea equivalente;
- no excluir UNSOURCED;
- no consultar GitHub por consulta.

## 2.10 Search

La búsqueda semántica usa archivos estáticos del runtime y un endpoint de embedding.

Evidence no debe incorporarse al vector de contenido en Foundation.

Una señal compacta de `evidenceStatus` podrá añadirse más adelante a catálogos de metadata si se demuestra útil.

## 2.11 Offline

El Service Worker trata `/api/*` como network-only.

El lector canónico es estático/offline-capable.

Consecuencia:

- el artículo debe seguir leyendo offline aunque Evidence API no esté disponible;
- Foundation no debe convertir Evidence en dependencia de lectura;
- un futuro bloque “Fuentes y fundamento” offline deberá provenir de un snapshot estático opcional y compacto, no de una llamada API obligatoria.

---

# 3. REUSABLE COMPONENTS

Reutilizar:

1. `ensureWikiDb` como patrón de migración aditiva.
2. D1 `batch()` para atomicidad.
3. índices parciales/únicos ya utilizados por Chat Editorial.
4. hash/idempotencia de AUTOOPT y Chat Editorial.
5. guardas de versión exacta usadas por Semantic Audit.
6. patrón HEAD esperado + `force:false` de GitHub Staging.
7. `wiki_article_provenance` para origen editorial.
8. autenticación privada de Chat Editorial.
9. OpenAPI privado como superficie chat-native.
10. tests `node:test` + SQLite/Miniflare ya existentes.
11. canonical runtime como fuente de lectura del usuario.
12. predeploy como ensamblador; no editar `src/index.js` generado directamente.

---

# 4. CONFLICTS / NO REUSE

## 4.1 Semantic Audit

No reutilizar `wiki_semantic_audits.verdict` como `evidenceStatus`.

Motivo: un juicio diagnóstico de ChatGPT/humano sin fuentes no equivale a verificación documental.

## 4.2 AUTOOPT

No utilizar:

- firstPassSuccessRate;
- confidence;
- published;
- validationAttempts;

como señal de verdad.

## 4.3 R32 references

No migrar automáticamente `referenceCodes` a EvidenceLink.

## 4.4 wiki_article_provenance

No guardar sources/claims dentro de esta tabla.

Su propósito actual es procedencia de creación/integración.

## 4.5 GitHub Staging

No usar GitHub como base de datos de Source Registry.

## 4.6 Canonical schema R32

No modificar inmediatamente `canonical-entry.schema.json` para hacer Evidence obligatorio.

Eso haría que 10,133 entradas R32 dejen de validar.

---

# 5. SCHEMA OPTIONS

## Option A — añadir columnas/JSON a wiki_articles

Ejemplo:

```
evidence_status
evidence_json
sources_json
```

Ventajas:

- pocas tablas;
- lectura sencilla.

Problemas:

- acopla R33 al artículo R32;
- modifica una tabla ampliamente consumida;
- duplica sources;
- dificulta dedupe;
- dificulta historia;
- JSON grande por entrada;
- empeora concurrencia;
- hace más difícil invalidar Evidence cuando cambia el artículo.

**Decisión: REJECT.**

## Option B — capa D1 normalizada separada

Tablas dedicadas para source registry, state, claims, links, conflicts, reviews y revisiones.

Ventajas:

- R32 intacto;
- fuentes reutilizables;
- queries explícitas;
- estados parciales;
- historial;
- invalidación por versión;
- idempotencia;
- métricas por gate;
- no obliga Evidence al lector.

Costo:

- más joins;
- requiere contratos deterministas;
- mayor trabajo inicial.

**Decisión: RECOMMENDED.**

## Option C — GitHub Evidence como fuente de verdad

Guardar claims/sources/evidence en shards Git y cargar al runtime.

Ventajas:

- auditabilidad Git;
- D1 reducido.

Problemas:

- contradice el principio runtime-first;
- muchas mutaciones GitHub;
- peor concurrencia;
- consultas más complejas;
- riesgo de file explosion;
- uso incorrecto de GitHub como DB.

**Decisión: REJECT como runtime source of truth.**

Snapshots compactos Git siguen permitidos en el futuro como export/versioning.

---

# 6. RECOMMENDED DESIGN

## 6.1 Version identity

Toda Evidence debe pertenecer a una versión exacta.

Identidad recomendada:

```
entryCode
articleGeneratedAt
articleHash
```

`articleHash = SHA256(article_markdown normalizado de forma estable)`

No confiar únicamente en `generated_at`.

Si el artículo actual no coincide con ambos:

- no borrar historial;
- el estado efectivo vuelve a UNSOURCED;
- la verificación anterior queda histórica.

## 6.2 Source Registry

Tabla candidata:

`wiki_sources`

Campos recomendados:

```text
source_id TEXT PRIMARY KEY
identity_kind TEXT NOT NULL
identity_key TEXT NOT NULL
metadata_hash TEXT NOT NULL

source_type TEXT NOT NULL
authority_tier TEXT NOT NULL
status TEXT NOT NULL

title TEXT NOT NULL
authors_json TEXT NOT NULL DEFAULT '[]'
contributors_json TEXT NOT NULL DEFAULT '[]'
institution TEXT
publication_year INTEGER
publication_date TEXT
publisher TEXT
edition TEXT
container_title TEXT
journal TEXT
volume TEXT
issue TEXT
pages TEXT
article_number TEXT
isbn TEXT
issn TEXT
doi TEXT
canonical_url TEXT
language TEXT
topics_json TEXT NOT NULL DEFAULT '[]'

resource_version TEXT
supersedes_source_id TEXT
accessed_at TEXT
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

### Source identity

No se recomienda un contador global `MLS-SRC-000001` como identidad técnica.

Concurrencia multi-chat haría del contador un punto de coordinación innecesario.

Recomendación:

```
MLS-SRC-<deterministic hash>
```

derivado, en orden, de:

1. DOI normalizado;
2. ISBN normalizado;
3. canonical URL normalizada;
4. fingerprint bibliográfico normalizado.

La UI puede mostrar un alias corto si se desea.

Esto hace el upsert idempotente incluso desde chats distintos.

### Dedup indexes

Índices únicos parciales conceptuales:

- normalized DOI;
- normalized ISBN;
- normalized canonical URL;
- fingerprint.

No confiar únicamente en título/autor.

## 6.3 Entry evidence state

Tabla candidata:

`wiki_evidence_entry_state`

Una fila por código como caché del estado vigente.

Campos:

```text
code TEXT PRIMARY KEY
article_generated_at TEXT NOT NULL
article_hash TEXT NOT NULL
evidence_version TEXT NOT NULL
status TEXT NOT NULL
claims_total INTEGER NOT NULL
claims_verified INTEGER NOT NULL
sources_total INTEGER NOT NULL
conflicts_total INTEGER NOT NULL
needs_review INTEGER NOT NULL DEFAULT 0
evidence_revision INTEGER NOT NULL
source_revision INTEGER NOT NULL
citation_style TEXT NOT NULL
citation_edition INTEGER NOT NULL
citation_profile TEXT NOT NULL
citation_renderer_version TEXT NOT NULL
verified_at TEXT
reviewed_at TEXT
updated_at TEXT NOT NULL
```

Esta fila no es el historial.

Es un resumen rápido.

Regla:

si `article_generated_at/article_hash` no coincide con `wiki_articles`, no se considera vigente.

## 6.4 Claims

Tabla candidata:

`wiki_evidence_claims`

```text
claim_id TEXT PRIMARY KEY
code TEXT NOT NULL
article_generated_at TEXT NOT NULL
article_hash TEXT NOT NULL
section_key TEXT
summary TEXT NOT NULL
claim_type TEXT NOT NULL
materiality TEXT NOT NULL
status TEXT NOT NULL
created_at TEXT NOT NULL
verified_at TEXT
verification_revision INTEGER
```

`materiality` propuesta:

- substantial;
- supporting;
- constructed_example.

Los `constructed_example` no cuentan como claim sustancial a verificar, pero la regla que ilustran sí.

Claim IDs deben ser deterministas por versión + fingerprint semántico normalizado cuando sea posible.

## 6.5 Evidence links

Tabla candidata:

`wiki_evidence_links`

```text
link_id TEXT PRIMARY KEY
claim_id TEXT NOT NULL
source_id TEXT NOT NULL
support_type TEXT NOT NULL
locator_json TEXT NOT NULL DEFAULT '{}'
notes TEXT
verification_method TEXT NOT NULL
verified_at TEXT
created_at TEXT NOT NULL
```

Support types:

- supports;
- partially_supports;
- contextualizes;
- contradicts;
- primary_source;
- secondary_interpretation.

`locator_json` puede contener únicamente localizadores explícitos:

- page;
- pageRange;
- chapter;
- section;
- paragraph;
- table;
- figure;
- timestamp;
- urlFragment.

No contiene texto completo de la fuente.

## 6.6 Conflicts

Tabla candidata:

`wiki_evidence_conflicts`

Campos:

```text
conflict_id TEXT PRIMARY KEY
code TEXT NOT NULL
article_generated_at TEXT NOT NULL
claim_id TEXT NOT NULL
conflict_type TEXT NOT NULL
status TEXT NOT NULL
context TEXT NOT NULL
resolution TEXT
needs_review INTEGER NOT NULL DEFAULT 1
created_at TEXT NOT NULL
resolved_at TEXT
```

Tipos sugeridos:

- contradiction;
- regional_variation;
- standard_variation;
- register_variation;
- historical_variation;
- metadata_conflict.

Variación legítima resuelta no debe bloquear VERIFIED.

Una contradicción sustantiva no resuelta sí.

## 6.7 Reviews

Tabla candidata:

`wiki_evidence_reviews`

Append-only.

```text
review_id TEXT PRIMARY KEY
code TEXT NOT NULL
article_generated_at TEXT NOT NULL
article_hash TEXT NOT NULL
evidence_version TEXT NOT NULL
evidence_revision INTEGER NOT NULL
source_revision INTEGER NOT NULL
status_before TEXT NOT NULL
status_after TEXT NOT NULL
claims_total INTEGER NOT NULL
claims_verified INTEGER NOT NULL
sources_total INTEGER NOT NULL
conflicts_total INTEGER NOT NULL
reviewer_type TEXT NOT NULL
reviewer TEXT
verification_method TEXT NOT NULL
citation_renderer_version TEXT NOT NULL
notes TEXT
run_id TEXT
created_at TEXT NOT NULL
```

No guardar prompt completo.

## 6.8 Article revisions

Tabla candidata:

`wiki_article_revisions`

Crear snapshot solo cuando el texto cambia.

Campos mínimos:

```text
revision_id TEXT PRIMARY KEY
code TEXT NOT NULL
revision_number INTEGER NOT NULL
parent_revision_id TEXT
article_markdown TEXT NOT NULL
article_hash TEXT NOT NULL
source_generated_at TEXT NOT NULL
change_reason TEXT NOT NULL
evidence_review_id TEXT
status TEXT NOT NULL
created_at TEXT NOT NULL
UNIQUE(code, revision_number)
UNIQUE(code, article_hash)
```

Estados iniciales:

- baseline;
- proposed;
- canonical;
- superseded.

Foundation crea el modelo y sus guardas.

El mecanismo definitivo de actualización canónica se valida durante el piloto; no se debe introducir un overwrite directo prematuro.

## 6.9 Provenance composition

No crear una segunda tabla genérica de provenance.

La respuesta provenance R33 se compone de:

```
wiki_articles
+ wiki_article_provenance
+ wiki_evidence_entry_state
+ latest wiki_evidence_review
+ wiki_article_revisions cuando existan
```

Esto permite responder:

- origen;
- modelo generador;
- auditor editorial;
- promptVersion;
- staging run;
- snapshot commit;
- evidenceVersion;
- evidence revision;
- sources;
- verifiedAt;
- revision history.

---

# 7. DETERMINISTIC STATUS MACHINE

## 7.1 UNSOURCED

Se devuelve cuando:

- no existe state vigente; o
- state pertenece a otra versión/hash; o
- no existe evidence mapping suficiente.

No significa incorrecto.

## 7.2 SOURCED

Requisitos mínimos:

- existe state vigente;
- existe al menos una Source válida;
- existe al menos un EvidenceLink a un claim actual;
- metadata mínima de Source pasa validación.

No exige cobertura completa.

## 7.3 VERIFIED

Solo puede promover backend si:

1. la versión/hash del artículo coincide;
2. `claimsTotal > 0`;
3. todos los claims `substantial` están verificados;
4. cada claim substantial tiene al menos un EvidenceLink que cuente como soporte según su source policy;
5. Tier X nunca cuenta;
6. `contextualizes` por sí solo no verifica;
7. `partially_supports` por sí solo no verifica;
8. no existe contradicción sustantiva unresolved;
9. locators obligatorios para ese claim/source están presentes;
10. Source metadata pasa validación;
11. APA metadata requerida para el tipo pasa validación;
12. cualquier corrección textual necesaria pasó Editorial Validation;
13. existe review event para la transición.

Nunca aceptar `status=VERIFIED` enviado por el cliente sin recalcularlo.

## 7.4 REVIEWED

Requisitos:

- VERIFIED vigente;
- revisión editorial posterior explícita;
- review event distinto del evento de verificación;
- `reviewed_at > verified_at`.

No utilizar REVIEWED como una probabilidad de verdad.

---

# 8. SOURCE POLICY

La política debe resolver dos cosas por separado:

1. **authority policy**: qué tiers/tipos pueden respaldar cada claim;
2. **regional policy**: qué autoridades y variedades son preferentes por idioma.

Estructura conceptual:

```json
{
  "version": "1.0",
  "language": "espanol-guatemala",
  "defaultAllowedTiers": ["A", "B", "C", "D"],
  "claimRules": {
    "normative": {
      "requiresStrongSource": true,
      "strongTiers": ["A", "B"]
    }
  },
  "variation": {
    "regional": true,
    "doNotTreatAsConflictByDefault": true
  },
  "approvedSourcePool": []
}
```

No llenar el approvedSourcePool con fuentes no verificadas.

---

# 9. APA / URL DESIGN

## 9.1 Metadata first

Guardar metadata estructurada.

No guardar una referencia APA como identidad.

## 9.2 Renderer

Renderer inicial:

- `citationStyle = APA`
- `citationEdition = 7`
- `citationProfile = URL-GT-2025`
- `citationRendererVersion = 1.0`

Foundation debe fallar cerrado para un tipo bibliográfico no soportado.

No improvisar una referencia.

## 9.3 Tipos mínimos del piloto

Implementar primero:

- book;
- book_chapter;
- journal_article;
- institutional_webpage;
- report;
- reference_entry.

Añadir otros tipos después de tests específicos.

## 9.4 Validator

El validator comprueba metadata requerida por tipo.

El renderer no determina autoridad.

## 9.5 Ediciones futuras

Una nueva edición APA crea nuevo rendererVersion/citationEdition.

No reescribir historial.

---

# 10. CHAT-NATIVE API DESIGN

## Foundation API recomendada

Superficie privada bajo:

`/api/wiki/editorial/evidence/`

### Read

- `GET entry?code=<code>`
- `GET status`
- `GET sources?code=<code>`

### Write

- `POST proposal`
- `POST validate`
- `POST verify`
- `POST review`

### Source Registry

`proposal` puede incluir sources estructuradas.

El backend:

1. normaliza;
2. deduplica;
3. asigna deterministic sourceId;
4. guarda/recicla Source;
5. guarda claims/links de la propuesta;
6. incrementa evidenceRevision bajo optimistic concurrency.

No permitir escrituras parciales sin revision token.

## Optimistic concurrency

Toda mutación de una entrada debe incluir:

- `code`;
- `articleGeneratedAt`;
- `articleHash`;
- `expectedEvidenceRevision`.

Si cambia:

HTTP 409.

No sobrescribir trabajo de otro chat.

## Research orchestration

El Worker no necesita implementar un crawler en Foundation.

Flujo recomendado:

```
ChatGPT
  → obtiene entrada + policy + registry
  → investiga fuentes externas
  → lee evidencia relevante
  → envía proposal estructurada
Worker
  → normaliza/deduplica
  → valida determinísticamente
  → persiste
ChatGPT
  → solicita validate / verify
```

Ventajas:

- FREE ONLY;
- sin APIs académicas pagadas;
- sin crawling runtime;
- rate limits gestionados en la capa de investigación;
- backend no confunde búsqueda con verificación.

---

# 11. D1 IMPACT ESTIMATE

Estas cifras son **estimaciones de payload equivalente**, no mediciones de facturación D1. El piloto debe reemplazarlas por métricas reales.

## Escenario lean

Supuestos:

- 4 claims/entry;
- 1.2 links/claim;
- fuerte reutilización de sources.

Orden aproximado: **30–45 MB** de metadata para corpus completo, antes de overhead de índices.

## Escenario expected

Supuestos:

- 6 claims/entry;
- 1.5 links/claim;
- ~0.25 nuevas sources/entry gracias a reuse.

Orden aproximado: **50–80 MB** de metadata, antes de overhead de índices.

## Escenario high

Supuestos:

- 10 claims/entry;
- 2 links/claim;
- menor reutilización.

Orden aproximado: **110–180 MB** con índices/metadata adicionales.

Conclusión:

Evidence puede seguir siendo pequeño en relación con un sistema documental siempre que:

- no duplique artículos;
- no guarde PDFs;
- no guarde citas extensas;
- reutilice Source;
- evite event logs redundantes.

## Writes por primera verificación

Hipótesis inicial para benchmark:

- 1 state;
- 4–10 claims;
- 5–20 links;
- 0–5 sources nuevas;
- 1 review;
- 0–2 conflicts.

Orden esperado: **~12–35 row writes por entrada** en primer verification, con menos source writes al crecer el registry.

Debe medirse en piloto.

---

# 12. GITHUB IMPACT ESTIMATE

Foundation debe añadir principalmente:

- documentación;
- schema/version contracts;
- source policy files;
- tests;
- módulos JS;
- posiblemente snapshots compactos de configuración.

No añadir Evidence runtime por entrada al repo.

Impacto esperado de Foundation: bajo, del orden de cientos de KB, no decenas de MB.

Si posteriormente se exportan snapshots Evidence:

- usar shards;
- batch writes;
- no un archivo por claim;
- no un commit por entry.

---

# 13. SIZE BUDGET

Baseline medido de artículos canónicos:

~31.3 MB para 10,133 entradas.

Objetivos iniciales:

- piloto 20: Evidence metadata muy por debajo de 250 KB;
- gate 100: medir bytes/entry;
- gate 500: proyectar corpus;
- si Evidence metadata supera de forma sostenida ~2× el corpus textual sin una razón auditiva clara, revisar granularidad y duplicación.

Esto es un guardrail de arquitectura, no un límite contractual rígido.

---

# 14. INDEX STRATEGY

Crear índices solo para queries concretas.

Candidatos Foundation:

`wiki_sources`

- unique identity_key;
- status;
- authority_tier cuando lo requiera administración.

`wiki_evidence_entry_state`

- status;
- updated_at.

`wiki_evidence_claims`

- (code, article_generated_at);
- status.

`wiki_evidence_links`

- claim_id;
- source_id.

`wiki_evidence_conflicts`

- (code, status);
- claim_id.

`wiki_evidence_reviews`

- (code, created_at).

`wiki_article_revisions`

- (code, revision_number).

No crear índices de language/family en todas las tablas por anticipación.

---

# 15. VIRTUOSO, PROFESOR IA, SEARCH Y READER

## Foundation

No modificar comportamiento público todavía.

## Después del piloto

### Reader

Añadir bloque opcional:

**Fuentes y fundamento**

cargado de forma progresiva.

Si API no responde:

- el artículo sigue visible;
- no mostrar error alarmante;
- indicar que la fundamentación no está disponible en ese momento.

### Offline

Crear snapshot compacto únicamente si se decide que Evidence debe verse offline.

No hacer network Evidence requisito para lectura.

### Profesor IA

Añadir resumen pequeño de Evidence al contexto.

Reglas:

- UNSOURCED → no afirmar verificación;
- SOURCED → decir fuentes identificadas, no “comprobado”;
- VERIFIED/REVIEWED → puede mencionar respaldo y fuentes;
- conflictos unresolved → explicar que existe discrepancia.

### Virtuoso/Search

`evidenceStatus` puede utilizarse únicamente como señal secundaria de confianza cuando relevancia sea equivalente.

---

# 16. ARTICLE REVISION STRATEGY

No cambiar `wiki_articles` durante Foundation.

Durante piloto, cuando Evidence exija corregir texto:

1. verificar `generated_at + hash`;
2. crear snapshot baseline si todavía no existe;
3. guardar proposed revision;
4. ejecutar Editorial Validator;
5. ejecutar Evidence Validator sobre proposed revision;
6. integrar únicamente con guard de concurrencia;
7. marcar revision canonical;
8. preservar parent revision;
9. actualizar provenance/review;
10. reconstruir/exportar canonical GitHub mediante flujo controlado.

El mecanismo exacto de integración D1 ↔ GitHub se debe probar con las 20 entradas antes de generalizar.

---

# 17. FAILURE MODES

Fail closed para:

- article version mismatch;
- evidence revision mismatch;
- source metadata inválida;
- source unresolved usada como soporte;
- Tier X usado para verificar;
- locator requerido ausente;
- unresolved substantive conflict;
- APA source type no soportado;
- repo context mismatch.

Fail open para lectura R32:

- Evidence API caída;
- entrada UNSOURCED;
- source UI no disponible.

---

# 18. PHASE 1 IMPLEMENTATION UNITS

Orden recomendado:

## F1 — Contracts and schema

- evidence constants;
- source normalization;
- deterministic IDs;
- additive DDL;
- schema tests.

## F2 — Source Registry

- normalize;
- validate;
- dedupe;
- upsert;
- read.

## F3 — Claims and links

- claim model;
- locator model;
- support types;
- conflicts.

## F4 — State machine and validator

- UNSOURCED;
- SOURCED;
- VERIFIED guard;
- REVIEWED guard.

## F5 — APA

- metadata validator;
- renderer supported types;
- citation versioning;
- tests.

## F6 — Reviews and revision model

- append-only reviews;
- optimistic concurrency;
- revision storage;
- no canonical overwrite yet.

## F7 — Private API/OpenAPI

- entry;
- status;
- sources;
- proposal;
- validate;
- verify;
- review.

## F8 — Regression certification

- Evidence tests;
- Chat Editorial;
- staging;
- AUTOOPT;
- canonical tools;
- accessibility baseline;
- predeploy;
- dry-run check.

No production deploy.

---

# 19. RISKS

## Highest

1. False VERIFIED caused by permissive validator.
2. Citation laundering.
3. Source duplication.
4. Concurrent chat overwrite.
5. Treating regional variation as contradiction.
6. Canonical article drift between D1 and GitHub.
7. Auto-deploy behavior on branch pushes.

## Mitigations

- hard backend gates;
- exact article hash;
- optimistic evidence revision;
- deterministic source identity;
- policy per language;
- no automatic canonical overwrite in Foundation;
- inspect Cloudflare Git integration before pushing production-code changes.

---

# 20. FASE 0 EXIT DECISION

Fase 0 architecture is sufficiently defined to begin Foundation.

Recommended architecture:

**Option B — normalized additive D1 layer.**

Locked implementation principles:

1. no Evidence columns in `wiki_articles` Foundation;
2. no reuse of Semantic Audit as verification;
3. no reuse of style references as Evidence;
4. Source Registry global and deduplicated;
5. evidence bound to exact article version/hash;
6. deterministic backend status machine;
7. provenance composed from existing + Evidence review/revision data;
8. article revisions only when content changes;
9. APA generated from structured metadata;
10. Worker does not autonomously crawl/search in Foundation;
11. reader remains usable without Evidence;
12. no production deploy during Foundation certification.

Next state:

**FASE 1 — FOUNDATION / READY TO START.**
