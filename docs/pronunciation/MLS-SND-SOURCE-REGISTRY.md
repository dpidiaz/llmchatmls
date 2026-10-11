# MLS-SND Source Registry

Estado: **registro operativo v0.6**. Este archivo registra fuentes admisibles y su alcance. La presencia de una fuente aquí **no valida por sí sola una entrada**.

## 1. Objetivo

Registrar de manera auditable qué fuentes pueden respaldar afirmaciones del tomo y para qué idioma, variedad, fenómeno y nivel analítico son apropiadas.

La unidad de validación R33 sigue siendo:

**afirmación concreta ↔ evidencia concreta ↔ localizador concreto ↔ versión vigente del texto**.

## 2. Tiers de fuente

- **Tier A — Institucional/primaria:** organismo lingüístico, ministerio, instituto nacional, asociación profesional o documentación oficial del sistema descrito.
- **Tier B — Académica de referencia:** artículo revisado por pares, monografía, capítulo especializado, Illustration of the IPA o corpus académico con metodología explícita.
- **Tier C — Lexicográfica/especializada:** diccionario de pronunciación, ortoépico o recurso especializado de autoridad.
- **Tier D — Auxiliar:** material pedagógico o divulgativo de calidad; nunca debe ser la única base de una afirmación lingüística compleja.
- **Tier X — No admisible como evidencia final:** fuente sin autoría/metodología verificable, agregador, contenido generado automáticamente o recurso que no permita comprobar el alcance.

## 3. Registro mínimo por fuente

Cada fuente deberá registrar:

- `source_id`;
- tier;
- referencia APA 7;
- autor/institución;
- título;
- año/versión;
- URL/DOI/identificador persistente;
- acceso gratuito: sí/no/parcial;
- idioma;
- variedad cubierta;
- fenómenos cubiertos;
- localizadores disponibles;
- limitaciones conocidas;
- fecha de verificación;
- estado editorial.

## 4. Regla de alcance

Una fuente sobre un idioma general no se tratará automáticamente como evidencia suficiente para una afirmación sobre una variedad concreta.

Una fuente normativa tampoco se tratará automáticamente como descripción exhaustiva del uso.

Una `Illustration of the IPA` basada en uno o pocos hablantes se utilizará para el alcance que el artículo declara, no como prueba automática de toda la diversidad de la lengua.

## 5. Localizadores aceptables

Según la fuente podrán utilizarse:

- página o rango de páginas;
- sección o epígrafe estable;
- capítulo;
- tabla;
- figura;
- número de ejemplo;
- entrada lexicográfica;
- registro de corpus;
- DOI/handle más página/sección;
- otro localizador reproducible.

La URL sola no constituye por defecto un localizador suficiente para una afirmación material.

## 6. Registro inicial verificado

### SND-SRC-0001 — International Phonetic Association: IPA Chart

- **Tier:** A
- **APA 7:** International Phonetic Association. (2026). *The IPA Chart*. https://www.internationalphoneticassociation.org/node/1061
- **Idioma/variedad:** transversal
- **Cobertura:** inventario oficial del IPA, organización de la tabla, estatus oficial de símbolos y revisiones.
- **Localizador:** sección “The International Phonetic Alphabet and the IPA Chart”; subtablas de consonantes, vocales, diacríticos, suprasegmentales y tonos.
- **Acceso:** gratuito.
- **Limitación:** define el sistema IPA; no describe por sí sola el inventario fonético/fonológico de una lengua.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0002 — Handbook of the IPA

- **Tier:** A/B
- **APA 7:** International Phonetic Association. (1999). *Handbook of the International Phonetic Association: A guide to the use of the International Phonetic Alphabet*. Cambridge University Press.
- **URL:** https://www.internationalphoneticassociation.org/content/handbook-ipa
- **Idioma/variedad:** transversal
- **Cobertura:** principios de análisis fonético, uso de símbolos y 29 Illustrations.
- **Localizador:** capítulos y apéndices del *Handbook*; la página oficial confirma estructura y alcance.
- **Acceso:** página descriptiva gratuita; libro completo con acceso restringido según edición/membresía.
- **Limitación:** no sustituye bibliografía específica y reciente de cada variedad.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0003 — Guatemala / ASALE

- **Tier:** A
- **APA 7:** Asociación de Academias de la Lengua Española. (2021). *Crónica de la lengua española 2021*. Espasa.
- **URL:** https://www.asale.org/sites/default/files/2024-03/Cronica%20de%20la%20lengua%20espanola%202021.pdf
- **Idioma/variedad:** español de Guatemala.
- **Cobertura:** panorama contemporáneo; sección específica de fonética y fonología; variación regional y generacional.
- **Localizador:** capítulo “Una aproximación al español en Guatemala en los albores del siglo XXI” → “Peculiaridades del español de Guatemala” → “Fonética y fonología”, p. 209 de la edición impresa (página PDF 231 / índice interno P230 en la copia digital consultada).
- **Acceso:** gratuito.
- **Limitación:** la propia obra declara que no pretende una descripción fonético-fonológica exhaustiva de la variedad.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0004 — American English / Ladefoged

- **Tier:** B
- **APA 7 canónica para R33:** Ladefoged, P. (1999). American English. En International Phonetic Association (Ed.), *Handbook of the International Phonetic Association: A guide to the use of the International Phonetic Alphabet* (pp. 41–44). Cambridge University Press.
- **URL canónica:** https://www.cambridge.org/core/books/handbook-of-the-international-phonetic-association/illustrations-of-the-ipa/324F06806CCBF10275E6E52989B02404
- **Antecedente editorial:** la Illustration se originó en el modelo presentado por Ladefoged en 1989 y posteriormente fue incorporada al *Handbook* de 1999. MLS-SND usa la versión de 1999 como referencia canónica porque su procedencia, alcance y contexto son directamente verificables en Cambridge.
- **Idioma/variedad:** inglés estadounidense; habla de estadounidenses jóvenes educados del Far West y algunas zonas del Midwest; la grabación base corresponde a una hablante de 21 años de Southern California.
- **Cobertura:** Illustration of the IPA; inventario y transcripción de una variedad estadounidense explícitamente delimitada.
- **Localizador:** capítulo “American English”, pp. 41–44 del *Handbook*.
- **Acceso:** extracto y metadatos accesibles en Cambridge Core; acceso integral según edición/suscripción.
- **Limitación:** la propia descripción advierte que existen múltiples dialectos norteamericanos y que resulta impropio presentar una sola variedad como “American English” sin delimitación. No representa todo EE. UU.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_SCOPE_WARNING.

