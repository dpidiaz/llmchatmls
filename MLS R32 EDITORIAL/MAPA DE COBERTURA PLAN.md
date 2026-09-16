# Plan de trabajo · Mapa de cobertura editorial

## Objetivo
Dar visibilidad real al avance editorial por idioma, nivel, capítulo y familia gramatical sin confundir volumen publicado con calidad ni inventar denominadores que el sistema no conoce.

## Principios

1. El porcentaje de avance exacto solo se calcula cuando existe un denominador canónico conocido.
2. Por idioma, usar los totales oficiales de `WIKI_LANGUAGE_ORDER`.
3. Por nivel, capítulo, parte y familia, mostrar evidencia publicada y auditada sin fingir un total planificado si no existe en D1.
4. Mantener idiomas separados.
5. No cambiar FIFO, prioridades, prompts, validaciones ni publicaciones.
6. No iniciar lotes ni rescates.
7. Cero llamadas de IA y cero coste externo.
8. El mapa es diagnóstico y de solo lectura.

## Fase 1 · Avance exacto por idioma

Para cada idioma mostrar:

- total canónico de entradas;
- publicadas;
- pendientes;
- porcentaje exacto de publicación;
- artículos auditados semánticamente vigentes;
- deferred abiertos cuando existan.

## Fase 2 · Evidencia por niveles A1–C2

Mostrar para cada idioma y nivel:

- publicaciones observadas;
- proporción dentro de lo ya publicado en ese idioma;
- auditorías semánticas vigentes;
- intensidad de evidencia (`sin evidencia`, `baja`, `media`, `alta`).

La proporción observada no debe presentarse como porcentaje de finalización del nivel.

## Fase 3 · Partes y capítulos

Agrupar metadatos de `wiki_articles` por idioma, parte y capítulo. Mostrar conteos publicados y auditados.

Como D1 no conserva un denominador canónico por capítulo para las entradas aún no publicadas, no calcular un falso porcentaje de completitud de capítulo.

## Fase 4 · Familias gramaticales

Clasificar artículos publicados con la misma función `mlsAutooptFamily` usada por AUTOOPT. Mostrar:

- idioma;
- familia;
- publicaciones observadas;
- auditorías semánticas;
- observaciones `watch` / `review_required` cuando existan.

No transferir expectativas entre idiomas.

## Fase 5 · Integración con Panel AUTOOPT

Añadir una sección `Mapa de cobertura editorial` con:

- avance global exacto;
- tabla por idioma;
- evidencia por nivel;
- familias con menor evidencia observada;
- capítulos con menor muestra semántica.

El panel debe indicar claramente la diferencia entre `completitud exacta` y `evidencia observada`.

## Fase 6 · Endpoint privado

Añadir un endpoint autenticado y de solo lectura para consultar el mapa desde Actions/ChatGPT y desde el panel.

Comando previsto: `MLS mapa de cobertura`.

## Fase 7 · Pruebas

Cubrir como mínimo:

1. porcentaje exacto por idioma;
2. pendiente nunca negativo;
3. niveles A1–C2 separados por idioma;
4. familias separadas por idioma;
5. capítulos separados por idioma;
6. intensidad de evidencia determinista;
7. auditoría semántica integrada sin certificar cobertura total;
8. ausencia de mutaciones;
9. almacenamiento vacío legible;
10. integración con el Panel AUTOOPT.

## Criterio de aceptación

El usuario puede saber con exactitud cuánto falta por idioma y puede identificar zonas con poca evidencia publicada o semánticamente auditada por nivel, familia y capítulo, sin que el sistema invente porcentajes de completitud para dimensiones cuyo total planificado no está disponible.