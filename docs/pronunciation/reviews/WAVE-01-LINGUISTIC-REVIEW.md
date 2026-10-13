# MLS-SND — Linguistic Review Wave 01

**Fecha:** 2026-10-11  
**Base:** `feat/mls-snd-foundation`

## Resultado

El núcleo transversal actual supera la segunda revisión lingüística.

### En LINGUISTIC_REVIEW

**Fundamentos (12):**

- SND-FND-002 — Fonética y fonología.
- SND-FND-003 — Fonema, alófono, segmento y realización.
- SND-FND-004 — Producción del habla y tracto vocal.
- SND-FND-006 — Consonantes.
- SND-FND-007 — Vocales.
- SND-FND-008 — Sílaba.
- SND-FND-009 — Fonotáctica.
- SND-FND-010 — Duración y cantidad.
- SND-FND-011 — Acento y prominencia.
- SND-FND-013 — Tono.
- SND-FND-015 — Entonación.
- SND-FND-017 — Variación.

**Representación (5):**

- SND-REP-002 — Qué es el AFI/IPA.
- SND-REP-005 — Diacríticos.
- SND-REP-006 — Suprasegmentales, tonos y acentos de palabra.
- SND-REP-007 — Transcripción fonológica y fonética.
- SND-REP-008 — Transcripción amplia y estrecha.

Total transversal revisado: **17 entradas**.

## Controles aplicados

1. Fonética y fonología permanecen separadas.
2. Pitch y F0 no se tratan como equivalentes físicos exactos.
3. Tono, acento tonal y entonación permanecen diferenciados.
4. Duración fonética no se convierte automáticamente en cantidad fonológica.
5. Barras / / y corchetes [ ] se vinculan a niveles analíticos distintos.
6. Amplia/estrecha se trata como continuo de detalle.
7. Variación se presenta como parte estructural del uso lingüístico, no como desviación.
8. La notación de una fuente se conserva cuando sustituirla impondría un análisis distinto.

## Perfiles de idioma

La revisión transversal **no promueve automáticamente** entradas específicas de idiomas. Esas entradas mantienen sus estados R33 hasta revisión específica/especializada.

### Ajustes puntuales de perfil

- PTBR-001: los claims de alcance se vincularon a evidencia sustantiva de variación regional/social.
- PTBR-006: se conserva `/S/` de Callou para la sibilante postvocálica, en vez de normalizarla silenciosamente a `/s/`.
- Los porcentajes cariocas de décadas de 1970/1990 permanecen marcados como históricos.

## Concurrencia

Durante esta wave la rama matriz recibió numerosos commits de otros chats. Para evitar pérdida de trabajo, los cambios finales se integraron como transformaciones sobre la versión más reciente de cada archivo, no mediante reemplazo de una rama atrasada.

Los PR #7298 y #7312 quedaron obsoletos por divergencia concurrente y no deben utilizarse para integración.

## Siguiente gate

1. EDITORIAL_REVIEW del núcleo transversal;
2. revisión lingüística específica por idioma;
3. canonicalización de fuentes provisionales;
4. READY_FOR_COMPOSITION únicamente después de ambos controles.
