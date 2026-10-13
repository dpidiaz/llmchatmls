# SND-KO-007 — Prosodia de Seoul Korean: Accentual Phrase y límites

**Estado:** READY_FOR_COMPOSITION.
**Idioma:** coreano  
**Variedad:** Seoul Korean  
**Dominio:** prosodia

## 1. Modelo de referencia

MLS-SND utilizará inicialmente el marco de **Accentual Phrase (AP)** de Sun-Ah Jun para explicar la prosodia de Seoul Korean, dejando claro que se trata de un modelo analítico con historia y revisiones propias.

Jun (1998) sitúa la Accentual Phrase inmediatamente por encima de la palabra dentro de la jerarquía prosódica propuesta para coreano de Seúl.

## 2. No convertir “acento” en estrés léxico

La literatura posterior que adopta este marco describe Seoul Korean como una lengua en la que la prominencia se organiza fuertemente mediante fraseo y entonación, no mediante un acento léxico tipo inglés.

En MLS-SND se evitará traducir **Accentual Phrase** como si significara “palabra acentuada”.

## 3. Relación con las consonantes iniciales

En este modelo, el patrón tonal inicial de la AP se relaciona con propiedades laríngeas del segmento inicial; estudios contemporáneos muestran además que el cambio en las oclusivas y F0 interactúa con esta estructura prosódica.

## 4. Cambio y modelo

La entrada no fijará una melodía única como invariable. Estudios recientes muestran variación, cambio sonoro y efectos de foco y del segmento inicial.

## 5. Evidencia R33

| claim_id | afirmación | source | localizador | estado |
|---|---|---|---|---|
| KO007-C01 | Jun propone la Accentual Phrase como unidad prosódica relevante de Korean/Seoul Korean | SND-SRC-0037 | pp. 189–226; descripción del modelo | VERIFIED |
| KO007-C02 | Trabajos contemporáneos describen Seoul Korean mediante APs tonales y prominencia de borde/fraseo | SND-SRC-0038 | introducción/overview del sistema prosódico | VERIFIED |
| KO007-C03 | La F0 posterior a oclusivas participa en la diferenciación de categorías y su implementación varía según la posición prosódica en Seoul Korean | SND-SRC-0021 | Abstract; §1.1; Current study | VERIFIED |

## 6. Límite

Esta entrada no se extiende automáticamente a dialectos tonales regionales ni a todas las variedades de coreano.


## Revisión lingüística 2026-10-11

- Alcance y nivel analítico comprobados.
- Source IDs canónicos y localizadores revisados.
- Se mantuvo la separación entre norma, descripción empírica y modelo analítico.
- Gate: **LINGUISTIC_REVIEW**; aún falta EDITORIAL_REVIEW.

## Revisión editorial wave 01

- **Fecha:** 2026-10-11.
- **Resultado:** PASS.
- **Comprobado:** claridad, jerarquía, navegación conceptual y separación entre norma, habla empírica, hangul, romanización e IPA.
- **Cambios lingüísticos:** ninguno.
- **Claims R33 modificados:** ninguno.
- **Estado resultante:** EDITORIAL_REVIEW.
- **Siguiente gate:** composition-readiness; no se promueve automáticamente a READY_FOR_COMPOSITION.

## Composition readiness wave 01

- **Fecha:** 2026-10-12.
- **Versión evaluada:** blob `1f4d724e1149351f31693b063ee53405b6c1713f`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Alcance:** Seoul Korean; Accentual Phrase se mantiene como modelo analítico atribuido, no como “estrés léxico”.
- **Reader-facing:** incluir §§1–4 y límite; excluir tabla R33 y metadata interna.
- **Pronunciation Quick Layer:** NOT_APPLICABLE.
- **Written-only:** PASS.