### SND-SRC-0005 — American English: Southern Michigan

- **Tier:** B
- **APA 7:** Hillenbrand, J. M. (2003). American English: Southern Michigan. *Journal of the International Phonetic Association, 33*(1), 121–126.
- **URL:** https://www.cambridge.org/core/journals/journal-of-the-international-phonetic-association/illustrations-of-the-ipa-free-content
- **Idioma/variedad:** inglés estadounidense, sur de Michigan.
- **Cobertura:** perfil fonético regional; contrapunto explícito a una noción homogénea de “General American”.
- **Localizador:** pp. 121–126; extracto de la ficha de Cambridge.
- **Acceso:** contenido listado como libre por Cambridge.
- **Limitación:** regional; no representa todo EE. UU.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0006 — Brazilian Portuguese / JIPA

- **Tier:** B
- **APA 7:** Barbosa, P. A., & Albano, E. C. (2004). Brazilian Portuguese. *Journal of the International Phonetic Association, 34*(2), 227–232. https://doi.org/10.1017/S0025100304001756
- **URL:** https://www.cambridge.org/core/journals/journal-of-the-international-phonetic-association/article/brazilian-portuguese/8EE69D52AE2D06C1EDA2841EA2E14FEC
- **Idioma/variedad:** portugués brasileño; hablante vinculada a São Paulo/Valinhos.
- **Cobertura:** Illustration of the IPA de portugués brasileño.
- **Localizador:** pp. 227–232.
- **Acceso:** ficha y contenido libre indicados por Cambridge.
- **Limitación crítica:** **no es una fuente carioca**; sirve como contraste y marco de PB, no como evidencia automática de Río de Janeiro.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_SCOPE_WARNING.

### SND-SRC-0007 — Perfil de la fala carioca

- **Tier:** B
- **APA 7:** Callou, D. (2009). Um perfil da fala carioca. En S. S. C. Ribeiro, S. B. B. Costa, & S. A. M. Cardoso (Orgs.), *Dos sons às palavras: nas trilas da Língua Portuguesa* (pp. 130–152). EDUFBA.
- **DOI/URL:** https://doi.org/10.7476/9788523211851.0008 ; https://books.scielo.org/id/vr2dr
- **Idioma/variedad:** portugués de Río de Janeiro / habla carioca.
- **Cobertura:** perfil sociolingüístico y fonético de la fala carioca; variación de segmentos como /r/, /s/ y /l/ en los datos discutidos.
- **Localizador:** pp. 130–152; usar página exacta para cada afirmación.
- **Acceso:** gratuito, SciELO Books; licencia CC BY 4.0 indicada por la edición abierta.
- **Limitación:** no debe extrapolarse a todo portugués brasileño.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0008 — Italiano / DOP

- **Tier:** A/C
- **APA 7:** RAI. (2025). *DOP: Dizionario italiano multimediale e multilingue d’ortografia e di pronunzia* (2.ª ed. multimediale). https://www.dop.rai.it/
- **Idioma/variedad:** italiano; referencia ortoépica/lexicográfica.
- **Cobertura:** pronunciación y ortografía; guías específicas para E, O, S, Z, transliteraciones y lectura de voces.
- **Localizador:** entrada concreta del diccionario o sección estable de “Norme per la lettura”.
- **Acceso:** gratuito en web.
- **Limitación:** recurso normativo/ortoépico; no equivale a descripción de toda la variación regional italiana.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0009 — Français / PFC

- **Tier:** B
- **APA 7:** Programme Phonologie du Français Contemporain. (s. f.). *PFC: usages, variétés, structure*. https://www.projet-pfc.net/
- **Idioma/variedad:** francés contemporáneo del espacio francófono; múltiples variedades.
- **Cobertura:** corpus de francés oral contemporáneo; más de 50 encuestas y más de 400 hablantes según la página del proyecto.
- **Localizador:** encuesta/corpus/localidad y registro correspondiente; no usar solo la portada para afirmaciones fonéticas específicas.
- **Acceso:** parte del corpus accesible mediante recursos asociados como Ortolang.
- **Limitación:** no proporciona por sí solo una única “pronunciación estándar”; exige seleccionar subcorpus y bibliografía analítica.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_AS_CORPUS_FRAMEWORK.

### SND-SRC-0010 — Alemán / Duden

- **Tier:** C
- **APA 7:** Dudenredaktion. (s. f.). *Aussprache*. https://www.duden.de/hilfe/aussprache
- **Idioma/variedad:** alemán; pronunciación lexicográfica de referencia Duden.
- **Cobertura:** uso de IPA en Duden, longitud vocálica, acento y tabla de signos empleados.
- **Localizador:** página “Aussprache” → tabla “Lautschriftzeichen”; entrada concreta cuando corresponda.
- **Acceso:** gratuito en web.
- **Limitación:** no sustituye investigación específica de estándares nacionales de Alemania, Austria y Suiza.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0011 — Mandarín de Taiwán / MOE Zhuyin

- **Tier:** A
- **APA 7:** Ministry of Education, Taiwan. (2017). *The Manual of the Phonetic Symbols of Mandarin Chinese* (digital ed.). https://language.moe.gov.tw/001/Upload/files/site_content/M0001/juyin/html_en/index.html
- **Idioma/variedad:** mandarín en Taiwán; Bopomofo/Zhuyin como sistema de símbolos fonéticos pedagógico-oficial.
- **Cobertura:** símbolos de inicio y rima, marcas tonales, tablas silábicas y convenciones gráficas.
- **Localizador:** “1. List of Phonetic Symbols” → onset/rhyme/tonal marks; “6. Reference Table…”.
- **Acceso:** gratuito; manual digital con licencia indicada por MOE.
- **Limitación:** **Zhuyin no se tratará como equivalente local del IPA**; se necesita bibliografía fonética/fonológica adicional para realizaciones concretas.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0012 — Coreano / Revised Romanization

- **Tier:** A
- **APA 7:** National Institute of Korean Language. (s. f.). *Romanization of Korean*. https://www.korean.go.kr/front_eng/roman/roman_01.do
- **Idioma/variedad:** coreano estándar según el marco normativo del NIKL.
- **Cobertura:** principios y tablas de la Romanización Revisada; relación declarada con la pronunciación estándar.
- **Localizador:** “1. Basic Principles for Transcription”; “2. Summary of the Transcription System”.
- **Acceso:** gratuito.
- **Limitación:** la romanización no registra todos los detalles fonéticos; la propia página indica, por ejemplo, que la longitud vocálica no se refleja.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0013 — Japonés / Tokyo accent data

