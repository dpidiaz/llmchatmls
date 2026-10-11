# MLS-SND — Auditoría de divergencia de ramas `snd/*`

Fecha: **2026-10-11**.
Base auditada: `feat/mls-snd-foundation`.
Ramas observadas: **78**.

## 1. Método

Se comparó cada rama `snd/*` contra la rama matriz viva mediante GitHub compare, registrando:

- estado (`ahead`, `behind`, `diverged`);
- commits por delante;
- commits por detrás;
- número de archivos con diferencia efectiva.

Esta auditoría mide **integrabilidad técnica relativa**, no calidad lingüística.

Los contadores son un snapshot: pueden cambiar en cuanto la matriz reciba nuevas integraciones.

## 2. Resultado global

| Estado frente a matriz | Ramas |
|---|---:|
| `ahead` y 0 behind | 2 |
| `diverged` | 75 |
| solo `behind` | 1 |
| **Total** | **78** |

Una de las dos ramas `ahead` es esta propia wave de auditoría. La otra, en el momento del snapshot, era:

- `snd/content-lint-wave-01` — ahead 1 / behind 0.

## 3. Conclusión principal

La existencia de una rama activa **no implica que sea mergeable limpiamente**.

La mayoría de las waves fueron creadas sobre versiones anteriores de la matriz y ahora contienen tanto:

1. trabajo propio útil;
2. historia/base antigua que ya fue superada por integraciones posteriores.

Por eso una fusión directa de una rama muy divergida puede reintroducir hot files, estados o versiones de entradas que ya cambiaron en la matriz.

**Recomendación:** tratar `feat/mls-snd-foundation` como canónico y reaplicar únicamente el delta semántico útil de cada wave.

## 4. Ramas casi actuales

Estas ramas estaban a **5 commits o menos** por detrás en el snapshot y merecen prioridad de integración/revisión porque el costo de reconciliación es bajo:

| Rama | ahead | behind | archivos diff |
|---|---:|---:|---:|
| `snd/integrate-ready-domain-wave-01` | 10 | 2 | 10 |
| `snd/inventory-status-reconciliation-wave-01` | 1 | 4 | 1 |
| `snd/japanese-kana-wave-03` | 4 | 4 | 3 |
| `snd/pt-br-linguistic-review-wave-01` | 1 | 4 | 1 |
| `snd/russian-linguistic-review-wave-01` | 10 | 4 | 10 |
| `snd/source-metadata-repair-wave-01` | 4 | 4 | 2 |

Estas ramas siguen siendo `diverged`; “casi actual” no significa “merge automático”.

## 5. Ramas sin delta efectivo útil detectable

### `snd/r33-pilot-audit-wave-01`

- ahead: 0;
- behind: 189;
- archivos diff: 0.

**Recomendación:** considerar histórica/superseded. No contiene delta propio frente a la matriz actual.

### `snd/korean-consonant-recovery-wave-01`

- ahead: 2;
- behind: 67;
- archivos diff efectivos reportados: 0.

**Recomendación:** revisar los commits antes de mantenerla activa. Si no hay contenido recuperable, marcarla como superseded.

## 6. Divergencia alta

Muchas ramas superan 100 commits de retraso respecto de la matriz. Ejemplos relevantes:

- `snd/foundations-articulation-wave-01`: behind 190;
- `snd/r33-audit-pilots-wave-01`: behind 189;
- `snd/representation-ipa-reading-wave-01`: behind 187;
- `snd/representation-ipa-wave-01`: behind 184;
- `snd/pt-br-rio-pilot-wave-01`: behind 179;
- `snd/r33-audit-pilot-wave-01`: behind 179;
- `snd/es-gt-reference-wave-01`: behind 178;
- `snd/en-us-pilot-wave-01`: behind 177;
- `snd/italian-pilot-wave-01`: behind 175;
- `snd/representation-diacritics-suprasegmentals-wave-01`: behind 173;
- `snd/linguistic-review-foundations-wave-01`: behind 170;
- `snd/russian-pilot-wave-01`: behind 169;
- `snd/fr-reference-wave-01`: behind 168;
- `snd/german-pilot-wave-01`: behind 166.

