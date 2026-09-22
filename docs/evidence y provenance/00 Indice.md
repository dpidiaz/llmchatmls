# MLS R33 Evidence & Provenance

Documentación oficial para preparar MASTER LANGUAGE SYSTEM R33 sobre la base R32 existente.

## Alcance

Este directorio define la evolución de MLS desde un corpus **AI-assisted + editorially validated** hacia un sistema **evidence-backed + provenance-aware + auditable**, sin convertir MLS en MKS y sin romper R32.

R33 es aditivo. Las entradas R32 continúan siendo utilizables aunque su estado inicial sea `UNSOURCED`.

## Documentos

1. [01 Master Prompt MLS Evidence Provenance R33](./01%20Master%20Prompt%20MLS%20Evidence%20Provenance%20R33.md)  
   Especificación consolidada de Evidence & Provenance, incluyendo APA 7, perfil institucional URL Guatemala, Source Registry, claims, evidence links, provenance, revisiones, validación, staging, D1, QA y escalamiento.

2. [02 Roadmap MLS Evidence Provenance R33](./02%20Roadmap%20MLS%20Evidence%20Provenance%20R33.md)  
   Roadmap vivo y obligatorio. Debe consultarse antes de cada cambio R33 y actualizarse al cerrar cada checkpoint.

3. [03 Fase 0 Arquitectura y diseño recomendado](./03%20Fase%200%20Arquitectura%20y%20dise%C3%B1o%20recomendado.md)  
   Auditoría técnica de R32, opciones de schema, arquitectura D1 recomendada, state machine, concurrencia, APA, estimaciones de tamaño y unidades de implementación de Foundation.

4. [03 Pilot 20 Plan](./03%20Pilot%2020%20Plan.md)  
   Plan operativo y gates del Pilot 20.

5. [04 Pilot 20 Manifest](./04%20Pilot%2020%20Manifest.json)  
   Muestra canónica bloqueada y estado de ejecución del piloto.

6. Checkpoints Pilot 20: `05` a `09`  
   Métricas y hallazgos por bloques de cuatro entradas.

7. [10 Fase 3 Evaluacion Pilot 20](./10%20Fase%203%20Evaluacion%20Pilot%2020.md)  
   Evaluación posterior al piloto. Decisión vigente: **CORRECT AND REPEAT**; Gate 100 bloqueado hasta cerrar E1–E5.

8. [11 Correction Repeat E1 E2 E4 E5](./11%20Correction%20Repeat%20E1%20E2%20E4%20E5.md)  
   Evidencia reproducible del repeat dirigido: E1, E2, E4 y E5 PASS; E3 permanece reservado para review humano real.

9. [12 Gate 100 Scalability Preparation](./12%20Gate%20100%20Scalability%20Preparation.md)  
   Preparación batch-first y exception-first para que Gate 100 mida escalabilidad real: Source Registry first, reuse candidates, triage de hasta 50 entradas y discovery externo solo cuando sea necesario.

## Contexto R32 inspeccionado al crear esta documentación

Repositorio: `dpidiaz/llmchatmls`  
Base: `main`  
HEAD inspeccionado: `47c720005bfc0a3ceab1aad46079d4db913ffb61`

Componentes confirmados y reutilizables:

- `MLS R32 EDITORIAL/AUTOOPT.md`
- `MLS R32 EDITORIAL/AUTOOPT arquitectura.md`
- `MLS R32 EDITORIAL/AUTOOPT historial.md`
- `MLS R32 EDITORIAL/autoopt.js`
- `MLS R32 EDITORIAL/contrato editorial.js`
- `MLS R32 EDITORIAL/MLS GITHUB STAGING.md`
- `MLS R32 EDITORIAL/staging.js`
- `MLS R32 EDITORIAL/chat workflow.js`
- `MLS R32 EDITORIAL/chat openapi.json`
- `schemas/canonical-entry.schema.json`
- `package.json`

Hallazgos estructurales confirmados:

- AUTOOPT es observacional y no certifica verdad ni precisión lingüística.
- `references/referenceCodes` forman parte de la calibración editorial R32; no deben reinterpretarse como evidence sources.
- GitHub Staging ya implementa snapshot fijado por commit, commits con `force:false`, reconciliación y provenance editorial.
- D1 ya dispone de `wiki_article_provenance` para procedencia de staging; R33 debe extender o relacionar esta capa, no duplicarla.
- GitHub Staging usa GitHub como staging/versionado, no como runtime DB.
- `npm run deploy` despliega realmente; para QA se deben usar `predeploy`, `check` y las suites apropiadas.

## Autoridad bibliográfica

La implementación inicial utiliza:

- `citationStyle = APA`
- `citationEdition = 7`
- `citationProfile = URL-GT-2025`

La fuente normativa primaria sigue siendo la edición oficial vigente de APA. El perfil institucional inicial de MLS se alinea con la **Guía para citar obras en el sistema de la American Psychological Association (APA), segunda edición 2025**, publicada por la Universidad Rafael Landívar.

La referencia APA renderizada nunca sustituye la metadata normalizada de una fuente.

## Regla de trabajo

Antes de implementar cualquier cambio R33:

1. leer este índice;
2. leer el Master Prompt;
3. leer el Roadmap;
4. verificar repositorio, rama y HEAD;
5. actualizar el Roadmap al cerrar el checkpoint.

La documentación no autoriza por sí sola un despliegue remoto ni una migración masiva.
