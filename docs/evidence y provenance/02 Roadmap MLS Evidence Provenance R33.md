# ROADMAP — MLS EVIDENCE & PROVENANCE R33

Estado del documento: VIVO  
Repositorio: `dpidiaz/llmchatmls`  
Base funcional: MLS R32  
Programa: Evidence & Provenance R33  
Última actualización: 2026-09-21  
Responsable operativo: implementación chat native sobre el repositorio real

---

## 1. PROPÓSITO DEL ROADMAP

Este archivo es la fuente de seguimiento de R33.

Debe consultarse:

- antes de comenzar cualquier cambio R33;
- antes de modificar schema D1;
- antes de tocar GitHub Staging;
- antes de añadir endpoints;
- antes de iniciar un gate de migración;
- antes de declarar un checkpoint cerrado.

Debe actualizarse:

- después de cada checkpoint;
- cuando cambie una decisión arquitectónica;
- cuando aparezca un bloqueo;
- cuando un gate se abra o se cierre;
- cuando cambien HEAD, branch, tests o impacto medido.

No utilizar la memoria conversacional como única fuente de estado.

---

## 2. ESTADO GLOBAL

**Estado actual: FASE 2 — PILOTO 20 / PREPARED, START GATE PENDING LIVE D1 TELEMETRY PREFLIGHT**

Progreso global inicial:

| Fase | Estado | Gate |
| --- | --- | --- |
| Documentación contractual R33 | COMPLETE | Prompt y roadmap versionados |
| Fase 0 Auditoría | COMPLETE | Arquitectura y schema recomendados |
| Fase 1 Foundation | COMPLETE | Foundation R33 certificada |
| Fase 2 Piloto 20 | PREPARED — NOT STARTED | Live D1 telemetry preflight + métricas piloto aceptables |
| Fase 3 Evaluación | NOT STARTED | Decisión explícita go/no go |
| Fase 4 Gate 100 | NOT STARTED | 100 estables |
| Fase 5 Gate 500 | NOT STARTED | 500 estables |
| Fase 6 Gate 1000 | NOT STARTED | 1000 estables |
| Fase 7 Escalamiento corpus | NOT STARTED | Viabilidad demostrada |
| Source first para nuevas entradas | DEFERRED | Después de R33 estable |
| AUTOOPT Evidence metrics | DEFERRED | Después de R33 estable |

R33 no está autorizado a saltar directamente a migración masiva.

---

## 3. BASELINE DE REPOSITORIO

Contexto inspeccionado al crear este roadmap:

- SYSTEM: MLS
- REPOSITORY: `dpidiaz/llmchatmls`
- DOMAIN: language
- BASE BRANCH: `main`
- BASE HEAD: `47c720005bfc0a3ceab1aad46079d4db913ffb61`
- DOCUMENTATION BRANCH: `r33-evidence-provenance-docs`

Antes de nuevas escrituras volver a verificar HEAD y branch.

Si el repositorio no coincide:

`REPO_CONTEXT_MISMATCH`

y detener.

---

## 4. HALLAZGOS CONFIRMADOS DE FASE 0

### 4.1 AUTOOPT

Confirmado:

- AUTOOPT 1.0 es observacional.
- No redacta ni verifica verdad.
- `firstPassSuccessRate` no equivale a accuracy.
- Su versionado ya separa `autooptVersion` y `promptVersion`.
- R33 debe añadir `evidenceVersion` sin reinterpretar historial.

### 4.2 Style references

Confirmado:

- R32 utiliza `references` y `referenceCodes` para calibración editorial.
- Esas referencias no son evidencia bibliográfica.
- R33 debe conservar compatibilidad y añadir conceptos explícitos de evidence.

### 4.3 GitHub Staging

Confirmado:

- rama de datos separada;
- snapshot fijado por `snapshotVersion` y `snapshotCommit`;
- commits sobre HEAD esperado;
- `force:false`;
- reconciliación contra D1;
- GitHub no es fallback silencioso;
- D1 no es fallback silencioso;
- start/next/status/validate/stage/cancel staging no consumen D1;
- snapshot e integración sí pueden usar D1.

### 4.4 Provenance existente

Confirmado:

`wiki_article_provenance` ya registra:

- code;
- origin;
- standard;
- prompt_version;
- staging_run_id;
- snapshot_version;
- snapshot_commit;
- staged_at;
- integrated_at;
- source_audit_model;
- recorded_at.

R33 debe extender o relacionar esta estructura, no duplicarla sin razón.

### 4.5 Publicación canónica

Confirmado:

- `wiki_articles.code` actúa como identidad canónica existente.
- staging preserva artículos ajenos como `preservedExisting`.
- no debe etiquetarse provenance staging si el `audit_model` no coincide.

### 4.6 QA y deploy

Scripts actualmente presentes:

- `npm run test:chat-editorial`
- `npm run qa:baseline`
- `npm run predeploy`
- `npm run check`
- `npm run recovery:verify`