- **Tier:** A/B
- **APA 7:** Shibata, T. (superv.), Mase, Y., & Sato, R. (Eds.). (1985/2013). *東京語アクセント資料 [A Dictionary of Tone-accent on Words in the Tokyo Dialect]* (digital ed.). National Institute for Japanese Language and Linguistics. https://mmsrv.ninjal.ac.jp/tokyo_accent/
- **Idioma/variedad:** japonés, habla de Tokio; acento.
- **Cobertura:** 12,803 palabras con variación esperada; datos de 19 hablantes y comparación con diccionarios de acento.
- **Localizador:** número de página/entrada/forma/respuesta del recurso digital; prólogo pp. 3–10 y convenciones pp. 11–17 para metodología.
- **Acceso:** gratuito.
- **Limitación:** datos recogidos principalmente 1982–1984; debe combinarse con recursos más recientes para afirmaciones sobre uso actual.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_DATE_WARNING.

### SND-SRC-0014 — Japonés / OJAD-NINJAL project

- **Tier:** A/B
- **APA 7:** National Institute for Japanese Language and Linguistics. (s. f.). *日本語教育のためのコーパスを利用したオンライン日本語アクセント辞書の開発*. https://www.ninjal.ac.jp/research/cr-project/project/pubpro/accentdictionary/
- **Idioma/variedad:** japonés común con referencia de dialecto de Tokio en el proyecto.
- **Cobertura:** acento, transformaciones de acento y prosodia para educación de japonés; proyecto OJAD.
- **Localizador:** secciones “概要” y “プロジェクトの詳細”.
- **Acceso:** gratuito.
- **Limitación:** el proyecto institucional terminó en 2013; usar con fecha y alcance explícitos.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_DATE_WARNING.

### SND-SRC-0015 — Ruso / Illustration of the IPA

- **Tier:** B
- **APA 7:** Yanushevskaya, I., & Bunčić, D. (2015). Russian. *Journal of the International Phonetic Association, 45*(2), 221–228. https://doi.org/10.1017/S0025100314000395
- **Open-access record:** https://hdl.handle.net/2262/112950
- **Idioma/variedad:** ruso.
- **Cobertura:** Illustration of the IPA; inventario y realizaciones descritas en el artículo.
- **Localizador:** pp. 221–228.
- **Acceso:** copia de acceso abierto registrada por Trinity College Dublin.
- **Limitación:** verificar dentro del artículo el alcance exacto de hablantes/variedad antes de generalizar.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0016 — Ruso / ortoepía contemporánea

- **Tier:** A/C
- **APA 7:** Каленчук, М. Л., Касаткин, Л. Л., & Касаткина, Р. Ф. (2017). *Большой орфоэпический словарь русского языка: Литературное произношение и ударение начала XXI века: норма и её варианты* (2-е изд.). АСТ-ПРЕСС КНИГА.
- **Registro institucional:** https://ruslang.ru/book/kalenchuk-ml-kasatkin-l-l-kasatkina-r-f-bolshoy-orfoepicheskiy-slovar-russkogo-yazyka
- **Idioma/variedad:** ruso literario contemporáneo; norma y variantes.
- **Cobertura:** pronunciación y acento de más de 80,000 palabras; variación normativa y generacional.
- **Localizador:** entrada lexicográfica concreta; página en la edición impresa cuando se cite una afirmación.
- **Acceso:** registro institucional gratuito; libro no necesariamente íntegro en acceso abierto.
- **Limitación:** fuente principalmente ortoépica/normativa; complementar con descripción fonética.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

## 7. Gaps prioritarios del registro

Aún faltan fuentes de base suficientes para cerrar:

1. una descripción fonética moderna y explícitamente delimitada del **español urbano de Ciudad de Guatemala**;
2. un marco contemporáneo para **inglés estadounidense no regionalizado** sin recurrir a la etiqueta engañosamente homogénea “General American”;
3. bibliografía adicional reciente para **portugués carioca**, especialmente vocalismo, nasalidad y prosodia;
4. una descripción fonética/fonológica académica de **italiano de referencia** separada de la ortoepía DOP;
5. selección de subcorpus y bibliografía analítica para **francés**;
6. fuentes académicas para **estándares nacionales del alemán**;
7. fuentes de fonética/fonología de **mandarín de Taiwán** aparte de Zhuyin;
8. fuentes fonéticas del **coreano contemporáneo** aparte de Romanización Revisada;
9. bibliografía contemporánea complementaria para **japonés de Tokio**;
10. fuentes descriptivas adicionales para **ruso contemporáneo**, separando descripción y norma.

## 8. Regla de expansión

No se llenará el registro para alcanzar una cuota numérica. Cada fuente nueva debe cubrir un vacío identificable y debe registrar qué afirmaciones podría sostener y cuáles **no**.


## 9. Segunda expansión verificada

### SND-SRC-0017 — Italiano / Illustration of the IPA

- **Tier:** B
- **APA 7:** Rogers, D., & d’Arcangeli, L. (2004). Italian. *Journal of the International Phonetic Association, 34*(1), 117–121.
- **Registro:** https://researchnow.flinders.edu.au/en/publications/illustrations-of-the-ipa-italian/
- **Idioma/variedad:** italiano; el artículo distingue variedades regionales del estándar y discute el “mainstream Italian”.
- **Cobertura:** Illustration of the IPA.
- **Localizador:** pp. 117–121.
- **Acceso:** metadatos abiertos; Cambridge lista el artículo entre Illustrations de libre acceso.
- **Limitación:** no debe borrar la distinción entre estándar, variedades regionales y mainstream contemporáneo.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0018 — Francés / Illustration of the IPA

- **Tier:** B
- **APA 7:** Fougeron, C., & Smith, C. L. (1993). French. *Journal of the International Phonetic Association, 23*(2), 73–76. https://doi.org/10.1017/S0025100300004874
- **URL:** https://www.cambridge.org/core/journals/journal-of-the-international-phonetic-association/article/french/E2BC8B1DD975FE4B272B088B8345B933
- **Idioma/variedad:** francés; descripción basada en una joven hablante parisina.
- **Cobertura:** Illustration of the IPA.
- **Localizador:** pp. 73–76.
- **Acceso:** Cambridge la incluye en la colección de Illustrations libres.
- **Limitación:** perfil antiguo y basado en una hablante; usar PFC y estudios contemporáneos para variación y cambios.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_SCOPE_DATE_WARNING.

