# MLS-V10-0051 — corrección propuesta

**Estado:** revisión local del conflicto; propuesta pendiente de validación canónica. El artículo y su Evidence canónicos no se modificaron.

## Conflicto del backup

El recibo local `MLS-CNF-9C780487CC6C20E3525C118D` señala que el artículo clasifica *contándoselo* como esdrújula. El mismo registro del backup incluye una afirmación correctiva: la palabra es sobresdrújula. En el SQL la afirmación correctiva seguía `unverified` y la entrada estaba `SOURCED`; no se acepta ese estado como prueba.

El artículo canónico actual coincide exactamente con la versión del backup. Su Evidence R33 está en `VERIFIED`, revisión 2, pero cubre una afirmación general sobre enclíticos y reglas de acentuación y no registra este conflicto puntual. Este hallazgo local no invalida ni extiende esa certificación.

## Cambio propuesto

**Antes**

> *contándoselo:* *contando + se + lo*. La adición de dos pronombres produce una forma esdrújula.

**Después**

> *contándoselo:* *contando + se + lo*. La palabra completa es sobresdrújula y, por eso, lleva tilde.

La segmentación silábica es *con-tán-do-se-lo*. La sílaba tónica *tán* precede a la antepenúltima, por lo que la clasificación es sobresdrújula. El análisis de esta palabra es una aplicación local de la regla; no se atribuye a la fuente una mención literal de *contándoselo*.

## Fuentes consultadas

La RAE establece que los enclíticos se escriben unidos al verbo y que la forma resultante sigue las reglas generales. En el apartado sobre voseo clasifica *decímelo* como esdrújula cuando lleva dos pronombres. La misma obra define sobresdrújula por la posición de la sílaba tónica y establece la tilde para esdrújulas y sobresdrújulas.

Real Academia Española. (s. f.). *Ortografía*. §§ 3.1.2 y 3.5.3, pp. 12 y 16 del PDF (páginas impresas 1526 y 1530). https://www.rae.es/diccionario-estudiante/docs/ortografia.pdf

## Pendiente

Esta propuesta solo resuelve el punto ortográfico detectado. Falta revisar las otras afirmaciones y ejemplos de la entrada y ejecutar la validación canónica sobre cualquier cambio aceptado. No marcar `VERIFIED` ni actualizar el PDF hasta cerrar ese proceso.
