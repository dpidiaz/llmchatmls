# SND-REP-011 — Transliteración

**Estado:** RESEARCHED.  
**Dominio:** representación / conversión de escritura.  
**Idioma:** transversal.  
**Fuente conceptual nueva:** REP-PROP-002, pendiente de canonicalización.

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

## 6. Evidencia provisional

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| REP011-C01 | CLDR describe transliteration como conversión de caracteres de un script a otro | REP-PROP-002 | Unicode Transliteration Guidelines, Introduction | terminología CLDR | MAPPED_PENDING_REGISTRY |
| REP011-C02 | CLDR distingue transliteración de traducción | REP-PROP-002 | Introduction, “Transliteration is not translation” | terminología CLDR | MAPPED_PENDING_REGISTRY |
| REP011-C03 | CLDR usa transliteración en sentido amplio, incluyendo transformaciones reversibles y no reversibles | REP-PROP-002 | Introduction, nota sobre narrow meaning / reversibility | terminología CLDR | MAPPED_PENDING_REGISTRY |

## 7. Nota editorial

MLS-SND no utilizará “transliteración” y “transcripción fonética” como sinónimos.

## 8. Gate pendiente

Canonicalizar REP-PROP-002 y realizar auditoría independiente antes de promover a EVIDENCE_CHECKED.