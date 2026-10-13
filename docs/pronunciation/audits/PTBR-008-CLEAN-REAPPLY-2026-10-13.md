# PTBR-008 — Clean reapply audit — 2026-10-13

## Identidad
- **ID:** SND-PTBR-008
- **Origen:** PR #7277 / `snd/pt-br-rio-pilot-wave-01`
- **Blob histórico:** `79e74324388d57f9c4550a7292e4060136a537d8`
- **Estado de salida:** EVIDENCE_CHECKED con DATE_SCOPE_WARNING

## Canonicalización
`PTBR-W01-SRC-01` corresponde a **Callou (2009), Um perfil da fala carioca**, ya registrado como `SND-SRC-0007`.

Los localizadores de PTBR008:
- p. 133, Quadro 1;
- pp. 143–144, “A propósito do L” y Figura 10;
- p. 144;

están dentro del capítulo canónico y conservan el alcance declarado por la wave histórica.

## Claims preservados
- PTBR008-C01 → SND-SRC-0007 / PB_BROAD histórico;
- PTBR008-C02 → SND-SRC-0007 / RIO_SUBSCOPE:NURC;
- PTBR008-C03 → SND-SRC-0007 / RIO_SUBSCOPE:NURC histórico;
- PTBR008-C04 → decisión editorial de fecha/muestra.

## Guards
- no convertir vocalización histórica en porcentaje de 2026;
- no convertir habla culta NURC en toda la ciudad;
- no reducir ortográficamente “l = u”;
- no añadir IPA o realizaciones no presentes en la versión auditada;
- conservar la necesidad de una fuente contemporánea específica de Río antes del cierre lingüístico final.

## Cambio bibliográfico
La referencia final se alinea con la ficha canónica SND-SRC-0007 (editores, pp. 130–152 y DOI). Esto no cambia claims ni localizadores.

## Resultado
**PASS para integración física → EVIDENCE_CHECKED con DATE_SCOPE_WARNING.**

El gate LINGUISTIC_REVIEW sigue pendiente; no se hereda del piloto.
