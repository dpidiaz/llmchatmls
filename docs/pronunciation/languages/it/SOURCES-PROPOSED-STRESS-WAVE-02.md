# Italiano — source map local: stress wave 02

Estado: **LOCAL_CANDIDATE**. Este archivo es el source map obligatorio de la wave SND-IT-005 conforme a `editorial/source-integration-protocol.md`. Evita editar el Source Registry global mientras existen workers paralelos.

## IT-W02-S01 — Treccani, “Accento”

- **Estado de verificación:** VERIFIED_LOCATOR_PENDING_CANONICALIZATION.
- **Idioma / variedad:** italiano; síntesis general del italiano con discusión explícita de distribución y morfofonología del acento.
- **Fenómeno cubierto:** acento léxico; función distintiva; correlatos fonéticos; distribución; interacción morfofonológica.
- **Entradas / claims:** SND-IT-005; IT005-C01, IT005-C02, IT005-C03.

- **Propuesta de tier:** C/B auxiliar académica.
- **Referencia:** Gili Fivela, B. (2010). Accento. En *Enciclopedia dell’Italiano*. Treccani. https://www.treccani.it/enciclopedia/accento_%28Enciclopedia-dell%27Italiano%29/
- **Acceso:** abierto.
- **Alcance:** acento léxico italiano; función distintiva; correlatos fonéticos; posiciones posibles; preferencias de distribución; restricciones prosódicas y efectos morfofonológicos.
- **Localizadores:** “Definizione”; “Principali correlati fonetici”; “L’accento in italiano”, especialmente los apartados sobre posición libre, distribución y función distintiva; “Fenomeni morfofonologici dovuti a derivazione, composizione e flessione della parola”.
- **Limitación:** obra enciclopédica de síntesis; no sustituye estudios experimentales para medidas acústicas ni resuelve por sí sola todos los análisis métricos del italiano.

## IT-W02-S02 — D’Imperio & Rosenthall (1999)

- **Estado de verificación:** VERIFIED_ABSTRACT_PENDING_CANONICALIZATION.
- **Idioma / variedad:** italiano; italiano estándar y variedades regionales incluidas por el estudio.
- **Fenómeno cubierto:** acento principal y duración vocálica condicionada por estructura silábica y posición.
- **Entradas / claims:** SND-IT-005; IT005-C04, IT005-C05.

- **Propuesta de tier:** B.
- **Referencia:** D’Imperio, M., & Rosenthall, S. (1999). Phonetics and phonology of main stress in Italian. *Phonology, 16*(1), 1–28. https://doi.org/10.1017/S0952675799003681
- **Acceso consultado:** abstract y metadatos abiertos en Cambridge Core.
- **Alcance:** relación entre acento principal y duración vocálica en italiano estándar y variedades regionales según el estudio; diferencias entre sílabas abiertas tónicas y otras posiciones.
- **Localizador usado en esta wave:** Abstract; metadatos de volumen 16(1), pp. 1–28, DOI.
- **Limitación:** esta wave solo usa afirmaciones explícitas del resumen consultable; no atribuye detalles que requieran inspección del texto completo.

## Integración

- **Fecha de verificación de esta wave:** 2026-10-11.
- El integrador debe comprobar DOI/URL y metadatos contra el Source Registry vigente.
- Si existe una coincidencia canónica, marcar el candidato como `DEDUP_MATCH` y reescribir todos sus claims al `SND-SRC` existente.
- Si es realmente nuevo, asignar un `SND-SRC` únicamente en la wave de integración.
- La canonicalización bibliográfica por sí sola **no** promueve SND-IT-005 a `EVIDENCE_CHECKED`; debe repetirse el gate R33 después de la reescritura.
- Antes de integrar la entrada a `feat/mls-snd-foundation`, no puede quedar ningún `IT-W02-Sxx` dentro de la entrada integrada.
