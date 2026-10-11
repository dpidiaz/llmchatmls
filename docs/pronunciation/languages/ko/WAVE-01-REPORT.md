# 🇰🇷 Korean pilot — Wave 01 report

**Branch:** `snd/korean-pilot-wave-01`  
**PR:** #7288  
**Fecha:** 2026-10-11

## Resultado

Se completó un primer perfil operativo que separa:
1. **norma institucional**;
2. **descripción fonética de Seoul Korean**;
3. **análisis fonológico/prosódico**;
4. **escritura y romanización**.

## IDs trabajados

| ID | Estado en esta wave | Resultado |
|---|---|---|
| SND-KO-001 | EVIDENCE_CHECKED | Norma estándar y Seoul Korean separados por alcance |
| SND-KO-002 | RESEARCHED_PARTIAL | Contraste oclusivo mapeado; consonantes no oclusivas aún abiertas |
| SND-KO-003 | EVIDENCE_CHECKED | Cambio VOT/F0 y dependencia de posición documentados |
| SND-KO-004 | EVIDENCE_CHECKED | Cambio vocálico de Seúl documentado con límites de muestra |
| SND-KO-005 | RESEARCHED_PARTIAL | Marco silábico útil; controversia sub-silábica no cerrada |
| SND-KO-006 | EVIDENCE_CHECKED (NORMATIVE) | Neutralización de coda, nasalización y tensificación separadas de frecuencia real |
| SND-KO-007 | EVIDENCE_CHECKED (modelo) | Accentual Phrase como marco de referencia para Seoul Korean |
| SND-KO-008 | EVIDENCE_CHECKED (NORMATIVE) | Hangul y realización superficial tratados como capas distintas |
| SND-KO-009 | ya EVIDENCE_CHECKED en base | No duplicado |
| SND-KO-010 | EVIDENCE_CHECKED | Romanización Revisada ≠ IPA |

## Fuentes nuevas locales

Se añadieron nueve anchors locales `KO-W1-S01..S09`.

No se asignaron IDs globales `SND-SRC` para evitar colisiones con las ramas paralelas. El integrador debe promocionar únicamente los anchors que acepte.

## Hallazgos que cambian el diseño

### 1. No congelar valores acústicos antiguos
El contraste lenis–aspirada de Seoul Korean está en cambio; F0 ha ganado peso frente a VOT. Un cuadro pedagógico debe incluir fecha/población/posición.

### 2. La posición prosódica es material
La realización de las oclusivas no es idéntica en inicio de frase y posición medial de palabra.

### 3. “Standard Korean” y “Seoul Korean” no se colapsan
La primera etiqueta se mantiene para normativa institucional; la segunda para estudios fonéticos que declaran esa muestra/variedad.

### 4. Normativa ≠ corpus
Las Standard Pronunciation Rules respaldan claims NORMATIVE, no frecuencia espontánea.

### 5. La prosodia necesita modelo explícito
Accentual Phrase se adopta como marco de referencia inicial, sin traducirlo como “estrés léxico”.

## Gaps para wave 02

- consonantes no oclusivas contemporáneas;
- inventario vocálico contemporáneo con fuentes adicionales;
- corpus de procesos contextuales para pasar de NORMATIVE a descriptivo;
- fuentes sobre relación fonológica entre hangul y estructura silábica;
- revisión especializada de prosodia y terminología española;
- localizadores full-text para KO-W1-S06 antes de elevar KO-005.

## Gate

Esta wave puede pasar a **LINGUISTIC_REVIEW** para KO-001/003/004/006/007/008/010.

KO-002 y KO-005 permanecen abiertos por diseño.
