# Profesor IA Preguntas Sugeridas

Versión: `professorSuggestionsVersion = 1.0`

## Objetivo

Sustituir las preguntas rápidas universales del Profesor IA por 3 a 5 sugerencias contextuales construidas a partir de la entrada abierta, el idioma y el nivel.

## Contrato

- Todas las sugerencias incorporan el tema o forma objetivo de la entrada actual.
- Cada una de las diez enciclopedias tiene patrones propios; no se traduce mecánicamente una lista universal.
- El nivel modifica al menos una sugerencia para distinguir entradas introductorias de avanzadas.
- Se preservan las normas canónicas: Guatemala, inglés multivariante, portugués de Brasil, italiano estándar, francés estándar, Standarddeutsch, kanji/kana, tradicionales de Taiwán, Hangul y cirílico.
- Las sugerencias solo disparan preguntas normales al Profesor IA y no alteran artículos ni historial editorial.
- El fallback neutral se limita a preguntas genéricas y no inventa una variante regional.

## Integración

El parche se aplica después del contexto conversacional y antes de perfiles, preferencias, acciones rápidas y pronunciación. Esto permite que una sugerencia use la misma conversación corta y todas las capas lingüísticas existentes.
