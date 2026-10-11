# MLS-SND Source Registry

Estado: **registro operativo v0.20**. Este archivo registra fuentes admisibles y su alcance. La presencia de una fuente aquí **no valida por sí sola una entrada**.

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
- **APA 7:** Ladefoged, P. (1999). American English. En International Phonetic Association (Ed.), *Handbook of the International Phonetic Association: A guide to the use of the International Phonetic Alphabet* (pp. 41–44). Cambridge University Press.
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
- **APA 7:** Projeto NURC-RJ. (s. f.). *Projeto NURC-RJ*. Faculdade de Letras, Universidade Federal do Rio de Janeiro. https://nurcrj.letras.ufrj.br/
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
- **APA 7:** National Institute of Korean Language. (s. f.). *표준 발음법* [Standard Pronunciation Rules]. https://www.korean.go.kr/front/page/pageView.do?mn_id=94&page_id=P000097
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
- **APA 7:** United Nations Group of Experts on Geographical Names. (s. f.). *Romanization Systems*. United Nations Statistics Division. https://unstats.un.org/unsd/ungegn/romanization/
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
- **APA 7:** Unicode Consortium. (s. f.). *Unicode Transliteration Guidelines*. Common Locale Data Repository. https://cldr.unicode.org/index/cldr-spec/transliteration-guidelines
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


### SND-SRC-0053 — Español guatemalteco–k’ichee’ / espacios vocálicos

- **Tier:** B.
- **APA 7:** Baird, B. O. (2020). The vowel spaces of Spanish-K’ichee’ bilinguals. En R. Rao (Ed.), *Spanish Phonetics and Phonology in Contact: Studies from Africa, the Americas, and Spain* (pp. 63–82). John Benjamins. https://doi.org/10.1075/ihll.28.03bai
- **Idioma/variedad:** español guatemalteco monolingüe y español–k’ichee’ bilingüe de dos variedades de k’ichee’, según el abstract.
- **Cobertura admitida con acceso actual:** análisis acústico de espacios vocálicos; diferencia reportada entre espacios vocálicos del español de grupos bilingües y monolingües; mantenimiento de diferencias translingüísticas en vocales medias por los bilingües.
- **Localizador:** abstract del capítulo publicado por John Benjamins.
- **Acceso verificado:** metadatos y abstract públicos; texto completo no utilizado para claims no visibles.
- **Limitación crítica:** la evidencia de contacto no se generaliza a todo el español de Guatemala; no usar esta fuente, sin texto completo comprobado, para valores formánticos, tamaños de muestra o resultados internos más específicos.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_ABSTRACT_SCOPE_ONLY.

## Resultado del registro tras SND-SRC-0053

El registro contiene **53 fuentes canónicas** hasta SND-SRC-0053.


### SND-SRC-0054 — Español K’iche’–español / /f/ y contacto

- **Tier:** B.
- **APA 7:** Baird, B., & Regan, B. (2025). The status of /f/ in Mayan-accented Spanish. *Studies in Hispanic and Lusophone Linguistics, 18*(1), 1–35. https://doi.org/10.1515/shll-2025-2001
- **Idioma/variedad:** español de bilingües K’iche’–español dentro del estudio.
- **Cobertura:** 1,430 tokens de /f/ de 40 bilingües; [f], lenición [h], fortición [p]; dominancia lingüística, educación, contexto fonético, contacto y *enregisterment*.
- **Localizadores:** Abstract; §1 Introduction; §6 Conclusions.
- **Acceso:** Open Access; CC BY 4.0 según el editor.
- **Limitación:** población bilingüe y fenómeno /f/; no representa automáticamente todo el español de Guatemala.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_CONTACT_SCOPE.

### SND-SRC-0055 — RAE/ASALE / Ortografía 2010

- **Tier:** A.
- **APA 7:** Real Academia Española & Asociación de Academias de la Lengua Española. (2010). *Ortografía de la lengua española*. Espasa. https://www.asale.org/obras-y-proyectos/ortografia/ortografia-2010
- **Idioma/variedad:** español panhispánico; sistema ortográfico.
- **Cobertura:** objetivo y descripción institucional del sistema ortográfico y de las normas de escritura.
- **Localizador:** ficha oficial “Ortografía 2010”, descripción del objetivo y características.
- **Limitación:** fuente ortográfica/normativa; no es descripción fonética específica de Guatemala.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_INSTITUTIONAL.

### SND-SRC-0056 — RAE/ASALE / Ortografía básica §2.4.2

- **Tier:** A.
- **APA 7:** Real Academia Española & Asociación de Academias de la Lengua Española. (2012). *Ortografía básica de la lengua española*. Espasa. Versión en línea, §2.4.2 “La acentuación gráfica de las palabras con secuencias vocálicas”.
- **URL:** https://www.rae.es/ortografía-básica/uso-de-la-tilde/las-reglas-de-acentuación-gráfica/la-acentuación-gráfica-de-las-palabras-con-secuencias-vocálicas
- **Idioma/variedad:** español panhispánico.
- **Cobertura:** variación de hiato/diptongo/triptongo y convención ortográfica para acentuación gráfica independiente de la articulación real.
- **Localizador:** §2.4.2, párrafos introductorios y párrafo que comienza “Por todo ello…”.
- **Limitación:** convención ortográfica panhispánica; no describe específicamente la pronunciación guatemalteca.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_INSTITUTIONAL.

## 24. Resultado del registro v0.13

El registro contiene **56 fuentes canónicas** numeradas SND-SRC-0001 a SND-SRC-0056.


### SND-SRC-0057 — Español de Guatemala / aspiración de oclusivas sordas

- **Tier:** B.
- **APA 7:** McKinnon, S. (2020). Un análisis sociofonético de la aspiración de las oclusivas sordas en el español guatemalteco monolingüe y bilingüe (español-kaqchikel). *Spanish in Context, 17*(1), 1–29. https://doi.org/10.1075/sic.00051.mck
- **URL editorial:** https://www.benjamins.com/catalog/sic.00051.mck
- **Idioma/variedad:** español guatemalteco en comunidades monolingües y bilingües español–kaqchikel dentro de la muestra del estudio.
- **Cobertura admitida con acceso actual:** aspiración/VOT de oclusivas sordas; comparación de factores lingüísticos y extralingüísticos entre comunidades monolingües y bilingües; el resumen reporta VOT más largo que en variedades sin contacto y señala indicios, no confirmación definitiva, de efectos de contacto.
- **Localizadores disponibles:** Abstract; estructura del artículo (§1 Introducción; §3 Metodología; §4 Resultados; §5 Discusión y conclusión); pp. 1–29.
- **Acceso verificado:** metadatos, resumen y estructura públicos en John Benjamins; texto completo requiere autorización en la plataforma editorial.
- **Limitación crítica:** no usar sin texto completo comprobado para valores numéricos, efectos estadísticos detallados o generalizaciones que excedan el resumen. El propio resumen indica que se requieren investigaciones futuras para confirmar definitivamente los efectos del contacto.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_ABSTRACT_SCOPE_ONLY / FULLTEXT_REQUIRED_FOR_SPECIFIC_CLAIMS.