`npm run deploy` despliega realmente y no se utiliza como test.

---

## 5. DECISIONES ARQUITECTÓNICAS VIGENTES

| ID | Decisión | Estado |
| --- | --- | --- |
| R33 D001 | Evidence es una capa distinta de AUTOOPT | LOCKED |
| R33 D002 | Style references y evidence sources son conceptos distintos | LOCKED |
| R33 D003 | R32 sigue usable con `UNSOURCED` | LOCKED |
| R33 D004 | D1 guarda estado operativo de Evidence | LOCKED |
| R33 D005 | GitHub conserva contratos/configuración/snapshots/staging, no runtime DB | LOCKED |
| R33 D006 | No un archivo Git por claim | LOCKED |
| R33 D007 | Source Registry normalizado y deduplicado | LOCKED |
| R33 D008 | VERIFIED requiere reglas backend deterministas | LOCKED |
| R33 D009 | APA renderizado deriva de metadata estructurada | LOCKED |
| R33 D010 | APA inicial = 7; perfil institucional = URL Guatemala 2025 | LOCKED |
| R33 D011 | No migración masiva antes de gates | LOCKED |
| R33 D012 | FREE ONLY $0.00 | LOCKED |
| R33 D013 | No imágenes ni ejercicios | LOCKED |
| R33 D014 | Source first queda diferido hasta estabilizar R33 | LOCKED |
| R33 D015 | No deploy remoto como método de prueba | LOCKED |

Cambiar una decisión LOCKED requiere documentar motivo, impacto, compatibilidad y nueva versión semántica cuando corresponda.

---

# 6. FASE 0 — AUDITORÍA Y DISEÑO

**Estado: COMPLETE**

## Objetivo

Comprender completamente R32 y producir un diseño implementable de Foundation sin tocar todavía el corpus masivamente.

## Trabajo completado

- [x] Verificar identidad del repositorio.
- [x] Verificar rama `main`.
- [x] Inspeccionar AUTOOPT.
- [x] Inspeccionar contrato editorial.
- [x] Inspeccionar Chat Editorial.
- [x] Inspeccionar GitHub Staging.
- [x] Confirmar provenance existente.
- [x] Confirmar scripts QA/predeploy actuales.
- [x] Consolidar Master Prompt R33.
- [x] Incorporar APA 7 + perfil URL Guatemala 2025.
- [x] Crear roadmap vivo.

## Trabajo pendiente

Ninguno para el exit gate de Fase 0.

## Trabajo completado adicional

- [x] Inventariar DDL actual de `wiki_articles`, Chat Editorial, AUTOOPT, Semantic Audit y provenance.
- [x] Localizar `ensureWikiArticleProvenanceDb` y su schema exacto.
- [x] Inventariar superficie editorial/OpenAPI relevante.
- [x] Auditar Virtuoso y Profesor IA como consumidores futuros de Evidence.
- [x] Auditar semantic/full text search.
- [x] Auditar `canonical-entry.schema.json`.
- [x] Auditar Service Worker/offline: `/api/*` es network-only y la lectura canónica no depende de Evidence.
- [x] Medir corpus canónico: ~31.3 MB de entradas, ~3.1 KB/entrada.
- [x] Evaluar tres opciones de schema.
- [x] Seleccionar capa D1 normalizada separada.
- [x] Definir state machine UNSOURCED → SOURCED → VERIFIED → REVIEWED.
- [x] Definir guardas deterministas mínimas de VERIFIED.
- [x] Definir optimistic concurrency por generatedAt + articleHash + evidenceRevision.
- [x] Definir estructura conceptual de source policies.
- [x] Definir dedupe Source Registry por DOI/ISBN/URL/fingerprint.
- [x] Definir metadata APA + versionado de renderer.
- [x] Documentar impacto D1/GitHub/tamaño y unidades F1–F8.

Documento de cierre: `03 Fase 0 Arquitectura y diseño recomendado.md`.

## Deliverable de cierre

Debe producir:

```
CURRENT ARCHITECTURE
REUSABLE COMPONENTS
CONFLICTS
SCHEMA OPTIONS
RECOMMENDED DESIGN
RISKS
SIZE IMPACT ESTIMATE
D1 IMPACT ESTIMATE
GITHUB IMPACT ESTIMATE
```

## Exit gate

Fase 0 solo se cierra cuando existe una arquitectura Foundation suficientemente concreta para implementar sin inventar durante el coding.

---

# 7. FASE 1 — FOUNDATION

**Estado: COMPLETE**

## Alcance permitido

Implementar únicamente:

- Source Registry;
- Evidence status;
- Claim model;
- EvidenceLink model;
- Evidence review state;
- provenance extension/relationship;
- article revision minimum viable model;
- deterministic Evidence Validator;
- APA metadata normalization;
- APA renderer/validator foundation;
- source policy configuration;
- tests.

No migrar corpus completo.

