# MLS-SND — Source map: comparación transversal

Estado: **wave local / propuesta de integración**.

Este archivo documenta fuentes usadas por SND-CMP-001 sin asignar unilateralmente nuevos IDs globales mientras otras waves también amplían el Source Registry.

## Fuentes canónicas reutilizadas

### SND-SRC-0001 — International Phonetic Association: IPA Chart

- **Uso en esta wave:** marco de notación IPA y distinción entre símbolo, diacrítico y convención descriptiva.
- **No usar para:** demostrar por sí solo que dos realizaciones de idiomas distintos son fonéticamente idénticas.

### SND-SRC-0024 — Essentials of Linguistics, 2nd edition

- **Uso en esta wave:** distinguir fonética/fonología; mostrar que cada lengua organiza los sonidos de manera propia; apoyar la diferencia entre teléfono, fonema, alófono y análisis fonémico.
- **Localizadores principales:** §3.6 “The International Phonetic Alphabet”; §4.1 “Phonemes and allophones”; §4.5 “Phonemic analysis”; §13.2 “Evidence for phonemes as mental categories”.
- **Limitación:** manual introductorio; no sustituye investigación acústica específica.

## Fuente nueva propuesta localmente

### CMP-PROP-001 — Georgiou & Giannakou (2026)

- **Tier propuesto:** B.
- **APA 7:** Georgiou, G. P., & Giannakou, A. (2026). Modeling cross-language vowel similarity: Integrating phonetic analysis and explainable classification. *Applied Psycholinguistics, 47*, e58. https://doi.org/10.1017/S0142716426101076
- **Acceso:** open access, CC BY 4.0.
- **Idioma/variedad:** griego moderno estándar y albanés estándar; comparación vocálica.
- **Cobertura útil:** comparación acústica multidimensional de inventarios vocálicos parcialmente compartidos; correspondencia entre categorías y no equivalencia fonética completa.
- **Localizadores:** Abstract; Introduction, especialmente el desarrollo sobre inventarios compartidos y equivalencia; Discussion, especialmente párrafos iniciales sobre overlap vs. implementación; Conclusions.
- **Hallazgo aplicable:** compartir un inventario fonológico o etiquetas /i e a o u/ no implica implementación fonética idéntica; diferencias sistemáticas pueden aparecer en duración, propiedades espectrales y dinámica formántica.
- **Limitación:** estudio de vocales griego–albanés en un diseño controlado; no generalizar sus medidas concretas a consonantes ni a todos los pares de lenguas.
- **Estado:** PROPOSED_LOCAL — pendiente de canonicalización en MLS-SND-SOURCE-REGISTRY.md.

## Regla de uso

La fuente CMP-PROP-001 puede sostener el principio metodológico de **no inferir identidad fonética a partir de inventarios o etiquetas compartidas**, pero sus resultados empíricos concretos permanecen limitados a los sistemas y al diseño estudiados.
