# MLS-SND — Auditoría de canonicalización es-GT wave 06

**Fecha:** 2026-10-11.  
**Rama:** `snd/es-gt-source-canonicalization-wave-06`.  
**Entrada afectada:** `SND-ESGT-002`.  
**Resultado:** **SOURCE_IDS_RESOLVED / NO_STATE_PROMOTION**.

## 1. Problema

El mapa segmental canónico `SND-ESGT-002` conservaba tres IDs locales históricos:

- `ESGT-SRC-P01`;
- `ESGT-SRC-P03`;
- `ESGT-SRC-P04`.

Esto contradice el invariante del protocolo de integración que prohíbe dejar IDs de fuente locales dentro de una entrada integrada.

## 2. Resolución

| ID local | Fuente | Acción | ID global |
|---|---|---|---|
| ESGT-SRC-P01 | Utgård 2010 | DEDUP_MATCH: la obra estable ya estaba registrada | SND-SRC-0025 |
| ESGT-SRC-P03 | McKinnon 2020 | CANONICAL_NEW | SND-SRC-0057 |
| ESGT-SRC-P04 | Congosto Martín 2020 | CANONICAL_NEW | SND-SRC-0058 |

## 3. Control de alcance

### SND-SRC-0057

El artículo de McKinnon (2020) está verificado en John Benjamins como *Spanish in Context* 17(1), pp. 1–29, DOI 10.1075/sic.00051.mck.

El acceso comprobado permite metadatos, resumen y estructura del artículo; por tanto el registro se limita a `ADMITTED_ABSTRACT_SCOPE_ONLY / FULLTEXT_REQUIRED_FOR_SPECIFIC_CLAIMS`.

No se importaron valores numéricos o resultados estadísticos que no sean visibles en el resumen.

### SND-SRC-0058

Congosto Martín (2020), *Estudios de Fonética Experimental* 29, pp. 153–194, está documentado por Universidad de Sevilla y registros académicos.

El estudio queda registrado con alcance prosódico/entonativo acotado: comparación Guatemala–Los Ángeles dentro del proyecto Geoprosodic/AMPER y diseño restringido a la entonación femenina y a enunciados SVO declarativos/interrogativos absolutos del corpus descrito.

No se generaliza a toda la prosodia guatemalteca.

## 4. Estado editorial

`SND-ESGT-002` permanece **SOURCE_MAPPED**.

Canonicalizar una bibliografía:

- no convierte un mapa en inventario fonémico;
- no valida claims que todavía no existen;
- no autoriza transcripciones nuevas;
- no promueve el gate R33.

## 5. Coordinación

La wave #7328, que reclama ESGT-006/007/008 y planea usar Congosto 2020, debe reutilizar **SND-SRC-0058** después de integrar esta wave.

## 6. Gate posterior requerido

Tras integrar:

1. ejecutar el detector de source IDs locales sobre las 79+ entradas físicas;
2. comprobar que `ESGT-SRC-P01/P03/P04` ya no aparezcan en entradas;
3. comprobar que `SND-SRC-0057/0058` existan una sola vez en el Registry;
4. solo entonces recalcular SOURCE-ID-INTEGRITY global.
