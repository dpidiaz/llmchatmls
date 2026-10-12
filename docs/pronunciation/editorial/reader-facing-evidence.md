# MLS-SND — Fuentes y fundamento para el lector

Estado: **diseño editorial v0.2**.

## 1. Objetivo

MLS-SND debe ser auditable sin obligar al lector a interpretar la infraestructura interna de R33.

La edición de lectura mostrará una capa comprensible de **Fuentes y fundamento** derivada de la evidencia interna, mientras el repositorio conserva el detalle claim ↔ source ↔ locator.

## 2. Dos capas distintas

### Capa interna

Puede contener:

- claim_id;
- source_id;
- localizador exacto;
- estado evidencial;
- versión;
- notas de auditoría;
- conflictos;
- decisiones analíticas.

Esta capa existe para investigación, revisión y trazabilidad.

### Pronunciation Quick Layer: derivada, no evidencial

La pronunciación fácil puede formar parte de la capa de lectura, pero **no es una fuente ni una capa R33**.

Debe derivarse de representación lingüística ya aprobada y conservar, cuando sea material:

- forma original;
- locale del lector;
- variedad/contexto;
- vínculo con la representación formal o explicación profunda.

No se permite usar una respelling pedagógica para:

- justificar un claim;
- reemplazar un localizador;
- inferir IPA;
- ocultar una diferencia de variedad;
- promover un estado editorial.

La procedencia de la derivación puede registrarse en el Composition Handoff Manifest sin mostrarla como aparato crítico al lector.

### Capa de lectura

Debe responder de manera simple:

- ¿en qué fuentes se apoya esta entrada?;
- ¿qué variedad describen?;
- ¿hay una decisión editorial que deba conocer?;
- ¿existe variación o desacuerdo relevante?;
- ¿dónde puedo comprobar la afirmación?

## 3. Bloque “Fuentes y fundamento”

Una entrada puede cerrar con:

### Fuentes principales

Referencias realmente utilizadas en la versión publicada.

### Alcance de la evidencia

Una frase breve cuando sea material:

> Esta descripción se refiere a la variedad X documentada por Y.

### Variación o desacuerdo

Solo cuando afecte la interpretación:

> Las fuentes difieren en el análisis de Z; esta entrada adopta A por las razones explicadas en la nota editorial.

### Localizadores

Página, sección, tabla, entrada lexicográfica u otro localizador reproducible.

## 4. Qué no mostrar automáticamente

La edición destinada al lector no necesita mostrar por defecto:

- códigos de worker;
- estados R44;
- hashes;
- IDs de lease;
- nombres de ramas;
- estados internos como SOURCE_MAPPED;
- logs de auditoría.

Estos datos pueden seguir existiendo en el repositorio.

## 5. Claim IDs

Los claim IDs son útiles para auditoría, pero no necesitan aparecer en la prosa principal.

Pueden conservarse:

- en edición técnica;
- en metadatos digitales;
- en una vista expandible futura;
- en el repositorio fuente.

## 6. Decisiones editoriales visibles

Cuando una afirmación del texto no sea un hecho lingüístico sino una decisión MLS-SND, debe marcarse conceptualmente como tal.

Ejemplos:

- elección de variedad de referencia;
- nivel de transcripción;
- orden de capas escritura → romanización → IPA;
- nomenclatura interna;
- política comparativa.

El lector no debe recibir una decisión editorial como si procediera de una institución lingüística externa.

## 7. Conflictos entre fuentes

Si el desacuerdo es material, la edición debe explicarlo.

No es necesario reproducir toda la auditoría; basta con:

1. describir las posiciones;
2. delimitar su alcance;
3. indicar qué solución adopta la entrada, si adopta una;
4. enlazar las fuentes.

## 8. Fuentes normativas

Cuando una fuente sea normativa, el texto debe decirlo.

Preferir:

> “Duden registra/recomienda…”

en vez de:

> “En alemán siempre se pronuncia…”

si la evidencia realmente es lexicográfica/normativa.

## 9. Fuentes descriptivas

Cuando una fuente describa una muestra o corpus, la edición debe conservar el alcance.

Preferir:

> “En la muestra de 53 hablantes estudiada por…”

en vez de:

> “En Taiwán todos los hablantes…”

## 10. Regla de derivación

La capa de lectura **se deriva** de la evidencia R33 validada.

Nunca ocurre al revés: una bibliografía visualmente completa no convierte una entrada en validada.
