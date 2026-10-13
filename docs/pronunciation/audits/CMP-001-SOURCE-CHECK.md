# MLS-SND — Auditoría de fuentes de SND-CMP-001

**Fecha:** 2026-10-11  
**Entrada:** SND-CMP-001 — Cómo comparar sonidos sin asumir identidad  
**Resultado:** PASS para los claims CMP001-C01…C05 de la versión canónica auditada.

## Fuentes ya canónicas

- SND-SRC-0001 — International Phonetic Association, IPA Chart.
- SND-SRC-0024 — Anderson et al., *Essentials of Linguistics*.
- SND-SRC-0051 — Lee & Iverson (2017).
- SND-SRC-0052 — Cavar et al. (2025).

## SND-SRC-0051 — Lee & Iverson 2017

Comprobado contra la ficha/texto de Cambridge Core:

- autores: Sue Ann S. Lee y Gregory K. Iverson;
- *Journal of Child Language*, 44(6), 1485–1515;
- DOI: 10.1017/S0305000916000659;
- la introducción usa español e inglés /p/ como ejemplo de categoría compartida con valores distintos de VOT.

**Uso admitido en CMP-001:** control metodológico de que una categoría/símbolo compartido no garantiza una implementación fonética idéntica.

**No admite:** convertir el artículo en descripción completa de español, inglés estadounidense ni sus variedades.

## SND-SRC-0052 — Cavar et al. 2025

Comprobado contra Cambridge Core:

- autores: Malgorzata E. Cavar, Emily M. Rudman, Neha Nagaraj y Lily Peters;
- *Journal of the International Phonetic Association*, 55(1–2), 1–34;
- DOI: 10.1017/S0025100325000040;
- §1 explica el uso de /ɨ/ para facilitar la presentación comparativa y formula explícitamente la pregunta de si las realizaciones físicas justifican símbolos iguales o diferentes;
- resultados/discusión y conclusiones documentan diferencias articulatorias entre las vocales estudiadas.

**Uso admitido en CMP-001:** control metodológico de que una notación amplia compartida puede coexistir con realizaciones físicas distintas.

**No admite:** extrapolar esas realizaciones a otras lenguas que utilicen /ɨ/.

## Reconciliación de waves

- PR #7297 aportó el checklist editorial de comparación, ya presente en la matriz.
- PR #7294 aportó los dos controles empíricos y la auditoría inicial.
- La entrada canónica conserva su estructura integrada previa y absorbe únicamente evidencia compatible; no se reemplaza por una segunda versión paralela.

## Gate

Los cinco claims de la tabla R33 de CMP-001 utilizan IDs canónicos y localizadores congruentes con el alcance declarado.

**Estado canónico:** EVIDENCE_CHECKED.

Aún requiere, como cualquier entrada del tomo, los gates posteriores que correspondan antes de READY_FOR_COMPOSITION.
