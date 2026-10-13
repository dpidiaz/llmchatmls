# MLS-SND — Revisión editorial de estabilización de FR-001

- **Entrada:** SND-FR-001 — Selección de variedad de referencia
- **Fecha:** 2026-10-13
- **Rama:** `snd/fr001-reference-stabilization-wave-01`
- **Versión de partida:** blob `667d9ed5d427dca033c29cfacfc6b1e3e2c1ecd3`
- **Resultado:** `EDITORIAL_REVIEW / PASS_WITH_SCOPE_POLICY_UPDATE`

## 1. Problema resuelto

La versión anterior estaba bloqueada para composición porque mantenía una referencia metropolitana `REFERENCE_PROVISIONAL` pendiente de un corpus/criterio único.

El cluster FR-002…009 ya revisado muestra que el núcleo publicable no depende de una sola referencia:
- claims de Fougeron & Smith conservan su hablante parisina;
- datos parisinos contemporáneos se etiquetan como tales;
- France-Nord/supralocal se usa solo donde la fuente lo declara;
- PFC funciona como marco de diversidad y exige punto/publicación cuando se usan datos locales.

## 2. Decisión

La primera edición adopta **MULTI_REFERENCE**.

Esto no significa ausencia de coherencia. La regla de coherencia es que cada afirmación fonética/fonológica conserve la variedad, muestra, corpus o fuente que realmente la sustenta.

## 3. Compatibilidad evidencial

La decisión es consistente con los claims existentes de FR-001:
- PFC documenta unidad y diversidad;
- la Illustration de 1993 está delimitada a una joven hablante parisina;
- Chalier documenta pluralidad normativa y tendencia bicéntrica dentro de su alcance;
- PFC exige citar la encuesta concreta cuando se usan puntos específicos.

No se añade ningún claim para “demostrar” MULTI_REFERENCE: sigue siendo una política editorial MLS-SND derivada de esos límites.

## 4. Cambios autorizados

- `REFERENCE_PROVISIONAL` → `MULTI_REFERENCE`;
- §2 reformulado como política multirreferencia;
- §7 actualizado con la decisión editorial estabilizada;
- §10 actualizado para retirar el blocker provisional;
- constancia del gate editorial.

No se modifican FR001-C01…C05, Source IDs, localizadores ni bibliografía.

## 5. Próximo gate

Composition readiness sobre la versión estabilizada. COMPOSITION no podrá colapsar las referencias delimitadas en una única voz “francesa estándar”.
