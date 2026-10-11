# MLS-SND work claim — Source metadata repair wave 01

**Branch:** `snd/source-metadata-repair-wave-01`
**Base:** `feat/mls-snd-foundation`
**Type:** Source Registry metadata repair

## Alcance

- SND-SRC-0004 — normalizar nombre del campo APA 7; no cambiar referencia canónica.
- SND-SRC-0026 — añadir APA 7 institucional del corpus NURC-RJ.
- SND-SRC-0032 — añadir APA 7 institucional de 표준 발음법 / Standard Pronunciation Rules.

## Reglas

- no cambiar source IDs;
- no ampliar alcance lingüístico;
- no inferir fecha de publicación si la página no la declara;
- usar `s. f.` cuando corresponda;
- conservar institución, URL y limitaciones existentes.
## Resultado

**Estado:** REVIEW_READY.

- Source Registry detectado: 50 registros.
- Registros con campo `APA 7`: 50/50.
- Source IDs modificados: 0.
- Alcances lingüísticos modificados: 0.

### Reparaciones

- SND-SRC-0004: se normalizó el nombre del campo `APA 7 canónica para R33` → `APA 7`; la referencia no cambió.
- SND-SRC-0026: se añadió referencia institucional del Projeto NURC-RJ/UFRJ.
- SND-SRC-0032: se añadió referencia institucional de *표준 발음법* del National Institute of Korean Language.
- SND-SRC-0049: se añadió referencia institucional UNGEGN.
- SND-SRC-0050: se añadió referencia institucional Unicode CLDR.

No se infirieron fechas no declaradas; se usa `s. f.` en recursos institucionales sin fecha explícita.