### SND-SRC-0058 — Español guatemalteco / prosodia y entonación en contacto

- **Tier:** B.
- **APA 7:** Congosto Martín, Y. (2020). Guatemalan Spanish in contact: Prosody and intonation / El español guatemalteco en contacto: prosodia y entonación. *Estudios de Fonética Experimental, 29*, 153–194.
- **Registro bibliográfico:** https://raco.cat/index.php/EFE/article/view/375462
- **Copia institucional:** https://idus.us.es/bitstreams/7186befa-3743-49b1-9816-09206104806d/download
- **Idioma/variedad:** español guatemalteco; comparación entre hablantes guatemaltecos en Guatemala y hablantes guatemaltecos residentes en Los Ángeles dentro del diseño del estudio.
- **Cobertura:** prosodia y entonación; proyecto Geoprosodic; metodología vinculada a AMPER; declarativas e interrogativas absolutas con estructura SVO del corpus analizado.
- **Localizadores:** pp. 153–194; resumen/abstract para objetivo y alcance; sección metodológica para el diseño AMPER y delimitación de enunciados; tablas/figuras y conclusiones solo cuando un claim las cite explícitamente.
- **Acceso verificado:** registro institucional de Universidad de Sevilla y texto accesible mediante repositorios académicos; referencia confirmada también en bibliografía de ASALE.
- **Limitación crítica:** el estudio declara un alcance circunscrito a entonación femenina y a tipos de enunciados concretos; no debe presentarse como descripción exhaustiva de toda la prosodia guatemalteca ni extrapolarse a todos los hablantes.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_SCOPE_WARNING.

## 25. Resultado del registro v0.14

El registro contiene **58 fuentes canónicas** numeradas SND-SRC-0001 a SND-SRC-0058.

SND-SRC-0057 y SND-SRC-0058 se incorporan para resolver fuentes locales históricas del mapa es-GT sin promover automáticamente ninguna entrada. Sus alcances permanecen separados: sociofonética segmental/aspiración en el primer caso y prosodia/entonación de diseño acotado en el segundo.


## 26. Canonicalización japonesa: escritura y pronunciación

### SND-SRC-0059 — Japonés / 現代仮名遣い (Modern Kana Usage)

- **Tier:** A.
- **Institución:** 文化庁 [Agency for Cultural Affairs], Government of Japan.
- **APA 7:** 文化庁 [Agency for Cultural Affairs]. (s. f.). *現代仮名遣い* [Modern Kana Usage]. https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/gendaikana/index.html
- **Instrumento reproducido:** Cabinet Notice No. 1 (1986), con modificación institucional de 2010.
- **Idioma/alcance:** japonés; ortografía kana moderna de uso social general.
- **Cobertura:** principio fonológico de la ortografía, excepciones convencionales, partículas を/は/へ, determinadas grafías ぢ/づ y convenciones de vocales largas.
- **Localizador:** 前書き, especialmente puntos 1 y 6; 本文 第2, apartados sobre excepciones y vocales largas; 付記.
- **Acceso:** gratuito en sitio oficial.
- **Limitación:** norma ortográfica; no decide toda variación de pronunciación y no constituye transcripción fonética IPA.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_NORMATIVE.

### SND-SRC-0060 — Japonés / 外来語の表記 (Orthography of Loanwords)

- **Tier:** A.
- **Institución:** 文化庁 [Agency for Cultural Affairs], Government of Japan.
- **APA 7:** 文化庁 [Agency for Cultural Affairs]. (s. f.). *外来語の表記* [Orthography of Loanwords]. https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/gairai/index.html
- **Instrumento reproducido:** Cabinet Notice No. 2 (1991).
- **Idioma/alcance:** japonés; escritura en katakana de préstamos y nombres extranjeros.
- **Cobertura:** tablas de kana para préstamos, formas de uso general, formas que buscan aproximarse más al sonido/grafía de origen y límites de regulación.
- **Localizador:** 前書き; 留意事項その1; 仮名と符号の表; 留意事項その2.
- **Acceso:** gratuito en sitio oficial.
- **Limitación:** política ortográfica/adaptativa; no representa de manera exhaustiva la fonética del idioma de origen ni regula todos los sonidos especiales.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_NORMATIVE.

### SND-SRC-0061 — Japonés / 常用漢字表 (Jōyō Kanji Table)

- **Tier:** A.
- **Institución:** Government of Japan / 文化庁 [Agency for Cultural Affairs].
- **APA 7:** Government of Japan. (2010). *常用漢字表* [Jōyō Kanji Table] (Cabinet Notice No. 2, November 30, 2010). https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/kanji/
- **Idioma/alcance:** japonés escrito; guía de uso general de kanji en la vida social moderna.
- **Cobertura:** caracteres, formas, 音訓, ejemplos y límites de alcance; incluye 2,136 caracteres en la tabla vigente.
- **Localizador:** 内閣告示; 前書き; 表の見方及び使い方; 本表/付表.
- **Acceso:** gratuito en sitio oficial.
- **Limitación:** guía de uso general, no diccionario exhaustivo de todas las lecturas; los nombres propios quedan en general fuera del alcance salvo excepciones institucionales indicadas.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_NORMATIVE.

### SND-SRC-0062 — Japonés / 常用漢字表の音訓索引

- **Tier:** A.
- **Institución:** 文化庁 [Agency for Cultural Affairs], Government of Japan.
- **APA 7:** 文化庁 [Agency for Cultural Affairs]. (s. f.). *常用漢字表の音訓索引* [On/Kun Reading Index of the Jōyō Kanji Table]. https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/kanji/joyokanjisakuin/index.html
- **Idioma/alcance:** japonés; índice oficial de 音/訓 y ejemplos léxicos de la tabla Jōyō.
- **Cobertura:** búsqueda por 音 en katakana, 訓 en hiragana, múltiples lecturas y ejemplos por carácter.
- **Localizador:** introducción; 音・訓検索; fila/registro individual del carácter citado.
- **Acceso:** gratuito en sitio oficial.
- **Limitación:** índice de la tabla Jōyō; no agota lecturas de nombres propios, usos no incluidos ni información de acento tonal/fonética estrecha.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_NORMATIVE.

## 27. Resultado del registro v0.15

El registro contiene **62 fuentes canónicas** numeradas SND-SRC-0001 a SND-SRC-0062.

Mapeo de IDs locales resuelto en esta wave:

- `JA-W3-S01` → `SND-SRC-0059`;
- `JA-W3-S02` → `SND-SRC-0060`;
- `JA-W3-S03` → `SND-SRC-0061`;
- `JA-W3-S04` → `SND-SRC-0062`.

La canonicalización mantiene separados kana, katakana de préstamos, kanji y lecturas; ninguno de estos sistemas se trata como IPA ni como transcripción fonética exhaustiva.


## 28. Canonicalización en-US: variación, reducción, corpus y acento

### SND-SRC-0063 — American English / six regional vowel systems

