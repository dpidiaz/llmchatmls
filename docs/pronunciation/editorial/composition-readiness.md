# MLS-SND — Gate de preparación para composición

**Estado:** norma editorial v0.3.  
**Función:** definir el paso `EDITORIAL_REVIEW → READY_FOR_COMPOSITION`.  
**Importante:** este documento **no promueve automáticamente ninguna entrada**.

## 1. Principio

`READY_FOR_COMPOSITION` significa que el contenido de una versión concreta está suficientemente estabilizado para pasar al carril de composición **sin pedir al maquetador que resuelva problemas lingüísticos, evidenciales o editoriales**.

No significa:

- publicación final;
- ausencia absoluta de futuras correcciones;
- aprobación de audio;
- cierre de todo el tomo;
- que la entrada deba ocupar exactamente una página.

## 2. Precondiciones duras

Una entrada solo puede evaluarse para este gate si su versión vigente ya ha pasado:

1. `EVIDENCE_CHECKED`;
2. `LINGUISTIC_REVIEW`;
3. `EDITORIAL_REVIEW`.

Si cualquiera de esos gates corresponde a una versión anterior y hubo un cambio sustantivo posterior, la entrada vuelve al gate afectado antes de continuar.

## 3. Gate PASS/BLOCKED

El resultado de la evaluación de composición solo puede ser:

- **PASS → READY_FOR_COMPOSITION**
- **BLOCKED → permanece en EDITORIAL_REVIEW o vuelve al gate anterior afectado**

No se crea un estado intermedio nuevo.

## 4. Checklist de contenido

### 4.1 Identidad y alcance

- [ ] ID y título canónicos confirmados.
- [ ] Idioma y variedad explícitos cuando son materiales.
- [ ] Dominio y nivel de representación coherentes.
- [ ] Las advertencias de alcance siguen visibles.
- [ ] No quedan etiquetas provisionales que el lector pudiera interpretar como contenido final.

### 4.2 Evidencia R33

- [ ] Todos los claims materiales de la versión vigente tienen estado adecuado.
- [ ] Cada claim material conserva `source_id + localizador + alcance`.
- [ ] No hay claims `UNSOURCED` ocultos en prosa final.
- [ ] Conflictos entre fuentes están resueltos o presentados explícitamente.
- [ ] La bibliografía de la entrada contiene únicamente fuentes realmente utilizadas.
- [ ] No hay referencias bibliográficas incompletas necesarias para comprender o auditar la entrada.

### 4.3 Revisión lingüística

- [ ] El análisis lingüístico aprobado sigue intacto.
- [ ] Variedad, registro, fecha y muestra están delimitados cuando son materiales.
- [ ] Las transcripciones corresponden al análisis aprobado.
- [ ] No se presenta una variante como universal sin evidencia.
- [ ] Norma, descripción y variación están diferenciadas cuando corresponda.

### 4.4 Revisión editorial

- [ ] La entrada puede leerse de forma autónoma.
- [ ] La explicación es comprensible para un lector autodidacta sin sacrificar precisión.
- [ ] La terminología coincide con la política canónica.
- [ ] Títulos y jerarquía de secciones son consistentes.
- [ ] Referencias cruzadas usan IDs canónicos.
- [ ] Comparaciones entre idiomas conservan su etiqueta de relación.
- [ ] No quedan instrucciones internas, notas de trabajo o lenguaje de “pendiente” dentro de la **proyección reader-facing**.
- [ ] Si el archivo fuente conserva metadata interna de auditoría/revisión, el handoff identifica explícitamente qué secciones quedan fuera de la edición de lectura.

## 5. Checklist de transcripción y sistemas de escritura

Cuando la entrada contenga representación lingüística:

- [ ] `/…/` y `[…]` se usan de acuerdo con su nivel analítico.
- [ ] Transcripción amplia/estrecha está justificada.
- [ ] Diacríticos están definidos, explicados o enlazados.
- [ ] Romanización/transliteración está identificada por sistema.
- [ ] Ortografía, romanización, transliteración e IPA no aparecen como capas intercambiables.
- [ ] Zhuyin, hangul, kana, kanji, cirílico u otros sistemas conservan su función propia.
- [ ] Signos de tono/acento/duración no mezclan convenciones sin identificar.
- [ ] Los caracteres Unicode necesarios han sido comprobados en el texto fuente.

