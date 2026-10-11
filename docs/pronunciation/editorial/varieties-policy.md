# MLS-SND — Política de variedades

Estado: **norma editorial v0.2**.

## 1. Principio

Ninguna etiqueta amplia como “inglés estadounidense”, “francés”, “alemán” o “español de Guatemala” debe interpretarse automáticamente como una pronunciación única y homogénea.

Elegir una variedad de referencia es una **decisión editorial de alcance**, no una declaración de superioridad lingüística.

## 2. Etiqueta obligatoria

Toda afirmación dependiente de variedad deberá identificar, con el nivel de precisión que la evidencia permita:

- idioma;
- país/región;
- variedad de referencia;
- registro o estilo, cuando sea material;
- población/edad, cuando sea material;
- fecha o periodo, cuando sea material;
- fuente que justifica el alcance.

## 3. Estados de decisión

Cada perfil tendrá uno de estos estados:

- REFERENCE_FIXED: la referencia editorial está cerrada.
- REFERENCE_PROVISIONAL: existe una propuesta suficientemente útil para prototipar, pero requiere investigación adicional.
- MULTI_REFERENCE: el perfil se diseñará deliberadamente con más de una referencia.
- REFERENCE_OPEN: no hay evidencia suficiente para cerrar la decisión.

## 4. Tipos de afirmación

Una entrada podrá etiquetar una afirmación como:

- BROADLY_DISTRIBUTED — documentada con amplitud en la lengua/área indicada;
- REFERENCE_VARIETY — propia o característica de la referencia elegida;
- DOCUMENTED_VARIANT — variante documentada sin tratarla como error;
- NORMATIVE — recomendación o forma codificada por una fuente normativa;
- CORPUS_OBSERVED — observada en un corpus delimitado;
- ANALYTICAL_CHOICE — decisión de análisis adoptada por una fuente o por MLS;
- OPEN_QUESTION — pendiente de investigación.

## 5. Política por idioma

### 🇬🇹 Español de Guatemala

**Estado:** REFERENCE_PROVISIONAL.

**Propuesta editorial:** usar un perfil nacional provisional del español de Guatemala, con etiquetas regionales, sociales, generacionales y de contacto cuando sean materiales. Ciudad de Guatemala podrá funcionar como subreferencia urbana solo cuando la evidencia la delimite; no se toma como sustituto automático de todo el país.

**Evidencia inicial:** SND-SRC-0003 (ASALE) documenta que existen al menos tres grandes áreas dialectales —centro-occidental, oriental y norteña— y variación generacional, aun cuando describe la variación fonética global como relativamente reducida.

**Regla:** cualquier rasgo de oriente, norte u otra zona debe etiquetarse por separado.

**Pendiente crítico:** ampliar estudios fonéticos específicos de Ciudad de Guatemala/área centro-occidental y reconciliar las zonificaciones nacionales antes de considerar REFERENCE_FIXED.

---

### 🇺🇸 Inglés estadounidense

**Estado:** MULTI_REFERENCE.

**Decisión:** MLS-SND **no utilizará “General American” como si designara una pronunciación fonéticamente homogénea**.

**Fundamento inicial:** la página de Illustrations libres de Cambridge resume la observación de Ladefoged y Hillenbrand de que existe diversidad fonética considerable en Norteamérica y que “General American English” no es una etiqueta suficientemente precisa para una única realización.

**Fuentes iniciales:**
- SND-SRC-0004 — Ladefoged (1989), perfil de American English;
- SND-SRC-0005 — Hillenbrand (2003), Southern Michigan.

**Arquitectura propuesta:**
1. un núcleo de contrastes ampliamente documentados en inglés estadounidense;
2. ejemplos siempre asociados a la fuente/variedad;
3. módulos de variación cuando una diferencia regional afecte la explicación.

**Pendiente:** identificar corpus y bibliografía contemporánea para habla estadounidense de baja marcación regional.

---

### 🇧🇷 Portugués brasileño — referencia carioca

**Estado:** REFERENCE_PROVISIONAL.