### SND-SRC-0019 — Alemán / Illustration of the IPA

- **Tier:** B
- **APA 7:** Kohler, K. J. (1990). German. *Journal of the International Phonetic Association, 20*(1), 48–50. https://doi.org/10.1017/S0025100300004084
- **URL:** https://www.cambridge.org/core/journals/journal-of-the-international-phonetic-association/article/german/D74393072AA2D66032B8A6E58BE15082
- **Idioma/variedad:** alemán.
- **Cobertura:** Illustration of the IPA.
- **Localizador:** pp. 48–50.
- **Acceso:** disponible vía Cambridge según la ficha consultada.
- **Limitación:** no cubre por sí sola los estándares nacionales contemporáneos de Alemania, Austria y Suiza.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_SCOPE_DATE_WARNING.

### SND-SRC-0020 — Coreano / Illustration of the IPA

- **Tier:** B
- **APA 7:** Lee, H. B. (1993). Korean. *Journal of the International Phonetic Association, 23*(1), 28–31. https://doi.org/10.1017/S0025100300004758
- **URL:** https://www.cambridge.org/core/journals/journal-of-the-international-phonetic-association/article/korean/07312FF2A7409D9C71A4FE83E12AA54D
- **Idioma/variedad:** coreano; autor afiliado a Seoul National University.
- **Cobertura:** Illustration of the IPA.
- **Localizador:** pp. 28–31.
- **Acceso:** disponible vía Cambridge según la ficha consultada.
- **Limitación:** antigüedad relevante dada la documentación de cambios fonéticos posteriores; no usar como única descripción del coreano contemporáneo.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_DATE_WARNING.

### SND-SRC-0021 — Coreano de Seúl / oclusivas contemporáneas

- **Tier:** B
- **APA 7:** Schweizer, D., Ahn, S., & Kwon, H. (2026). Acoustic properties of Seoul Korean stops in phrase-initial and word-medial positions. *Journal of the International Phonetic Association*. Publicación en línea 11 de mayo de 2026.
- **URL:** https://www.cambridge.org/core/journals/journal-of-the-international-phonetic-association/article/acoustic-properties-of-seoul-korean-stops-in-phraseinitial-and-wordmedial-positions/51F4CFC5431FA2FFF9F61C3B360383B4
- **Idioma/variedad:** coreano de Seúl.
- **Cobertura:** propiedades acústicas de oclusivas en posiciones inicial de frase y medial de palabra; experimento de producción y corpus.
- **Localizador:** secciones “Study 1: Production experiment”, “Study 2: Corpus”, “Discussion” y tablas/figuras del artículo.
- **Acceso:** ficha y resumen web.
- **Limitación:** fenómeno específico; no reemplaza una gramática fonética completa.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0022 — Taiwan Mandarin / variación tonal regional

- **Tier:** B
- **APA 7:** Fon, J., & Chuang, Y.-Y. (2024). When a rise is not only a rise: An acoustic analysis of the impressionistic distinction between northern and central Taiwan Mandarin using Tone 1 as an example. *Journal of the International Phonetic Association, 54*(2), 738–769. https://doi.org/10.1017/S0025100324000100
- **Idioma/variedad:** mandarín de Taiwán; norte vs. centro.
- **Cobertura:** análisis acústico de Tone 1 y variación regional; 53 hablantes en la muestra descrita por el artículo.
- **Localizador:** secciones metodológicas, resultados, tablas y figuras del artículo; usar localizador exacto por claim.
- **Acceso:** ficha/artículo de Cambridge; metadatos institucionales de NTU.
- **Limitación:** se centra en Tone 1 y un contraste regional concreto; no generalizar a todo el sistema tonal.
- **Nota bibliográfica:** Cambridge puede mostrar fecha de publicación web posterior, pero el volumen/issue canónico es JIPA 54(2), 2024.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0023 — Japonés / Illustration of the IPA

- **Tier:** B
- **APA 7:** Okada, H. (1991). Japanese. *Journal of the International Phonetic Association, 21*(2), 94–96. https://doi.org/10.1017/S002510030000445X
- **URL:** https://www.cambridge.org/core/journals/journal-of-the-international-phonetic-association/article/japanese/EF0E01DD40A1B2779F3ADFF96B5D97E3
- **Idioma/variedad:** japonés.
- **Cobertura:** Illustration of the IPA.
- **Localizador:** pp. 94–96.
- **Acceso:** disponible vía Cambridge según la ficha consultada.
- **Limitación:** descripción breve y antigua; complementar con NINJAL y estudios actuales.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_DATE_WARNING.

## 10. Resultado del registro v0.3

El registro contiene ahora **23 fuentes** con alcance explícito.

La prioridad de la siguiente ronda no es aumentar el número, sino cerrar estos huecos:

- Guatemala contemporánea con mejor granularidad regional/urbana;
- inglés estadounidense contemporáneo con corpus y variación;
- prosodia y vocalismo carioca actuales;
- estándares nacionales del alemán;
- fonética integral de Taiwan Mandarin;
- coreano contemporáneo más allá de oclusivas;
- japonés segmental/prosódico contemporáneo;
- francés contemporáneo con selección de subcorpus PFC.


## 11. Fuente transversal para fundamentos

### SND-SRC-0024 — Essentials of Linguistics, 2nd edition

- **Tier:** B/D — manual académico abierto de introducción; admisible para definiciones y fundamentos, no como única fuente para afirmaciones especializadas o específicas de una variedad.
- **APA 7:** Anderson, C., Bjorkman, B. M., Denis, D., Doner, J., Grant, M., Sanders, N., & Taniguchi, A. (2022). *Essentials of Linguistics* (2nd ed.). eCampusOntario Pressbooks. https://ecampusontario.pressbooks.pub/essentialsoflinguistics2/
- **Idioma/variedad:** transversal.
- **Cobertura:** fonética, IPA, sílaba, tono e intonación, fonología, fonemas/alófonos, análisis fonémico y fonotáctica.
- **Localizadores útiles:** cap. 3 “Phonetics”; §3.6 “The International Phonetic Alphabet”; §3.10 “Syllables”; §3.12 “Tone and Intonation”; cap. 4 “Phonology”; §4.1 “Phonemes and allophones”; §4.2 “Phonotactics”; §4.5 “Phonemic Analysis”.
- **Acceso:** gratuito.
- **Licencia:** CC BY-NC-SA 4.0 indicada por la edición.
- **Limitación:** obra introductoria; sus ejemplos y simplificaciones pedagógicas no sustituyen fuentes especializadas por idioma ni debates teóricos avanzados.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_FOR_FOUNDATIONS.