- **Tier:** B.
- **APA 7:** Clopper, C. G., Pisoni, D. B., & de Jong, K. (2005). Acoustic characteristics of the vowel systems of six regional varieties of American English. *The Journal of the Acoustical Society of America, 118*(3), 1661–1676. https://doi.org/10.1121/1.2000774
- **Idioma/alcance:** American English; seis regiones de Estados Unidos.
- **Cobertura:** duración, F1/F2 y variación regional de sistemas vocálicos; 48 hablantes, ocho por región.
- **Localizadores:** Abstract; §I Introduction; §II.A “Talkers”; resultados/discusión, pp. 1661–1676.
- **Acceso:** texto completo abierto en PubMed Central (PMCID PMC3432912).
- **Limitación:** muestra joven y regionalmente balanceada; no agota variación social/étnica/generacional ni autoriza un único inventario nacional.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0064 — American English / schwa, duración y posición acústica

- **Tier:** B.
- **APA 7:** Cohen Priva, U., & Strand, E. (2023). Schwa’s duration and acoustic position in American English. *Journal of Phonetics, 96*, 101198. https://doi.org/10.1016/j.wocn.2022.101198
- **Idioma/alcance:** American English; habla espontánea del Buckeye Corpus.
- **Cobertura:** duración, contexto acústico, schwa, vocales breves, neutralización/asimilación.
- **Localizadores:** Abstract; Highlights; secciones de métodos/resultados del artículo cuando un claim exceda el resumen.
- **Acceso:** open access; versión aceptada del autor disponible desde la página del autor.
- **Limitación:** fenómeno acústico específico; no constituye una teoría completa de reducción vocálica ni una muestra nacional.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0065 — American English / tempo, stress y reducción vocálica

- **Tier:** B.
- **APA 7:** Fourakis, M. (1991). Tempo, stress, and vowel reduction in American English. *The Journal of the Acoustical Society of America, 90*(4), 1816–1827. https://doi.org/10.1121/1.401662
- **Idioma/alcance:** American English; experimento controlado con ocho hablantes.
- **Cobertura:** reducción fonológica/fonética en el marco del estudio; efectos de stress y tempo sobre duración y espacio vocálico.
- **Localizadores:** Abstract; pp. 1816–1827; para claims finos usar sección/página del texto completo.
- **Acceso:** metadatos y abstract verificables en PubMed.
- **Limitación:** estudio experimental de 1991, muestra pequeña y contextos controlados; no generalizar sus magnitudes a toda habla estadounidense.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_ACCESS_WARNING.

### SND-SRC-0066 — Buckeye / artículo metodológico

- **Tier:** B.
- **APA 7:** Pitt, M. A., Johnson, K., Hume, E., Kiesling, S., & Raymond, W. (2005). The Buckeye corpus of conversational speech: Labeling conventions and a test of transcriber reliability. *Speech Communication, 45*(1), 89–95. https://doi.org/10.1016/j.specom.2004.09.001
- **Idioma/alcance:** American English; Central Ohio / Columbus.
- **Cobertura:** diseño del corpus, 40 hablantes, aproximadamente 307,000 palabras, transcripción y etiquetado fonémico.
- **Localizadores:** Abstract; “Corpus creation”; “Corpus transcription and labeling”; “Corpus availability”.
- **Acceso:** página del publisher y documentación del Buckeye Corpus.
- **Limitación:** muestra regional y demográficamente delimitada; no representa automáticamente Estados Unidos.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0067 — Buckeye Corpus of Conversational Speech, 2nd release

- **Tier:** A/B — corpus institucional.
- **APA 7:** Pitt, M. A., Dilley, L., Johnson, K., Kiesling, S., Raymond, W., Hume, E., & Fosler-Lussier, E. (2007). *Buckeye Corpus of Conversational Speech* (2nd release). Department of Psychology, The Ohio State University. https://buckeyecorpus.osu.edu/
- **Idioma/alcance:** American English; 40 hablantes de Columbus, Ohio.
- **Cobertura:** grabaciones de conversación espontánea, transcripción ortográfica, etiquetas fonéticas y alineación temporal.
- **Localizadores:** sitio oficial “The Buckeye Speech Corpus”; página “Publications”; token/archivo/intervalo cuando se cite un ejemplo de corpus.
- **Acceso:** gratuito para usos no comerciales sujeto a las condiciones del proyecto.
- **Limitación:** corpus regional; cada ejemplo debe conservar procedencia y metadatos relevantes.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_CORPUS.

### SND-SRC-0068 — American English / organización temporal regional

- **Tier:** B.
- **APA 7:** Clopper, C. G., & Smiljanic, R. (2015). Regional variation in temporal organization in American English. *Journal of Phonetics, 49*, 1–15. https://doi.org/10.1016/j.wocn.2014.10.002
- **Idioma/alcance:** American English; seis dialectos regionales en el diseño del estudio.
- **Cobertura:** articulation rate, pausas y variabilidad de duración consonántica/vocálica.
- **Localizadores:** Abstract; Highlights; Discussion/Conclusions; pp. 1–15.
- **Acceso:** abstract y partes del artículo disponibles en ScienceDirect; material de proyecto también disponible en Ohio State.
- **Limitación:** las diferencias reportadas pertenecen al diseño/muestra; no convertirlas en estereotipos categóricos regionales.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_ACCESS_WARNING.

### SND-SRC-0069 — American English / prosodia Southern vs. Midland

- **Tier:** B.
- **APA 7:** Clopper, C. G., & Smiljanic, R. (2011). Effects of gender and regional dialect on prosodic patterns in American English. *Journal of Phonetics, 39*(2), 237–245. https://doi.org/10.1016/j.wocn.2011.02.006
- **Idioma/alcance:** American English; variedades Southern y Midland, habla leída.
- **Cobertura:** speaking rate, pausas, pitch accents, tonos de frontera y efectos de género.
- **Localizadores:** Abstract; §1.0 Introduction; §4.0 Discussion; §5.0 Conclusions; pp. 237–245.
- **Acceso:** texto completo abierto en PubMed Central (PMCID PMC3113495).
- **Limitación:** dos regiones y habla leída; no constituye una gramática entonativa nacional.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED.

### SND-SRC-0070 — American English / manual abierto de fonética y word stress

- **Tier:** B/D — manual universitario abierto.
- **APA 7:** Broeders, T., & Gussenhoven, C. (s. f.). *An Introduction to American English Phonetics: A Theoretical Guide to American English Pronunciation* (N. Verberkt, Ed.). Radboud University / Open Textbook Platform. https://opentextbooks.rug.nl/americanenglishphonetics2/
- **Idioma/alcance:** modelo pedagógico de American English; el propio manual utiliza GA como referencia.
- **Cobertura:** spelling/pronunciation, segmentos y capítulo 3 sobre word stress: homógrafos, derivados, múltiples acentos, compuestos y stress shift.
- **Localizadores:** tabla de contenidos; cap. 3 “Word stress”; §§3.1–3.8.
- **Acceso:** gratuito.
- **Licencia:** CC BY-NC-SA 4.0 indicada por el libro.
- **Limitación:** recurso pedagógico y variedad-modelo; MLS-SND no adopta GA como pronunciación estadounidense homogénea.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_FOR_PEDAGOGICAL_FRAME.

