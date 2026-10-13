# SND-ESGT-002 — Revisión lingüística 2026-10-12

## Alcance

Revisión independiente del gate `EVIDENCE_CHECKED → LINGUISTIC_REVIEW` sobre el blob canónico previo:

`0b526339e7fba945039ac34cdd9ff34cafddf25a`

La unidad revisada es el **mapa de cobertura segmental**, no un inventario fonémico definitivo.

## Controles aplicados

- separación entre categoría fonológica, realización fonética, variedad/localidad, población y tipo de fuente;
- alcance nacional frente a evidencia regional o de contacto;
- diferencia entre cobertura evidencial y estatus fonémico;
- preservación de `SOURCE_MAPPED`, `ACTIVE_RESEARCH` y `FULLTEXT_REQUIRED` cuando la evidencia no permite cierre;
- exclusión de prosodia del mapa segmental;
- no generalización de muestras bilingües a todo el español de Guatemala.

## Fuentes y roles revisados

- **SND-SRC-0003** — panorama institucional nacional; explícitamente no exhaustivo.
- **SND-SRC-0025** — estudio geolingüístico nacional de fonética segmental; 22 localidades / 88 informantes en la investigación asociada; no sustituye prosodia ni una muestra exclusiva de Ciudad de Guatemala.
- **SND-SRC-0053** — espacios vocálicos en muestras español–k’ichee’; alcance de abstract y contacto.
- **SND-SRC-0054** — /f/ en bilingües K’iche’–español; alcance de contacto, no país completo.
- **SND-SRC-0057** — aspiración/VOT de oclusivas sordas; acceso de abstract/estructura, con `FULLTEXT_REQUIRED` para claims finos.
- **SND-SRC-0058** — prosodia/entonación; correctamente excluida del mapa segmental.

## Hallazgo lingüístico

La versión revisada mantiene una arquitectura correcta para un mapa preliminar:

1. no convierte una realización cartografiada en fonema;
2. no trata una fuente nacional como prueba de uniformidad nacional;
3. no extiende muestras bilingües a hablantes monolingües;
4. no cierra clusters que solo están mapeados;
5. no utiliza evidencia prosódica para validar segmentos;
6. no promueve datos de acceso parcial más allá de su alcance.

Se añadió un guard explícito para dejar claro que los estados de las filas describen **cobertura evidencial**, no estatus fonémico, frecuencia nacional ni obligatoriedad.

## Veredicto

**PASS_WITH_SCOPE_WARNING → LINGUISTIC_REVIEW**

Persisten fuera de este gate:

- inventario fonémico nacional integral;
- clusters aún `SOURCE_MAPPED` o `ACTIVE_RESEARCH`;
- claims finos de SND-SRC-0057 sin texto completo;
- cualquier futura versión de inventario, que deberá abrir sus propios gates.

No se añadieron fuentes, IPA, pronunciaciones ni claims materiales nuevos.
