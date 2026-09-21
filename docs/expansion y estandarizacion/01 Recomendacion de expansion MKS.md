# Recomendacion de expansion MKS

**Version:** 1.0  
**Fecha:** 21 de septiembre de 2026  
**Proyecto de origen:** MASTER LANGUAGE SYSTEM  
**Estado:** recomendacion futura; expansion pospuesta hasta consolidar MLS.

## 1. Resumen ejecutivo

MASTER LANGUAGE SYSTEM comenzo como un proyecto de organizacion y explicacion de conocimiento linguistico. Su evolucion produjo componentes que trascienden el dominio de los idiomas: corpus canonico, automatizacion editorial, AUTOOPT, staging en GitHub, recuperacion, busqueda lexical y semantica, Virtuoso, Profesor IA, circuit breaker, QA, accesibilidad y operacion desde chat.

La existencia de esos componentes abre la posibilidad de construir enciclopedias especializadas en otros dominios, por ejemplo Diseño Grafico, Marketing, Psicologia o Filosofia.

La recomendacion no es transformar el repositorio MLS en un sistema universal.

La recomendacion es:

> **Preservar MLS como producto independiente y extraer, con evidencia practica, una arquitectura MKS a partir de las partes de MLS que demuestren ser independientes del dominio.**

## 2. MKS como ecosistema, no como megarepositorio

MASTER KNOWLEDGE SYSTEM se entiende aqui como una **familia de enciclopedias especializadas** y una arquitectura compartida, no como una sola enciclopedia que contenga todo el conocimiento.

Arquitectura conceptual futura:

```text
mks core
  |
  +-- llmchatmls
  +-- mks design
  +-- mks marketing
  +-- mks psychology
  +-- mks philosophy
```

Cada producto conserva:

- repositorio;
- corpus;
- namespace;
- contrato editorial;
- familias AUTOOPT;
- Source Registry;
- Evidence & Provenance;
- Worker;
- D1;
- staging;
- despliegue;
- QA.

El codigo comun solo se extrae cuando exista evidencia de que es realmente comun.

## 3. MLS no debe convertirse en MKS

No se recomienda renombrar o reconvertir `dpidiaz/llmchatmls` en un repositorio universal.

Principales razones:

- riesgo de regresiones sobre un producto ya operativo;
- contaminacion entre conceptos linguisticas y conceptos genericos;
- estadisticas AUTOOPT mezcladas entre dominios;
- mayor radio de impacto de un fallo;
- releases y QA acoplados;
- crecimiento innecesario de Git y GitHub;
- politicas de fuentes diferentes por disciplina;
- mayor riesgo de conflictos entre workstreams;
- rollback transversal innecesario;
- complejidad creciente en Virtuoso y retrieval.

El principio recomendado es:

> **MKS no reemplaza a MLS. MKS se extrae de MLS.**

## 4. Secuencia recomendada

No crear `mks core` inmediatamente.

Secuencia:

```text
MLS R32 estable
-> Evidence & Provenance R33
-> piloto real de Evidence
-> R33 estable
-> segundo dominio independiente
-> comparacion MLS / segundo dominio
-> identificacion de componentes realmente comunes
-> extraccion de mks core
```

El segundo dominio recomendado como prueba es Diseño Grafico, porque combina teoria, historia, practica profesional y estructura conceptual suficientemente distinta de la linguistica.

## 5. Repositorio independiente por sistema

Estructura futura posible:

```text
dpidiaz/llmchatmls
dpidiaz/mks design
dpidiaz/mks marketing
dpidiaz/mks psychology
dpidiaz/mks philosophy
dpidiaz/mks core
```

Los nombres reales deberan seguir las restricciones tecnicas de GitHub; los nombres mostrados aqui son conceptuales.

Cada repositorio debe poder clonarse, validarse, construirse y recuperarse de manera independiente.

Un fallo o despliegue de Psicologia no debe poner en riesgo MLS.