### SND-SRC-0071 — CMU Pronouncing Dictionary

- **Tier:** A/C — recurso lexicográfico/técnico institucional.
- **APA 7:** Carnegie Mellon University Speech Group. (s. f.). *CMUdict: Carnegie Mellon Pronouncing Dictionary*. https://github.com/cmusphinx/cmudict
- **Idioma/alcance:** inglés; pronunciaciones usadas en tecnología del habla, mantenidas por el Speech Group de Carnegie Mellon University.
- **Cobertura:** entradas léxicas y pronunciaciones en el phoneset CMU/Arpabet.
- **Localizadores:** README del repositorio; entrada concreta en `cmudict.dict`.
- **Acceso:** repositorio público; README declara uso irrestricto con reconocimiento de origen.
- **Limitación:** el propio README advierte errores, omisiones e inconsistencias; no usar como autoridad única para generalizaciones fonológicas.
- **Verificado:** 2026-10-11 contra `cmusphinx/cmudict` README.
- **Estado:** ADMITTED_LEXICOGRAPHIC.

### SND-SRC-0072 — cmudict-tools / formato y marcadores de stress

- **Tier:** C/D — documentación técnica complementaria.
- **APA 7:** Dunn, R. H. (2015–). *CMU Pronunciation Dictionary Tools*. https://github.com/cmusphinx/cmudict-tools
- **Idioma/alcance:** formato CMUdict y phonesets; configuración en-US.
- **Cobertura:** formato de entradas, phones, variantes y marcadores de stress vocálico.
- **Localizador:** README → “CMU Pronunciation Dictionary File Format”: `0` unstressed, `1` primary stress, `2` secondary stress.
- **Acceso:** repositorio público.
- **Licencia:** GPL-3.0-or-later según README.
- **Limitación:** documentación de herramientas/formato, no fuente fonológica general del inglés.
- **Verificado:** 2026-10-11 contra `cmusphinx/cmudict-tools` README.
- **Estado:** ADMITTED_TECHNICAL.

## 29. Resultado del registro v0.16

En esta cadena apilada, el registro contiene **72 fuentes canónicas** numeradas SND-SRC-0001 a SND-SRC-0072.

Mapeo local propuesto/resuelto por esta wave:

- `ENUS-CAND-002` → `SND-SRC-0063`;
- `ENUS-W2-S01` → `SND-SRC-0064`;
- `ENUS-W2-S02` → `SND-SRC-0065`;
- `ENUS-CAND-006` → `SND-SRC-0066` (artículo) + `SND-SRC-0067` (corpus), según el claim;
- `ENUS-CAND-005` → `SND-SRC-0068`;
- `ENUS-CAND-004` → `SND-SRC-0069`;
- `ENUS-CAND-008` → `SND-SRC-0070`;
- `ENUS-CAND-009` → `SND-SRC-0071` (diccionario) + `SND-SRC-0072` (formato/stress markers).

No se canonicalizan en esta wave ENUS-CAND-001/003/007 porque no son necesarios para el núcleo que se integrará a continuación.


## 30. Canonicalización italiana: variación y acento

### SND-SRC-0073 — Italiano / Standard Italian vs. Florence, Milan and Rome

- **Tier:** B.
- **APA 7:** Bertinetto, P. M., & Loporcaro, M. (2005). The sound pattern of Standard Italian, as compared with the varieties spoken in Florence, Milan and Rome. *Journal of the International Phonetic Association, 35*(2), 131–151. https://doi.org/10.1017/S0025100305002148
- **Idioma/variedad:** Standard Italian (SI), Florence Italian (FI), Milan Italian (MI), Rome Italian (RI).
- **Cobertura:** comparación segmental/prosódica de SI y tres variedades regionales prestigiosas; vocales medias, consonantes, geminación, procesos y variación.
- **Localizador:** pp. 131–151; introducción pp. 131–132 para alcance; p. 137 para distribución de vocales medias; otras secciones por fenómeno.
- **Acceso:** versión publicada y post-print disponibles en repositorio de Scuola Normale Superiore.
- **Limitación:** FI/MI/RI son comparadores documentados, no un inventario exhaustivo de la diversidad regional italiana.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_SCOPE_WARNING.

### SND-SRC-0074 — Italiano / acento léxico (Treccani)

- **Tier:** B/C, referencia académica institucional.
- **APA 7:** Gili Fivela, B. (2010). Accento. En *Enciclopedia dell’Italiano*. Treccani. https://www.treccani.it/enciclopedia/accento_%28Enciclopedia-dell%27Italiano%29/
- **Idioma/variedad:** italiano; síntesis general del sistema de acento.
- **Cobertura:** acento léxico, posición libre/móvil, función distintiva, correlatos fonéticos, distribución y morfofonología.
- **Localizador:** “Definizione”; “Principali correlati fonetici”; “L’accento in italiano”; sección morfofonológica.
- **Acceso:** gratuito en Treccani.
- **Limitación:** obra enciclopédica de síntesis; no sustituye estudios experimentales para medidas acústicas ni resuelve por sí sola todos los análisis métricos.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_AS_REFERENCE.

### SND-SRC-0075 — Italiano / acento principal y duración vocálica

- **Tier:** B.
- **APA 7:** D’Imperio, M., & Rosenthall, S. (1999). Phonetics and phonology of main stress in Italian. *Phonology, 16*(1), 1–28. https://doi.org/10.1017/S0952675799003681
- **Idioma/variedad:** italiano estándar y variedades regionales dentro del alcance del artículo.
- **Cobertura:** relación entre acento principal, estructura silábica, posición y duración vocálica.
- **Localizador:** Abstract; pp. 1–28 para claims que requieran detalle adicional.
- **Acceso:** metadatos y abstract abiertos en Cambridge Core.
- **Limitación:** no convertir la duración de vocal tónica en contraste fonémico de longitud; la propia fuente distingue duración fonética y análisis fonológico.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_ABSTRACT_SCOPE.

## 31. Resultado del registro v0.17

El registro contiene **75 fuentes canónicas** numeradas SND-SRC-0001 a SND-SRC-0075.

Mapeo local resuelto:

- `IT-PROP-CORE-001` → `SND-SRC-0073`;
- `IT-W02-S01` → `SND-SRC-0074`;
- `IT-W02-S02` → `SND-SRC-0075`.

Esta numeración sustituye la reserva italiana provisional 0061–0063, cedida a las waves upstream ya integradas al detectarse la colisión antes de integración.


## 32. Canonicalización japonesa: consonantes y realizaciones

### SND-SRC-0076 — Japonés / /r/ y /d/: articulación, duración y contacto

