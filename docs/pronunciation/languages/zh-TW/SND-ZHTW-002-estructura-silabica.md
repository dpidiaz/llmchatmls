# SND-ZHTW-002 — Estructura silábica

**Estado:** EVIDENCE_CHECKED para la organización descriptiva básica; análisis fonológico completo pendiente.
**Idioma:** mandarín.
**Variedad:** Taiwan Mandarin.
**Dominio:** sílaba / fonotáctica / representación / fonética.

## 1. Dos fuentes de organización que no deben confundirse

El manual de símbolos fonéticos del Ministry of Education de Taiwán organiza su sistema mediante:
- símbolos de onset;
- símbolos de rhyme;
- marcas tonales;
- una tabla de sílabas de mandarín.

Esto proporciona una estructura institucional útil para **representar** sílabas.

Wan et al. (2024), en cambio, realizan un análisis corpus/fonotáctico de habla natural de Taiwan Mandarin. Su dataset se clasifica en **12 tipos de estructura silábica de superficie**.

Las dos capas son compatibles como recursos de consulta, pero no cumplen la misma función.

## 2. Corpus de habla natural

Wan et al. (2024) analizan:
- 202 horas de conversación y otros contextos naturalistas;
- 2,384,567 ítems léxicos;
- 6,272,394 tokens;
- 3,852,987 tokens consonánticos;
- 2,419,407 tokens vocálicos.

Los autores indican que el cálculo fonotáctico omite el tono.

## 3. Tipos silábicos del análisis corpus

El estudio enumera estas sílabas fonéticas/de superficie:

**V, CV, GV, VG, VN, CVG, CVN, CGV, GVG, GVN, CGVG, CGVN.**

Su análisis utiliza como máximo **CGVX**, donde:
- C = segmento consonántico;
- G = glide;
- V = vocal nuclear;
- X = nasal o glide.

Esta es la **representación analítica de Wan et al. (2024)** y se etiquetará como tal; no se convertirá por defecto en la única teoría silábica de MLS-SND.

## 4. Finales y condicionamiento fonético

Zhang (2009) estudia 70 sílabas de Taiwan Mandarin y analiza cómo distintos elementos de la final condicionan la calidad vocálica.

En su muestra aparecen efectos asociados a:
- glide prenuclear;
- glide posnuclear;
- nasal de coda.

Esto muestra por qué una “final” no debe tratarse como una simple vocal escrita: su composición puede afectar la realización fonética.

## 5. Codas nasales

Chiu & Lu (2021) estudian /n/ y /ŋ/ finales mediante ultrasonido.

Su resumen confirma que la dirección del merger depende del contexto vocálico y muestra que, para algunos hablantes, la postura lingual puede converger mientras la nasalización de la vocal precedente todavía conserva diferencias.

## 6. Política MLS-SND

El perfil distinguirá cuatro niveles:

1. **organización institucional/pedagógica**: onset + rhyme + tono;
2. **estructura fonológica**: análisis atribuido explícitamente a una fuente;
3. **estructura fonética/de superficie**: por ejemplo los tipos de Wan et al. (2024);
4. **realización fonética**: glides, vocales, nasales y sus interacciones.

No se convertirá la terminología de Zhuyin ni un único análisis corpus en teoría fonológica universal.

## 7. Evidencia R33

| claim_id | afirmación | fuente | localizador | estado |
|---|---|---|---|---|
| ZHTW002-C01 | El manual MOE organiza símbolos en onset, rhyme y marcas tonales | SND-SRC-0011 | “1. List of Phonetic Symbols”, apartados onset/rhyme/tonal marks | VERIFIED |
| ZHTW002-C02 | El manual incluye una tabla de sílabas de mandarín | SND-SRC-0011 | “6. Reference Table of Chinese Characters with Mandarin Chinese Syllables” | VERIFIED |
| ZHTW002-C03 | Wan et al. usan 202 h de habla natural y clasifican el dataset en 12 tipos silábicos | ZHTW-LOCAL-009 | abstract y §2 Methodology, pp. 1157–1159 | VERIFIED |
| ZHTW002-C04 | El análisis de superficie enumera V, CV, GV, VG, VN, CVG, CVN, CGV, GVG, GVN, CGVG, CGVN y un máximo CGVX | ZHTW-LOCAL-009 | discusión de estructura silábica, p. 1161 | VERIFIED |
| ZHTW002-C05 | Zhang usa 70 sílabas que cubren combinaciones de segmentos en la final | ZHTW-LOCAL-007 | tesis, §3.2 Materials pp. 26–28; resumen institucional | VERIFIED |
| ZHTW002-C06 | Zhang encuentra condicionamiento vocálico por glides pre/postnucleares y nasales de coda | ZHTW-LOCAL-007 | cap. 4 Findings and discussion, especialmente pp. 45, 58–73, 85; resumen | VERIFIED |
| ZHTW002-C07 | Chiu & Lu encuentran merger nasal final dependiente del contexto vocálico | ZHTW-LOCAL-008 | Abstract | VERIFIED |

## 8. Fuentes

Ministry of Education, Taiwan. (2017). *The Manual of the Phonetic Symbols of Mandarin Chinese*.

Wan, I.-P., Chang, C.-W., Lee, C., & Yu, P. (2024). Probability distributions of sounds and phonotactics in Taiwan Mandarin syllables. En *Proceedings of the 38th Pacific Asia Conference on Language, Information and Computation* (pp. 1157–1165). Tokyo University of Foreign Studies. https://aclanthology.org/2024.paclic-1.111/

Zhang, H.-Y. (2009). *An acoustic study on Taiwan Mandarin vowels* [Master’s thesis, National Chengchi University].

Chiu, C., & Lu, Y.-A. (2021). Articulatory evidence for the syllable-final nasal merging in Taiwan Mandarin. *Language and Speech, 64*(4). https://doi.org/10.1177/0023830920948084

## 9. Límite

Esta entrada valida la organización institucional, una clasificación corpus de superficie y algunos efectos fonéticos de la final, pero **no congela todavía un único árbol silábico ni una teoría universal de constituyentes** para Taiwan Mandarin.
