# MLS R33 Evidence & Provenance — Correction Repeat dirigido

**Fecha:** 2026-09-22  
**Origen:** Fase 3 Pilot 20  
**Decision anterior:** CORRECT AND REPEAT  
**Gate 100:** BLOQUEADO hasta cerrar E3 y reevaluar  
**Repeat ID:** `MLS-R33-EVIDENCE-CORRECTION-REPEAT-20260922-A`

## 1. Alcance

Este repeat no vuelve a procesar las 20 entradas.

Su objetivo es cerrar de manera dirigida los hallazgos E1–E5 detectados por la evaluación del Pilot 20:

- E1 — DOI granular vs DOI de contenedor;
- E2 — Source reuse cross-entry;
- E3 — lifecycle REVIEWED humano;
- E4 — escalabilidad del control plane;
- E5 — contrato de consumo Evidence para Virtuoso y Profesor IA.

No se autoriza Gate 100 desde este documento.

## 2. E1 — DOI scope — PASS LIVE

La corrección de código de PR #143 fue repetida contra D1 real.

### Recurso `laut`

Bridge command `0274`.

- entrada: `MLS-V05-0881`;
- URL granular: `https://grammis.ids-mannheim.de/praepositionen/299306`;
- DOI compartido: `10.14618/wb-praepositionen`;
- `doiScope = container`;
- Source ID preservado por identidad granular URL: `MLS-SRC-5C3B2FDCD580343CD374`;
- D1: 69 rows read / 4 rows written;
- después del cambio: SOURCED hasta nueva verificación.

### Recurso `mit`

Bridge command `0275`.

- entrada: `MLS-V05-0165`;
- URL granular: `https://grammis.ids-mannheim.de/praepositionen/299660`;
- mismo DOI compartido: `10.14618/wb-praepositionen`;
- `doiScope = container`;
- Source ID granular distinto: `MLS-SRC-37F3FA7F5D30322681BD`;
- Source legacy DOI marcada como superseded: `MLS-SRC-64B6BBB95C5D1F331FDA`;
- D1: 82 reads / 11 writes.

### Validación y re-verificación

Commands `0276–0279`.

`MLS-V05-0881`:

- validate: 3/3 claims, 3 Sources, APA/citation ready;
- VERIFIED;
- evidence revision: 4;
- review: `MLS-REVW-2F875C6B5A791CE1E6F5426A`;
- verification request: 208 reads / 6 writes.

`MLS-V05-0165`:

- validate: 3/3 claims, 5 Sources, APA/citation ready;
- VERIFIED;
- evidence revision: 6;
- review: `MLS-REVW-F12B7B8F3F03D84E16BC7271`;
- verification request: 238 reads / 6 writes.

### Conclusión E1

Dos recursos granulares pueden compartir un DOI de contenedor y seguir teniendo identidades Source distintas por URL.

El DOI de contenedor no sustituye la URL granular como identidad ni como locator APA.

**Resultado:** PASS LIVE.

## 3. E2 — Cross-entry Source reuse — PASS LIVE

Commands `0269–0271`.

La misma Source Duden fue reutilizada desde una entrada distinta:

`MLS-SRC-13608E329726A3D4557A`

La propuesta sobre `MLS-V05-0165` reutilizó el Source ID existente y no creó un duplicado.

Resultados:

- proposal: 78 reads / 9 writes;
- validate: 56 reads / 0 writes;
- verify: 215 reads / 6 writes;
- estado final de `MLS-V05-0165`: VERIFIED.

La actualización compartida de metadata cambió correctamente el hash Evidence de `MLS-V05-0881` e invalidó su review anterior. Esto no fue un fallo: confirmó que una Source compartida forma parte del snapshot auditable.

Después de estabilizar metadata y ejecutar E1, `MLS-V05-0881` fue revalidada y regresó a VERIFIED.

**Resultado:** PASS LIVE.

## 4. E3 — Human REVIEWED lifecycle — PENDING HUMAN

No se creó ningún `reviewerType=human` artificial.

Candidate recomendado para el ejercicio:

`MLS-V05-0881`

Estado técnico actual:

- VERIFIED;
- 3/3 claims sustanciales cubiertos;
- 3 Sources;
- DOI scope ya corregido;
- snapshot actual verificado;
- sin necesidad de sobrescribir el artículo R32.

### Paquete de revisión humana

El humano debe revisar realmente:

1. el artículo canónico;
2. los tres claim clusters;
3. las Sources asociadas;
4. los locators utilizados;
5. las referencias APA;
6. la correspondencia Source ↔ Claim;
7. variación/limitaciones relevantes;
8. que no exista una revisión propuesta tratada como canónica.

Solo después de esa revisión real puede ejecutarse:

`revisarEvidenceMLS`

con una identidad/reviewer humana real.

No aceptar:

- una instrucción genérica como sustituto de review;
- `reviewerType=human` generado por IA;
- promoción automática desde VERIFIED;
- revisión sin comprobar el snapshot vigente.

**Resultado:** PENDING HUMAN. Gate 100 continúa bloqueado.