- **Tier:** B — evidencia institucional contemporánea con datos articulatorios y corpus.
- **APA 7:** Maekawa, K. (2026, July 27). *子供がラ行とダ行を区別できないのはなぜですか* [Why do children confuse the Japanese r-row and d-row?]. ことば研究館, National Institute for Japanese Language and Linguistics. https://kotoba.ninjal.ac.jp/qa/yokuaru/qa-246/
- **Idioma/variedad:** japonés estándar; muestras articulatorias de hablantes de Tokio y análisis de /r/ y /d/ en el Corpus of Spontaneous Japanese.
- **Cobertura:** semejanza y diferencias articulatorias de /r/ y /d/; duración; lugar de contacto; variación contextual de /r/.
- **Localizadores:** 「調音運動の分析」; 「持続時間の分析」; 「接触位置」; 「母音の影響」; 「まとめ」.
- **Acceso:** FREE_TO_READ; página institucional completa verificada.
- **Licencia/reutilización:** UNKNOWN; acceso gratuito no se interpreta como licencia abierta. MLS-SND usa paráfrasis y no redistribuye video/figuras.
- **Limitación:** no es un inventario consonántico completo; parte de la explicación de la variación de contacto se presenta como hipótesis.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_INSTITUTIONAL_WITH_SCOPE.

### SND-SRC-0077 — Japonés / alternancias p~h~b en contadores

- **Tier:** B/C — explicación académica institucional de morfofonología e historia fonológica.
- **APA 7:** Kubozono, H. (2024, November 27). *「匹」に「ひき」「びき」「ぴき」の読み方があるのはなぜですか* [Why does the counter 匹 have the readings hiki, biki and piki?]. ことば研究館, National Institute for Japanese Language and Linguistics. https://kotoba.ninjal.ac.jp/qa/yokuaru/qa-225/
- **Idioma/variedad:** japonés contemporáneo con explicación histórica.
- **Cobertura:** alternancias /p ~ h ~ b/ en contadores; condicionamiento por numeral y sokuon; relación con cambio histórico de la serie ハ.
- **Localizadores:** 「匹はハ行音で始まる助数詞」; 「ハ行音の特殊性」 y desarrollo posterior.
- **Acceso:** FREE_TO_READ; página institucional completa verificada.
- **Licencia/reutilización:** UNKNOWN; se usa paráfrasis, sin reproducir tablas/figuras.
- **Limitación:** caso morfofonológico específico; no generalizar a todo /h/, /p/ o /b/ del japonés.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_INSTITUTIONAL_WITH_SCOPE.

### SND-SRC-0078 — Japonés / etiquetado segmental del Corpus of Spontaneous Japanese

- **Tier:** B — documentación institucional primaria de corpus.
- **APA 7:** Maekawa, K., Kikuchi, H., Fujimoto, M., & Yoneyama, S. (s. f.). *『日本語話し言葉コーパス』の分節音ラベリング* [Segmental labeling of the Corpus of Spontaneous Japanese] (Version 1.0). National Institute for Japanese Language and Linguistics. https://www2.ninjal.ac.jp/kikuo/segment.pdf
- **Idioma/variedad:** japonés hablado representado en el Corpus of Spontaneous Japanese (CSJ).
- **Cobertura:** política de segmentación; etiquetas consonánticas/vocálicas; variantes fonéticas anotables; relación con mora.
- **Localizadores:** p. 2, §§1–3; p. 3, Tabla 2; p. 11, apéndice mora ↔ etiquetas cuando sea pertinente.
- **Cobertura del material etiquetado:** aproximadamente 500.000 palabras / 44 horas según el manual.
- **Acceso:** FREE_TO_READ; PDF institucional.
- **Licencia/reutilización:** UNKNOWN; el PDF no se redistribuye y la tabla no se reutiliza como arte editorial.
- **Limitación:** esquema de anotación intermedio entre transcripción amplia y estrecha, no inventario fonológico definitivo; algunas etiquetas definidas no se usan actualmente en CSJ.
- **Verificado:** 2026-10-11; pp. 2–3 inspeccionadas visualmente.
- **Estado:** ADMITTED_CORPUS_DOCUMENTATION.

### SND-SRC-0079 — Japonés / panorama fonético-fonológico e inventario consonántico

- **Tier:** B — handbook académico de referencia.
- **APA 7:** Kubozono, H. (2015). Introduction to Japanese phonetics and phonology. In H. Kubozono (Ed.), *Handbook of Japanese Phonetics and Phonology* (pp. 1–40). De Gruyter Mouton. https://doi.org/10.1515/9781614511984.1
- **Idioma/alcance:** japonés moderno; panorama fonético y fonológico.
- **Cobertura usada por MLS-SND:** inventario consonántico de referencia; alofonía de /s t h/; estratos léxicos; expansión de combinaciones consonante-vocal en préstamos.
- **Localizadores verificados:** pp. impresas 6–9; §3 “Consonant inventory”; §3.1 “Phonemes and allophones”; Tabla 1; §3.2; inicio de §3.3.
- **Acceso:** FREE_TO_READ para el preview PDF oficial verificado; no se asume acceso abierto al libro completo.
- **Licencia/reutilización:** UNKNOWN; se usa paráfrasis del fragmento verificado.
- **Limitación:** Tabla 1 es baseline fonémico de referencia adaptado de Shibatani (1990); el propio capítulo documenta mayor complejidad alofónica y por estratos léxicos. No usar como lista superficial exhaustiva.
- **Verificado:** 2026-10-11; pp. impresas 6–9 inspeccionadas visualmente.
- **Estado:** ADMITTED_WITH_SECTION_VERIFICATION.

## 33. Resultado del registro v0.18

El registro contiene **79 fuentes canónicas** numeradas SND-SRC-0001 a SND-SRC-0079.

Mapeo local resuelto:

- `JA-W04-S01` → `SND-SRC-0076`;
- `JA-W04-S02` → `SND-SRC-0077`;
- `JA-W04-S03` → `SND-SRC-0078`;
- `JA-W04-S04` → `SND-SRC-0079`.

La canonicalización resuelve identidad bibliográfica y localizadores; no promueve por sí sola SND-JA-004 más allá de SOURCE_MAPPED.



## 34. Canonicalización zh-TW: romanización latina

### SND-SRC-0080 — Taiwan MOE / Revised Mandarin Chinese Dictionary

- **Tier:** A — recurso lexicográfico institucional.
- **APA 7:** Ministry of Education, R.O.C. (Taiwan). (2021–). *Revised Mandarin Chinese Dictionary, Taiwan Academic Network Version 6*. https://dict.revised.moe.edu.tw/
- **Idioma/alcance:** mandarín; recurso institucional taiwanés de consulta lexicográfica.
- **Cobertura usada por MLS-SND:** coexistencia operativa de Bopomofo/Zhuyin y Hanyu Pinyin como capas separadas de búsqueda y visualización de pronunciación.
- **Localizadores verificados:** Basic Search (campo de búsqueda + Bopomofo Keypad + Hanyu Pinyin Keypad); entradas 博 y 模, campos “Bopomofo” y “Hanyu Pinyin”.
- **Acceso:** FREE_TO_READ en el sitio oficial.
- **Licencia/reutilización:** no se asume licencia abierta; MLS-SND usa paráfrasis y metadatos, no redistribuye contenido del diccionario.
- **Limitación:** demuestra que Hanyu Pinyin funciona como capa latina institucional de consulta en este recurso; no prueba que sea la única romanización histórica de Taiwán, una transcripción fonética exhaustiva ni una obligación para todos los materiales del MLS.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_INSTITUTIONAL.

