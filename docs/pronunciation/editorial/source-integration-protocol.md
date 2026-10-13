# MLS-SND — Protocolo de integración de fuentes entre branches

**Estado:** propuesta operativa v0.1  
**Problema que resuelve:** múltiples chats investigan en paralelo y necesitan registrar fuentes sin competir por los IDs globales `SND-SRC-xxxx`.

## 1. Principio

El **Source Registry global** es canónico. Los workers de investigación no asignan IDs globales nuevos mientras trabajan en paralelo.

Cada branch puede usar IDs locales temporales. La canonicalización ocurre en integración.

Esto separa dos tareas:

- **investigación:** encontrar, verificar y localizar una fuente;
- **integración:** deduplicarla, asignarle un ID global y reescribir referencias de claims.

R44 organiza este flujo; R33 determina si la evidencia es suficiente. Ninguno de los dos cambia el análisis lingüístico.

## 2. IDs locales

Formato recomendado:

`<LANG>-W<NN>-S<NN>`

Ejemplos:

- `KO-W1-S01`
- `ZHTW-W2-S03`
- `ESGT-W1-S05`
- `FND-W2-S02`

Cuando una wave sea explícitamente complementaria puede usar una letra estable, por ejemplo `KO-W1-C04`, pero **una vez publicada en un PR ese ID no debe renombrarse sin actualizar atómicamente todos los claims que lo citan**.

## 3. Source map obligatorio por wave

Toda branch que introduzca fuentes nuevas deberá contener un source map local con, como mínimo:

- ID local;
- referencia APA 7;
- DOI/URL/identificador persistente;
- tipo/tier candidato;
- idioma y variedad;
- fenómeno cubierto;
- localizadores disponibles;
- acceso;
- limitaciones;
- estado de verificación;
- entradas/claims que la usan.

El source map es una **cola de candidatos**, no una extensión paralela del registro global.

## 4. Prohibición de dangling source IDs

Un claim en una branch puede citar un ID local únicamente si ese ID existe en el source map de **esa misma branch o de una dependencia declarada**.

Antes de integrar una entrada al branch matriz:

> **no puede quedar ningún ID local sin resolver.**

Estados de fuente durante integración:

- `LOCAL_CANDIDATE`
- `DEDUP_MATCH`
- `CANONICAL_NEW`
- `CANONICALIZED`
- `REJECTED`
- `HOLD`

## 5. Deduplicación

Orden de comparación recomendado:

1. DOI/ISBN/Handle/identificador institucional exacto;
2. URL canónica estable;
3. autor/institución + año + título normalizado;
4. edición/versión;
5. alcance lingüístico real.

### Regla

Misma obra + misma edición/versión = un solo `SND-SRC`, aunque dos branches hayan usado URLs distintas.

Mismo título pero edición, corpus, versión normativa o snapshot materialmente distintos = pueden requerir registros diferentes.

Una página institucional que **describe** una obra y la obra misma no se fusionan automáticamente si cumplen funciones evidenciales distintas.

## 6. Canonicalización

El integrador:

1. lee todos los source maps de los PRs que va a combinar;
2. compara cada candidato con el Source Registry vigente;
3. marca coincidencias como `DEDUP_MATCH`;
4. reserva IDs globales solo para fuentes realmente nuevas;
5. añade las fuentes nuevas al Source Registry;
6. reescribe en la misma integración cada claim local hacia su `SND-SRC-xxxx`;
7. comprueba que no queden IDs locales;
8. vuelve a ejecutar el gate de evidencia de las entradas afectadas.

La asignación del ID global y la reescritura de claims deben considerarse una **operación atómica de integración**.

## 7. No confiar en numeración adelantada

Un worker nunca debe asumir:

> “el próximo ID global será SND-SRC-0031”.

Otra branch puede integrarse primero.

Los números globales solo se reservan en el commit/PR de integración que modifica el registro canónico.

## 8. Claims que usan más de una fuente

Un claim puede citar:

- una sola fuente;
- varias fuentes complementarias;
- una fuente principal + un control independiente.

