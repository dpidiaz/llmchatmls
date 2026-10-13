# SND-DE-006 — Procesos contextuales

**Estado:** READY_FOR_COMPOSITION.  
**Idioma:** alemán.  
**Dominio:** fonética / procesos contextuales.  
**Alcance:** variedad ilustrada por Kohler (1990).

## 1. Aspiración de /p t k/

En la variedad ilustrada, Kohler describe /p t k/ como aspiradas salvo en determinados contextos: no cuando están precedidas por una fricativa dentro de la misma palabra ni cuando las sigue una nasal silábica. La aspiración es más fuerte antes de vocal tónica y más débil en palabras funcionales átonas.

MLS-SND tratará esto como patrón contextual, no como propiedad idéntica de cada realización de /p t k/.

## 2. Variación de /r/

El artículo describe /r/ con múltiples realizaciones condicionadas: aproximante en contexto intervocálico, ensordecida después de oclusivas/fricativas sordas, vocalizada postvocálicamente antes de consonante o al final de palabra, y con variación de lugar articulatorio según contexto vocálico.

La terminación `-er` aparece también con realización vocalizada en el sistema descrito.

## 3. Inicio vocálico y golpe glotal

Excepto en palabras funcionales átonas, la fuente describe vocales iniciales de palabra o raíz precedidas por golpe glotal.

Esta afirmación se conserva dentro del alcance de la Illustration y no se convierte automáticamente en regla para todos los estilos/variedades del alemán.

## 4. Distribución [ç] / [x]

Kohler condiciona la distribución de [ç] y [x] por contexto vocálico/consonántico y estructura morfológica. La fuente distingue, por ejemplo, contextos posteriores a vocales anteriores frente a diferentes clases de vocales posteriores.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| DE006-C01 | /p t k/ se aspiran bajo condiciones específicas y la fuerza varía con acento/contexto | SND-SRC-0019 | Kohler 1990, p. 49, “Conventions”, primer párrafo | variedad descrita | VERIFIED |
| DE006-C02 | /r/ presenta aproximantización, ensordecimiento y vocalización según contexto | SND-SRC-0019 | p. 49, párrafo sobre /r/ | variedad descrita | VERIFIED |
| DE006-C03 | Excepto palabras funcionales átonas, vocales iniciales de palabra/raíz se describen precedidas por golpe glotal | SND-SRC-0019 | p. 50, primer párrafo | variedad descrita | VERIFIED |
| DE006-C04 | [ç] y [x] muestran distribución contextual y morfológica descrita por la fuente | SND-SRC-0019 | pp. 48 y 50, discusión de /x/ y convenciones | análisis del artículo | VERIFIED |

## 6. Fuente

Kohler, K. J. (1990). German. *Journal of the International Phonetic Association, 20*(1), 48–50.

## 7. Nota editorial

Las diferencias DE/AT/CH pertenecen a SND-DE-008 y a fuentes específicas de cada estándar nacional; esta entrada no las absorbe.

## 8. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.

## 9. Revisión editorial wave 01

- **Fecha:** 2026-10-12.
- **Resultado:** PASS_WITH_SCOPE_WARNING → `EDITORIAL_REVIEW`.
- **Lectura:** aspiración, /r/, golpe glotal y [ç]/[x] se presentan como procesos/contextos de la variedad ilustrada, no como reglas absolutas para DE/AT/CH.
- **Scope warning:** la entrada conserva su función de referencia contextual; diferencias nacionales siguen fuera y remiten a DE-008/fuentes específicas.
- **Cambios lingüísticos/R33:** ninguno.
- **Siguiente gate:** composition readiness sobre esta misma versión.

## 10. Composition readiness wave 01

- **Fecha:** 2026-10-12.
- **Versión evaluada:** blob `54829c5fbaa621f54a24ef03532d366098a32e03`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Alcance:** aspiración, /r/, golpe glotal y [ç]/[x] permanecen procesos de la variedad ilustrada, no reglas absolutas DE/AT/CH.
- **Reader-facing:** incluir §§1–4 y nota editorial de alcance; excluir tabla R33, auditoría y metadata interna.
- **Pronunciation Quick Layer:** OMITTED_WITH_REASON; no se añade forma concreta ni respelling.
- **Written-only:** PASS.