## Schema candidates a evaluar

Nombres tentativos, no aprobados todavía:

- `wiki_sources`
- `wiki_evidence_claims`
- `wiki_evidence_links`
- `wiki_evidence_reviews`
- `wiki_article_revisions`

Debe decidirse si `wiki_article_provenance` se amplía o se relaciona con nuevas tablas.

## Progreso de implementación

- [x] F1 contracts: constantes Evidence/APA.
- [x] F1 schema: siete tablas aditivas y sus índices mínimos.
- [x] F1 identidad: articleHash SHA-256, Source/Claim/EvidenceLink IDs deterministas.
- [x] F1 normalización: DOI, ISBN y canonical URL.
- [x] F1 state machine base y optimistic concurrency 409.
- [x] F1 tests dedicados: 12 casos locales verdes.
- [x] F1 certificación completa del PR #125 contra main.
- [x] F2 Source Registry runtime/persistence; repository-certified.
- [x] F3 Claims and links persistence; repository-certified.
- [x] F4 State validator integrado; repository-certified.
- [x] F5 APA renderer/validator; repository-certified.
- [x] F6 Reviews/revisions.
- [x] F7 Private API/OpenAPI.
- [x] F8 Regression certification.
- [x] F9 Contract closure: source policies por los 10 idiomas.
- [x] F9 Contract closure: provenance R32+R33 compuesto explícitamente.
- [x] F9 Contract closure: repo identity / boundary contracts explícitos.

## Required tests

- [x] Source deduplication DOI.
- [x] Source deduplication ISBN.
- [x] Source deduplication canonical URL.
- [x] Fingerprint fallback.
- [x] Invalid DOI.
- [x] Invalid ISBN.
- [x] UNSOURCED default.
- [x] SOURCED transition.
- [x] VERIFIED hard guard.
- [x] Unresolved claims block VERIFIED.
- [x] Contradiction handling.
- [x] Idempotent verification.
- [x] Concurrent verification.
- [x] Revision creation.
- [x] No silent overwrite.
- [x] Style references remain distinct.
- [x] AUTOOPT unchanged.
- [x] GitHub Staging unchanged.
- [x] FREE ONLY.
- [x] Repo identity guard.
- [x] No image storage.
- [x] No exercises.
- [x] APA metadata/render separation.
- [x] Citation versioning.
- [x] No invented locator acceptance.

## Regression gate

Ejecutar scripts existentes que sigan vigentes tras inspeccionar `package.json`.

Mínimo esperado:

```sh
npm run test:chat-editorial
npm run test:evidence
npm run test:canonical-tools
npm run qa:baseline
npm run predeploy
npm run recovery:verify
node --test test/deploy-contract.test.cjs
npm run check
```

No deploy remoto.

## Exit gate

Foundation debe demostrar:

- additive schema;
- idempotent migrations;
- deterministic VERIFIED guard;
- zero R32 regression;
- zero paid dependency;
- no GitHub runtime dependency;
- storage estimate aceptable.

---

# 8. FASE 2 — PILOTO 20

**Estado: PREPARED — START GATE PENDING LIVE D1 TELEMETRY PREFLIGHT**

## Selección

Aproximadamente 20 entradas.

La muestra debe incluir:

- varios idiomas;
- varios niveles;
- varias familias AUTOOPT;
- reglas normativas;
- variación regional;
- ortografía;
- morfología;
- sintaxis;
- pronunciación cuando aplique;
- entradas cortas y extensas;
- al menos algunos casos potencialmente ambiguos o conflictivos.

No elegir solo casos fáciles.

### Muestra preparada

Manifest canónico: `docs/evidence y provenance/04 Pilot 20 Manifest.json`.

Plan operativo: `docs/evidence y provenance/03 Pilot 20 Plan.md`.

La muestra queda bloqueada en 20 entradas reales:

- 10 idiomas;
- 2 entradas por idioma;
- niveles A1, A2, B1, B2, C1, G1 y G4;
- ortografía, morfología, sintaxis, pronunciación, discurso, casos, opcionalidad y variación regional;
- 42,966 caracteres de artículo;
- mínimo 1,052; máximo 6,529;
- identidad fijada por Git blob SHA, `generatedAt` y metadata canónica.

Una entrada que cambie produce `PILOT_ENTRY_VERSION_MISMATCH`; no se sustituye silenciosamente.


## Flujo por entrada

```
LOAD ENTRY
→ CLAIM CLUSTERS
→ SOURCE POLICY
→ SOURCE REGISTRY FIRST
→ APPROVED SOURCE POOL
→ EXTERNAL DISCOVERY ONLY IF NEEDED
→ METADATA VALIDATION
→ READ RELEVANT EVIDENCE
→ EVIDENCE LINKS
→ CONFLICT CHECK
→ ARTICLE CORRECTION IF NEEDED
→ EDITORIAL REVALIDATION
→ EVIDENCE VALIDATION
→ REVISION
→ STATUS
```