## 6. Checklist de ejemplos

Para cada ejemplo:

- [ ] Está etiquetado como `SOURCE_EXAMPLE`, `CORPUS_EXAMPLE` o `EDITORIAL_EXAMPLE`.
- [ ] Un `EDITORIAL_EXAMPLE` no se usa como evidencia.
- [ ] La escritura original se conserva cuando corresponde.
- [ ] Glosa/traducción aparece solo cuando ayuda a identificar el ejemplo.
- [ ] La procedencia es auditable si el ejemplo viene de fuente o corpus.
- [ ] No se introduce audio como requisito para comprenderlo.

## 7. Checklist de navegación

- [ ] Entradas relacionadas apuntan a IDs existentes o a IDs canónicos ya reservados.
- [ ] No hay enlaces a IDs retirados sin redirección documentada.
- [ ] Las relaciones con fundamentos/representación están presentes cuando son necesarias para interpretar la entrada.
- [ ] La entrada puede comenzar en página nueva sin depender visualmente de la página anterior.

## 8. Open questions y blockers

Un `OPEN_QUESTION` no bloquea automáticamente la composición.

### Bloquea si:

- afecta el análisis central de la entrada;
- cambia una transcripción mostrada al lector;
- puede cambiar la variedad/alcance;
- cuestiona un claim material;
- requiere elegir entre fuentes incompatibles;
- impide definir un ejemplo o tabla principal.

### No bloquea necesariamente si:

- pertenece a una expansión futura explícitamente fuera de alcance;
- afecta un fenómeno que tendrá otra entrada;
- documenta una línea de investigación futura sin alterar el contenido aprobado;
- es una mejora opcional de aparato de consulta.

La decisión debe registrarse en el manifiesto de handoff.

## 9. Auditoría tipográfica mínima

Antes del PASS:

- [ ] IPA/Unicode renderiza correctamente en el archivo fuente.
- [ ] No se sustituyeron símbolos IPA por aproximaciones ASCII.
- [ ] Diacríticos combinantes no se perdieron.
- [ ] Comillas, rayas y signos especiales son consistentes.
- [ ] Tablas no dependen de una fuente tipográfica privada para ser inteligibles.

La prueba de maquetación completa pertenece al carril COMPOSITION, pero el contenido no debe llegar roto a ese carril.

## 10. Independencia del audio

Ninguna entrada puede requerir audio para superar este gate.

Si en el futuro existe audio:

- será una capa complementaria;
- deberá vincularse a una versión de contenido;
- no sustituirá transcripción, descripción ni evidencia escrita.

## 11. Relación con la regla de página

`READY_FOR_COMPOSITION` no exige que una entrada ocupe una página.

La regla editorial es:

> cada entrada comienza con un punto de inicio visual inequívoco, preferiblemente página nueva; su longitud la determina el contenido aprobado.

La composición puede extender una entrada a varias páginas sin recortar explicación o evidencia para cumplir una restricción visual.

## 12. Handoff obligatorio

Una entrada que reciba PASS debe llevar un **Composition Handoff Manifest** con:

- ID;
- versión/commit evaluado;
- estado de gates previos;
- variedad/alcance;
- sistemas de representación presentes;
- fuentes utilizadas;
- ejemplos presentes;
- referencias cruzadas;
- open questions no bloqueantes;
- requisitos especiales de tipografía/tablas;
- resultado PASS y fecha;
- **reader-facing projection**: secciones/bloques incluidos en la edición de lectura y metadata interna excluida;
- **Pronunciation Quick Layer**: `PRESENT`, `NOT_APPLICABLE` u `OMITTED_WITH_REASON`, con locale y procedencia derivada cuando aplique.

La plantilla está en `editorial/composition-handoff-template.md`.

