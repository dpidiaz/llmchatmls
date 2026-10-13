# SND-ENUS-009 — Southern Michigan como perfil documentado

**Estado:** READY_FOR_COMPOSITION.
**Idioma:** inglés.
**Variedad:** Southern Michigan / Northern Cities context.
**Dominio:** perfil regional / vocales / alcance.

## 1. Por qué aparece este perfil

Southern Michigan sirve en MLS-SND como **perfil regional documentado**, no como sustituto de todo el inglés estadounidense.

Hillenbrand (2003) lo presenta precisamente para complementar una descripción anterior basada en Southern California, dentro de un contexto de considerable diversidad fonética en Norteamérica.

## 2. Muestra y límites

La descripción se apoya en gran medida en grabaciones de **139 hablantes** analizados previamente por Hillenbrand et al. (1995): 45 hombres, 48 mujeres y 46 niños. El 87 % había crecido en Southern Michigan; la mayoría restante provenía de otras zonas del Inland Northeast.

La muestra adulta era predominantemente blanca y casi exclusivamente de clase media, y la mayoría de los adultos eran estudiantes universitarios jóvenes. Los ejemplos grabados que sirven de base a las transcripciones del artículo proceden de una mujer de 23 años criada en Grand Rapids.

Estas características forman parte del alcance de la evidencia y deben conservarse cuando se reutilice el artículo.

## 3. Qué diferencia especialmente este perfil

El artículo señala que las diferencias más características frente a muchas otras regiones norteamericanas se concentran principalmente en la **producción vocálica**.

Entre los rasgos documentados en el perfil se encuentra un contraste entre las vocales de *cot* y *caught*, que el artículo contrasta con regiones de Norteamérica donde esas vocales se han fusionado en gran medida o por completo.

## 4. Consonantes y generalización controlada

Hillenbrand indica que el inventario consonántico, los patrones de acento y las principales reglas fonológicas descritas por Ladefoged para Southern California también se aplican a Southern Michigan dentro del análisis del artículo.

MLS-SND no extenderá esa afirmación automáticamente a todo el territorio estadounidense.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| ENUS009-C01 | El artículo se plantea como complemento regional a una descripción basada en Southern California | SND-SRC-0005 | Hillenbrand (2003), p. 121, primer párrafo | Southern Michigan | VERIFIED |
| ENUS009-C02 | La descripción usa en gran parte datos de 139 hablantes y declara composición/origen de la muestra | SND-SRC-0005 | p. 121, segundo párrafo | muestra del estudio | VERIFIED |
| ENUS009-C03 | Las diferencias regionales tratadas se concentran principalmente en producción vocálica | SND-SRC-0005 | p. 121, segundo párrafo | Southern Michigan | VERIFIED |
| ENUS009-C04 | El artículo mantiene contraste cot/caught y lo contrasta con regiones donde hay fusión | SND-SRC-0005 | p. 122, sección “Vowels” | Southern Michigan vs. otras regiones | VERIFIED |
| ENUS009-C05 | Inventario consonántico, patrones de acento y reglas principales de la descripción de Southern California se aplican también a Southern Michigan en este artículo | SND-SRC-0005 | p. 122, inmediatamente después de la tabla de consonantes | alcance del artículo | VERIFIED |

## 6. Fuente

Hillenbrand, J. M. (2003). American English: Southern Michigan. *Journal of the International Phonetic Association, 33*(1), 121–126. https://doi.org/10.1017/S0025100303001221

## 7. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.
- **Control visual:** tabla consonántica y comienzo de la sección vocálica comprobados en la página 122 del PDF de Cambridge.
- **Límite:** no usar el perfil como una pronunciación nacional neutral ni proyectar la muestra de 1995/2003 sobre el inglés estadounidense contemporáneo completo.

## 8. Relacionado con

- SND-ENUS-001 — Por qué no usamos “General American” como una sola voz
- SND-ENUS-003 — Sistemas vocálicos y variación regional
- SND-FND-017 — Variación

## Revisión lingüística wave 01

- **Fecha:** 2026-10-11.
- **Resultado:** PASS.
- **Comprobado:** alcance regional/histórico, límites de muestra, relación con Ladefoged y control de generalización nacional.
- **Cambios de claims:** ninguno.
- **Siguiente gate:** EDITORIAL_REVIEW.

## Revisión editorial wave 01

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `EDITORIAL_REVIEW`.
- **Lectura:** El perfil mantiene visibles muestra, fecha, región y límites de generalización; la organización permite reutilizar Southern Michigan como caso documentado sin convertirlo en pronunciación nacional.
- **Control:** no se modificaron claims R33, source IDs, localizadores, transcripciones ni alcance de variedad durante este gate.
- **Siguiente paso:** candidato a `READY_FOR_COMPOSITION` únicamente después de aplicar el gate de composition readiness a esta misma versión.


## Composition readiness wave 01

- **Fecha:** 2026-10-13.
- **Versión evaluada:** blob `4347ccba5be81b8d146d0cc68eefc041b9aa699d`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION` como perfil regional documentado dentro de la arquitectura `MULTI_REFERENCE`.
- **Reader-facing projection:** encabezado + §§1–4, §6 y §8; excluir §5 (tabla R33), §7 (auditoría) y los bloques de revisión/gate.
- **Alcance obligatorio:** conservar Southern Michigan / Inland Northeast, composición de la muestra, fecha de los datos y la prohibición de extrapolar a todo EE. UU.
- **Pronunciation Quick Layer:** `OMITTED_WITH_REASON` — la versión menciona el contraste *cot/caught*, pero no contiene una representación formal suficiente para derivar una pronunciación fácil sin introducir una decisión nueva.
- **Audio:** no requerido.
- **Guard de composición:** no añadir IPA, fusionar variedades ni presentar Southern Michigan como “General American”.
- **Handoff:** `composition/handoffs/SND-ENUS-009.md`.