## 12. Resultado del registro v0.4

El registro contiene ahora **24 fuentes** con alcance explícito. SND-SRC-0024 permite comenzar la wave de fundamentos sin reutilizar fuentes específicas de idiomas fuera de su alcance.


## 13. Expansión del prototipo trilingüe

### SND-SRC-0025 — Español de Guatemala / Utgård 2010

- **Tier:** B.
- **APA 7:** Utgård, K. (2010). El español de Guatemala. En M. Á. Quesada Pacheco (Ed.), *El español hablado en América Central: Nivel fonético* (pp. 49–82). Iberoamericana/Vervuert. https://doi.org/10.31819/9783865278708-003
- **Idioma/variedad:** español de Guatemala; estudio geolingüístico nacional.
- **Cobertura:** fonética segmental, variación regional y propuesta de zonas dialectales.
- **Metodología relevante:** el estudio reporta 22 localidades y 88 informantes en la versión ampliada; los datos proceden de trabajo de campo del Atlas Fonético/ALAC.
- **Localizadores:** capítulo pp. 49–82; para claims concretos usar subsección y página exacta.
- **Acceso:** metadatos y DOI abiertos; existe copia pública de autor de la investigación relacionada.
- **Limitación:** el diseño privilegia localidades y fonética segmental; no sustituye una descripción prosódica ni un estudio exclusivo de Ciudad de Guatemala.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0026 — Corpus NURC-RJ / UFRJ

- **Tier:** A/B — corpus institucional universitario.
- **Institución:** Projeto NURC-RJ, Faculdade de Letras, Universidade Federal do Rio de Janeiro.
- **URL base:** https://nurcrj.letras.ufrj.br/
- **Idioma/variedad:** portugués de Río de Janeiro; habla culta urbana según los criterios del proyecto y la muestra concreta.
- **Cobertura:** entrevistas e inquéritos con metadatos de locutor, edad, profesión, zona residencial, fecha, duración y transcripción.
- **Localizador:** identificador de inquérito + locutor + fecha + fragmento/transcripción.
- **Acceso:** web institucional; múltiples inquéritos consultables.
- **Limitación crítica:** un corpus proporciona datos; no convierte automáticamente una observación en generalización fonológica. Toda inferencia requiere análisis y delimitación de muestra.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_AS_CORPUS.


## 14. Resultado del registro v0.5

El registro contiene **26 fuentes** numeradas SND-SRC-0001 a SND-SRC-0026.

La expansión reciente añadió:

- SND-SRC-0025 — Utgård (2010), estudio geolingüístico del español de Guatemala;
- SND-SRC-0026 — Corpus NURC-RJ/UFRJ para datos de habla urbana culta de Río de Janeiro.

La prioridad siguiente sigue siendo **cerrar vacíos**, no aumentar el conteo: evidencia contemporánea carioca, mayor cobertura de inglés estadounidense actual y fuentes prosódicas específicas de Guatemala.


## 15. Control tipológico para revisión de fundamentos

### SND-SRC-0027 — Van Soeren 2023 / lexical stress

- **Tier:** B.
- **APA 7:** Van Soeren, D. P. (2023). The role of word recognition factors and lexical stress in the distribution of consonants in Spanish, English and Dutch. *Journal of Linguistics, 59*(1), 149–177. https://doi.org/10.1017/S0022226722000081
- **Idioma/variedad:** control comparativo de español, inglés y neerlandés; no es una descripción general de todos los sistemas prosódicos.
- **Cobertura usada por MLS-SND:** control tipológico para evitar presuponer que toda lengua posee stress léxico del mismo tipo.
- **Localizador:** §6.1 “Lexical stress and word recognition”, especialmente la afirmación de que stress no aparece en la fonología de palabra de todas las lenguas y que sus funciones/realización varían entre lenguas que sí lo poseen.
- **Acceso:** abierto en Cambridge Core.
- **Limitación:** el artículo investiga distribución consonántica y reconocimiento de palabras en tres lenguas; no debe utilizarse como fuente única para una teoría universal del acento.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_FOR_LINGUISTIC_REVIEW.

## 16. Resultado del registro v0.6

El registro contiene **27 fuentes** numeradas SND-SRC-0001 a SND-SRC-0027.

SND-SRC-0027 se incorpora como control tipológico de la revisión lingüística de fundamentos; no reemplaza fuentes prosódicas específicas de cada idioma.


## 17. Canonicalización de fuentes multilingües — wave 01

### SND-SRC-0028 — Italiano / GEMMA lexical gemination

- **Tier:** B.
- **APA 7:** Di Benedetto, M.-G., & De Nardis, L. (2022). The GEMMA speech database: VCV and VCCV words for the acoustic analysis of consonants and lexical gemination in Italian. *Data in Brief, 43*, 108373. https://doi.org/10.1016/j.dib.2022.108373
- **Idioma/variedad:** italiano estándar; hablantes adultos criados/residentes en Roma según el diseño del conjunto.
- **Cobertura:** consonantes simples vs. geminadas; medidas de duración en materiales VCV/VCCV.
- **Localizadores:** Abstract; Value of the Data; Specifications Table.
- **Acceso:** abierto; PMCID PMC9256837.
- **Limitación:** corpus controlado y centrado en geminación; no representa toda la variación italiana.
- **Estado:** ADMITTED.

### SND-SRC-0029 — Italiano / Treccani, Fonetica

- **Tier:** B/C.
- **APA 7:** Bertinetto, P. M. (2010). Fonetica. En *Enciclopedia dell’Italiano*. Treccani. https://www.treccani.it/enciclopedia/fonetica_%28Enciclopedia-dell%27Italiano%29/
- **Idioma/variedad:** italiano; descripción enciclopédica con variación regional.
- **Cobertura:** fonética/fonología, geminación, cantidad, procesos y variación.
- **Localizadores:** §3.2 para geminación; sección de prosodia/cantidad; §6 para variación regional cuando corresponda.
- **Acceso:** gratuito.
- **Limitación:** recurso enciclopédico; para claims experimentales finos se prefieren estudios específicos.
- **Estado:** ADMITTED_AS_REFERENCE.

### SND-SRC-0030 — Alemán de Austria / variación de -ig