## 5. E4 — Control plane scaling — PASS / MITIGATED

### Problema observado en Pilot 20

El Bridge basado en archivos Git generaba aproximadamente:

- 1 commit por command;
- 1 commit por result;

por operación remota.

El Pilot acumuló 197 commits desde el baseline del control plane.

### Corrección

Se añadió un batch envelope secuencial al MLS Chat Bridge:

- 1–50 operaciones por envelope;
- orden preservado;
- `stopOnError=true` por defecto;
- allowlist cerrada;
- ninguna URL arbitraria;
- un único result file por batch.

### Demostración live

Command `0280`:

`batchId = E4-CONTROL-PLANE-BATCH-20260922-A`

Incluyó tres operaciones:

1. `entradaEvidenceMLS`;
2. `fuentesEntradaEvidenceMLS`;
3. `metricasEvidenceEntradaMLS`.

Resultado:

- requested: 3;
- processed: 3;
- failures: 0;
- las tres operaciones HTTP 200.

Transporte:

- 1 command file;
- 1 result file;

en lugar de tres pares independientes.

### Cloudflare Workers Builds

El batching reduce commits, pero no sustituye la configuración de Git integration.

Configuración recomendada cuando la rama/control plane no debe producir builds:

- Workers → Settings → Build → Build watch paths;
- excluir `mls chat bridge/*`;

o, cuando sea apropiado para el entorno:

- Settings → Build → Branch control;
- desactivar builds de ramas no productivas.

Documentación oficial:

- https://developers.cloudflare.com/workers/ci-cd/builds/build-watch-paths/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/

No se afirma que esta configuración externa haya sido modificada desde el repositorio.

**Resultado:** PASS / MITIGATED. La mitigación versionada es batching; la exclusión de builds es configuración operacional externa recomendada.

## 6. E5 — Consumer evidence contract — CODE + CI PASS

Se añadió un contrato read-only común para Virtuoso y Profesor IA.

Estados soportados:

- UNSOURCED;
- SOURCED;
- VERIFIED;
- REVIEWED.

También transporta:

- `needsReview`;
- existencia de article revision propuesta;
- timestamps de verificación/revisión cuando correspondan.

### Reglas

UNSOURCED:

- no permite afirmar verificación;
- puede indicar fundamentación pendiente.

SOURCED:

- no permite equiparar Sources con verificación;
- puede indicar que existen fuentes identificadas.

VERIFIED:

- permite wording limitado a “verificado con fuentes” para el snapshot vigente;
- no permite presentar la verificación como verdad absoluta.

REVIEWED:

- permite indicar además revisión editorial posterior;
- solo existe mediante lifecycle REVIEWED real.

Siempre:

- Source presence ≠ proof;
- proposed revision ≠ canonical;
- `needsReview` no se oculta.

### Profesor IA

El runtime recibe el contexto Evidence de la entrada actual como system guidance.

Si la consulta Evidence falla:

- Profesor IA degrada de forma segura;
- la enciclopedia/chat no queda bloqueada;
- no se inventa estado.

### Virtuoso

Evidence se adjunta después de que Virtuoso haya seleccionado/rerankeado recomendaciones.

Por tanto:

- no altera relevancia;
- no se convierte en ranking automático;
- el modelo no puede inferir VERIFIED/REVIEWED;
- el fallback degradado también recibe anotación determinista.

### API privada

Se añade:

`GET /api/wiki/editorial/evidence/consumer?code=<MLS-code>`

OpenAPI:

`consumerEvidenceEntradaMLS`

read-only / non-consequential.

### Certificación

PR #145.

GitHub Actions:

- run #337: SUCCESS;
- run #338: SUCCESS;
- `test:chat-editorial`: PASS;
- `test:evidence`: PASS;
- `test:canonical-tools`: PASS;
- `qa:baseline`: PASS;
- `predeploy`: PASS;
- `recovery:verify`: PASS;
- deploy-contract: PASS;
- `check`: PASS;
- production deploy: SKIPPED.

**Resultado:** CODE + CI PASS.

La prueba live del endpoint en el runtime de producción debe ejecutarse cuando el nuevo main esté disponible; CI no se presenta como sustituto de esa comprobación live.

## 7. Estado del repeat

| Finding | Estado |
| --- | --- |
| E1 DOI scope | PASS LIVE |
| E2 cross-entry Source reuse | PASS LIVE |
| E3 human REVIEWED | PENDING HUMAN |
| E4 control-plane scaling | PASS / MITIGATED |
| E5 consumer contract | CODE + CI PASS |

## 8. Decisión actual

**CORRECT AND REPEAT continúa vigente.**

No se autoriza Gate 100 todavía.

Único bloqueo metodológico obligatorio pendiente:

**E3 — demostrar REVIEWED mediante una revisión humana real.**

Después:

1. ejecutar E3;
2. comprobar E5 live en runtime actualizado;
3. actualizar métricas/resultados;
4. reevaluar GO / CORRECT AND REPEAT / STOP;
5. solo un GO explícito abre Gate 100.