**Referencia editorial:** habla urbana de Río de Janeiro, descrita explícitamente como **carioca**, no como sustituto de todo el portugués brasileño.

**Fuentes iniciales:**
- SND-SRC-0007 — Callou (2009), perfil de fala carioca;
- SND-SRC-0006 — Barbosa & Albano (2004), portugués brasileño basado en hablante de São Paulo/Valinhos, útil como contraste pero **no** como evidencia carioca.

**Regla:** toda afirmación debe diferenciar:
- PB_BROAD;
- RIO_CARIOCA;
- otra variedad brasileña identificada.

**Pendiente:** ampliar fuentes cariocas para vocalismo, nasalidad, prosodia, distribución social y cambio reciente.

---

### 🇮🇹 Italiano

**Estado:** REFERENCE_PROVISIONAL.

**Referencia editorial inicial:** pronunciación ortoépica de referencia documentada por el **DOP** para entradas léxicas, combinada posteriormente con una descripción fonética/fonológica académica.

**Fuente inicial:** SND-SRC-0008.

**Regla:** DOP puede respaldar pronunciación lexicográfica y convenciones normativas; no se extrapolará automáticamente a la variación regional real de toda Italia.

**Pendiente:** seleccionar una obra fonético-fonológica académica de referencia y definir cómo presentar italiano estándar, italiano regional y realizaciones locales.

---

### 🇫🇷 Francés

**Estado:** REFERENCE_PROVISIONAL.

**Decisión provisional:** usar como ancla descriptiva un francés metropolitano supralocal / norte de Francia, y etiquetar como parisinos únicamente los datos cuya fuente esté delimitada a París. No usar “français standard” como etiqueta autosuficiente ni presentar París como toda la francofonía.

**Fuente marco:** SND-SRC-0009 — proyecto PFC, diseñado para estudiar usos, variedades y estructura del francés oral contemporáneo en el espacio francófono.

**Arquitectura propuesta:**
1. seleccionar una referencia metropolitana concreta para el perfil principal;
2. usar PFC para documentar variación;
3. separar norma ortoépica, descripción fonética y variación geográfica.

**Pendiente crítico:** decidir corpus/localidad principal y bibliografía de base antes de redactar el perfil.

---

### 🇩🇪 Alemán

**Estado:** MULTI_REFERENCE.

**Decisión:** distinguir entre una pronunciación de referencia lexicográfica y las variedades estándar nacionales.

**Fuente inicial:** SND-SRC-0010 — Duden para notación y pronunciación lexicográfica.

**Arquitectura propuesta:**
- DE_STANDARD;
- AT_STANDARD;
- CH_STANDARD;

cuando la evidencia haga material la diferencia.

**Pendiente:** seleccionar bibliografía fonética especializada para los tres estándares nacionales y decidir cuál actúa como referencia principal del perfil introductorio.

---

### 🇹🇼 Mandarín de Taiwán

**Estado:** REFERENCE_PROVISIONAL.

**Referencia editorial:** mandarín usado/codificado en Taiwán, con **Zhuyin/Bopomofo** como sistema local relevante de anotación.

**Fuente inicial:** SND-SRC-0011 — Ministry of Education, Taiwan.

**Decisión cerrada:** Zhuyin no se describirá como equivalente del IPA.

**Pendiente crítico:** seleccionar bibliografía fonética/fonológica específica de Taiwan Mandarin para inventario segmental, realizaciones, tonos y variación; el manual de Zhuyin no basta para ello.

---

### 🇰🇷 Coreano

**Estado:** REFERENCE_PROVISIONAL.

**Referencia editorial:** coreano estándar según la documentación institucional cuando se trate de romanización o norma; para fonética concreta, la variedad/habla de referencia deberá precisarse con bibliografía especializada.

**Fuente inicial:** SND-SRC-0012 — National Institute of Korean Language.

**Decisión cerrada:** la Romanización Revisada es una capa auxiliar y no una transcripción fonética exhaustiva.

**Pendiente:** fuentes contemporáneas para contrastes consonánticos, cambios vocálicos, estructura silábica y prosodia; decidir cómo relacionar “estándar” con habla de Seúl sin asumir identidad absoluta.

