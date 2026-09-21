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

**Estado actual: FASE 0 — AUDITORÍA Y DISEÑO**

Progreso global inicial:

| Fase | Estado | Gate |
| --- | --- | --- |
| Documentación contractual R33 | COMPLETE | Prompt y roadmap versionados |
| Fase 0 Auditoría | IN PROGRESS | Arquitectura y schema recomendados |
| Fase 1 Foundation | NOT STARTED | Tests foundation verdes |
| Fase 2 Piloto 20 | NOT STARTED | Métricas piloto aceptables |
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

**Estado: IN PROGRESS**

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

- [ ] Inventariar todos los DDL actuales relacionados con `wiki_articles`, staging y provenance.
- [ ] Localizar definición exacta/installer de `wiki_article_provenance`.
- [ ] Inventariar endpoints editoriales y rutas OpenAPI que R33 deberá extender.
- [ ] Auditar Virtuoso y Profesor IA para puntos de integración Evidence.
- [ ] Auditar semantic/full text search para futura señal de `evidenceStatus`.
- [ ] Auditar canonical entry schema.
- [ ] Auditar rutas offline para asegurar que Evidence no rompa lectura local.
- [ ] Medir shape y tamaño medio de metadata actual por entrada.
- [ ] Diseñar 2–3 opciones de schema D1.
- [ ] Elegir diseño recomendado con estimación de rows/entry y bytes/entry.
- [ ] Definir transición exacta UNSOURCED → SOURCED → VERIFIED → REVIEWED.
- [ ] Definir reglas deterministas mínimas de VERIFIED.
- [ ] Definir contrato de revision/concurrency.
- [ ] Definir estructura de source policies.
- [ ] Definir Source Registry dedupe/fingerprint.
- [ ] Definir APA metadata schema + renderer versioning.

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

**Estado: NOT STARTED**

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

## Required tests

- [ ] Source deduplication DOI.
- [ ] Source deduplication ISBN.
- [ ] Source deduplication canonical URL.
- [ ] Fingerprint fallback.
- [ ] Invalid DOI.
- [ ] Invalid ISBN.
- [ ] UNSOURCED default.
- [ ] SOURCED transition.
- [ ] VERIFIED hard guard.
- [ ] Unresolved claims block VERIFIED.
- [ ] Contradiction handling.
- [ ] Idempotent verification.
- [ ] Concurrent verification.
- [ ] Revision creation.
- [ ] No silent overwrite.
- [ ] Style references remain distinct.
- [ ] AUTOOPT unchanged.
- [ ] GitHub Staging unchanged.
- [ ] FREE ONLY.
- [ ] Repo identity guard.
- [ ] No image storage.
- [ ] No exercises.
- [ ] APA metadata/render separation.
- [ ] Citation versioning.
- [ ] No invented locator acceptance.

## Regression gate

Ejecutar scripts existentes que sigan vigentes tras inspeccionar `package.json`.

Mínimo esperado:

```sh
npm run test:chat-editorial
npm run qa:baseline
npm run predeploy
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

**Estado: NOT STARTED**

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

## 2026-09-21 — Baseline documental

- Se creó documentación R33.
- Se consolidó Evidence & Provenance con APA/URL.
- Se verificó repo identity.
- Se confirmó separación AUTOOPT/Evidence.
- Se confirmó que R32 references son style calibration.
- Se confirmó provenance existente de GitHub Staging.
- Se fijó Fase 0 como estado activo.
- No se cambió código de producción.
- No se ejecutó deploy.
- No se ejecutó migración D1.
- No se procesaron entradas del corpus.

---

# 19. ÚLTIMO CHECKPOINT

Actualizar este bloque al cerrar cada trabajo.

```
STATUS: DOCUMENTATION BASELINE COMPLETE
SYSTEM: MLS
REPOSITORY: dpidiaz/llmchatmls
BRANCH: r33-evidence-provenance-docs
BASE HEAD: 47c720005bfc0a3ceab1aad46079d4db913ffb61

DONE:
- Combined Master Prompt R33
- APA 7 / URL Guatemala profile
- Living roadmap
- Initial R32 architecture inspection

CURRENT:
- Fase 0 audit and schema design

NEXT:
- Full D1 and endpoint inventory
- Foundation schema options
- Recommended architecture and impact estimates

BLOCKERS:
- None documented

AUTOOPT IMPACT:
- None; documentation only

R32 COMPATIBILITY:
- Preserved

EVIDENCE STATUS:
- No corpus migration started

SOURCES CREATED:
- 0

CLAIMS CREATED:
- 0

CLAIMS VERIFIED:
- 0

CONFLICTS:
- 0 measured

NEEDS REVIEW:
- 0 measured

D1 IMPACT:
- 0 writes from this documentation checkpoint

GITHUB IMPACT:
- Documentation branch only

SIZE DELTA:
- Documentation only

TESTS:
- Not applicable to documentation-only checkpoint
- No deploy executed
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