## Métricas

Registrar:

- entriesProcessed;
- sourcesCreated;
- sourcesReused;
- sourceDeduplication;
- claimsTotal;
- claimsVerified;
- evidenceLinks;
- evidenceConflicts;
- needsReview;
- verificationAttempts;
- D1RowsRead;
- D1RowsWritten;
- GitHubRequests;
- GitHubMutations;
- repoSizeDelta;
- averageEvidenceBytesPerEntry;
- averageSourcesPerEntry;
- APA validation failures;
- manual review burden.

### Instrumentación preparada

- [x] `proposal` reporta Sources creadas/reutilizadas/actualizadas y operaciones de Claims/Links/conflictos.
- [x] Telemetry D1 por request distingue metadata exacta de filas meramente observadas.
- [x] `d1RowsRead/d1RowsWritten` permanecen `null` si Cloudflare no entrega metadata exacta.
- [x] Endpoint read-only `/api/wiki/editorial/evidence/metrics` calcula bytes lógicos Evidence.
- [x] Manifest integrity y telemetry tests verdes en run #316.
- [x] Full Foundation regression suite verde en run #316.
- [ ] **Start gate live:** confirmar sobre el runtime desplegado del piloto si Cloudflare devuelve `exactRowsRead=true` y `exactRowsWritten=true`.

El Pilot 20 continúa **NOT STARTED** hasta cerrar ese último gate. No se han creado Sources, Claims, Links ni Reviews del piloto en producción.


## Exit gate

No avanzar si:

- existen falsos VERIFIED;
- dedupe es inestable;
- concurrencia sobrescribe;
- Evidence duplica demasiado el corpus;
- D1 impact es incompatible con FREE ONLY;
- APA metadata se pierde al renderizar;
- source discovery se confunde con verification.

---

# 9. FASE 3 — EVALUACIÓN

**Estado: NOT STARTED**

Comparar resultados del piloto contra los objetivos.

Preguntas obligatorias:

1. ¿Qué porcentaje de claims quedó realmente verificado?
2. ¿Cuántas fuentes se reutilizaron?
3. ¿Cuántos conflictos reales aparecieron?
4. ¿Cuánto review manual se requiere?
5. ¿Cuál es el costo D1 por entrada?
6. ¿Cuál es el costo GitHub por batch?
7. ¿Cuál es el crecimiento medio en bytes?
8. ¿Cuántos false matches ocurrieron?
9. ¿El modelo de claims es demasiado granular?
10. ¿Los source tiers están funcionando?
11. ¿La política por idioma necesita ajustes?
12. ¿El renderer APA produce salidas consistentes?
13. ¿Virtuoso/Profesor IA pueden consumir el estado sin exagerarlo?
14. ¿UNSOURCED sigue funcionando sin degradar R32?

Resultado:

`GO`, `CORRECT AND REPEAT` o `STOP`.

No escalar por inercia.

---

# 10. FASE 4 — GATE 100

**Estado: NOT STARTED**

Precondición: Fase 3 = GO.

Objetivo: verificar estabilidad operacional y reuse del Source Registry.

Medir nuevamente todas las métricas.

Añadir especial atención a:

- dedupe cross entry;
- source pools;
- authority tiers;
- language policy;
- batch behavior;
- D1 index efficiency;
- revisions;
- concurrency;
- stale source handling.

---

# 11. FASE 5 — GATE 500

**Estado: NOT STARTED**

Precondición: 100 estable.

Objetivo: validar comportamiento a escala intermedia.

No aceptar crecimiento accidental de:

- archivos Git;
- commits por entry;
- D1 scans;
- duplicated source metadata;
- revisiones redundantes;
- unresolved queues sin política.

---

# 12. FASE 6 — GATE 1000

**Estado: NOT STARTED**

Precondición: 500 estable.

Objetivo: probar que arquitectura, costos y operación chat native son sostenibles antes del resto del corpus.

En este gate debe existir suficiente evidencia para estimar el costo total de las 10,133 entradas.

---

# 13. FASE 7 — ESCALAMIENTO DEL CORPUS

**Estado: NOT STARTED**

Solo después de demostrar:

- correctness;
- idempotency;
- concurrency safety;
- storage viability;
- D1 viability;
- GitHub viability;
- source reuse;
- policy stability;
- QA stability;
- chat native operation.

Escalar en lotes controlados.

Nunca usar “añadimos bibliografía” como criterio de completitud.

---

# 14. SOURCE FIRST PARA ENTRADAS NUEVAS

**Estado: DEFERRED**

No implementar antes del piloto.

Objetivo eventual:

```
TARGET
→ APPROVED SOURCES
→ DRAFT
→ EDITORIAL VALIDATION
→ EVIDENCE VALIDATION
→ PUBLICATION
```

Debe existir un cambio explícito de contrato/versionado antes de convertirlo en flujo canónico.

---

# 15. APA Y PERFIL URL

