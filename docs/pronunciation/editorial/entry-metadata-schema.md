# MLS-SND — Esquema de metadatos de entrada

Estado: **v0.1**.

Este esquema complementa la plantilla editorial. No obliga todavía a usar YAML/JSON en los archivos finales.

## 1. Campos canónicos

| Campo | Obligatorio | Función |
|---|---:|---|
| entry_id | sí | ID estable SND-* |
| title | sí | título canónico |
| domain | sí | fonética/fonología/prosodia/etc. |
| language | según entrada | idioma |
| variety | si material | alcance de variedad |
| representation_level | si material | fonológico/fonético/ortográfico/etc. |
| workflow_state | interno | estado R44/editorial |
| evidence_state | interno | estado de evidencia |
| prerequisites | no | IDs previos |
| related | no | IDs relacionados |
| compare | no | IDs comparativos |
| source_ids | si hay claims | fuentes usadas |
| version | sí | versión de la entrada |
| last_substantive_change | sí | control de revalidación |

## 2. Dominio

Valores iniciales controlados:

- PHONETICS
- PHONOLOGY
- PRONUNCIATION
- PROSODY
- WRITING
- TRANSCRIPTION
- VARIATION
- REFERENCE

Se permiten múltiples valores cuando una entrada realmente cruce dominios.

## 3. Variedad

No usar texto libre inconsistente cuando exista una etiqueta aprobada.

El campo debe poder enlazar a la política de variedades y conservar:

- etiqueta;
- descripción;
- estado REFERENCE_FIXED/PROVISIONAL/MULTI_REFERENCE/OPEN.

## 4. Evidencia

`source_ids` no sustituye las tablas claim ↔ source ↔ locator.

Sirve para navegación y auditoría rápida.

## 5. Versionado

Una modificación es **sustantiva** si cambia:

- una afirmación;
- una transcripción;
- alcance de variedad;
- ejemplo factual;
- interpretación de una fuente.

Cambios puramente tipográficos no requieren invalidar automáticamente un gate R33.

## 6. Derivados

Desde estos metadatos deberían poder generarse:

- índice por idioma;
- índice por fenómeno;
- índice de variedades;
- referencias cruzadas;
- páginas relacionadas;
- reporte de entradas sin evidencia;
- reporte de entradas bloqueadas.
