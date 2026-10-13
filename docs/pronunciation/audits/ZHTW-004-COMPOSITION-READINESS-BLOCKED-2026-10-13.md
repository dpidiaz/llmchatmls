# SND-ZHTW-004 — Composition readiness — BLOCKED — 2026-10-13

## Scope
Evaluar la versión canónica de **SND-ZHTW-004 — Sistema tonal: mapa de evidencia** sin resolver decisiones lingüísticas durante composición.

- **Base matrix:** `c13dbc5f5b7394b37a1066063b30a8362f3baca8`
- **Editorial candidate blob:** `939fb1e7e6bd21a23a846a84b62b41861af5d642`
- **Gate:** EDITORIAL_REVIEW → READY_FOR_COMPOSITION
- **Resultado:** BLOCKED → permanece en EDITORIAL_REVIEW

## Precondiciones
- EVIDENCE_CHECKED: PASS para ZHTW004-C01…C03.
- LINGUISTIC_REVIEW: PASS.
- EDITORIAL_REVIEW: PASS.
- La entrada conserva explícitamente blockers previos al gate de composición.

## Blockers

### 1. Convención reader-facing de tono
La entrada declara pendiente seleccionar la convención exacta con la que se representarán tonos al lector.

Esto es material porque puede cambiar la representación mostrada. COMPOSITION no puede elegirla.

### 2. Cobertura específica Tone 2–4
La entrada requiere revisar realizaciones de Tone 2–4 con bibliografía específica antes del cierre.

No se puede rellenar esa cobertura por analogía desde Tone 1 ni desde Standard Mandarin.

### 3. Neutral tone y procesos tonales
La versión exige resolver cómo presentar neutral tone y procesos tonales sin importar reglas de otra variedad.

PR #7503 ya reclama **ZHTW-006 — procesos tonales**. Esta wave no duplica ese trabajo.

## Contenido que sí está estable
No bloquea el mapa evidencial existente:
- cuatro etiquetas Tone 1–4 documentadas por SND-SRC-0022;
- dos realizaciones ilustradas de Tone 3 según Figure 1;
- análisis /H, M, L, HM/ de SND-SRC-0043 tratado como ANALYTICAL_CHOICE;
- separación entre etiqueta, realización fonética, análisis fonológico, Zhuyin e IPA.

Pero esos elementos no eliminan los blockers reader-facing declarados por la propia entrada.

## Pronunciation Quick Layer
No se clasifica para publicación porque el gate global está BLOCKED.

COMPOSITION no debe producir respelling tonal ni una representación fácil mientras la convención reader-facing siga abierta.

## Regla de retorno
Reevaluar composition readiness únicamente cuando:
1. exista una convención tonal reader-facing aprobada para esta entrada;
2. la cobertura Tone 2–4 requerida por la entrada esté resuelta o explícitamente reducida de alcance;
3. neutral tone/procesos tonales estén delimitados sin importar reglas de otra variedad.

## Integridad
- cambios lingüísticos: 0;
- fuentes/localizadores: 0;
- IPA/notación tonal nueva: 0;
- handoff: no creado;
- estado canónico: sin modificación.

## Resultado final
**BLOCKED — permanece en EDITORIAL_REVIEW.**
