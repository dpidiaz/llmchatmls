## Anexo A. Glosario minimo

| Termino | Definicion en el proyecto |
| --- | --- |
| Entrada / semilla canonica | Unidad identificada en el mapa editorial; puede existir aunque el articulo aun no este materializado. |
| Articulo | Contenido desarrollado para una entrada canonica. |
| Publicado | Estado en el que el articulo definitivo se encuentra disponible en la fuente prevista. |
| FIFO | Procesamiento que respeta el orden editorial de la secuencia. |
| Publish First | Regla que consulta y reutiliza contenido existente antes de gastar IA. |
| D1 | Base de datos usada para articulos, estados, metricas y cursores. |
| RunId | Identificador de una ejecucion o lote reservado. |
| Circuit breaker | Mecanismo que detiene llamadas cuando una dependencia, como la cuota de IA, esta agotada. |
| Virtuoso | Bibliotecario y capa de orientacion del corpus. |
| Profesor IA | Asistente contextual que explica y amplia una entrada. |
| FREE ONLY | Politica que prohibe introducir consumo monetario o billing silencioso. |

## Anexo B. Indicadores del snapshot R32 del 12 de septiembre

| Indicador | Valor reportado | Nota |
| --- | --- | --- |
| Entradas planificadas | 10 133 | Cobertura editorial de diez idiomas. |
| Entradas publicadas en ese snapshot | 4 | Dato historico; no representa el estado actual del 20 de septiembre. |
| Entradas fallidas | 13 | Errores terminales acumulados en ese momento. |
| Entradas recuperables | 1 491 | Trabajo conservado en D1. |
| Entradas en espera activa | 4 | Resto del primer lote FIFO. |
| Mensajes fisicos | 73 | Backlog legado retenido entonces. |
| Politica | FIFO + Publish First | Procesamiento secuencial e idempotente. |
| Costo | Cero estricto | Sin consumo pagado habilitado. |

*Nota: estos valores se incluyen como evidencia historica del proceso de ingenieria. Los contadores operativos cambian durante el desarrollo y deben actualizarse antes de una publicacion externa.*

## Anexo C. Base documental interna consultada

[D1] Informe de aprendizajes de MASTER LANGUAGE SYSTEM Revision 32. Retrospectiva tecnica y de producto. 12 de septiembre de 2026.

[D2] MASTER LANGUAGE SYSTEM / EDITORIAL SYSTEM. ONE LANGUAGE · ONE LIFE v4.0. Story Bible y curriculo narrativo de 10 idiomas. 22 de agosto de 2026.

[D3] Pronunciation for Guatemalan Spanish Speakers. Especificacion de pronunciacion y romanizacion. 24 de agosto de 2026.

[D4] Codigo y prompt del Profesor IA para diez enciclopedias. Cloudflare Workers AI / Gemma. 9 de septiembre de 2026.

[D5] Registro de desarrollo y decisiones del proyecto entre 18 y 20 de septiembre de 2026: Virtuoso, UX/UI workstreams, GitHub Staging, traductor, pronunciacion local, circuit breaker y presupuesto FREE ONLY.

## Anexo D. Cita sugerida

| APA ORIENTATIVA Diaz Ponce, J. D. (2026). MASTER LANGUAGE SYSTEM: caso de desarrollo tecnologico y pedagogico (Version 1.0). Documentacion de proyecto. |
| --- |

## Anexo E. Declaracion de alcance

Este documento es una documentacion de proyecto y no una evaluacion experimental de eficacia educativa. Describe decisiones, arquitectura, implementacion y evidencia operativa. Para afirmar impacto pedagogico en poblaciones de estudiantes seria necesario un diseño de evaluacion independiente con usuarios, indicadores de aprendizaje y metodologia definida.

# MASTER LANGUAGE SYSTEM

> Caso de desarrollo tecnologico y pedagogico

Documento preparado a partir de la evidencia interna disponible del proyecto hasta el 20 de septiembre de 2026.

### Josue David Diaz Ponce | Diseñador grafico

Guatemala, 2026
