# MLS-SND — Fuentes propuestas para Unicode/composición

Estas fuentes no reciben ID SND-SRC global en esta wave para evitar colisiones con el Source Registry.

## TYPE-PROP-001 — Unicode Standard Annex #15

- **Tier propuesto:** A.
- **Institución:** Unicode Consortium.
- **Título:** Unicode Standard Annex #15: Unicode Normalization Forms.
- **Versión consultada:** Unicode 18.0.0, Revision 58, 2026-08-12.
- **URL:** https://www.unicode.org/reports/tr15/
- **Cobertura:** NFC, NFD, NFKC, NFKD; equivalencia canónica; orden de combining marks; estabilidad y concatenación.
- **Localizadores:** Summary; §1.2 Normalization Forms; §1.4 Concatenation of Normalized Strings.
- **Uso MLS-SND:** política de almacenamiento/normalización y QA.
- **Limitación:** estándar de codificación; no prescribe diseño tipográfico ni análisis lingüístico.

## TYPE-PROP-002 — Unicode Normalization FAQ

- **Tier propuesto:** A.
- **Institución:** Unicode Consortium.
- **Título:** FAQ — Normalization.
- **URL:** https://www.unicode.org/faq/normalization.html
- **Cobertura:** explicación práctica de equivalencia, formas de normalización y recomendación de NFC para texto general.
- **Uso MLS-SND:** justificación accesible de la decisión editorial de NFC.
- **Limitación:** FAQ complementaria; UAX #15 es la referencia normativa principal.

## TYPE-PROP-003 — Unicode 18.0 Character Code Charts

- **Tier propuesto:** A.
- **Institución:** Unicode Consortium.
- **URL:** https://unicode.org/Public/18.0.0/charts/
- **Cobertura relevante:** IPA Extensions, Phonetic Extensions, combining marks, modifier letters, Bopomofo, CJK, Hangul, Hiragana, Katakana, Cyrillic.
- **Uso MLS-SND:** comprobar que los caracteres pertenecen a bloques Unicode estandarizados.
- **Limitación:** existencia en Unicode no garantiza cobertura en una fuente tipográfica concreta.