- **Tier:** B.
- **APA 7:** Lanwermeyer, M., Fanta-Jende, J., Lenz, A. N., & Korecky-Kröll, K. (2019). Competing norms of standard pronunciation. Phonetic analyses on the -ig-variation in Austria. *Dialectologia et Geolinguistica, 27*(1), 143–175. https://doi.org/10.1515/dialect-2019-0008
- **Idioma/variedad:** alemán estándar de Austria.
- **Cobertura:** variación fonética de -ig; 52 hablantes, dos generaciones y cobertura regional austríaca según el estudio.
- **Localizador:** pp. 143–175; metodología/resultados por claim.
- **Limitación:** fenómeno específico; no es descripción completa del estándar austríaco.
- **Estado:** ADMITTED.

### SND-SRC-0031 — Swiss Standard German / vocales

- **Tier:** B.
- **APA 7:** Zihlmann, U. B. (2023). Vowel quality in four Alemannic dialects and its influence on the respective varieties of Swiss Standard German. *Journal of the International Phonetic Association, 53*(1), 1–28. https://doi.org/10.1017/S0025100320000377
- **Publicación online:** 2021-02-18.
- **Idioma/variedad:** cuatro dialectos alemánicos y sus variedades correspondientes de Swiss Standard German.
- **Cobertura:** calidad vocálica y efecto de dialectos alemánicos sobre SSG.
- **Localizadores:** Abstract; Methods; Results; Discussion.
- **Acceso:** Open Access en Cambridge.
- **Limitación:** vocales/áreas concretas; no representa toda la fonética del SSG.
- **Estado:** ADMITTED.

### SND-SRC-0032 — Coreano / Standard Pronunciation Rules

- **Tier:** A.
- **Institución:** National Institute of Korean Language.
- **Título:** *표준 발음법* [Standard Pronunciation Rules].
- **URL:** https://www.korean.go.kr/front/page/pageView.do?mn_id=94&page_id=P000097
- **Idioma/variedad:** coreano estándar; norma institucional.
- **Cobertura:** consonantes/vocales, longitud, pronunciación de coda, asimilación, tensificación e inserción.
- **Localizador:** reglas/capítulos individuales; Principle 1 y comentario institucional para alcance.
- **Dato de alcance:** la explicación institucional vincula el estándar con el habla moderna de Seúl ampliamente usada por hablantes educados.
- **Limitación:** fuente normativa; no equivale a corpus exhaustivo del habla espontánea.
- **Estado:** ADMITTED_NORMATIVE.

### SND-SRC-0033 — Coreano de Seúl / cambio en oclusivas

- **Tier:** B.
- **APA 7:** Bang, H.-Y., Sonderegger, M., Kang, Y., Clayards, M., & Yoon, T.-J. (2018). The emergence, progress, and impact of sound change in progress in Seoul Korean: Implications for mechanisms of tonogenesis. *Journal of Phonetics, 66*, 120–144.
- **Idioma/variedad:** coreano de Seúl.
- **Cobertura:** cambio en curso en el contraste de oclusivas; relación VOT/f0.
- **Localizador:** pp. 120–144; secciones de métodos/resultados según claim.
- **Limitación:** foco en cambio de oclusivas, especialmente posición inicial relevante al estudio.
- **Estado:** ADMITTED.

### SND-SRC-0034 — Coreano de Seúl / vocales monoptongales

- **Tier:** B.
- **APA 7:** Kang, J., & Kong, E. J. (2016). Static and dynamic spectral properties of the monophthong vowels in Seoul Korean: Implication on sound change. *Phonetics and Speech Sciences, 8*(4), 39–47. https://doi.org/10.13064/KSSS.2016.8.4.039
- **Idioma/variedad:** coreano de Seúl; habla espontánea del Seoul Corpus.
- **Cobertura:** siete vocales monoptongales; diferencias por edad/género y cambio vocálico.
- **Localizador:** pp. 39–47; abstract, métodos, resultados.
- **Limitación:** muestra y periodo concretos; no congelar como sistema atemporal.
- **Estado:** ADMITTED.

### SND-SRC-0035 — Coreano de Seúl / cambio de /o/

- **Tier:** B.
- **APA 7:** Igeta, T., Sonu, M., & Arai, T. (2014). Sound change of /o/ in modern Seoul Korean: Focused on relations with acoustic characteristics and perception. *Phonetics and Speech Sciences, 6*(3), 109–119. https://doi.org/10.13064/KSSS.2014.6.3.109
- **Idioma/variedad:** coreano de Seúl.
- **Cobertura:** producción/percepción de /o/ y relación con /u/ en hablantes jóvenes.
- **Localizador:** pp. 109–119; producción, percepción y resultados.
- **Limitación:** fenómeno y grupo etario concretos.
- **Estado:** ADMITTED.

### SND-SRC-0036 — Coreano de Seúl / /e/–/ɛ/

- **Tier:** B.
- **APA 7:** Chung, I. (2022). On the phonemic status of the vowels /e/ ㅔ and /ɛ/ ㅐ and their merger in modern Seoul Korean. *Korean Journal of Linguistics, 47*(4), 857–877. https://doi.org/10.18855/lisoko.2022.47.4.009
- **Idioma/variedad:** coreano moderno de Seúl.
- **Cobertura:** estatus fonémico y fusión /e/–/ɛ/.
- **Localizador:** pp. 857–877; usar secciones concretas por claim.
- **Limitación:** presenta una posición analítica argumentada; no convertirla en consenso universal sin contraste.
- **Estado:** ADMITTED_WITH_ANALYTICAL_SCOPE.

### SND-SRC-0037 — Coreano de Seúl / Accentual Phrase

- **Tier:** B.
- **APA 7:** Jun, S.-A. (1998). The Accentual Phrase in the Korean prosodic hierarchy. *Phonology, 15*(2), 189–226. https://doi.org/10.1017/S0952675798003571
- **Idioma/variedad:** coreano estándar/de Seúl dentro del modelo del artículo.
- **Cobertura:** Accentual Phrase y jerarquía prosódica.
- **Localizador:** pp. 189–226; secciones específicas por claim.
- **Limitación:** modelo analítico; no usar “Accentual Phrase” como equivalente de acento léxico.
- **Estado:** ADMITTED_MODEL_REFERENCE.

### SND-SRC-0038 — Coreano de Seúl / focus prosody

- **Tier:** B.
- **APA 7:** Lee, Y.-c., & Cho, S. (2020). Focus Prosody Varies by Phrase-Initial Tones in Seoul Korean: Production, Perception, and Automatic Classification. *Languages, 5*(4), 64. https://doi.org/10.3390/languages5040064
- **Idioma/variedad:** coreano de Seúl.
- **Cobertura:** foco prosódico y relación con tonos iniciales de frase.
- **Localizador:** Abstract; §1 y secciones experimentales/resultados según claim.
- **Acceso:** Open Access.
- **Limitación:** foco prosódico; no es descripción completa de la prosodia coreana.
- **Estado:** ADMITTED.

