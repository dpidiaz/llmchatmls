# MLS — Objetivo R33 y primer hito

**Objetivo:** respaldar las 10.133 entradas con evidencia vinculada a la versión exacta, referencias APA 7 y un apartado visible de fuentes en los PDF. Ninguna entrada se certifica por tener una bibliografía o por el estado de una cola operativa.

**Fecha:** 9 de octubre de 2026. **Estado:** auditoría completa y recuperación local terminadas; investigación y validación integral en curso, todavía sin completar R33 para el corpus.

## Diagnóstico del backup

| Clasificación exclusiva | Entradas |
|---|---:|
| Fuentes activas vinculadas al texto y fecha actuales | 229 |
| Evidencia estructurada de otra versión | 15 |
| Referencias candidatas recuperables, sin vínculo estructurado actual | 4338 |
| Sin referencias identificadas en los campos inspeccionados | 5551 |
| **Total** | **10.133** |

Estos conteos no son cifras de cumplimiento R33. Se recuperaron 8.406 recibos R44 y 1.476 propuestas de revisión. Hay referencias candidatas en 4418 entradas, incluyendo algunas de las 229 con vínculos actuales y algunas con evidencia antigua. Las notas o recibos sin fuentes no se cuentan como bibliografía; «sin referencias identificadas» no equivale a ausencia de historial.

Solo cuatro textos originales presentan un encabezado reconocible de fuentes/bibliografía. Esto no implica que solo cuatro PDF tengan referencias: el generador también incorpora fuentes desde las tablas de evidencia.

225 entradas presentan discrepancias entre el estado resumido y los registros de afirmaciones. Todas las 353 filas de afirmaciones del backup figuran como unverified; los estados resumidos contienen 239 VERIFIED, 1 REVIEWED y 4 SOURCED. Por tanto no se adopta el estado resumido como certificación automática. Hay dos conflictos no resueltos vinculados a textos actuales.

Los hashes del JSON de los 8.406 recibos coinciden. En 1.178 propuestas preview el hash result_sha256 no coincide con los bytes de payload_json ni con dos serializaciones comunes. La representación que produjo ese hash requiere documentación: no se afirma corrupción ni se acepta ese campo como prueba de integridad.

## Trabajo realizado

- Inventario individual de las 10.133 entradas, con hash, fecha, fuentes actuales, discrepancias y acción siguiente.
- Recuperación de fuentes y propuestas sin sustituir el corpus original.
- 10.133 apartados de fuentes preparados como datos separados, con advertencias y procedencia; las referencias no revisadas no se etiquetan como APA 7 validada.
- Cola de 102 lotes, normalmente de 100 entradas, con prioridad para conflictos y discrepancias. Los lotes aún pendientes no se presentan como trabajo ejecutado.
- Primer contraste documental: MLS-V10-0020, con siete grupos de afirmaciones cotejados con fuentes oficiales RAE/ASALE y referencias redactadas en APA 7. La validación canónica permanece pendiente.
- Primera reparación propuesta: MLS-V04-0174 (celui-ci / celui-là), elimina la equivalencia general primero/segundo y distingue distancia, referencia textual y lengua hablada. La revisión del resto de sus afirmaciones permanece pendiente.

## Criterios de cierre por entrada

1. Identificar el texto exacto mediante código, fecha y SHA-256.
2. Descomponer las afirmaciones sustanciales y distinguir ejemplos construidos.
3. Leer fuentes primarias o autorizadas; guardar URL, metadatos, fecha de consulta y localizador.
4. Registrar soporte, alcance, contradicciones y variantes. Corregir el texto si corresponde.
5. Revisar referencias e insertar el apartado de fuentes; diferenciar respaldo parcial y completo.
6. Conciliar el estado con los registros individuales y validar la revisión aceptada.
7. Regenerar los PDF correspondientes y comprobar texto, enlaces, paginación y muestra visual.

## Próximo trabajo preparado

Resolver los dos conflictos actuales; conciliar las 225 discrepancias; validar las fuentes de las 229 entradas vinculadas; contrastar las referencias recuperadas y después investigar las entradas restantes. Los datos están preparados para continuar por lote sin redescubrir el backup.

## Fuentes del primer contraste

Real Academia Española & Asociación de Academias de la Lengua Española. (s. f.). abecedario. En *Diccionario panhispánico de dudas* (2.ª ed.). Recuperado el 9 de octubre de 2026, de https://www.rae.es/dpd/abecedario

Real Academia Española. (s. f.). *Exclusión de «ch» y «ll» del abecedario*. Recuperado el 9 de octubre de 2026, de https://www.rae.es/espanol-al-dia/exclusion-de-ch-y-ll-del-abecedario

Real Academia Española & Asociación de Academias de la Lengua Española. (s. f.). diéresis. En *Diccionario panhispánico de dudas* (2.ª ed.). Recuperado el 9 de octubre de 2026, de https://www.rae.es/dpd/di%C3%A9resis

Real Academia Española & Asociación de Academias de la Lengua Española. (s. f.). tilde. En *Diccionario panhispánico de dudas* (2.ª ed.). Recuperado el 9 de octubre de 2026, de https://www.rae.es/dpd/tilde

Real Academia Española & Asociación de Academias de la Lengua Española. (s. f.). h. En *Diccionario panhispánico de dudas* (2.ª ed.). Recuperado el 9 de octubre de 2026, de https://www.rae.es/dpd/h

Real Academia Española & Asociación de Academias de la Lengua Española. (s. f.). seseo. En *Diccionario panhispánico de dudas* (2.ª ed.). Recuperado el 9 de octubre de 2026, de https://www.rae.es/dpd/seseo

Real Academia Española. (s. f.). *Un solo nombre para cada letra*. Recuperado el 9 de octubre de 2026, de https://www.rae.es/espanol-al-dia/un-solo-nombre-para-cada-letra

Office québécois de la langue française. (s. f.). *Les particules adverbiales ci et là*. Recuperado el 9 de octubre de 2026, de https://vitrinelinguistique.oqlf.gouv.qc.ca/23480/la-grammaire/ladverbe/les-particules-adverbiales-ci-et-la

Office québécois de la langue française. (2022). pronom démonstratif. En *Grand dictionnaire terminologique*. https://vitrinelinguistique.oqlf.gouv.qc.ca/fiche-gdt/fiche/26559761/pronom-demonstratif

Centre national de ressources textuelles et lexicales. (s. f.). Celui-là, celle-là, ceux-là, celles-là. En *Trésor de la langue française informatisé*. Recuperado el 9 de octubre de 2026, de https://www.cnrtl.fr/definition/celui-l%C3%A0

## Límites de esta entrega

Los PDF entregados anteriormente todavía no se han reemplazado por una edición certificada R33. Este paquete contiene el diagnóstico completo, los datos para integrar fuentes y las dos primeras revisiones documentadas. No se han reactivado servicios ni escrito en D1 o GitHub. El trabajo aquí registrado es local y no implica un proceso que continúe ejecutándose después de esta sesión.
