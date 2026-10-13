# SND-REP-011 — Transliteración

**Estado:** LINGUISTIC_REVIEW — PASS_WITH_TERMINOLOGY_SCOPE_WARNING.  
**Dominio:** representación / conversión de escritura.  
**Idioma:** transversal.  
**Fuente conceptual:** SND-SRC-0050 — Unicode CLDR, canonicalizada en el Source Registry.

## 1. Definición operativa y advertencia terminológica

MLS-SND utilizará **transliteración** para conversiones sistemáticas entre scripts en las que el objeto inmediato son los caracteres o unidades gráficas de una escritura.

Sin embargo, el término no tiene exactamente el mismo alcance en todas las normas y tradiciones. Unicode CLDR lo usa de manera amplia para convertir caracteres de un script a otro y aclara que, dentro de CLDR, puede incluir transformaciones reversibles o no reversibles.

## 2. No es traducción

Unicode distingue transliteración de traducción: la primera transforma la representación gráfica de la forma; la segunda cambia la expresión lingüística para transmitir significado en otra lengua.

MLS-SND mantendrá esa diferencia terminológica.

## 3. Reversibilidad: no asumirla

Algunas tradiciones usan “transliteración” en un sentido más estrecho y esperan una correspondencia reversible o casi reversible. CLDR advierte que su uso del término es más amplio.

Por eso el tomo no afirmará simplemente: “toda transliteración es reversible”. Cada sistema deberá describirse según su propia norma.

## 4. Transliteración y pronunciación

Una transliteración puede ayudar a reconocer o reproducir una forma escrita en otro script, pero no debe presentarse automáticamente como guía fonética.

Esta distinción es especialmente importante en MLS-SND porque el propósito del tomo es describir sistemas sonoros sin confundirlos con sistemas gráficos.

## 5. Romanización como caso relacionado

Una romanización tiene como destino el alfabeto romano; puede ser una forma de conversión entre scripts, pero MLS-SND mantendrá el término **romanización** cuando esa propiedad sea editorialmente relevante.

## 6. Evidencia R33

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| REP011-C01 | CLDR describe transliteration como conversión de caracteres de un script a otro | SND-SRC-0050 | Unicode Transliteration Guidelines, Introduction | terminología CLDR | VERIFIED |
| REP011-C02 | CLDR distingue transliteración de traducción | SND-SRC-0050 | Introduction, “Transliteration is not translation” | terminología CLDR | VERIFIED |
| REP011-C03 | CLDR usa transliteración en sentido amplio, incluyendo transformaciones reversibles y no reversibles | SND-SRC-0050 | Introduction, nota sobre narrow meaning / reversibility | terminología CLDR | VERIFIED |

## 7. Nota editorial

MLS-SND no utilizará “transliteración” y “transcripción fonética” como sinónimos.

## 8. Gate

**EVIDENCE_CHECKED.** La fuente técnica quedó canonicalizada; falta LINGUISTIC_REVIEW.

## 9. Revisión lingüística wave 02

- **Fecha:** 2026-10-12.
- **Versión revisada:** blob `102be5724de1b919199500bc02a2775383a5872c`.
- **Resultado:** PASS_WITH_TERMINOLOGY_SCOPE_WARNING → `LINGUISTIC_REVIEW`.
- **Definición:** transliteración permanece orientada primariamente a conversión gráfica entre scripts y no se equipara a pronunciación.
- **CLDR:** su uso amplio de “transliteration” se atribuye a esa tradición técnica y no se impone como definición lingüística universal.
- **Reversibilidad:** no se presupone para toda transliteración.
- **Metadata:** SND-SRC-0050 ya estaba canonicalizada; se corrige únicamente el encabezado obsoleto.
- **Siguiente gate:** EDITORIAL_REVIEW independiente.
