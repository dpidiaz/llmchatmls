# Estandar de proyectos derivados de MLS

**Version:** 1.0  
**Fecha:** 21 de septiembre de 2026  
**Nombre conceptual:** MLS Derived Knowledge System Standard  
**Estado:** estandar recomendado para futuros proyectos similares.

## 1. Proposito

MASTER LANGUAGE SYSTEM paso de una idea editorial a una plataforma operativa con corpus canonico, automatizacion, busqueda, IA, staging, recuperacion, observabilidad, accesibilidad y QA.

Este documento convierte las lecciones de MLS en un estandar reutilizable para futuras enciclopedias digitales especializadas.

MLS se considera aqui un **caso de referencia exitoso dentro de sus objetivos tecnicos y de producto actuales**. Esta expresion no implica por si sola validacion comercial, cientifica o academica externa.

El estandar busca evitar dos errores:

1. copiar todas las decisiones de MLS como si fueran universales;
2. comenzar cada nuevo sistema desde cero y repetir problemas ya resueltos.

## 2. Lenguaje normativo

Se utilizan tres niveles:

- **MUST:** requisito para considerar el sistema conforme al estandar base.
- **SHOULD:** recomendacion fuerte; puede omitirse con justificacion.
- **MAY:** capacidad opcional.

## 3. Naturaleza del producto

El sistema MUST ser una enciclopedia o plataforma de consulta de conocimiento.

El nucleo no debe asumir que es un curso.

Por defecto NO debe introducir:

- ejercicios;
- tareas;
- quiz;
- examenes;
- evaluacion;
- flashcards;
- gamificacion;
- rutas obligatorias.

Un dominio puede crear otro producto pedagogico en el futuro, pero eso constituye otra variante y debe declararse explicitamente.

Principio heredado de MLS:

> **EXPLICAR -> ACLARAR -> AMPLIAR -> RESPONDER.**

Y:

> **La explicacion mas sencilla que siga siendo verdadera.**

## 4. Separacion entre nucleo y dominio

Un proyecto derivado MUST distinguir capacidades generales de decisiones especificas.

### Generalizables

- corpus canonico;
- identificadores;
- taxonomia;
- Reader;
- search;
- relaciones;
- Virtuoso;
- Evidence & Provenance;
- AUTOOPT;
- staging;
- recovery;
- QA;
- accesibilidad;
- operacion desde chat;
- observabilidad.

### Especificas de MLS

- CEFR;
- idiomas;
- pronunciacion;
- romanizacion;
- traduccion;
- alfabetos;
- conjugacion;
- familias AUTOOPT linguisticas.

Un nuevo sistema no debe cargar conceptos linguisticas que no necesita.

## 5. Identidad del sistema

Cada repositorio MUST declarar inequívocamente su identidad.

Se recomienda un archivo `SYSTEM.json` con al menos:

```json
{
  "systemId": "DESIGN",
  "domain": "graphic-design",
  "repository": "owner/repository",
  "standardVersion": "1.0"
}
```

Antes de cualquier escritura automatizada MUST verificarse:

- repository;
- systemId;
- domain;
- branch;
- HEAD esperado.

No confiar exclusivamente en contexto conversacional.

## 6. Aislamiento por repositorio

Cada enciclopedia SHOULD comenzar en un repositorio independiente.

Tambien SHOULD tener, inicialmente:

- Worker independiente;
- D1 independiente;
- secrets independientes;
- staging independiente;
- indices independientes;
- contratos independientes.

La infraestructura compartida solo debe introducirse despues de demostrar beneficio y aislamiento suficiente.

## 7. Namespace

Cada sistema MUST usar identificadores propios.

Un backend MUST rechazar identificadores que no pertenezcan a su namespace cuando la operacion sea de escritura o publicacion.

Los IDs deben ser:

- estables;
- no reutilizables;
- legibles o trazables;
- independientes del titulo cuando sea posible.

## 8. Corpus canonico

El conocimiento publicado MUST tener una fuente canonica versionada y recuperable.

El patron de referencia de MLS es:

> GitHub preserva el conocimiento. La infraestructura solo lo sirve.

Cuando se adopte este patron:

- el corpus editorial vive en GitHub;
- los assets de runtime se generan deterministamente;
- D1 no es la unica copia de conocimiento publicado;
- un recovery limpio puede reconstruir el sistema desde el repositorio y la configuracion de infraestructura.

## 9. Recuperabilidad

El proyecto MUST documentar una secuencia reproducible de recovery.

Debe ser posible determinar:

- que necesita clonarse;
- que se genera;
- que secrets no se versionan;
- que tests validan integridad;
- que comando construye;
- que comando verifica sin desplegar.

El deploy no debe utilizarse como prueba de compilacion.

## 10. GitHub aware design

Un sistema conforme SHOULD mantenerse deliberadamente pequeno aunque GitHub admita repositorios mucho mayores.

Presupuesto de referencia:

| Estado | Working tree |
| --- | ---: |
| Objetivo | menor de 75 MiB |
| Advertencia | 75 a 100 MiB |
| Revision | mayor de 100 MiB |

Debe medirse tambien el crecimiento de `.git`.

Los nuevos objetos generados SHOULD ser pequenos. Si un archivo supera aproximadamente 1 MiB, se debe evaluar si conviene shardearlo.

## 11. Sharding

Los nuevos corpus MUST evitar directorios excesivamente anchos.

Objetivo recomendado:

- aproximadamente 250 entradas por directorio;
- advertencia interna antes de 900 elementos;
- indices divididos en shards pequenos, por ejemplo 100 IDs;
- manifests raiz compactos.

No crear manifests monoliticos que crezcan sin limite.

## 12. Media y peso

La variante base del estandar es:

# TEXT FIRST / NO IMAGES.

Por defecto no incorporar:

- imagenes;
- video;
- paquetes multimedia;
- audio decorativo;
- thumbnails;
- scans.

La razon es mantener alta densidad educativa con baja huella tecnica.

Un dominio MAY autorizar medios en una revision posterior, pero debe:

1. justificar valor educativo;
2. medir impacto;
3. definir presupuesto;
4. preservar accesibilidad;
5. evitar que el medio se vuelva requisito para comprender todo el corpus.

## 13. Source policy

Todo nuevo dominio MUST definir una politica de fuentes antes de generar masivamente el corpus.

La politica debe especificar:

- fuentes prioritarias;
- jerarquia de autoridad;
- tipos aceptables;
- fuentes insuficientes;
- tratamiento de controversias;
- actualidad requerida;
- politica de citacion.

## 14. Evidence & Provenance

Los nuevos proyectos SHOULD nacer source first.

Debe distinguirse:

```text
styleReferences
evidenceSources
```

Las primeras calibran estilo.

Las segundas fundamentan conocimiento.

Estados recomendados:

```text
UNSOURCED
SOURCED
VERIFIED
REVIEWED
```

SOURCED nunca equivale automaticamente a VERIFIED.

La IA puede formar parte de provenance, pero MUST NOT considerarse fuente epistemologica independiente.

## 15. Source Registry

Una fuente SHOULD almacenarse una sola vez con identidad estable.

Metadatos posibles:

- sourceId;
- title;
- authors;
- institution;
- year;
- edition;
- publisher;
- ISBN;
- DOI;
- URL;
- sourceType;
- authorityTier.

Las entradas deben referenciar `sourceId` y no duplicar bloques bibliograficos completos en cada registro.

## 16. Claim clusters

Evidence SHOULD trabajar con grupos de afirmaciones sustantivas, no necesariamente una fila por cada frase.

Mayor granularidad debe utilizarse para:

- cifras;
- fechas;
- causalidad;
- controversias;
- afirmaciones cientificas;
- atribuciones;
- interpretaciones disputadas.

Esto protege almacenamiento y legibilidad.

## 17. Anti citation laundering

Un sistema conforme MUST prohibir la practica:

```text
articulo generado
-> fuentes relacionadas
-> bibliografia
-> VERIFIED
```

El flujo correcto es:

```text
claims
-> source discovery
-> evidence matching
-> conflict detection
-> correction
-> validation
-> verification
```

## 18. AUTOOPT

Un proyecto derivado SHOULD incorporar un mecanismo adaptativo inspirado en AUTOOPT cuando exista suficiente volumen editorial.