## Baseline vigente

- citationStyle: APA
- citationEdition: 7
- citationProfile: URL-GT-2025
- citationRendererVersion: 1.0 inicial

## Fuentes normativas iniciales

APA official Publication Manual 7th edition:
`https://www.apa.org/pubs/books/publication-manual-7th-edition-paperback`

Universidad Rafael Landívar, guía APA, segunda edición 2025:
`https://biblioteca.url.edu.gt/vrip/guia-para-citar-obras-en-el-sistema-de-la-american-psychological-association-apa/`

## Regla

APA formatting no es evidencia.

El renderer nunca sustituye metadata normalizada.

---

# 16. RIESGOS ABIERTOS

| Riesgo | Severidad inicial | Mitigación |
| --- | --- | --- |
| Citation laundering | Alta | Claim ↔ source mapping obligatorio |
| Falsos VERIFIED | Alta | Guard backend determinista |
| Fuentes inventadas | Alta | Metadata verification + unresolved |
| Locators inventados | Alta | Validación explícita |
| Source duplication | Media/Alta | DOI/ISBN/URL/fingerprint |
| D1 growth | Media | Benchmark por gate |
| GitHub file explosion | Alta | Runtime en D1 + shards compactos |
| Concurrency overwrite | Alta | Revision guard/reconcile |
| Confundir variation con contradiction | Alta | Source policies por idioma |
| APA string como canonical data | Media | Metadata estructurada + renderer |
| AUTOOPT reinterpretado como truth metric | Alta | Separación contractual |
| R32 regression | Alta | Additive migrations + regression suites |
| Auto deploy al hacer push de ramas | Media/Alta | Verificar integración Cloudflare/GitHub antes de ramas de implementación; distinguir push documental de autorización explícita de release |
| Paid API creep | Alta | FREE ONLY contract |
| Reader clutter | Media | Fuentes y fundamento discreto |
| Search bias excesivo | Media | VERIFIED solo desempata relevancia equivalente |
| Stale institutional source | Media | Version/date/freshness |

---

# 17. MÉTRICAS ACUMULADAS

Actualizar en cada checkpoint.

```yaml
entriesProcessed: 0
sourcesCreated: 0
sourcesReused: 0
claimsCreated: 0
claimsVerified: 0
evidenceLinks: 0
evidenceConflicts: 0
needsReview: 0
verificationAttempts: 0
d1RowsRead: 0
d1RowsWritten: 0
githubRequests: 0
githubMutations: 0
repoSizeDeltaBytes: 0
averageEvidenceBytesPerEntry: null
averageSourcesPerEntry: null
apaValidationFailures: 0
```

No inventar números cuando no se hayan medido.

---

# 18. CHANGE LOG DEL ROADMAP

## 2026-09-21 — Pilot 20 preparado; ejecución aún bloqueada

- PR #134 prepara Phase 2 sin ejecutar Evidence sobre el corpus.
- Se fijó una muestra canónica de 20 entradas: dos por cada idioma MLS.
- La muestra se bloqueó por Git blob SHA + generatedAt + metadata para evitar drift silencioso.
- Se añadió plan operativo y stop conditions.
- Se añadió telemetría por request para D1; rows exactas solo se reportan cuando Cloudflare las entrega.
- `observedRowsRead/observedRowsWritten` quedan separados y nunca sustituyen billed rows.
- `proposal` reporta creación/reutilización de Sources, Claims, Links y conflictos.
- Se añadió medición read-only de bytes lógicos Evidence.
- CI detectó y corrigió dos errores de preparación: familia AUTOOPT esperada incorrecta para MLS-V01-0613 y un placeholder extra en un fixture SQLite.
- GitHub Actions run #316: SUCCESS.
- test:chat-editorial, test:evidence, test:canonical-tools, qa:baseline, predeploy, recovery:verify, deploy-contract y check: SUCCESS.
- Production deploy: SKIPPED.
- Start gate pendiente: preflight live de metadata D1 en el runtime que vaya a ejecutar el piloto.
- entriesProcessed=0; sourcesCreated=0; claimsCreated=0; claimsVerified=0 en producción.

## 2026-09-21 — F9 Contract Closure certificado; Phase 1 COMPLETE