## 6. Aislamiento Cloudflare

Inicialmente se recomienda:

```text
Repositorio MLS -> Worker MLS -> D1 MLS
Repositorio Design -> Worker Design -> D1 Design
Repositorio Psychology -> Worker Psychology -> D1 Psychology
```

No comenzar con una base de datos global compartida.

Las ventajas son:

- menor blast radius;
- permisos mas simples;
- backups y recovery independientes;
- metricas AUTOOPT separadas;
- presupuestos y quotas observables por producto;
- rollback local;
- releases desacoplados.

La infraestructura comun puede evaluarse posteriormente.

## 7. Limites y salud de GitHub

MLS demuestra que una enciclopedia textual grande puede seguir siendo pequena. La medicion de septiembre de 2026 encontro aproximadamente 58.8 MiB de blobs y 10 420 archivos en `main`.

Para proyectos futuros se recomienda un presupuesto deliberadamente conservador:

| Estado | Working tree orientativo |
| --- | ---: |
| Ideal | menor de 75 MiB |
| Advertencia | 75 a 100 MiB |
| Revision arquitectonica | mayor de 100 MiB |

Estos valores son una politica interna, no limites oficiales de GitHub.

Tambien deben vigilarse:

- tamaño de `.git`;
- objetos grandes;
- anchura de directorios;
- manifests;
- cantidad de commits automaticos;
- crecimiento de indices semanticos;
- staging historico.

## 8. Sharding desde el inicio

Algunos directorios actuales de MLS superan 1 000 entradas. Aunque son manejables para Git, ese patron no debe repetirse deliberadamente en nuevos sistemas.

Los nuevos corpus deben nacer shardados.

Ejemplo:

```text
content/
  0001 0250/
  0251 0500/
  0501 0750/
```

Objetivo recomendado:

- alrededor de 250 entradas por directorio;
- indices de alrededor de 100 IDs por shard;
- manifests pequenos que apunten a manifests secundarios.

No crear un unico archivo de indice que crezca indefinidamente.

## 9. GitHub como fuente canonica, no como base operacional

La arquitectura actual de MLS establece una regla fuerte:

> GitHub preserva el conocimiento. La infraestructura lo sirve.

Los proyectos derivados deberian conservar ese principio cuando sea tecnicamente apropiado.

GitHub debe versionar:

- corpus canonico;
- contratos;
- source policies;
- schemas;
- documentacion;
- pruebas;
- configuracion;
- snapshots compactos necesarios para recovery.

D1 u otra infraestructura de runtime debe manejar:

- estados operativos;
- runs;
- jobs;
- contadores;
- sesiones;
- mappings consultados frecuentemente;
- observabilidad de alta frecuencia.

No utilizar GitHub como una base de datos de eventos.

## 10. Evidence & Provenance como requisito de nuevos dominios

MLS detecto retrospectivamente una limitacion: R32 podia producir contenido editorialmente valido sin tener fuentes academicas explicitamente vinculadas a sus afirmaciones.

Los proyectos futuros no deben repetir ese orden.

Para un nuevo dominio:

```text
Source Policy
-> bibliografia base
-> taxonomia
-> catalogo
-> Golden Corpus
-> AUTOOPT
-> generacion
-> Evidence validation
-> publicacion
```

La IA puede ayudar a producir contenido, pero las fuentes lo fundamentan.

## 11. AUTOOPT por dominio

AUTOOPT es uno de los componentes mas valiosos de R32, pero sus familias actuales son linguisticas.

Cada nuevo sistema debe tener sus propias familias.

Ejemplo conceptual para Diseño:

- tipografia;
- composicion;
- color;
- identidad;
- editorial;
- produccion;
- historia;
- UX/UI.

AUTOOPT debe conservar su rol original:

```text
OBSERVA
AGREGA
COMPARA
RECOMIENDA
```

