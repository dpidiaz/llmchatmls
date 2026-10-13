# SND-PTBR-009 — Acento y ritmo: qué sabemos y qué no podemos llamar todavía “carioca”

**Estado:** EVIDENCE_CHECKED con **VARIETY_SCOPE_WARNING**.  
**Idioma:** portugués brasileño.  
**Variedad:** PB_BROAD para el experimento auditado; referencia carioca pendiente.  
**Dominio:** prosodia / acento secundario / ritmo.

## 1. Separar dos niveles

El perfil carioca necesita explicar acento y ritmo, pero esta wave no va a convertir automáticamente un experimento etiquetado como “Brazilian Portuguese” en una descripción específica de Río de Janeiro.

## 2. Evidencia PB sobre acento secundario

Moraes (2003) estudia perceptiva y acústicamente el acento secundario en portugués brasileño.

En el experimento:

- cuatro hablantes produjeron palabras relacionadas con número creciente de sílabas pretónicas dentro de frases portadoras;
- diez oyentes participaron en la prueba perceptiva;
- se midieron F0, duración y amplitud.

Los resultados muestran variación entre dos estrategias de prominencia secundaria en los cuatro hablantes: alternancia binaria e inicio prominente.

El estudio concluye además que no apareció un único correlato acústico estable para el acento secundario: según el patrón/hablante, intervienen F0 o una combinación de duración e intensidad.

## 3. Por qué esto no se etiqueta todavía RIO_CARIOCA

La sección de métodos consultada no identifica explícitamente la procedencia dialectal de los cuatro hablantes.

La afiliación UFRJ del investigador **no prueba** que los hablantes sean cariocas.

Por tanto, estos claims se etiquetan **PB_BROAD/EXPERIMENTAL**.

## 4. Qué necesitamos para el perfil carioca

Para promover una descripción a RIO_CARIOCA hacen falta fuentes que delimiten:

- hablantes de Río;
- acento léxico;
- acento secundario si es pertinente;
- organización temporal/ritmo;
- interacción con fraseo y entonación;
- variación por estilo o velocidad cuando afecte la explicación.

## 5. Relación con SND-PTBR-010

SND-PTBR-010 ya posee una fuente cuyo alcance sí identifica **Río de Janeiro** para intonación.

Acento/ritmo e intonación se mantendrán separados hasta que la evidencia permita describir sus interacciones sin mezclar corpus.

## 6. Evidencia R33

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| PTBR009-C01 | Moraes (2003) investiga acento secundario en PB mediante producción, percepción y análisis acústico | SND-SRC-0091 | p. 1, abstract y métodos | PB_BROAD/EXPERIMENTAL | VERIFIED |
| PTBR009-C02 | Cuatro hablantes produjeron el material y diez oyentes participaron en la prueba perceptiva | SND-SRC-0091 | p. 1, métodos, líneas de “four subjects” y “ten subjects” | muestra experimental | VERIFIED |
| PTBR009-C03 | El estudio encuentra dos estrategias principales de prominencia secundaria | SND-SRC-0091 | pp. 2–4, comentarios y conclusiones | muestra experimental | VERIFIED |
| PTBR009-C04 | No se identifica un único correlato acústico estable de SS; aparecen F0 o duración+intensidad | SND-SRC-0091 | p. 4, conclusiones | muestra experimental | VERIFIED |
| PTBR009-C05 | La procedencia dialectal de los cuatro hablantes no está explícita en la metodología consultada | SND-SRC-0091 | p. 1, métodos | límite de fuente | VERIFIED |
| PTBR009-C06 | No se promoverán esos resultados a RIO_CARIOCA sin fuente de procedencia | decisión MLS | varieties-policy / R33 | editorial | VERIFIED_AS_EDITORIAL_LIMIT |

## 7. Fuente

Moraes, J. A. de. (2003). Secondary stress in Brazilian Portuguese: perceptual and acoustical evidence. In *Proceedings of the 15th International Congress of Phonetic Sciences* (pp. 2063–2066). https://www.internationalphoneticassociation.org/icphs-proceedings/ICPhS2003/papers/p15_2063.pdf

## 8. Open questions

- localizar y auditar “Ritmo e velocidade da fala na estratégia do discurso”;
- localizar estudio de acento léxico con muestra explícitamente carioca;
- decidir si “ritmo” merece una entrada independiente del acento en el perfil final;
- conectar este bloque con PTBR-010 solo después de verificar compatibilidad de variedad/corpus.


## 9. Clean reapply wave 01

- **Fecha:** 2026-10-13.
- **Origen:** PR #7277 / blob histórico `62ca1bbbc4063b36d635cefeae9bfa1598cd1656`.
- **Resultado:** integrado como `EVIDENCE_CHECKED` con `VARIETY_SCOPE_WARNING`; sin promoción adicional.
- **Canonicalización:** `PTBR-W01-SRC-12 → SND-SRC-0091`.
- **Alcance preservado:** `PB_BROAD/EXPERIMENTAL`; la procedencia regional de los cuatro hablantes no está demostrada como carioca.
- **Guard:** afiliación UFRJ del investigador no se usa como evidencia de procedencia dialectal.
- **Cambios materiales:** ninguno; no se añadieron resultados, fuentes, claims o atribuciones regionales.