- Se implementaron Source Policies explícitas para los 10 idiomas canónicos MLS.
- approvedSourcePool permanece vacío hasta verificar fuentes reales durante el piloto; no se preaprobaron autoridades concretas por intuición.
- Español Guatemala, Portugués Brasil y Chino Taiwán conservan explícitamente su variante objetivo.
- El Evidence Validator selecciona la policy a partir del language canónico del artículo.
- Se añadió provenance compuesto R32 + R33 reutilizando wiki_article_provenance cuando existe.
- Se añadió endpoint privado read-only de provenance.
- Se declaró y bloqueó la identidad canónica MLS / dpidiaz/llmchatmls / language; mismatch produce REPO_CONTEXT_MISMATCH.
- Tests de boundary impiden paid APIs, GitHub como runtime DB, style-reference laundering, imágenes/ejercicios y overwrite de wiki_articles desde Evidence.
- verifyEntryEvidence quedó idempotente sobre el mismo snapshot: reusa el verification review y no incrementa evidence_revision.
- GitHub Actions run #309: SUCCESS.
- test:chat-editorial, test:evidence, test:canonical-tools, qa:baseline, predeploy, recovery:verify, deploy-contract y check: SUCCESS.
- Production deploy: SKIPPED.
- No se crearon Sources, Claims ni EvidenceLinks en D1 de producción.
- Phase 1 queda COMPLETE. Phase 2 Pilot 20 queda READY pero NOT STARTED.

## 2026-09-21 — F8 Regression certification aprobado; gap audit de cierre

- GitHub Actions run #303: SUCCESS.
- Pasaron explícitamente `test:chat-editorial`, `test:evidence`, `test:canonical-tools`, `qa:baseline`, `predeploy`, `recovery:verify`, deploy-contract y `check`.
- Production deploy permaneció SKIPPED.
- El gate técnico F8 está aprobado.
- El contraste contra el contrato completo de Foundation detectó tres pendientes antes de cerrar Phase 1: source policies por los 10 idiomas, composición explícita de provenance R32+R33 y boundary/repo identity contracts explícitos.
- Se crea F9 Contract Closure; Phase 1 no se declara COMPLETE hasta que esos contratos estén implementados y recertificados.

## 2026-09-21 — F7 Private Evidence API certificado

- Se añadió el namespace privado `/api/wiki/editorial/evidence/*` bajo la misma autenticación `MLS_EDITORIAL_CHAT_KEY`.
- Operaciones disponibles: status, entry, sources, proposal, validate, verify, review y revision/propose.
- El flujo chat-native queda operativo como `entry → investigación externa de ChatGPT → proposal → validate → verify → review`.
- El Worker no hace crawling ni búsqueda académica automática.
- `proposal` exige versión/hash exactos y `expectedEvidenceRevision`; preflight valida referencias internas antes de escrituras Evidence.
- `validate` es read-only; `proposal`, `verify`, `review` y `revision/propose` son consecuenciales en OpenAPI.
- Los módulos CommonJS de Evidence se empaquetan como IIFEs aisladas para Cloudflare; el runtime generado no conserva `require('./evidence...')`.
- OpenAPI privado pasa a versión 33.0.0, manteniendo el contrato de generación editorial R32/32.0 intacto.
- Se corrigieron dos defectos del ensamblador detectados por CI: un literal regex mal escapado y un bloque residual duplicado; ambos fueron corregidos sin ampliar alcance.
- GitHub Actions run #299: SUCCESS; production deploy SKIPPED.

## 2026-09-21 — F6 Reviews y Article Revisions certificado

- Se añadieron reviews append-only con `review_kind` y `evidence_snapshot_hash`.
- VERIFIED requiere un verification review persistido cuyo hash coincida exactamente con el snapshot Evidence vigente.
- REVIEWED requiere un segundo editorial review posterior y sobre el mismo snapshot.
- Cambiar claims, EvidenceLinks, metadata de Source o conflictos invalida automáticamente el review anterior para el estado efectivo.
- `verificationConfirmed` dejó de ser una vía de promoción: los booleanos de cliente no producen VERIFIED.
- `verifyEntryEvidence` y `reviewEntryEvidence` son las únicas orquestaciones internas de promoción definidas en Foundation.
- Los reviews son idempotentes y conservan historial; un snapshot stale falla con 409.
- Se implementó baseline de artículo y revisiones `proposed` con guard por articleHash.
- F6 no incluye ninguna ruta para sobrescribir `wiki_articles`; la integración canónica queda diferida al piloto.
- GitHub Actions run #290: SUCCESS; deploy de producción SKIPPED.

## 2026-09-21 — F5 APA validator y renderer implementados

- Se verificó nuevamente la base institucional: la guía URL 2025 declara alineación con APA 7.
- Se añadió metadata explícita de editors para capítulos de libro.
- APA Validator soporta inicialmente book, book chapter, journal article, institutional webpage, report y reference entry.
- El renderer produce referencia APA derivada de metadata estructurada y citas parentéticas/narrativas.
- DOI se normaliza como `https://doi.org/...` y tiene prioridad sobre URL.
- Se implementó regla APA 7 de hasta 20 autores y elipsis para más de 20.
- El perfil `URL-GT-2025` usa fechas renderizadas en español para `es-GT`.
- El renderer no inventa sentence case, autores, páginas, DOI ni metadata faltante: falla cerrado cuando un tipo requiere campos ausentes.
- `citationReady` dejó de ser confiable desde el cliente: F4 ahora lo calcula internamente usando el APA Validator sobre las fuentes que realmente sostienen cada claim.
- Una fuente `unresolved` puede renderizarse si su metadata es suficiente, pero nunca cuenta como `citationReady`.
- Suite acumulada local F1–F5: 43/43 verde.
- F4 fue certificado en GitHub Actions run #287 e integrado por PR #128 (`3d6008a...`).

