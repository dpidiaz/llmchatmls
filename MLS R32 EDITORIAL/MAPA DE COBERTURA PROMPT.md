# Prompt de implementación · Mapa de cobertura editorial

Trabaja exclusivamente en `dpidiaz/llmchatmls`, rama `feat/autoopt-editorial-coverage-map`.

## Contexto
MASTER LANGUAGE SYSTEM R32 ya tiene AUTOOPT, Panel de Salud, Rescate inteligente de deferred y Auditoría semántica por muestra. El siguiente objetivo es dar visibilidad de cobertura editorial real sin convertir el mapa en un sistema de priorización autónoma.

## Objetivo
Implementa un mapa privado, read-only y de cero coste que muestre avance exacto por idioma y evidencia observada por nivel, parte, capítulo y familia gramatical.

## Restricciones innegociables

- NO iniciar lotes ni rescates.
- NO cambiar FIFO ni prioridades.
- NO generar, corregir ni publicar artículos.
- NO modificar R32 ni promptVersion.
- NO usar proveedores externos ni Workers AI.
- NO mezclar idiomas.
- NO inferir un porcentaje de completitud cuando no existe un denominador canónico.
- Por idioma, usar `WIKI_LANGUAGE_ORDER` como denominador exacto.
- Por nivel, capítulo, parte y familia, etiquetar los resultados como evidencia observada, no como completitud final.
- Mantener Auditoría semántica como muestra diagnóstica, nunca como certificación del corpus.

## Salida mínima

El mapa debe incluir:

- total global canónico, publicadas, pendientes y porcentaje;
- por idioma: total, publicadas, pendientes, porcentaje exacto y auditorías semánticas vigentes;
- por nivel A1–C2: publicaciones y auditorías por idioma;
- por parte y capítulo: publicaciones y auditorías observadas;
- por familia: publicaciones, auditorías y hallazgos semánticos por idioma;
- señales de evidencia `sin evidencia`, `baja`, `media`, `alta` con umbrales deterministas y claramente documentados;
- notas explícitas sobre qué métricas son exactas y cuáles son observacionales.

## Integración

- Añadir endpoint privado autenticado de solo lectura.
- Añadir operación OpenAPI para `MLS mapa de cobertura`.
- Integrar un resumen en el Panel AUTOOPT.
- Reutilizar `mlsAutooptFamily` para la clasificación familiar.
- Reutilizar auditorías semánticas vigentes cuando estén disponibles.
- No añadir una migración si el mapa puede derivarse de tablas actuales.

## Pruebas

Añade pruebas puras y deterministas para agregación, separación de idiomas, niveles A1–C2, capítulos, familias, cálculo exacto por idioma, intensidad de evidencia y ausencia de side effects. Ejecuta suite editorial, predeploy, deploy-contract y Wrangler dry run.

## Entrega

1. Implementa el cambio mínimo robusto.
2. Documenta límites y semántica de los porcentajes.
3. Abre PR contra `main`.
4. No hagas merge ni deploy hasta que GitHub Actions quede verde.