## 35. Resultado del registro v0.19

El registro contiene **80 fuentes canónicas** numeradas SND-SRC-0001 a SND-SRC-0080.

Mapeo local resuelto:

- `ZHTW-ROM-S01` → `SND-SRC-0080`.

La canonicalización resuelve identidad bibliográfica y localizadores. La política global de romanización del MLS permanece como decisión editorial separada.


## 36. Canonicalización pt-BR/rio: variación segmental, vocalismo y prosodia

### SND-SRC-0081 — Português carioca / /S/ pós-vocálico em Copacabana

- **Tier:** B — trabalho acadêmico institucional aberto.
- **APA 7:** Nanini, R. F. (2022). *O /S/ pós-vocálico na fala carioca: uma análise dos falantes mais velhos de Copacabana* [Trabalho de conclusão de graduação, Universidade Federal do Rio de Janeiro]. Pantheon/UFRJ. http://hdl.handle.net/11422/22317
- **Idioma/variedade:** português carioca; subamostra de moradores mais velhos de Copacabana.
- **Cobertura:** /S/ pós-vocálico e palatalização na amostra delimitada do estudo.
- **Localizadores:** registro institucional para autoria, ano, título e escopo; PDF `RFNanini.pdf` para resultados quantitativos ou condicionamentos finos.
- **Acesso:** aberto no Pantheon/UFRJ.
- **Limitação:** amostra pequena e social/geograficamente específica; não representar como frequência de toda a cidade do Rio.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_SAMPLE_SCOPE.

### SND-SRC-0082 — Português carioca / apagamento de /R/ final

- **Tier:** B.
- **APA 7:** Callou, D., Moraes, J., & Leite, Y. (1998). Apagamento do R final no dialeto carioca: um estudo em tempo aparente e em tempo real. *DELTA, 14*(n. esp.), 61–72. https://doi.org/10.1590/S0102-44501998000300006
- **Idioma/variedade:** português do Rio de Janeiro; fala culta em conjuntos NURC históricos.
- **Cobertura:** enfraquecimento/apagamento de /R/ em coda final, comparação em tempo aparente e real e condicionamento por idade.
- **Localizadores:** pp. 61–72; abstract; seções 1, 3, 4, 5 e 6 quando um claim exigir detalhe.
- **Acesso:** artigo disponível via SciELO/DELTA.
- **Nota de data:** o fascículo é de 1998; plataformas atuais exibem datas posteriores de disponibilização/migração web. O ano bibliográfico preservado é 1998.
- **Limitação:** dados históricos NURC; não constituem frequência atual de toda a população carioca.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_DATE_SCOPE.

### SND-SRC-0083 — Português carioca periférico / coda (r), FavRio

- **Tier:** B — dissertação institucional aberta.
- **APA 7:** Silva, K. L. A. da. (2026). *Um estudo sobre a variação da coda (r) com falantes periféricos da comunidade de fala do Rio de Janeiro* [Dissertação de mestrado, Universidade Federal do Rio de Janeiro]. Pantheon/UFRJ. http://hdl.handle.net/11422/29818
- **Idioma/variedade:** português carioca; falantes residentes em favelas do município do Rio de Janeiro, Amostra FavRio.
- **Cobertura:** coda (r) interna e externa em itens não verbais; condicionamentos estruturais e sociais.
- **Localizadores:** registro institucional/abstract para desenho, 24 falantes e resultados globais; PDF `KLASilva.pdf` para claims finos.
- **Acesso:** aberto no Pantheon/UFRJ.
- **Limitação:** subamostra periférica específica; não usar como sinônimo de toda a comunidade carioca.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_SAMPLE_SCOPE.

### SND-SRC-0084 — Português fluminense popular / S, R e L em coda

- **Tier:** B.
- **APA 7:** Brandão, S. F. (2008). Variação em coda silábica na fala popular fluminense. *Revista da ABRALIN, 7*(1), 177–190. https://revista.abralin.org/index.php/abralin/article/view/983
- **Idioma/variedade:** fala popular de treze comunidades do Norte e Noroeste do estado do Rio de Janeiro.
- **Cobertura:** variação de S, R e L em coda silábica e atuação de variáveis extralinguísticas.
- **Localizadores:** resumo do artigo; pp. 177–190 para resultados e condicionamentos.
- **Acesso:** página e PDF da Revista da ABRALIN.
- **Nota de data:** a edição é identificada como v. 7, n. 1 (2008); a plataforma também mostra datas posteriores de publicação/migração web. O ano bibliográfico usado por MLS-SND é 2008.
- **Limitação crítica:** **fluminense não equivale a carioca**; esta fonte funciona como controle geográfico, não como evidência direta da cidade do Rio.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_GEOGRAPHIC_SCOPE.

### SND-SRC-0085 — Português carioca / vogais pretônicas médias

- **Tier:** B.
- **APA 7:** Machado, L., Moraes, J., Callou, D., & Leite, Y. (2010). Sobre vogais pretônicas médias no dialeto carioca: vogal derivada versus vogal subjacente. In *Textos Seleccionados do XXV Encontro Nacional da Associação Portuguesa de Linguística* (pp. 499–511). https://apl.pt/wp-content/uploads/2017/09/36-Luana-Machado.pdf
- **Idioma/variedade:** português carioca; experimento controlado com oito universitários de 18–28 anos do Rio de Janeiro.
- **Cobertura:** diferenças acústicas entre vogais altas derivadas e subjacentes em posição pretônica; medições acústicas e análise multivariada.
- **Localizadores:** p. 499, abstract/objetivo; pp. 500–503, corpus e metodologia; p. 504 em diante para análise.
- **Acesso:** PDF aberto no site da Associação Portuguesa de Linguística.
- **Conflito documental preservado:** o abstract informa **1344 tokens**, enquanto a metodologia da versão auditada registra **1152 ocorrências analisadas**. MLS-SND não escolhe um número até que a distinção de contagem seja demonstrada.
- **Limitação:** amostra experimental pequena e controlada; não representa todo o sistema pretônico nem cobre por si só vogais postônicas.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_OPEN_COUNT_CONFLICT.

### SND-SRC-0086 — Português / entoação de Lisboa e Rio de Janeiro

- **Tier:** B.
- **APA 7:** Frota, S., & Moraes, J. A. de. (2016). Intonation in European and Brazilian Portuguese. In W. L. Wetzels, J. Costa, & S. Menuzzi (Eds.), *The Handbook of Portuguese Linguistics* (pp. 141–166). Wiley-Blackwell. https://doi.org/10.1002/9781118791844.ch9
- **Repositório aberto:** http://hdl.handle.net/10451/25546
- **Idioma/variedade:** português europeu de Lisboa e português brasileiro do Rio de Janeiro.
- **Cobertura:** demarcação, highlighting/prominence, distinção de tipos de enunciado, agrupamento entoacional, eventos tonais e fronteiras.
- **Localizadores:** pp. 141–166; resumo institucional/publisher para escopo; seção específica do capítulo para contornos concretos.
- **Acesso:** versão em repositório institucional da Universidade de Lisboa.
- **Limitação:** o resumo valida escopo e funções gerais; fórmulas/contornos específicos exigem auditoria da seção correspondente do capítulo.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_SECTION_LOCATOR_REQUIREMENT.