No redacta, no certifica verdad y no cambia silenciosamente el contrato.

## 12. Virtuoso por dominio

Cada enciclopedia debe tener su propio espacio semantico.

Virtuoso MLS conoce la biblioteca linguistica.

Virtuoso Design conoce el corpus de Diseño.

Virtuoso Psychology conoce Psicologia.

El motor puede ser compartido mas adelante, pero los indices y corpus deben permanecer aislados.

Esto evita ambiguedades transversales innecesarias y reduce el riesgo de retrieval fuera de dominio.

## 13. Seguridad de contexto entre repositorios

No confiar en que un chat recuerde siempre correctamente el repositorio activo.

Cada sistema debe declarar identidad, por ejemplo mediante un archivo pequeño como `SYSTEM.json`:

```json
{
  "systemId": "MLS",
  "domain": "language",
  "repository": "dpidiaz/llmchatmls"
}
```

Antes de una escritura deben coincidir:

```text
systemId
repository
domain
branch
expected HEAD
```

Principio:

> **El chat declara la intencion; el repositorio demuestra su identidad.**

Una discrepancia debe detener la escritura.

## 14. Namespaces independientes

Nunca reutilizar los IDs MLS para otros dominios.

Ejemplos conceptuales:

```text
MLS V10 0020
DES 000001
PSY 000001
PHI 000001
```

La sintaxis final puede variar, pero cada sistema debe poder rechazar IDs ajenos.

## 15. Credenciales con menor privilegio

Cuando sea posible:

- una GitHub App limitada al repositorio correspondiente;
- Worker con bindings del producto correspondiente;
- D1 independiente;
- secrets independientes.

Una credencial de Diseño no necesita poder modificar MLS.

## 16. Un futuro mks core

`mks core` solo debe contener comportamientos realmente compartidos, por ejemplo si se demuestran comunes:

- reader;
- navigation;
- search foundation;
- Virtuoso engine;
- Evidence engine;
- Provenance;
- AUTOOPT engine;
- staging engine;
- accessibility foundation;
- offline foundation;
- schemas base.

No debe contener corpus.

No debe contener CEFR, pronunciacion, traduccion u otras funciones especificas de MLS.

## 17. Proyecto de grado e investigacion transversal

Los repositorios separados no impiden investigacion conjunta desde ChatGPT.

Un futuro proyecto de grado puede consultar multiples repositorios selectivamente para analizar:

- evolucion arquitectonica;
- patrones compartidos;
- diferencias por dominio;
- AUTOOPT;
- Evidence;
- tamaños;
- QA;
- decisiones de diseño;
- cronologia.

Puede crearse posteriormente un repositorio pequeno de ecosistema o investigacion que contenga manifests y documentacion transversal, sin copiar los corpus.

Principio:

> **La lectura y la investigacion pueden ser multi repositorio; la escritura sigue siendo repositorio por repositorio.**

## 18. Criterio para considerar MKS real

MKS no debe declararse arquitectura general solamente porque MLS sea complejo.

El criterio minimo recomendado es:

1. MLS funcionando como sistema de referencia.
2. Un segundo dominio significativamente distinto funcionando.
3. Componentes comunes identificados por comparacion.
4. Extraccion de esos componentes sin romper los dos productos.
5. QA independiente y compartido donde corresponda.

## 19. Estado actual de la recomendacion

Esta expansion se considera de largo plazo.

No es prioridad inmediata.

La prioridad de MLS es consolidar el producto y desarrollar Evidence & Provenance.

Esta documentacion existe para evitar perder la vision y para impedir que, cuando se retome, se reconstruya la estrategia desde cero.

## 20. Decision registrada

> **Preservar MASTER LANGUAGE SYSTEM como producto independiente. Si se crean nuevas enciclopedias, comenzar con repositorios e infraestructura aislados. Extraer MKS Core solo despues de demostrar reutilizacion real entre al menos dos dominios.**