---

### 🇯🇵 Japonés

**Estado:** REFERENCE_FIXED para el **ancla prosódica principal**; no para toda variación japonesa.

**Referencia editorial:** lengua común / habla de Tokio como ancla para el tratamiento principal del acento léxico, con variación regional explícita donde corresponda.

**Fuentes iniciales:**
- SND-SRC-0013 — 東京語アクセント資料;
- SND-SRC-0014 — proyecto NINJAL/OJAD.

**Justificación:** NINJAL trata explícitamente el acento del dialecto de Tokio/común como referencia útil para recursos de acento y documenta además variación.

**Regla:** “referencia de Tokio” no significa que todos los hablantes japoneses compartan ese patrón.

**Pendiente:** incorporar fuentes segmentales y prosódicas actuales adicionales.

---

### 🇷🇺 Ruso

**Estado:** REFERENCE_FIXED para la referencia ortoépica principal.

**Referencia editorial:** pronunciación literaria rusa contemporánea, con norma y variantes identificadas.

**Fuentes iniciales:**
- SND-SRC-0015 — Yanushevskaya & Bunčić (2015), Illustration of the IPA;
- SND-SRC-0016 — Kalenchuk, Kasatkin & Kasatkina (2017), Большой орфоэпический словарь русского языка.

**Regla:** diferenciar:
- descripción fonética;
- norma ortoépica;
- variantes normativas;
- variación no cubierta por la norma.

**Pendiente:** precisar el alcance sociogeográfico del perfil fonético y complementar con estudios contemporáneos.

## 6. Comparación autoral

Español de Guatemala, inglés estadounidense y portugués carioca pueden actuar como **lentes comparativas**.

No deberán utilizarse para:

- definir categorías universales;
- asumir equivalencia fonética;
- convertir un rasgo conocido en explicación completa de otro;
- juzgar otras pronunciaciones como desviaciones.

Toda comparación debe usar la taxonomía de MLS-SND-TRANSCRIPTION-GUIDE.md:

- IDENTIDAD DOCUMENTADA;
- SEMEJANZA PARCIAL;
- APROXIMACIÓN ARTICULATORIA;
- SIN EQUIVALENTE DIRECTO ÚTIL.

## 7. Cambio lingüístico y fecha

Cuando una fuente documente datos históricos o de varias generaciones, la entrada deberá conservar esa dimensión temporal.

No se presentará como “actual” un patrón documentado solo por una fuente antigua sin comprobar continuidad cuando la fecha sea material.

Ejemplo de control: los datos de SND-SRC-0013 sobre Tokio se recogieron principalmente en 1982–1984; son valiosos, pero una afirmación sobre uso contemporáneo puede requerir fuente adicional.

## 8. Gate para fijar una referencia

Una variedad solo puede pasar de REFERENCE_PROVISIONAL o REFERENCE_OPEN a REFERENCE_FIXED cuando:

1. exista al menos una fuente admisible que delimite la variedad;
2. su utilidad editorial esté documentada;
3. exista suficiente cobertura para los fenómenos centrales del perfil;
4. las principales variaciones conocidas puedan etiquetarse sin distorsión;
5. la decisión quede registrada como editorial, no como superioridad lingüística.

## 9. Estado global v0.2

| Perfil | Estado |
|---|---|
| 🇬🇹 es-GT | REFERENCE_PROVISIONAL |
| 🇺🇸 en-US | MULTI_REFERENCE |
| 🇧🇷 pt-BR-rio | REFERENCE_PROVISIONAL |
| 🇮🇹 it | REFERENCE_PROVISIONAL |
| 🇫🇷 fr | REFERENCE_PROVISIONAL |
| 🇩🇪 de | MULTI_REFERENCE |
| 🇹🇼 zh-TW | REFERENCE_PROVISIONAL |
| 🇰🇷 ko | REFERENCE_PROVISIONAL |
| 🇯🇵 ja | REFERENCE_FIXED (ancla Tokio/común, con límites) |
| 🇷🇺 ru | REFERENCE_FIXED (ortoepía literaria, con límites) |