### SND-SRC-0039 — Francés / normas de pronunciación panfrancófonas

- **Tier:** B.
- **APA 7:** Chalier, M. (2021). *Les normes de prononciation du français: Une étude perceptive panfrancophone*. De Gruyter.
- **Repositorio:** https://e-book.fwf.ac.at/o:1567
- **Idioma/variedad:** París, Québec y Suiza francófona en el diseño del estudio.
- **Cobertura:** producción, percepción, representaciones y pluralidad de normas.
- **Localizadores:** capítulos 4–7; páginas exactas por claim.
- **Acceso:** Open Access, CC BY 4.0.
- **Limitación:** modela normas en las regiones estudiadas; no representa toda la francofonía.
- **Estado:** ADMITTED.

### SND-SRC-0040 — Francés parisino / vocales medias

- **Tier:** B.
- **APA 7:** Griffiths, J. M., & Renwick, M. E. L. (2025). Reconsidering the mid-vowel system of Parisian French: Phonetic and phonological factors. *Isogloss. Open Journal of Romance Linguistics, 11*(5), 1–17. https://doi.org/10.5565/rev/isogloss.503
- **Idioma/variedad:** francés parisino.
- **Cobertura:** /e, ɛ/, /o, ɔ/, /ø, œ/; contraste marginal y variación.
- **Localizador:** pp. 1–17; métodos/resultados por claim.
- **Acceso:** Open Access, CC BY 4.0.
- **Limitación:** vocales medias/parisino; no generalizar al francés completo.
- **Estado:** ADMITTED.

### SND-SRC-0041 — Francés parisino / vocales nasales

- **Tier:** B.
- **APA 7:** Mooney, D. (2023). The role of speaker sex and sexuality in an ongoing sound change: Nasal vowels in Parisian French. *Journal of French Language Studies, 33*(3), 357–384. https://doi.org/10.1017/S0959269523000157
- **Idioma/variedad:** francés parisino.
- **Cobertura:** cambio en curso de vocales nasales y variación sociolingüística.
- **Localizador:** pp. 357–384; Linguistic Background, Methodology, Results.
- **Acceso:** Open Access.
- **Limitación:** fenómeno y población del estudio; no generalizar a toda la francofonía.
- **Estado:** ADMITTED.

### SND-SRC-0042 — Taiwan Mandarin / Tone 3 sandhi

- **Tier:** B.
- **APA 7:** Myers, J., & Tsay, J. (2003). Investigating the phonetics of Mandarin tone sandhi. *Taiwan Journal of Linguistics, 1*(1), 29–68. https://doi.org/10.6519/TJL.2003.1(1).2
- **Idioma/variedad:** incluye Taiwan Mandarin dentro del contraste de variedades.
- **Cobertura:** evidencia fonética sobre Tone 3 sandhi y yi-sandhi.
- **Localizador:** pp. 29–68; abstract, metodología y secciones experimentales.
- **Acceso:** PDF de Taiwan Journal of Linguistics.
- **Limitación:** debe contrastarse con literatura posterior; no usar como última palabra sobre el análisis.
- **Estado:** ADMITTED.

### SND-SRC-0043 — Taiwan Mandarin / representación tonal propuesta

- **Tier:** B.
- **APA 7:** Huang, K. (2017). From pitch contour variation to tone change: An analysis of the phonological representations of the tones in Taiwan Mandarin. *International Journal of Chinese Linguistics, 4*(2), 273–307. https://doi.org/10.1075/ijchl.16016.hua
- **Idioma/variedad:** Taiwan Mandarin.
- **Cobertura:** propuesta analítica fonológica del sistema tonal basada en experimentos acústicos.
- **Localizador:** pp. 273–307.
- **Limitación:** propuesta analítica concreta; no etiquetarla como única representación posible.
- **Estado:** ADMITTED_WITH_ANALYTICAL_SCOPE.

### SND-SRC-0044 — Mandarin / inventario canónico y variantes

- **Tier:** B.
- **APA 7:** Fon, J. (2020). The Phonetic Realizations of the Mandarin Phoneme Inventory: The Canonical and the Variants. En H.-M. Liu, F.-M. Tsao, & P. Li (Eds.), *Speech Perception, Production and Acquisition: Multidisciplinary Approaches in Chinese Languages* (pp. 11–36). Springer. https://doi.org/10.1007/978-981-15-7606-5_2
- **Idioma/variedad:** Mandarin; compara variantes de Taiwán, Singapur y China.
- **Cobertura:** inventario canónico usado por el capítulo y variantes fonéticas regionales.
- **Localizador:** pp. 11–36; subsecciones por fenómeno.
- **Limitación:** el inventario canónico del capítulo no debe etiquetarse automáticamente como inventario exclusivo de Taiwan Mandarin.
- **Estado:** ADMITTED.

### SND-SRC-0045 — Taiwan Mandarin / mergers de nasales finales

- **Tier:** B.
- **APA 7:** Fon, J., Hung, J.-M., Huang, Y.-H., & Hsu, H.-J. (2011). Dialectal variations on syllable-final nasal mergers in Taiwan Mandarin. *Language and Linguistics, 12*(2), 273–311.
- **Idioma/variedad:** Taiwan Mandarin; norte/sur.
- **Cobertura:** mergers de nasales finales y variación dialectal/social.
- **Localizador:** pp. 273–311.
- **Limitación:** fenómeno específico.
- **Estado:** ADMITTED.

### SND-SRC-0046 — Taiwan Mandarin / mergers de sibilantes

- **Tier:** B.
- **APA 7:** Chiu, C., Wei, P.-C., Noguchi, M., & Yamane, N. (2020). Sibilant Fricative Merging in Taiwan Mandarin: An Investigation of Tongue Postures using Ultrasound Imaging. *Language and Speech, 63*(4), 877–897. https://doi.org/10.1177/0023830919896386
- **Idioma/variedad:** Taiwan Mandarin.
- **Cobertura:** [s]–[ʂ]–[ɕ], merger variable, articulación por ultrasonido y condicionamiento contextual.
- **Localizador:** pp. 877–897; métodos/resultados.
- **Acceso:** manuscrito en PMC; metadatos PubMed/NTU.
- **Limitación:** fricativas sibilantes; no descripción segmental completa.
- **Estado:** ADMITTED.

## 18. Resultado del registro v0.7

