# SND-DE-001 — Alemán estándar y estándares nacionales

**Estado:** READY_FOR_COMPOSITION.  
**Idioma:** alemán.  
**Dominio:** variedad / alcance descriptivo.

## 1. Decisión de arquitectura

MLS-SND no utilizará “alemán estándar” como si designara una única pronunciación uniforme en todo el espacio germanófono.

El perfil deberá poder distinguir, cuando la evidencia haga material la diferencia:

- estándar usado en Alemania;
- estándar austríaco;
- Swiss Standard German.

## 2. Base ya registrada

SND-SRC-0019 (Kohler, 1990) aporta una Illustration of the IPA para alemán y sirve como referencia histórica/descriptiva.

SND-SRC-0010 (Duden) aporta convenciones lexicográficas de pronunciación e IPA.

Ninguna de estas dos fuentes basta por sí sola para describir toda la variación estándar nacional contemporánea.

## 3. Austria

La investigación de Lanwermeyer et al. sobre -ig dentro del registro estándar austríaco muestra que la realización está afectada por múltiples factores lingüísticos y sociales y concluye que los hablantes se encuentran entre normas transnacionales divergentes y modelos intranacionales variables.

Eso justifica no tratar la pronunciación austríaca como simple desviación de una única referencia alemana.

## 4. Suiza

La literatura reciente sobre Swiss Standard German muestra que sus propiedades fonéticas han sido menos estudiadas que otras áreas y que las variedades alemánicas locales influyen en realizaciones del estándar suizo.

Por tanto, Swiss Standard German necesita tratamiento propio cuando un rasgo fonético difiera de otras referencias estándar.

## 5. Estado editorial

Se mantiene **MULTI_REFERENCE**.

SND-SRC-0030 y SND-SRC-0031 ya están canonicalizadas. Una fuente contextual adicional sobre Swiss Standard German permanece fuera de esta entrada mientras sus metadatos no estén completos.

## 6. Evidencia R33

| claim_id | afirmación | fuente | localizador | estado |
|---|---|---|---|---|
| DE001-C01 | La referencia alemana no debe extrapolarse automáticamente a Austria y Suiza | SND-SRC-0010 + SND-SRC-0019 + SND-SRC-0030 + SND-SRC-0031 | alcance declarado de cada fuente | EDITORIAL_SYNTHESIS |
| DE001-C02 | El estándar austríaco muestra variación fonética condicionada y normas en competencia | SND-SRC-0030 | Abstract / pp. 143–175 | VERIFIED |
| DE001-C03 | Swiss Standard German presenta variación e influencia de dialectos alemánicos en el dominio fonético estudiado | SND-SRC-0031 | Abstract + Introduction | VERIFIED |

## 7. Entradas relacionadas

- SND-DE-007 — Duden e IPA.
- SND-DE-008 — Mapa DE/AT/CH.

## 8. Gate editorial

Las afirmaciones específicas de Austria y Suiza conservan sus fuentes y localizadores.

**LINGUISTIC_REVIEW: PASS. EDITORIAL_REVIEW: PASS_WITH_EDITORIAL_CHANGES.**

La síntesis **MULTI_REFERENCE** se mantiene como decisión editorial sustentada por alcances diferenciados. SND-DE-008 ya se encuentra en `READY_FOR_COMPOSITION` como mapa de cobertura con scope warning; esta integración no decide por sí sola la readiness de DE-001 ni el cierre global del perfil.

## 9. Composition readiness wave 01

- **Fecha:** 2026-10-12.
- **Versión evaluada:** blob `bbebbf7836918ea4050d012c0250e774973e4720`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Arquitectura:** `MULTI_REFERENCE` permanece visible; Alemania, Austria y Suiza no se colapsan en una única pronunciación estándar.
- **Alcance:** SND-DE-008 ya funciona como mapa de cobertura; DE-001 conserva su función de arquitectura/alcance, no de inventario nacional exhaustivo.
- **Reader-facing:** incluir §§1–5 y 7; derivar fundamento de claims verificados; excluir tabla R33 y metadata de gates.
- **Pronunciation Quick Layer:** NOT_APPLICABLE.
- **Written-only:** PASS.