## 2026-09-21 — F4 State validator implementado

- Se añadió validador determinista separado de Editorial Validator y del futuro APA Validator.
- Fuente identificada se distingue de fuente suficientemente fuerte: una fuente débil puede mantener SOURCED sin contar para VERIFIED.
- Claims `normative` requieren Tier A/B por política inicial; la política es configurable.
- Claims `quotation` requieren locator explícito; nunca se inventa uno.
- Cobertura completa no puede alcanzar VERIFIED si `citationReady` es falso.
- Cobertura completa tampoco alcanza VERIFIED sin evento explícito de verificación.
- Contradicción sustantiva unresolved bloquea VERIFIED; variación regional accepted no lo bloquea.
- Estado efectivo vuelve a UNSOURCED automáticamente si cambia el hash/version del artículo.
- Persistencia del state usa `expectedEvidenceRevision` y devuelve conflicto 409 ante revisión obsoleta.
- Un state stale puede reiniciarse a la nueva versión únicamente con expected revision 0.
- 12/12 tests locales de F4 verdes.
- F3 fue certificado por GitHub Actions run #284 e integrado por PR #127 (`305cf098...`).

## 2026-09-21 — F3 Claims, EvidenceLinks y conflictos implementado

- Claims se vinculan obligatoriamente a la versión exacta `code + generatedAt + articleHash`.
- Claim IDs y EvidenceLink IDs son deterministas e idempotentes.
- Los constructed examples se modelan explícitamente y no se convierten por sí solos en claims sustanciales verificados.
- EvidenceLinks requieren Claim y Source existentes.
- Locators aceptan únicamente page, pageRange, chapter, section, paragraph, table, figure, timestamp y urlFragment.
- Un locator ausente permanece ausente: no se inventa página ni sección.
- Conflictos registran `source_ids_json` para preservar qué fuentes intervienen.
- Contradicción unresolved marca needsReview; variación accepted requiere resolución explícita.
- F3 no promueve VERIFIED ni modifica `wiki_evidence_entry_state`; eso queda reservado a F4.
- 10/10 tests locales de F3 verdes.
- F2 quedó certificado por GitHub Actions run #282 y fue integrado en `main` mediante PR #126 (`b494432...`).

## 2026-09-21 — F2 Source Registry implementado

- Se creó `evidence registry.js` con persistencia D1 aislada del runtime público.
- Upsert idempotente: repetir metadata idéntica no genera escritura adicional.
- Deduplicación efectiva por DOI, ISBN, canonical URL y fingerprint.
- Enriquecimiento conservador completa campos ausentes sin crear otra Source.
- Conflictos en metadata fuerte fallan cerrado con `SOURCE_METADATA_CONFLICT` 409.
- Una fuente superseded no puede reactivarse silenciosamente.
- URL estable + `resourceVersion`/publicationDate produce identidad versionada distinta.
- Estado agregado del Source Registry disponible internamente.
- 8/8 tests locales del registry verdes tras corregir el hash para excluir campos transitorios.
- No se crearon Sources, Claims ni EvidenceLinks en D1 real; son pruebas SQLite en memoria.
- Certificación completa del PR pendiente.

## 2026-09-21 — F1 Contracts and schema certificado

- GitHub Actions run #279 completó SUCCESS contra `main`.
- Pasaron `test:chat-editorial`, `predeploy`, `recovery:verify`, deploy-contract y `check`.
- El paso de despliegue de producción del workflow fue SKIPPED.
- F1 cumple su gate técnico y queda listo para merge.

## 2026-09-21 — F1 Contracts and schema iniciado

- Se creó la rama `r33-evidence-provenance-foundation` desde el checkpoint documental.
- Se añadieron contratos y schema aditivos sin conectar Evidence al runtime.
- Se añadieron IDs deterministas y normalización DOI/ISBN/URL.
- Se añadieron guards UNSOURCED/SOURCED/VERIFIED/REVIEWED y concurrencia 409.
- 12 tests dedicados pasaron localmente.
- `test:evidence` y el test de Foundation se añadieron al contrato de tests.
- PR #125 abierto contra `main` para certificación real.
- No se ejecutó migración D1 ni procesamiento de corpus.

## 2026-09-21 — Cierre de Fase 0

- Auditoría D1, provenance, OpenAPI, Virtuoso, Profesor IA, search, offline y canonical schema completada.
- Se rechazó añadir Evidence directamente a `wiki_articles`.
- Se seleccionó arquitectura D1 normalizada separada.
- Se definió vínculo de Evidence a `code + generatedAt + articleHash`.
- Se definió Source Registry global deduplicado.
- Se definieron state machine, concurrency guard, reviews y article revision strategy.
- Se midió el corpus canónico en ~31.3 MB de entradas, ~3.1 KB por entrada.
- Se estimó Evidence completo en escenarios lean/expected/high y se dejó el piloto como autoridad final de métricas.
- Fase 1 queda READY TO START.
- No se modificó código de producción ni D1.