### SND-SRC-0087 — Português brasileiro / atos de fala e metodologia entoacional

- **Tier:** B.
- **APA 7:** Moraes, J. A. de, & Rilliard, A. (2018). Describing the intonation of speech acts in Brazilian Portuguese: Methodological aspects. In *Methods in prosody: A Romance language perspective* (pp. 229–262). Language Science Press. https://doi.org/10.5281/zenodo.1441347
- **Idioma/variedade:** português brasileiro; metodologia experimental/perceptiva para atos de fala.
- **Cobertura:** resíntese de contornos de pitch, testes perceptivos e avaliação de pistas prosódicas.
- **Localizadores:** registro Zenodo para metadados/resumo; pp. 229–262 e seção correspondente para claims específicos.
- **Acesso:** capítulo aberto via Zenodo/Language Science Press.
- **Limitação:** **PB_BROAD/METHOD**, não se converte automaticamente em evidência da variedade carioca.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_VARIETY_SCOPE.

### SND-SRC-0088 — Português carioca / acústica das vogais orais, voz feminina

- **Tier:** B — dissertação UFRJ em catálogo institucional.
- **APA 7:** Orsini, M. T. (1995). *A acústica das vogais orais no dialeto carioca: a voz feminina* [Dissertação de mestrado, Universidade Federal do Rio de Janeiro].
- **Registro:** https://buscaintegrada.ufrj.br/Record/aleph-UFR01-000401799
- **Idioma/variedade:** português carioca; seis inquéritos do arquivo sonoro NURC, voz feminina.
- **Cobertura:** espaço acústico das vogais orais em posições tônica, pretônica e postônica.
- **Localizadores:** registro/resumo institucional para escopo; dissertação integral para valores formânticos e categorias específicas.
- **Acesso:** metadados institucionais abertos; disponibilidade integral deve ser confirmada antes de usar claims numéricos.
- **Limitação:** amostra NURC histórica e feminina; não representa toda a população contemporânea do Rio.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_FULLTEXT_REQUIRED_FOR_NUMERIC_CLAIMS.

### SND-SRC-0089 — Português / duração de vogais nasais e nasalizadas

- **Tier:** B.
- **APA 7:** Moraes, J. A., & Wetzels, W. L. (1992). Sobre a duração dos segmentos vocálicos nasais e nasalizados em português: um exercício de fonologia experimental. *Cadernos de Estudos Linguísticos, 23*, 153–166. https://doi.org/10.20396/cel.v23i0.8636851
- **Idioma/variedade:** português brasileiro dentro do desenho experimental do artigo.
- **Cobertura:** duração de segmentos vocálicos nasais e nasalizados; fonologia experimental.
- **Localizadores:** pp. 153–166; artigo integral para qualquer claim sobre amostra, variedade ou resultado fino.
- **Acesso:** PDF/página do periódico UNICAMP.
- **Nota de data:** o fascículo é v. 23 (1992); a plataforma atual exibe data de publicação web em 2012. O ano bibliográfico preservado é 1992.
- **Limitação crítica:** MLS-SND não trata a afiliação UFRJ dos autores como prova de proveniência carioca dos falantes; a variedade da amostra deve ser verificada no artigo antes de um claim RIO_CARIOCA.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_SAMPLE_PROVENANCE_HOLD.

### SND-SRC-0090 — Português carioca / nasal coda emergence

- **Tier:** B.
- **APA 7:** Shosted, R. K. (2006). Vocalic context as a condition for nasal coda emergence: aerodynamic evidence. *Journal of the International Phonetic Association, 36*(1), 39–58. https://doi.org/10.1017/S0025100306002350
- **Idioma/variedade:** Carioca Brazilian Portuguese / Rio de Janeiro.
- **Cobertura:** nasal coda emergence (NCE), cinco vogais fonemicamente nasais no análise do artigo, coda nasal excrescente e condicionamento por altura/posterioridade.
- **Localizadores:** abstract; pp. 39–58 para resultados detalhados.
- **Amostra:** três falantes de CBP para os dados aerodinâmicos.
- **Acesso:** abstract e metadados via Cambridge; texto completo conforme acesso disponível.
- **Limitação:** amostra muito pequena; não generalizar frequências/condicionamentos além do estudo sem evidência adicional.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED_WITH_SMALL_SAMPLE_WARNING.

### SND-SRC-0091 — Português brasileiro / acento secundário

- **Tier:** B.
- **APA 7:** Moraes, J. A. de. (2003). Secondary stress in Brazilian Portuguese: perceptual and acoustical evidence. In *Proceedings of the 15th International Congress of Phonetic Sciences* (pp. 2063–2066). https://www.internationalphoneticassociation.org/icphs-proceedings/ICPhS2003/papers/p15_2063.pdf
- **Idioma/variedade:** português brasileiro; variedade regional dos falantes **não explicitada** na metodologia auditada.
- **Cobertura:** produção e percepção de proeminência secundária; evidência acústica/perceptiva.
- **Localizadores:** pp. 2063–2066; metodologia p. 2063/2064 e resultados/conclusões nas páginas seguintes.
- **Amostra:** quatro falantes na produção e dez ouvintes no teste perceptivo segundo a versão auditada.
- **Limitação crítica:** **PB_BROAD/EXPERIMENTAL**, não RIO_CARIOCA. Afiliação institucional do autor não é evidência da variedade dos falantes.
- **Verificado:** 2026-10-11 contra os proceedings oficiais de ICPhS.
- **Estado:** ADMITTED_WITH_VARIETY_SCOPE.

## 37. Resultado do registro v0.20

O registro contém **91 fontes canônicas** numeradas SND-SRC-0001 a SND-SRC-0091.

Mapeamento local resolvido nesta wave:

- `PTBR-W01-SRC-02` → `SND-SRC-0081`;
- `PTBR-W01-SRC-03` → `SND-SRC-0082`;
- `PTBR-W01-SRC-04` → `SND-SRC-0083`;
- `PTBR-W01-SRC-05` → `SND-SRC-0084`;
- `PTBR-W01-SRC-06` → `SND-SRC-0085`;
- `PTBR-W01-SRC-07` → `SND-SRC-0086`;
- `PTBR-W01-SRC-08` → `SND-SRC-0087`;
- `PTBR-W01-SRC-09` → `SND-SRC-0088`;
- `PTBR-W01-SRC-10` → `SND-SRC-0089`;
- `PTBR-W01-SRC-11` → `SND-SRC-0090`;
- `PTBR-W01-SRC-12` → `SND-SRC-0091`.

`PTBR-W01-SRC-13` permanece deliberadamente fora do registro como catálogo/discovery aid; não substitui evidência primária.

