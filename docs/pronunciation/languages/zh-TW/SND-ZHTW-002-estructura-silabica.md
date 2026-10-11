# SND-ZHTW-002 — Estructura silábica

**Estado:** EVIDENCE_CHECKED para la organización descriptiva básica; análisis fonológico completo pendiente.
**Idioma:** mandarín.
**Variedad:** Taiwan Mandarin.
**Dominio:** sílaba / fonotáctica / representación / fonética.

## 1. Capas que no deben confundirse

El manual del Ministry of Education de Taiwán organiza Zhuyin mediante símbolos de **onset**, **rhyme** y marcas tonales, e incluye una tabla de sílabas. Esta es una organización institucional útil para representar pronunciación.

Wan et al. (2024), en cambio, analizan fonotáctica en un corpus natural de Taiwan Mandarin y clasifican sus datos en **12 tipos de estructura silábica de superficie**.

MLS-SND conservará ambas capas sin convertir la terminología pedagógica de Zhuyin en una teoría fonológica universal ni convertir un único análisis corpus en el único análisis posible.

## 2. Corpus de habla natural

Wan et al. (2024) trabajan con:
- 202 horas de conversación y otros contextos naturalistas;
- 2,384,567 ítems léxicos;
- 6,272,394 tokens;
- 3,852,987 tokens consonánticos;
- 2,419,407 tokens vocálicos.

El tono se excluye de sus cálculos fonotácticos.

## 3. Tipos silábicos en ese análisis

El estudio enumera:

**V, CV, GV, VG, VN, CVG, CVN, CGV, GVG, GVN, CGVG, CGVN.**

Los autores utilizan como representación máxima de superficie **CGVX**, donde C = consonante, G = glide, V = vocal nuclear y X = nasal o glide.

Esta notación se atribuirá siempre a ese análisis.

## 4. Finales y condicionamiento fonético

Zhang (2009) estudia 70 sílabas producidas por seis hombres hablantes nativos de mandarín nacidos y criados en Taipei. La calidad vocálica de su muestra está condicionada por elementos de la final, incluidos glide prenuclear, glide posnuclear y nasal de coda.

Chiu & Lu (2021) muestran además que el merger de /n/ y /ŋ/ finales depende del contexto vocálico y puede ser incompleto.

## 5. Política MLS-SND

El perfil distinguirá:

1. **organización institucional/pedagógica** — Zhuyin;
2. **estructura fonológica** — siempre atribuida a un análisis;
3. **estructura fonética/de superficie** — como la clasificación corpus de Wan et al.;
4. **realización fonética** — glides, vocales, nasales y sus interacciones.

## 6. Evidencia R33

| claim_id | afirmación | fuente | localizador | estado |
|---|---|---|---|---|
| ZHTW002-C01 | El manual MOE organiza símbolos en onset, rhyme y marcas tonales | SND-SRC-0011 | “1. List of Phonetic Symbols” | VERIFIED |
| ZHTW002-C02 | El manual incluye una tabla de sílabas de mandarín | SND-SRC-0011 | “6. Reference Table of Chinese Characters with Mandarin Chinese Syllables” | VERIFIED |
| ZHTW002-C03 | Wan et al. usan 202 h de habla natural y clasifican el dataset en 12 tipos silábicos | ZHTW-LOCAL-009 | abstract y §2 Methodology, pp. 1157–1159 | VERIFIED |
| ZHTW002-C04 | El análisis enumera 12 tipos y una forma máxima CGVX | ZHTW-LOCAL-009 | discusión de estructura silábica, p. 1161 | VERIFIED |
| ZHTW002-C05 | Zhang usa seis hombres de Taipei y 70 sílabas | ZHTW-LOCAL-007 | §3 Methodology, pp. 25–33 | VERIFIED |
| ZHTW002-C06 | Zhang documenta condicionamiento por glides y nasales de coda | ZHTW-LOCAL-007 | cap. 4, especialmente pp. 45, 58–73 y 85 | VERIFIED |
| ZHTW002-C07 | Chiu & Lu encuentran merger nasal final dependiente del contexto vocálico | ZHTW-LOCAL-008 | Abstract | VERIFIED |

## 7. Fuentes

Ministry of Education, Taiwan. (2017). *The Manual of the Phonetic Symbols of Mandarin Chinese*.

Wan, I.-P., Chang, C.-W., Lee, C., & Yu, P. (2024). Probability distributions of sounds and phonotactics in Taiwan Mandarin syllables. En *Proceedings of the 38th Pacific Asia Conference on Language, Information and Computation* (pp. 1157–1165). Tokyo University of Foreign Studies. https://aclanthology.org/2024.paclic-1.111/

Zhang, H.-Y. (2009). *An acoustic study on Taiwan Mandarin vowels* [Master’s thesis, National Chengchi University].

Chiu, C., & Lu, Y.-A. (2021). Articulatory evidence for the syllable-final nasal merging in Taiwan Mandarin. *Language and Speech, 64*(4). https://doi.org/10.1177/0023830920948084

## 8. Límite

Esta entrada valida la organización institucional, una clasificación corpus de superficie y varios efectos fonéticos de la final. No congela todavía un único árbol silábico ni una teoría universal de constituyentes para Taiwan Mandarin.