## 2026-09-21 — Baseline documental

- Se creó documentación R33.
- Se consolidó Evidence & Provenance con APA/URL.
- Se verificó repo identity.
- Se confirmó separación AUTOOPT/Evidence.
- Se confirmó que R32 references son style calibration.
- Se confirmó provenance existente de GitHub Staging.
- Se fijó Fase 0 como estado activo.
- No se cambió código de producción.
- No se ejecutó manualmente `npm run deploy` ni un comando remoto de despliegue.
- La integración GitHub → Cloudflare desplegó automáticamente el commit de documentación de la rama; el cambio desplegado contiene solo documentación y no modifica código de producción.
- No se ejecutó migración D1.
- No se procesaron entradas del corpus.

---

# 19. ÚLTIMO CHECKPOINT

Actualizar este bloque al cerrar cada trabajo.

```
STATUS: PHASE 2 PILOT 20 PREPARED — START GATE PENDING LIVE D1 TELEMETRY PREFLIGHT
SYSTEM: MLS
REPOSITORY: dpidiaz/llmchatmls
BRANCH: r33-evidence-pilot-20-preparation
BASE: main
BASE HEAD: a369cff3e0c6b096c1a48b62931f2e1f7f4ce529

DONE:
- Phase 1 Foundation complete and merged
- Pilot 20 plan created
- Pilot 20 manifest created
- 20 canonical entries selected and version-locked
- exactly 2 entries per each of 10 MLS languages
- level and phenomenon coverage locked by test
- Source create/reuse/update telemetry added
- D1 exact-vs-observed telemetry added
- read-only logical Evidence byte measurement added
- private /evidence/metrics endpoint added
- Pilot manifest/telemetry/runtime certification green in run #316

CURRENT:
- Pilot remains NOT STARTED
- Final documentation recertification for PR #134

NEXT:
- Recertify final PR #134 HEAD
- Merge PR #134 if green
- On a separately authorized/deployed Pilot runtime, perform read-only live telemetry preflight
- Start entries 1–4 only if the live D1 telemetry gate is satisfied

BLOCKERS:
- Live D1 telemetry metadata has not yet been observed on the runtime that will execute the pilot

DECISIONS:
- No D1 billed-row number is inferred from observed row counts
- No Pilot source is preapproved merely because it appears plausible
- No sample entry may drift from its locked version silently
- Pilot begins sequentially, checkpoints every 4 entries
- No canonical article overwrite during Pilot 20

AUTOOPT IMPACT:
- None; classifier is only used to characterize the sample

R32 COMPATIBILITY:
- Preserved

EVIDENCE STATUS:
- Foundation complete
- Pilot sample prepared
- Pilot execution not started

ENTRIES PROCESSED:
- 0 production

SOURCES CREATED:
- 0 production

SOURCES REUSED:
- 0 production

CLAIMS CREATED:
- 0 production

CLAIMS VERIFIED:
- 0 production

EVIDENCE LINKS:
- 0 production

CONFLICTS:
- 0 production

NEEDS REVIEW:
- 0 production

D1 IMPACT:
- 0 production Pilot writes
- live exact rows not yet observed

GITHUB IMPACT:
- manifest, plan, telemetry and tests only

TESTS:
- GitHub Actions run #316: SUCCESS
- npm run test:chat-editorial: SUCCESS
- npm run test:evidence: SUCCESS
- npm run test:canonical-tools: SUCCESS
- npm run qa:baseline: SUCCESS
- npm run predeploy: SUCCESS
- npm run recovery:verify: SUCCESS
- deploy-contract: SUCCESS
- npm run check: SUCCESS
- production deploy step: SKIPPED

PR:
- #134 — feat: prepare MLS R33 Evidence Pilot 20
```
---

# 20. PROTOCOLO PARA FUTUROS CHATS

Cuando un chat reciba una instrucción para continuar R33:

1. leer `00 Indice.md`;
2. leer `01 Master Prompt MLS Evidence Provenance R33.md`;
3. leer este Roadmap;
4. verificar repo/branch/HEAD;
5. inspeccionar el código actual relevante, no confiar en snapshots conversacionales;
6. identificar la tarea pendiente exacta del Roadmap;
7. implementar sin ampliar alcance innecesariamente;
8. ejecutar QA correspondiente;
9. actualizar métricas reales;
10. actualizar decisiones si cambiaron;
11. actualizar Change Log;
12. reemplazar Último Checkpoint;
13. commit de documentación junto al cambio cuando corresponda;
14. reportar el formato de checkpoint del Master Prompt.

El Roadmap es parte del sistema de control de cambios R33, no una nota opcional.