El registro contiene **46 fuentes** numeradas SND-SRC-0001 a SND-SRC-0046.

La canonicalización mantiene separadas:
- fuentes normativas;
- fuentes descriptivas;
- modelos analíticos;
- corpora/datasets;
- estudios de fenómenos específicos.

La existencia de un ID global no convierte automáticamente todos los claims asociados en EVIDENCE_CHECKED: cada entrada conserva su propio gate claim ↔ source ↔ locator.


### SND-SRC-0047 — Coreano de Seúl / n-insertion y silabificación de /j/

- **Tier:** B.
- **APA 7:** Jun, J. (2015). Korean n-insertion: A mismatch between data and learning. *Phonology, 32*(3), 417–458. https://doi.org/10.1017/S0952675715000275
- **Publicación online:** 15 de febrero de 2016.
- **Idioma/variedad:** coreano de Seúl en el alcance del estudio.
- **Cobertura:** variación de n-insertion, factores fonológicos y discusión explícita de alternativas de silabificación para /j/.
- **Localizador:** pp. 417–458; para KO-005, análisis alrededor de (13b)–(16), incluido el pasaje que señala que ambas silabificaciones han sido propuestas.
- **Acceso:** Open Access en Cambridge Core.
- **Limitación:** fenómeno específico y análisis teórico concreto; no constituye por sí solo una gramática silábica completa del coreano.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_ANALYTICAL_SCOPE.

## 19. Resultado del registro v0.8

El registro contiene **47 fuentes** numeradas SND-SRC-0001 a SND-SRC-0047.


### SND-SRC-0048 — Tipología prosódica / pitch-accent

- **Tier:** B.
- **APA 7:** Hyman, L. M. (2009). How (not) to do phonological typology: the case of pitch-accent. *Language Sciences, 31*(2–3), 213–238. https://doi.org/10.1016/j.langsci.2008.12.007
- **Cobertura:** tipología prosódica; crítica de `pitch-accent` como tipo unitario; enfoque guiado por propiedades.
- **Localizador:** abstract; introducción sobre property-driven typology; conclusión tipológica; pp. 213–238.
- **Acceso:** copia académica abierta alojada por UC Berkeley.
- **Limitación:** discusión tipológica/teórica; no sustituye descripciones específicas de japonés ni de otros sistemas particulares.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_MODEL_REFERENCE.

## 20. Resultado del registro v0.9

El registro contiene **48 fuentes** numeradas SND-SRC-0001 a SND-SRC-0048.


### SND-SRC-0049 — UNGEGN / Romanization Systems

- **Tier:** A.
- **Institución:** United Nations Group of Experts on Geographical Names (UNGEGN).
- **Título:** *Romanization Systems*.
- **URL:** https://unstats.un.org/unsd/ungegn/romanization/
- **Cobertura:** romanización de escrituras no romanas al alfabeto romano; principios y proceso de adopción UNGEGN para nombres geográficos.
- **Localizador:** párrafo definitorio inicial y requisitos de adopción, incluido el grado aceptable de reversibilidad.
- **Limitación:** mandato centrado en nombres geográficos; sus requisitos institucionales no son propiedades universales de toda romanización.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_INSTITUTIONAL.

### SND-SRC-0050 — Unicode CLDR / Transliteration Guidelines

- **Tier:** A/B técnico-institucional.
- **Institución:** Unicode Consortium, Common Locale Data Repository.
- **Título:** *Unicode Transliteration Guidelines*.
- **URL:** https://cldr.unicode.org/index/cldr-spec/transliteration-guidelines
- **Cobertura:** diseño y uso de transliteradores; conversión entre scripts; reversibilidad y excepciones; distinción respecto de traducción.
- **Localizador:** Introduction; principios de diseño; secciones sobre reversibility/ambiguity y available transliterations.
- **Limitación:** CLDR usa una terminología operativa propia y amplia; no debe presentarse como la única definición lingüística posible de “transliteración”.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_TECHNICAL_REFERENCE.

## 21. Resultado del registro v0.10

El registro contiene **50 fuentes** numeradas SND-SRC-0001 a SND-SRC-0050.


### SND-SRC-0051 — Comparación interlingüística / /p/ y VOT

- **Tier:** B.
- **APA 7:** Lee, S. A. S., & Iverson, G. K. (2017). The emergence of phonetic categories in Korean–English bilingual children. *Journal of Child Language, 44*(6), 1485–1515. https://doi.org/10.1017/S0305000916000659
- **Cobertura usada por MLS-SND:** control metodológico para distinguir una categoría/símbolo fonémico compartido de su implementación fonética. La introducción usa español e inglés /p/ como ejemplo y señala valores de VOT diferentes.
- **Localizador:** introducción, pasaje inmediatamente posterior a la definición de *phonetic category formation* que ejemplifica Spanish/English /p/ y VOT.
- **Limitación:** el artículo trata adquisición bilingüe coreano–inglés; el ejemplo español/inglés se usa únicamente como control metodológico, no como descripción completa de ninguna variedad de español o inglés.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_FOR_COMPARATIVE_METHOD.

### SND-SRC-0052 — Comparación interlingüística / vocales altas centrales

- **Tier:** B.
- **APA 7:** Cavar, M. E., Rudman, E. M., Nagaraj, N., & Peters, L. (2025). High central vowels in Polish, Ukrainian and Russian. *Journal of the International Phonetic Association, 55*(1–2), 1–34. https://doi.org/10.1017/S0025100325000040
- **Cobertura usada por MLS-SND:** control metodológico para mostrar que una misma notación amplia /ɨ/ puede facilitar una comparación mientras las realizaciones articulatorias siguen siendo objeto de investigación y pueden diferir entre lenguas.
- **Localizadores:** §1, especialmente la discusión sobre el uso de /ɨ/ para presentación y el objetivo de comprobar las realizaciones físicas; sección de resultados/discusión y conclusiones para diferencias articulatorias.
- **Acceso:** Open Access, CC BY 4.0.
- **Limitación:** estudio específico de polaco, ucraniano y ruso; no autoriza a generalizar sobre cualquier uso de /ɨ/ ni sobre cualquier símbolo IPA compartido.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_FOR_COMPARATIVE_METHOD.

## 22. Resultado del registro v0.11

El registro contiene **52 fuentes canónicas** numeradas SND-SRC-0001 a SND-SRC-0052.

SND-SRC-0051 y SND-SRC-0052 se incorporan para fortalecer CMP-001 con controles empíricos independientes sin convertir ejemplos comparativos en descripciones generales de las variedades implicadas.