Cada referencia debe poder rastrearse a un registro canónico.

Si una fuente solo respalda una parte del claim, dividir el claim es preferible a hacer que una cita aparente respaldarlo completo.

## 9. Fuente normativa vs. descriptiva

La deduplicación bibliográfica **no fusiona alcances**.

Ejemplo:

- una regla oficial de pronunciación puede ser `NORMATIVE`;
- un corpus de habla espontánea puede ser `CORPUS_OBSERVED`.

Aunque ambos documenten el mismo fenómeno, no son intercambiables.

El registro debe conservar sus limitaciones y cada claim debe declarar el alcance adecuado.

## 10. Versiones y snapshots

Para recursos que cambian:

- registrar versión/fecha si existe;
- registrar fecha de verificación;
- preferir DOI, versión normativa o snapshot estable;
- no asumir que una página institucional futura conservará idéntico contenido.

Si una norma fue revisada, el integrador debe decidir si:
- sustituye una versión previa;
- conviven ambas por razones históricas;
- la nueva versión supersede la anterior para claims contemporáneos.

## 11. Conflictos entre source maps

Si dos branches proponen la misma fuente con metadatos diferentes:

1. no escoger silenciosamente una;
2. comprobar la fuente primaria;
3. registrar la referencia bibliográfica correcta;
4. conservar la mejor información de alcance/localizadores;
5. documentar la reconciliación en el PR de integración.

## 12. Fuentes rechazadas

Una fuente puede pasar a `REJECTED` si:

- no es verificable;
- el DOI/URL no corresponde al título citado;
- el alcance no respalda los claims;
- es un agregador cuando existe la fuente primaria accesible;
- el localizador fue inventado o no se puede reproducir;
- duplica sin valor adicional una fuente canónica.

No borrar silenciosamente el rastro: el reporte de la wave debe indicar qué candidato se descartó y por qué.

## 13. Gate automático/manual de integración

Antes de fusionar un PR de contenido al branch matriz, comprobar:

- [ ] todo source ID citado existe;
- [ ] ningún `KO-W…`, `FR-W…`, etc. queda en las entradas integradas;
- [ ] cada `SND-SRC` existe exactamente una vez en el registro;
- [ ] DOI/URL y APA corresponden a la misma obra;
- [ ] variedad/alcance del source coincide con el claim;
- [ ] localizador es reproducible;
- [ ] una fuente normativa no se usa como frecuencia descriptiva sin evidencia adicional;
- [ ] si cambió un source ID, todos los claims afectados fueron re-auditados;
- [ ] no se promovió el estado R33 solo por canonicalizar la bibliografía.

## 14. Coordinación entre chats

### Worker

- reclama IDs de entradas;
- usa fuente local;
- abre PR;
- no modifica el Source Registry global salvo que sea explícitamente una wave de integración.

### Integrador

- puede trabajar varios PRs juntos;
- deduplica candidatos;
- asigna IDs;
- actualiza claims;
- deja comentario de reconciliación en cada PR fuente.

### Auditor

- comprueba que source → locator → claim siga siendo correcto **después** de la canonicalización.

## 15. Caso de prueba: perfil coreano

El trabajo paralelo coreano reveló tres fallos que este protocolo debe impedir:

1. KO-001 llegó a la rama matriz citando `KO-SRC-P01/P02` que no estaban en el Source Registry global.
2. Una wave complementaria renombró sus candidatos de `KO-W1-Sxx` a `KO-W1-Cxx` sin que las entradas se actualizaran al mismo tiempo.
3. Dos PRs paralelos investigaron fuentes parcialmente coincidentes.

Aplicando este protocolo:

- #7287/#7288 conservan sus mapas locales;
- el integrador deduplica sus candidatos;
- asigna una única identidad canónica por fuente;
- reescribe claims;
- el auditor vuelve a verificar la versión integrada.

## 16. Invariante

> **Ninguna entrada integrada puede depender de una fuente que solo exista en la memoria de un chat o en un ID local huérfano.**

GitHub debe contener tanto la afirmación como la ruta reproducible hasta su evidencia.
