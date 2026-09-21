# Expansion y estandarizacion

**Proyecto de referencia:** MASTER LANGUAGE SYSTEM — Revision 32  
**Fecha:** 21 de septiembre de 2026  
**Estado:** documentacion estrategica; no autoriza por si sola cambios de arquitectura ni despliegues.

## Proposito

Esta carpeta documenta dos conclusiones surgidas de la evolucion de MASTER LANGUAGE SYSTEM (MLS).

La primera es que varias de las soluciones construidas para MLS —corpus canonico recuperable desde GitHub, busqueda, Virtuoso, AUTOOPT, staging editorial, validacion, resiliencia, accesibilidad y operacion por chat— pueden ser utiles para enciclopedias de otros dominios.

La segunda es que esa reutilizacion no debe lograrse convirtiendo `dpidiaz/llmchatmls` en un megarepositorio universal. MLS debe conservar su identidad como producto linguistico. Los sistemas futuros deben poder evolucionar de forma independiente y solo compartir aquello que haya demostrado ser realmente comun.

## Documentos

### 01 Recomendacion de expansion MKS.md

Describe la recomendacion de expansion futura hacia una familia de enciclopedias especializadas, denominada conceptualmente MASTER KNOWLEDGE SYSTEM (MKS).

La recomendacion central es:

> MKS no reemplaza a MLS. MKS se extrae de las partes de MLS que demuestren ser independientes del dominio.

El documento define aislamiento por repositorio, Worker y D1, limites de GitHub, seguridad de contexto, estrategia para un futuro `mks core` y uso transversal de varios repositorios para investigacion o un proyecto de grado.

### 02 Estandar de proyectos derivados de MLS.md

Define un estandar de referencia para construir nuevas enciclopedias inspiradas en MLS sin copiar ciegamente sus decisiones linguisticas.

Distingue:

- requisitos nucleares reutilizables;
- capacidades recomendadas;
- capacidades especificas de cada dominio;
- reglas para Evidence & Provenance;
- AUTOOPT;
- GitHub;
- staging;
- busqueda;
- Virtuoso;
- QA;
- ligereza;
- seguridad entre repositorios.

## Alcance

Estos documentos describen una expansion futura. No cambian el objetivo actual de MLS ni autorizan la creacion inmediata de nuevos repositorios.

La prioridad de corto plazo sigue siendo consolidar MLS y desarrollar Evidence & Provenance de forma incremental y compatible con R32.

## Relacion con el caso de desarrollo

La documentacion del caso de desarrollo tecnologico y pedagogico se encuentra en:

`docs/caso de desarrollo tecnologico y pedagogico/`

Esta carpeta complementa ese caso documentando una consecuencia posterior: MLS ya no sirve solamente como producto, sino tambien como **implementacion de referencia de principios que podrian estandarizar futuros sistemas de conocimiento**.

Eso no significa que todas las decisiones de MLS sean universales. El objetivo de este estandar es precisamente separar las decisiones transferibles de las que pertenecen al dominio linguistico.