AUTOOPT MUST ser asesor, no autoridad.

Puede observar:

- longitud;
- secciones;
- estructura;
- fallos;
- intentos;
- publicaciones;
- tiempo;
- evidence metrics.

No puede:

- certificar verdad;
- cambiar el contrato;
- publicar por su cuenta;
- inferir causalidad sin evidencia;
- mezclar versiones incompatibles.

Sus familias MUST ser configurables por dominio.

## 19. Golden Corpus

Antes de generacion masiva SHOULD crearse un conjunto inicial revisado.

Objetivo orientativo:

```text
20 a 50 entradas
```

Debe cubrir diferentes familias y estructuras.

Sirve para:

- calibracion editorial;
- prueba del contrato;
- AUTOOPT;
- Evidence;
- QA;
- validacion de la taxonomia.

## 20. Generacion

Una entrada generada por IA MUST pasar validacion antes de convertirse en conocimiento canonico.

Pipeline recomendado:

```text
target
-> domain contract
-> style references
-> AUTOOPT advice
-> approved evidence
-> draft
-> editorial validation
-> evidence validation
-> publication
```

No se debe confundir generacion con publicacion.

## 21. Staging

La produccion editorial SHOULD tener un staging independiente del corpus publicado.

El patron MLS usa GitHub Staging con:

- rama separada;
- HEAD esperado;
- tree;
- commit;
- ref con force false;
- reconciliacion;
- idempotencia.

Un nuevo proyecto puede implementar otro mecanismo, pero debe garantizar:

- no overwrite silencioso;
- recuperacion;
- concurrencia controlada;
- trazabilidad;
- separacion entre staged y published.

## 22. GitHub no es event database

GitHub SHOULD almacenar:

- corpus;
- contratos;
- schemas;
- source policies;
- documentacion;
- configuracion;
- snapshots compactos.

No SHOULD almacenar como archivos independientes:

- cada evento;
- cada request de IA;
- cada contador;
- cada claim mutation;
- cada sesion;
- telemetria de alta frecuencia.

Esos datos corresponden al runtime.

## 23. Search

El sistema MUST ofrecer busqueda determinista aunque la IA no este disponible.

La arquitectura de referencia puede combinar:

1. señales exactas;
2. full text;
3. semantic retrieval;
4. reranking opcional con IA.

Un fallo de IA no debe impedir encontrar contenido publicado.

## 24. Virtuoso

Un sistema SHOULD disponer de una capa de orientacion equivalente a Virtuoso cuando el corpus alcance una escala donde la taxonomia por si sola ya no sea suficiente.

Virtuoso debe:

- buscar dentro del corpus canonico;
- validar IDs;
- orientar;
- relacionar conceptos;
- degradar sin IA;
- mostrar Evidence cuando sea relevante.

No debe inventar entradas inexistentes.

## 25. Profesor IA

Una capa conversacional de explicacion MAY existir.

Debe ser distinta del buscador.

El modelo de referencia es:

```text
Virtuoso = encontrar y orientar
Profesor IA = explicar y aclarar
```

No todos los dominios necesitan Profesor IA.

## 26. Operacion desde chat

Los workflows editoriales SHOULD ser operables desde chat mediante APIs o Actions.

No deben depender obligatoriamente de ChatGPT Work.

Operaciones comunes:

- estado;
- siguiente lote;
- contexto;
- validar;
- stage;
- publicar;
- continuar;
- cancelar;
- verificar Evidence.

## 27. Idempotencia

Toda operacion repetible MUST evitar duplicados.

Se deben proteger:

- publicaciones;
- reservations;
- runs;
- source records;
- evidence mappings;
- staging commits;
- revision events.

Hashes o fingerprints pueden utilizarse cuando sean apropiados.

## 28. Concurrencia

El sistema MUST definir quien gana cuando dos procesos intentan modificar la misma unidad.

No resolver carreras mediante force push o overwrite silencioso.

Releer y reconciliar.

## 29. FREE ONLY

Si el proyecto adopta una politica FREE ONLY, esta debe convertirse en contrato de arquitectura.

No introducir silenciosamente:

- proveedores de IA pagados;
- storage pagado;
- billing automatico;
- fallbacks de costo.

