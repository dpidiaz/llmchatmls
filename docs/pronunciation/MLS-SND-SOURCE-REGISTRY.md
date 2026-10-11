# MLS-SND Source Registry

Estado: **registro operativo v0.2**. Este archivo registra fuentes admisibles y su alcance. La presencia de una fuente aquí **no valida por sí sola una entrada**.

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
- **Localizador:** capítulo de Guatemala → epígrafe “Fonética y fonología”; para publicación final deben registrarse además las páginas exactas del PDF por afirmación.
- **Acceso:** gratuito.
- **Limitación:** la propia obra declara que no pretende una descripción fonético-fonológica exhaustiva de la variedad.
- **Verificado:** 2026-10-11.
- **Estado:** ADMITTED; PAGE_LOCATORS_PENDING.

### SND-SRC-0004 — American English / Ladefoged

- **Tier:** B
- **APA 7:** Ladefoged, P. (1989). American English. *Journal of the International Phonetic Association, 19*(2), 41–44.
- **Índice bibliográfico:** https://phoible.org/sources/eng_ladefoged1989
- **Idioma/variedad:** inglés estadounidense; descripción histórica de referencia de una variedad de California meridional según literatura posterior.
- **Cobertura:** Illustration of the IPA; inventario y transcripción de referencia.
- **Localizador:** pp. 41–44.
- **Acceso:** metadatos gratuitos; disponibilidad del texto debe comprobarse antes de usar afirmaciones no visibles.
- **Limitación:** no debe etiquetarse como descripción exhaustiva de “General American”.
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
- **APA 7:** *When a rise is not only a rise: An acoustic analysis of the impressionistic distinction between northern and central Taiwan Mandarin using Tone 1 as an example*. (2025). *Journal of the International Phonetic Association*.
- **URL:** https://www.cambridge.org/core/journals/journal-of-the-international-phonetic-association/article/when-a-rise-is-not-only-a-rise-an-acoustic-analysis-of-the-impressionistic-distinction-between-northern-and-central-taiwan-mandarin-using-tone-1-as-an-example/3523B438DD9F526443D5661BB6131A57
- **Idioma/variedad:** mandarín de Taiwán; norte vs. centro.
- **Cobertura:** análisis acústico de variación tonal; el artículo documenta explícitamente variación fonética interna de Taiwan Mandarin.
- **Localizador:** sección 1 “Introduction” y secciones experimentales/tablas/figuras correspondientes.
- **Acceso:** artículo web de Cambridge; copyright de autores indicado.
- **Limitación:** se centra en Tone 1 y contraste regional concreto; no generalizar a todo el sistema tonal.
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
