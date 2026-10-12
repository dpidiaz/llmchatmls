# MLS-SND — Pronunciación y sistemas sonoros

Estado: **diseño editorial**.

Este directorio contiene el desarrollo del tomo independiente del Master Language System dedicado a fonética, fonología, pronunciación, prosodia y la relación entre sistemas sonoros y escritura.

## Principios de separación

- **R32** inspira estructura editorial, modularidad y claridad de las entradas.
- **R33** aporta trazabilidad de afirmaciones, fuentes, evidencia y localizadores.
- **R44** organiza unidades de trabajo, dependencias y entregas; no define análisis lingüístico ni formato de redacción.
- MLS-SND no modifica ni reversiona por ahora los tomos lingüísticos existentes.

## Alcance

Idiomas previstos:

- 🇬🇹 Español de Guatemala
- 🇺🇸 Inglés estadounidense
- 🇧🇷 Portugués brasileño, referencia carioca
- 🇮🇹 Italiano
- 🇫🇷 Francés
- 🇩🇪 Alemán
- 🇹🇼 Mandarín de Taiwán
- 🇰🇷 Coreano
- 🇯🇵 Japonés
- 🇷🇺 Ruso

El tomo será explicativo y de consulta. No contendrá ejercicios, pruebas, exámenes ni evaluaciones. Debe funcionar plenamente como obra escrita y no depender de audio ni reconocimiento automático de voz.

## Documentos fundacionales

- `MLS-SND-CHARTER.md`: propósito, límites y principios.
- `MLS-SND-TRANSCRIPTION-GUIDE.md`: política de AFI/IPA, variedades y niveles de representación.
- `MLS-SND-MASTER-INVENTORY.md`: mapa de contenidos y dependencias.
- `MLS-SND-SOURCE-REGISTRY.md`: registro inicial de fuentes y criterios de admisión.
- `editorial/terminology.md`: vocabulario editorial canónico.
- `editorial/varieties-policy.md`: política de variedades.
- `editorial/r33-validation.md`: gate de validación lingüística y evidencial.
- `editorial/pronunciation-quick-layer.md`: capa R32 de acceso rápido a pronunciación para la reader-facing projection.

## Arquitectura prevista

1. Fundamentos comunes.
2. Representación y transcripción.
3. Perfiles completos por idioma/variedad.
4. Comparación transversal.
5. Aparato de consulta.

Los capítulos comparativos deben redactarse después de validar suficientemente los perfiles lingüísticos, para evitar generalizaciones prematuras.


## Coordinación paralela

- `COORDINATION.md`: protocolo para que múltiples chats trabajen en ramas independientes y se coordinen mediante GitHub.