Si la capacidad gratuita se agota, degradar o detener de forma comprensible.

## 30. Presupuesto de IA

Cuando varias funciones compartan el mismo proveedor, SHOULD existir un presupuesto comun.

Ejemplos:

- Virtuoso;
- Profesor IA;
- generacion;
- traductor;
- Evidence research.

No deben competir a ciegas.

## 31. Offline y resiliencia

La lectura canonica SHOULD continuar sin IA.

Cuando sea viable, tambien SHOULD soportarse:

- cache;
- contenido descargado;
- estados de conexion;
- mensajes comprensibles;
- reintentos.

No todos los dominios requieren offline completo, pero la falla de red debe ser explicable.

## 32. Accesibilidad

El sistema MUST tratar accesibilidad como parte del baseline.

Minimo:

- teclado;
- focus visible;
- contraste;
- HTML semantico;
- lectores de pantalla;
- reflow;
- zoom;
- responsive mobile.

No crear un modo accesible separado como sustituto de una base correcta.

## 33. QA

Debe existir validacion automatizada de las invariantes del producto.

Categorias recomendadas:

- corpus;
- search;
- fallback;
- staging;
- recovery;
- AUTOOPT;
- Evidence;
- seguridad de repositorio;
- accesibilidad;
- responsive;
- deploy contract.

Una decision arquitectonica importante SHOULD terminar convertida en un test cuando sea posible.

## 34. Observabilidad

El sistema SHOULD distinguir estados operativos reales.

Ejemplos:

- quota exhausted;
- offline;
- AI unavailable;
- staged;
- deferred;
- needs review;
- verified;
- preserved existing.

Evitar mensajes genericos que oculten causas diferentes.

## 35. Documentacion

Cada proyecto MUST documentar:

- vision;
- arquitectura;
- contratos;
- source policy;
- corpus;
- staging;
- QA;
- recovery;
- deploy;
- riesgos;
- decisiones importantes.

La documentacion no debe depender exclusivamente de la memoria de conversaciones.

## 36. Decision records

Cambios estructurales SHOULD dejar una decision escrita que explique:

- problema;
- alternativas;
- decision;
- riesgos;
- rollback;
- impacto.

## 37. Que no debe copiarse automaticamente de MLS

Un proyecto derivado NO debe asumir que necesita:

- diez dominios;
- CEFR;
- Translator;
- Pronunciation;
- language packs;
- BGE M3 exactamente;
- Gemma exactamente;
- los mismos limites de palabras;
- las mismas familias AUTOOPT;
- el mismo schema D1 exacto.

Debe copiar principios, no accidentes historicos.

## 38. Criterio minimo de conformidad

Un proyecto puede considerarse conforme al estandar base cuando cumple, como minimo:

- identidad propia;
- repositorio independiente;
- corpus canonico versionado;
- recuperabilidad;
- contrato editorial;
- no overwrite silencioso;
- busqueda sin dependencia obligatoria de IA;
- source policy;
- Evidence model;
- QA;
- documentacion;
- seguridad de contexto.

AUTOOPT, Virtuoso, semantic retrieval, Profesor IA y offline avanzado pueden incorporarse por etapas.

## 39. Secuencia recomendada para un nuevo sistema

```text
1. definir dominio
2. crear repositorio
3. declarar SYSTEM identity
4. definir source policy
5. construir taxonomia
6. definir namespace
7. diseñar contrato editorial
8. crear Golden Corpus
9. implementar corpus canonico
10. implementar search
11. implementar Evidence & Provenance
12. implementar staging
13. calibrar AUTOOPT
14. implementar Virtuoso si escala lo requiere
15. certificar recovery y QA
16. escalar corpus
```

## 40. Principio de estandarizacion

El objetivo no es que todos los sistemas se vean identicos.

El objetivo es que compartan garantias.

> **Estandarizar invariantes; especializar el conocimiento.**

MLS demuestra que un proyecto educativo puede combinar gran cobertura, bajo peso, recuperabilidad, automatizacion, IA limitada por contratos y una experiencia accesible.

Los proyectos derivados deben conservar esas garantias sin sacrificar la independencia que cada disciplina necesita.