## 13. Qué puede cambiar en COMPOSITION

El carril de composición puede ajustar:

- saltos de página;
- jerarquía visual;
- espaciado;
- presentación de tablas;
- cabeceras/pies;
- índices visuales;
- disposición tipográfica de bloques aprobados;
- presentación visual de una Pronunciation Quick Layer **ya aprobada en el handoff**.

No puede cambiar sin reabrir revisión:

- wording lingüísticamente material;
- IPA/transcripciones;
- claims;
- variedad/alcance;
- ejemplos;
- fuentes/localizadores;
- análisis;
- relaciones de equivalencia;
- contenido o forma de una pronunciación fácil cuando modificarla implique una decisión fonética nueva.

## 14. Regla de rollback

Si composición detecta un problema material, la entrada vuelve al gate correspondiente.

Ejemplos:

- símbolo IPA dudoso → LINGUISTIC_REVIEW;
- fuente/localizador insuficiente → EVIDENCE_CHECKED;
- frase ambigua → EDITORIAL_REVIEW.

COMPOSITION no “corrige sobre la marcha” estos problemas.

## 15. Proyección reader-facing

El archivo canónico puede conservar metadata interna de R33, revisión lingüística o revisión editorial **siempre que el Composition Handoff Manifest defina de forma inequívoca la proyección de lectura**.

La proyección debe indicar:

- qué secciones o bloques entran a la edición destinada al lector;
- qué bloques permanecen como metadata interna del repositorio;
- cómo se deriva el bloque visible de “Fuentes y fundamento”, cuando exista;
- si alguna nota editorial es reader-facing o únicamente interna;
- cualquier excepción.

Reglas:

1. COMPOSITION no decide la proyección.
2. La proyección se aprueba antes del PASS.
3. Excluir metadata interna de la página de lectura no elimina esa metadata del repositorio.
4. Una sección ambigua bloquea el gate hasta que EDITORIAL_REVIEW la clasifique.
5. La proyección debe ser coherente con `reader-facing-evidence.md` y `page-composition.md`.

### 15.1 Pronunciation Quick Layer

La reader-facing projection puede incorporar la política `pronunciation-quick-layer.md`.

Cuando aplique, el handoff debe clasificar explícitamente la capa como:

- `PRESENT`;
- `NOT_APPLICABLE`;
- `OMITTED_WITH_REASON`.

Reglas del gate:

1. la pronunciación fácil es una **derivación de composición**, no un claim R33;
2. debe declarar el idioma/locale del lector para el que fue diseñada;
3. no sustituye IPA, escritura original, romanización ni explicación lingüística aprobada;
4. COMPOSITION no puede derivarla directamente de la ortografía por intuición;
5. si producirla requiere una decisión fonética nueva, la entrada vuelve al gate pertinente;
6. una entrada conceptual puede marcar `NOT_APPLICABLE` sin perder `READY_FOR_COMPOSITION`;
7. una versión que carece de datos suficientes puede usar `OMITTED_WITH_REASON`; el hueco no se rellena artificialmente.

Las entradas ya `READY_FOR_COMPOSITION` no pierden automáticamente su estado por la introducción de esta política. La clasificación se añade en su siguiente handoff/composición; solo se reabre revisión si la nueva proyección exige contenido lingüístico no aprobado.

## 16. Definición de PASS

Una entrada puede marcarse `READY_FOR_COMPOSITION` únicamente cuando:

1. la versión evaluada está identificada;
2. gates lingüístico/evidencial/editorial corresponden a esa versión;
3. no existen blockers abiertos;
4. la auditoría de representación pasa;
5. navegación y ejemplos son auditables;
6. se adjunta el Composition Handoff Manifest;
7. el manifiesto define una proyección reader-facing inequívoca;
8. la Pronunciation Quick Layer queda clasificada y, si está presente, no introduce decisiones fonéticas nuevas.

Este gate preserva la separación fundamental de MLS-SND: **composición recibe contenido estabilizado; no decide lingüística ni evidencia**.
