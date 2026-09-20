# MLS Traductor — Pronunciación

## Contrato pedagógico

Secuencia recomendada:

**Escuchar lento → repetir → escuchar normal**

El modo Lento es parte del Definition of Done.

## Velocidades

- Normal: `1.0`
- Lento: `0.65`

No se usa `playbackRate` sobre audio pregrabado. Se crea una nueva `SpeechSynthesisUtterance` con la velocidad seleccionada.

## Repetición y cancelación

Antes de hablar:
- `speechSynthesis.cancel()`.

Repetir conserva:
- texto;
- slug;
- modo de velocidad.

## Guías escritas R1

Implementado localmente cuando es seguro:

- Japonés kana: romanización Hepburn básica;
- Ruso: transliteración determinista.

Degradación deliberada:

- kanji con lectura contextual;
- pinyin tonal chino;
- romanización fonológica completa coreana;
- acento léxico ruso no conocido;
- guías fonéticas complejas de idiomas latinos/germánicos.

MLS prefiere decir que necesita un recurso lingüístico antes que inventar pronunciación.

## Locales prioritarios

- Español: `es-GT`, `es-419`, fallbacks compatibles
- Inglés: `en-US`, `en-GB`
- Portugués: `pt-BR`
- Italiano: `it-IT`
- Francés: `fr-FR`
- Alemán: `de-DE`
- Japonés: `ja-JP`
- Chino Taiwán: `zh-TW`
- Coreano: `ko-KR`
- Ruso: `ru-RU`

## Pronunciar por partes

No se incluyó en R1 porque una segmentación mecánica podría enseñar ritmo artificial. Queda como oportunidad futura si se incorpora segmentación lingüística confiable.