**Recomendación:** no interpretar la divergencia como defecto de contenido. Para estas waves, preferir:

1. leer el delta por archivo/ID;
2. comparar contra la versión canónica actual;
3. reaplicar manualmente solo claims, fuentes o redacción todavía vigentes;
4. volver a ejecutar gates afectados;
5. cerrar/superseder la rama histórica después de transferencia.

## 7. Divergencia moderada y baja

Ramas con aproximadamente 20–100 commits de retraso todavía requieren reconciliación, pero suelen ser mejores candidatas a reaplicación dirigida que las waves históricas más antiguas.

Ejemplos:

- `snd/typography-unicode-qa-wave-01`: behind 26;
- `snd/coordination-integration-wave-01`: behind 36;
- `snd/japanese-accent-wave-03`: behind 43;
- `snd/japanese-writing-wave-03`: behind 43;
- `snd/zh-tw-segmental-wave-02`: behind 43;
- `snd/composition-readiness-gate-wave-01`: behind 50;
- `snd/editorial-review-foundations-wave-02`: behind 51;
- `snd/french-core-wave-02`: behind 72;
- `snd/ref-cross-reference-graph-wave-01`: behind 71;
- `snd/ref-romanization-table-wave-01`: behind 77;
- `snd/source-integration-protocol-wave-01`: behind 79.

## 8. Caso de perfiles amplios

Las ramas amplias de perfiles contienen mucho trabajo, pero varias están fuertemente divergidas:

- en-US: `snd/en-us-pilot-wave-01` — ahead 23 / behind 177;
- pt-BR-rio: `snd/pt-br-rio-pilot-wave-01` — ahead 21 / behind 179;
- zh-TW: `snd/zh-tw-pilot-wave-01` — ahead 25 / behind 163;
- coreano: `snd/korean-pilot-wave-01` — ahead 36 / behind 156.

**Regla recomendada:** usar estas ramas como depósitos de trabajo fuente, no como ramas para merge total. El integrador debe extraer clusters/entradas concretas y compararlos contra la versión canónica actual.

## 9. Protocolo de integración recomendado

Para una wave divergida:

1. identificar los IDs/archivos que constituyen su claim real;
2. comprobar si esos IDs ya existen en matriz;
3. si no existen, crear una rama de **clean reapply** desde la matriz actual;
4. si ya existen, aplicar como revisión/corrección, no como reemplazo ciego;
5. copiar únicamente el contenido pertinente;
6. reconciliar Source IDs contra el Registry actual;
7. ejecutar SOURCE-ID-INTEGRITY;
8. ejecutar el gate editorial/lingüístico que corresponda;
9. actualizar hot files globales solo en integración coordinada;
10. cerrar o marcar superseded la rama vieja.

## 10. Prioridad sugerida

### Prioridad A — costo bajo

- branches con behind ≤5;
- `content-lint-wave-01` si sigue limpia;
- reparaciones de metadata/source IDs;
- revisiones lingüísticas casi actuales.

### Prioridad B — contenido sustantivo, reapply dirigido

- french-core;
- japanese accent/writing;
- zh-TW segmental;
- editorial review waves;
- typography/Unicode QA.

### Prioridad C — depósitos históricos

- pilots iniciales con >150 behind;
- waves R33 antiguas ya absorbidas;
- ramas sin delta efectivo.

## 11. Relación con INTEGRATION-QUEUE

Esta auditoría **no sustituye** `INTEGRATION-QUEUE.md`.

La cola del integrador contiene decisiones semánticas y canónicas por PR/ID. Este archivo añade una segunda dimensión:

> **qué tan lejos está técnicamente la rama que contiene ese trabajo de la matriz actual.**

Ambas dimensiones deben usarse juntas.

## 12. Regla final

**No medir progreso por número de ramas.**

El progreso canónico es el contenido que:

- existe en `feat/mls-snd-foundation`;
- usa fuentes canonicalizadas;
- supera el gate correspondiente;
- no reintroduce versiones antiguas de archivos globales.

Las ramas paralelas son una granja de producción y revisión; la matriz es el producto editorial canónico.
