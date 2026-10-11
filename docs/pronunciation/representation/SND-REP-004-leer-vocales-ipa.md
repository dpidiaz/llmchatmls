# SND-REP-004 — Cómo leer vocales del IPA

**Estado:** EDITORIAL_REVIEW.
**Dominio:** representación / fonética.
**Idioma:** transversal.

## 1. Función del diagrama vocálico

La tabla oficial del IPA incluye una sección específica para vocales.

MLS-SND utilizará ese diagrama para relacionar símbolos con categorías descriptivas del espacio vocálico, pero no lo tratará como un mapa exacto e invariable de la boca ni como inventario universal de todas las lenguas.

## 2. Ejes de lectura

Para la introducción general, el lector deberá poder reconocer al menos:

- altura;
- anterioridad/posterioridad;
- redondeamiento.

En la tabla oficial, cuando dos símbolos vocálicos aparecen pareados, el de la derecha representa la vocal redondeada.

Los perfiles lingüísticos podrán añadir otras dimensiones cuando sean necesarias.

## 3. Posición relativa

El diagrama permite visualizar relaciones entre categorías de altura y anterioridad/posterioridad.

La calidad vocálica forma un continuo que las descripciones dividen en regiones útiles. Por eso las posiciones del diagrama deben entenderse como una herramienta descriptiva, no como coordenadas físicas exactas que por sí solas determinen la realización de una lengua.

## 4. Símbolo IPA y realización concreta

MLS-SND evitará esta inferencia:

> mismo símbolo = sonido físicamente idéntico en todas las lenguas.

La transcripción amplia puede facilitar comparaciones sin afirmar identidad fonética estrecha. Como control empírico de esta cautela, SND-SRC-0052 estudia vocales representadas ampliamente con /ɨ/ en polaco, ucraniano y ruso precisamente para comprobar y comparar sus realizaciones físicas; esa evidencia se usa aquí solo como demostración metodológica, no para generalizar sobre cualquier símbolo IPA.

En cada perfil, la realización concreta deberá documentarse con fuentes de la lengua o variedad correspondiente.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| REP004-C01 | La tabla oficial del IPA contiene una subtabla específica de vocales | SND-SRC-0001 | “Quick links” → vowels | transversal | VERIFIED |
| REP004-C02 | Altura y anterioridad/posterioridad son dimensiones usadas para describir vocales | SND-SRC-0024 | §3.5 “Describing vowels” → “Height” y “Backness” | introductorio/transversal | VERIFIED |
| REP004-C03 | La calidad vocálica se organiza como un continuo que puede dividirse en regiones descriptivas | SND-SRC-0024 | §3.5 “Vowel quality” | introductorio/transversal | VERIFIED |
| REP004-C04 | En el diagrama oficial, cuando los símbolos vocálicos aparecen en pares, el símbolo de la derecha representa una vocal redondeada | SND-SRC-0001 | tabla “VOWELS” y nota “Where symbols appear in pairs, the one to the right represents a rounded vowel” | tabla IPA | VERIFIED |
| REP004-C05 | Una notación amplia compartida no obliga a asumir realizaciones físicas idénticas; el estudio citado usa /ɨ/ para comparación mientras examina diferencias articulatorias entre lenguas | SND-SRC-0052 | §1 y resultados/conclusiones de Cavar et al. (2025), dentro del alcance polaco–ucraniano–ruso | control metodológico acotado | VERIFIED |

## 6. Fuentes

International Phonetic Association. (2026). *The IPA Chart*. https://www.internationalphoneticassociation.org/content/ipa-chart

Anderson, C., Bjorkman, B. M., Denis, D., Doner, J., Grant, M., Sanders, N., & Taniguchi, A. (2022). *Essentials of Linguistics* (2nd ed.). eCampusOntario Pressbooks.

Cavar, M. E., Rudman, E. M., Nagaraj, N., & Peters, L. (2025). High central vowels in Polish, Ukrainian and Russian. *Journal of the International Phonetic Association, 55*(1–2), 1–34. https://doi.org/10.1017/S0025100325000040

## 7. Nota editorial

Las decisiones sobre cuánta precisión acústica o articulatoria incluir en cada lengua se tomarán dentro de los perfiles, no en esta entrada general.

## 8. Revisión lingüística

- **Fecha:** 2026-10-11.
- **Resultado:** **PASS_WITH_CHANGE**.
- **Cambios de precisión:** se hizo explícita la convención de redondeamiento del diagrama IPA y se añadió un control empírico acotado para evitar convertir un símbolo amplio compartido en identidad fonética.
- **No se cambió:** el objetivo pedagógico de orientación, la política de transcripción amplia ni la exigencia de fuentes específicas por perfil.
- **Gate alcanzado:** `LINGUISTIC_REVIEW`.
- **Pendiente:** `EDITORIAL_REVIEW`.


## 9. Revisión editorial

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `EDITORIAL_REVIEW`.
- **Lectura:** La secuencia función → ejes → posición relativa → símbolo vs. realización es clara para consulta; el control contra la inferencia ‘mismo símbolo = mismo sonido físico’ está suficientemente destacado.
- **Control:** no se modificaron claims R33, source IDs, localizadores, símbolos IPA, transcripciones ni alcance durante este gate.
- **Siguiente paso:** candidato a `READY_FOR_COMPOSITION` únicamente después del gate de composition readiness aplicado a esta misma versión.
