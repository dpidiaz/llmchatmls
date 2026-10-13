# SND-DE-003 — Longitud y calidad vocálica

**Estado:** READY_FOR_COMPOSITION.  
**Idioma:** alemán.  
**Dominio:** vocales / duración.  
**Alcance:** patrón descrito por Kohler (1990) para la variedad ilustrada.

## 1. Duración y calidad no deben separarse mecánicamente

Kohler organiza pares vocálicos con diferencias de apertura/calidad y duración. En la variedad ilustrada, las vocales más cerradas de un par close/open son más largas bajo las mismas condiciones de acento y entorno.

Esta formulación es más precisa que enseñar una oposición simple “larga vs. corta” sin hablar de calidad.

## 2. El contexto átono modifica la duración

La fuente señala que, en posición átona, las vocales cerradas se acortan y pueden conservar su calidad cerrada. También introduce una excepción/limitación para palabras funcionales átonas.

Por tanto MLS-SND no enseñará que el símbolo o la calidad de una vocal determina por sí solo una duración fija.

## 3. Qué puede y no puede afirmar esta entrada

Esta entrada puede afirmar la relación documentada por Kohler para la variedad ilustrada. No debe extrapolarla sin más a los estándares austríaco y suizo ni convertirla en una ecuación universal entre tensión/calidad y longitud.

## 4. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| DE003-C01 | En pares close/open, la vocal más cerrada es más larga bajo iguales condiciones de acento y entorno | SND-SRC-0019 | Kohler 1990, p. 50, párrafo “The closer vowels…” | variedad descrita | VERIFIED |
| DE003-C02 | En posición átona, las vocales cerradas se acortan y pueden mantener su calidad | SND-SRC-0019 | p. 50, mismo párrafo | variedad descrita | VERIFIED |
| DE003-C03 | La fuente exceptúa de esa restricción a ciertas palabras funcionales átonas | SND-SRC-0019 | p. 50, final del mismo párrafo | variedad descrita | VERIFIED |

## 5. Fuente

Kohler, K. J. (1990). German. *Journal of the International Phonetic Association, 20*(1), 48–50.

## 6. Nota editorial

La revisión lingüística del perfil ya fue completada; cualquier decisión transversal futura sobre close/open, tense/lax o longitud deberá mantenerse coherente con la terminología canónica y con los estándares nacionales.

## 7. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.

## 8. Revisión editorial wave 01

- **Fecha:** 2026-10-12.
- **Resultado:** PASS_WITH_METADATA_FIX → `EDITORIAL_REVIEW`.
- **Lectura:** la entrada evita la simplificación “larga vs. corta” y mantiene calidad, duración, acento y entorno como dimensiones relacionadas.
- **Corrección editorial:** la nota final deja de presentar la revisión lingüística como pendiente; cualquier armonización terminológica transversal futura sigue siendo editorial/terminológica.
- **Cambios lingüísticos/R33:** ninguno.
- **Siguiente gate:** composition readiness sobre esta misma versión.

## 9. Composition readiness wave 01

- **Fecha:** 2026-10-12.
- **Versión evaluada:** blob `cab6d34261c8c28af3f0ad949f1784a59a56ba39`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Alcance:** la relación calidad/duración permanece condicionada por acento, entorno y la variedad ilustrada.
- **Open question no bloqueante:** armonización terminológica transversal futura sobre close/open, tense/lax o longitud.
- **Reader-facing:** incluir §§1–3 y nota editorial pertinente; excluir tabla R33 y metadata interna.
- **Pronunciation Quick Layer:** NOT_APPLICABLE; entrada conceptual de sistema.
- **Written-only:** PASS.