A canonicalização resolve identidade bibliográfica, escopo e localizadores mínimos. **Não promove por si só nenhuma entrada PTBR nem fecha OPEN_QUESTION/HOLDs.**


## 38. Canonicalización zh-TW segmental / sílaba wave 03

### SND-SRC-0092 — Taiwan Mandarin / vocales acústicas de Taipei

- **Tier:** B.
- **APA 7:** Zhang, H.-Y. (2009). *An acoustic study on Taiwan Mandarin vowels* [Master’s thesis, National Chengchi University].
- **URL:** https://thesis.lib.nccu.edu.tw/detail/478653cb3f3c856e303d769153e75e75/
- **Idioma/variedad:** Taiwan Mandarin; muestra de seis hombres hablantes nativos nacidos y criados en Taipei.
- **Cobertura:** calidad vocálica acústica, formantes y condicionamiento por elementos de la final; 70 sílabas de prueba.
- **Localizadores:** metodología pp. 25–33; resultados pp. 35–96; conclusiones pp. 97–101; metadatos/resumen institucional NCCU.
- **Acceso:** registro institucional; disponibilidad del texto según repositorio NCCU.
- **Limitación:** tesis de 2009 con muestra pequeña, masculina y de Taipei; no generalizar valores acústicos a todo Taiwan Mandarin contemporáneo.
- **Verificado:** 2026-10-11 contra el registro institucional de National Chengchi University.
- **Estado:** ADMITTED_WITH_SAMPLE_DATE_WARNING.

### SND-SRC-0093 — Taiwan Mandarin / merger de nasales finales

- **Tier:** B.
- **APA 7:** Chiu, C., & Lu, Y.-A. (2021). Articulatory evidence for the syllable-final nasal merging in Taiwan Mandarin. *Language and Speech, 64*(4), 771–789. https://doi.org/10.1177/0023830920948084
- **URL:** https://journals.sagepub.com/doi/10.1177/0023830920948084
- **Idioma/variedad:** Taiwan Mandarin.
- **Cobertura:** /n/–/ŋ/ finales, ultrasonido, dependencia del contexto vocálico, nasalización de la vocal precedente y evidencia de merger potencialmente incompleto.
- **Localizadores:** abstract; pp. 771–789 para claims detallados.
- **Acceso:** metadatos y abstract SAGE/PubMed; texto completo según acceso del artículo.
- **Limitación:** fenómeno articulatorio específico; no es descripción integral del inventario ni de la estructura silábica.
- **Verificado:** 2026-10-11 contra SAGE y PubMed.
- **Estado:** ADMITTED.

### SND-SRC-0094 — Taiwan Mandarin / fonotáctica y tipos silábicos

- **Tier:** B.
- **APA 7:** Wan, I.-P., Chang, C.-W., Lee, C., & Yu, P. (2024). Probability distributions of sounds and phonotactics in Taiwan Mandarin syllables. In *Proceedings of the 38th Pacific Asia Conference on Language, Information and Computation* (pp. 1157–1165). Tokyo University of Foreign Studies.
- **URL:** https://aclanthology.org/2024.paclic-1.111/
- **Idioma/variedad:** Taiwan Mandarin.
- **Cobertura:** corpus natural de 202 horas, distribución de phones, fonotáctica probabilística y 12 tipos silábicos de superficie.
- **Localizadores:** abstract y §2 Methodology, pp. 1157–1159; Tables 1–2, pp. 1159–1160; discusión de estructura silábica, p. 1161.
- **Acceso/licencia:** ACL Anthology; publicación 2024 bajo CC BY 4.0 según la ficha de Anthology.
- **Limitación:** análisis de corpus/phones y representación de superficie; no equivale automáticamente a inventario fonémico definitivo. El tono se excluye de los cálculos fonotácticos del estudio.
- **Verificado:** 2026-10-11 contra ACL Anthology.
- **Estado:** ADMITTED.

### SND-SRC-0095 — Taiwan Mandarin / representación vocálica

- **Tier:** B.
- **APA 7:** Wan, I.-P., & Jaeger, J. J. (2003). The phonological representation of Taiwan Mandarin vowels: A psycholinguistic study. *Journal of East Asian Linguistics, 12*(3), 205–257. https://doi.org/10.1023/A:1023666819363
- **URL:** https://doi.org/10.1023/A:1023666819363
- **Idioma/variedad:** Taiwan Mandarin.
- **Cobertura:** contraste de hipótesis previas basadas en Beijing Mandarin y propuesta de un sistema de cinco vocales para Taiwan Mandarin apoyada en evidencia distribucional, fonética y psicolingüística.
- **Localizadores:** pp. 205–257; abstract y secciones de análisis según claim.
- **Acceso:** metadatos/abstract institucionales y DOI; texto completo según acceso editorial.
- **Limitación:** la propuesta de cinco vocales es **ANALYTICAL_CHOICE** de los autores; no se trata como consenso universal ni sistema obligatorio del MLS.
- **Verificado:** 2026-10-11 contra NCCU Academic Hub, University at Buffalo y metadatos DOI.
- **Estado:** ADMITTED_WITH_ANALYTICAL_SCOPE.

### SND-SRC-0096 — Taiwan Mandarin / VOT de oclusivas

- **Tier:** B.
- **APA 7:** Ogasawara, N. (2011). Acoustic analysis of voice-onset time in Taiwan Mandarin and Japanese. *Concentric: Studies in Linguistics, 37*(2), 155–178.
- **URL de metadatos:** https://tci.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi?o=dnclresource&s=id%3D%22A11034686%22.&searchmode=basic&tcihsspage=tcisearch_opt1_search
- **Idioma/variedad:** Taiwan Mandarin y japonés en diseño comparativo.
- **Cobertura usada por MLS-SND:** VOT en oclusivas aspiradas/no aspiradas de Taiwan Mandarin, incluidas posiciones de habla conectada.
- **Localizadores:** pp. 155–178; abstract institucional TCI/NCL.
- **Acceso:** metadatos y abstract en Taiwan Citation Index / National Central Library; texto según disponibilidad del periódico.
- **Limitación:** estudio específico de VOT y comparación con japonés; no constituye descripción consonántica completa.
- **Verificado:** 2026-10-11 contra TCI/NCL, EBSCO metadata y listado bibliográfico de la autora.
- **Estado:** ADMITTED.

## 39. Resultado del registro v0.21

El registro contiene **96 fuentes canónicas** numeradas SND-SRC-0001 a SND-SRC-0096.

Mapeamiento local resuelto en esta wave:

- `ZHTW-LOCAL-007` → `SND-SRC-0092`;
- `ZHTW-LOCAL-008` → `SND-SRC-0093`;
- `ZHTW-LOCAL-009` → `SND-SRC-0094`;
- `ZHTW-LOCAL-010` → `SND-SRC-0095`;
- `ZHTW-LOCAL-011` → `SND-SRC-0096`.

La canonicalización resuelve identidad bibliográfica, alcance y localizadores mínimos. **No promueve ZHTW-003 más allá de RESEARCHED_PARTIAL ni convierte un análisis de una fuente en consenso del perfil.**
