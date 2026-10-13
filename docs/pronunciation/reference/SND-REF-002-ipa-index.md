# SND-REF-002 — Índice IPA de MLS-SND

**Estado:** READY_FOR_COMPOSITION.  
**Tipo:** aparato de consulta vivo.  
**Fuente normativa de símbolos:** SND-SRC-0001 — International Phonetic Association, *The IPA Chart*.

## 1. Propósito

Este índice registra **los símbolos, diacríticos y suprasegmentales IPA que MLS-SND realmente utiliza o explica**.

No pretende duplicar toda la tabla del Alfabeto Fonético Internacional.

La tabla oficial de la International Phonetic Association seguirá siendo la referencia normativa para:

- pertenencia de un signo al IPA oficial;
- organización en consonantes, vocales, diacríticos, suprasegmentales y tonos/acentos de palabra;
- cambios aprobados del alfabeto o de la tabla.

## 2. Principio de inclusión

Un signo entra en este índice cuando cumple al menos una condición:

1. aparece en una entrada publicada o en revisión de MLS-SND;
2. una entrada de representación lo explica explícitamente;
3. es necesario para interpretar una transcripción citada por el tomo.

No se añadirá un signo solo porque exista en la tabla IPA.

## 3. Qué registra cada forma

Cada registro puede contener:

- **forma indexada** (símbolo, diacrítico o secuencia atestiguada);
- **clase IPA**;
- **estatus MLS-SND**;
- **entradas donde aparece**;
- **nivel de representación observado**: /fonológico/, [fonético] o ambos;
- **idioma/variedad**;
- **nota de alcance**;
- **primera evidencia o fuente pertinente**.

El índice no define por sí solo el valor fonético que una forma tiene en una lengua concreta.

**Guard de atomicidad:** una forma compuesta como `pʰ`, `tʂ` o `tɕʰ` puede indexarse porque aparece en una transcripción canónica, pero REF-002 no la presenta por ello como un único símbolo atómico del IPA. El índice distingue entre carácter/símbolo, diacrítico y secuencia cuando esa diferencia es material.

## 4. Estados del índice

### USED

La forma indexada aparece en una entrada MLS-SND integrada.

### EXPLAINED

La forma, símbolo o familia pertinente está explicada en una entrada de representación aunque todavía no aparezca en un perfil.

### SOURCE_SPECIFIC

La forma pertenece a una convención analítica o notación de una fuente y **no debe asumirse automáticamente como un símbolo IPA autónomo**.

### PENDING_CLASSIFICATION

La forma fue detectada, pero necesita comprobación antes de catalogarse.

## 5. Semilla v0.1 — formas actualmente observadas

Esta semilla se construyó a partir de entradas ya presentes en `feat/mls-snd-foundation` el 11 de octubre de 2026. Es deliberadamente parcial: se ampliará al integrarse nuevas waves.

| Forma indexada | Clase IPA | Estado | Uso observado | Entradas/idiomas | Nota |
|---|---|---|---|---|---|
| `a` | vocal | USED | /a/ | RU, KO | La identidad del símbolo no implica identidad acústica o fonológica entre idiomas. |
| `e` | vocal | USED | /e/ | FR, KO | En FR aparece dentro del contraste /e ~ ɛ/. |
| `i` | vocal | USED | [i], /i/ | RU, KO | RU discute [i] frente a [ɨ] dentro de análisis competidores. |
| `o` | vocal | USED | /o/ | FR, KO | En FR aparece dentro de /o ~ ɔ/. |
| `u` | vocal | USED | /u/ | KO | Forma parte del inventario citado para el Seoul Corpus. |
| `ɛ` | vocal | USED | /ɛ/, /ɛ̃/ | FR | La tilde combinante se registra por separado. |
| `ɔ` | vocal | USED | /ɔ/ | FR | Aparece dentro de /o ~ ɔ/. |
| `ø` | vocal | USED | /ø/ | FR | Aparece dentro de /ø ~ œ/. |
| `œ` | vocal | USED | /œ/, /œ̃/ | FR | La nasalización no se incorpora al símbolo base del índice. |
| `ɨ` | vocal | USED | [ɨ], /ɨ/ | RU, KO | Ejemplo útil de por qué un símbolo compartido no garantiza una misma realización. |
| `ʌ` | vocal | USED | /ʌ/ | KO | Aparece en el inventario de siete monoptongos citado. |
| `s` | consonante pulmonar | USED | /s/ | PT-BR-rio | El perfil carioca también conserva /S/ como notación de fuente separada; véase exclusiones. |
| `t` | consonante pulmonar | USED | /tʲ/ | RU | Base consonántica con diacrítico de palatalización. |
| `d` | consonante pulmonar | USED | /dʲ/ | RU | Base consonántica con diacrítico de palatalización. |
| `r` | consonante pulmonar | USED | /rʲ/ | RU | Base consonántica con diacrítico de palatalización. |
| `◌̃` | diacrítico | USED | /œ̃/, /ɛ̃/ | FR | La tabla oficial lo identifica como nasalización. |
| `ʲ` | diacrítico/modificador | USED | /tʲ dʲ rʲ/ | RU | La tabla oficial lo identifica como palatalización. |


## 6. Expansión auditada v0.2 — ruso y Taiwan Mandarin

Esta pasada añade únicamente formas **ya escritas explícitamente** en entradas canónicas. No completa inventarios por analogía y no deriva símbolos desde ortografía, Zhuyin o romanización.

### Ruso — ocurrencias canónicas adicionales

| Forma indexada | Clase IPA | Estado | Uso observado | Entrada | Nota |
|---|---|---|---|---|---|
| `v` | consonante pulmonar | USED | /v/ | SND-RU-007 | La entrada documenta realizaciones debilitadas/aproximantes sin fijar aquí una transcripción fonética más estrecha. |
| `j` | consonante pulmonar/aproximante | USED | /j/ | SND-RU-007 | El índice registra el símbolo; las realizaciones condicionadas siguen perteneciendo a la entrada y su evidencia. |

`vʲ` se representa en MLS-SND como base `v` + marca de palatalización `ʲ`; no se crea un símbolo atómico nuevo.

### Taiwan Mandarin — ocurrencias del mapa segmental

SND-ZHTW-003 aporta ocurrencias textuales canónicas al índice. REF-002 registra únicamente las formas que aparecen explícitamente en esa entrada y **no hereda ni redefine su análisis fonológico, sus gates ni sus decisiones analíticas**.

| Forma indexada | Clase IPA | Estado | Uso observado | Entrada | Alcance |
|---|---|---|---|---|---|
| `p`, `t`, `k` | consonantes pulmonares | USED | [p], [t], [k] | SND-ZHTW-003 | Miembros no aspirados de pares descritos por Wan et al. (2024). |
| `pʰ`, `tʰ`, `kʰ` | consonantes pulmonares + aspiración | USED | [pʰ], [tʰ], [kʰ] | SND-ZHTW-003 | La aspiración se conserva como `ʰ`; no se interpreta como símbolo independiente de segmento. |
| `tʂ`, `ts`, `tɕ` | secuencias/representaciones consonánticas usadas por la fuente | USED | [tʂ], [ts], [tɕ] | SND-ZHTW-003 | Se conserva la representación escrita en el mapa; REF-002 no decide aquí su análisis fonológico. |
| `tʂʰ`, `tsʰ`, `tɕʰ` | representaciones consonánticas + aspiración | USED | [tʂʰ], [tsʰ], [tɕʰ] | SND-ZHTW-003 | Mismo límite analítico; REF-002 no hereda ni redefine el gate de la entrada fuente. |
| `s`, `ʂ`, `ɕ` | consonantes pulmonares | USED | [s], [ʂ], [ɕ] | SND-ZHTW-003 | El mapa conserva variación interhablante/contextual; el índice no la colapsa. |
| `n`, `ŋ` | consonantes pulmonares | USED | /n/, /ŋ/ | SND-ZHTW-003 | Finales estudiadas por Chiu & Lu; el merger documentado es dependiente del contexto y potencialmente incompleto. |
| `ʰ` | diacrítico/modificador | USED | aspiración en [pʰ tʰ kʰ tʂʰ tsʰ tɕʰ] | SND-ZHTW-003 | Se registra por separado para que el lector pueda rastrear la marca. |

**Gate de alcance:** estas filas certifican indexación de formas observadas, no suficiencia R33 ni cierre analítico de SND-ZHTW-003. Si una versión futura cambia materialmente la representación adoptada, REF-002 deberá sincronizarse y reabrir los controles afectados.

## 7. Suprasegmentales y tonos: conjunto explicado, no inventario de uso

SND-REP-006 explica que MLS-SND puede necesitar signos IPA de:

- acento primario y secundario;
- duración;
- división silábica;
- enlace;
- límites prosódicos;
- tonos y contornos.

La tabla oficial registra, entre otros:

| Signo oficial | Función oficial resumida | Estado MLS-SND |
|---|---|---|
| `ˈ` | acento primario | EXPLAINED; ocurrencias por perfil pendientes de indexación |
| `ˌ` | acento secundario | EXPLAINED; ocurrencias por perfil pendientes |
| `ː` | largo | EXPLAINED; ocurrencias por perfil pendientes |
| `ˑ` | semilargo | EXPLAINED; ocurrencias por perfil pendientes |
| `◌̆` | extrabreve | EXPLAINED; ocurrencias por perfil pendientes |
| `.` | límite silábico | EXPLAINED; uso editorial concreto pendiente |
| `◌‿◌` | enlace/ausencia de ruptura | EXPLAINED; uso editorial concreto pendiente |

Los tonos y acentos de palabra se indexarán **solo cuando los perfiles adopten una convención concreta**. No se copiará automáticamente toda la subtabla tonal al aparato de consulta.

## 8. Registro de exclusiones y notaciones no canónicas

### /S/ en fuentes sobre portugués carioca

La entrada SND-PTBR-006 conserva `/S/` al describir la notación usada por Callou.

**Política de índice:** `S` no se incorpora automáticamente como símbolo IPA del índice. Se registra como **SOURCE_SPECIFIC** hasta que la entrada explique de forma explícita qué estatus analítico tiene esa notación en la fuente.

Esto evita convertir una convención de análisis en un símbolo IPA inexistente por simple semejanza tipográfica con una transcripción entre barras.

### Zhuyin/Bopomofo

No se indexa aquí.

Se trata en SND-ZHTW-007 como sistema local de representación distinto del IPA.

### Romanizaciones

No se indexan aquí salvo que contengan un signo IPA utilizado explícitamente como IPA, caso que debe documentarse.

## 9. Reglas de mantenimiento

Cuando una entrada nueva introduzca un símbolo IPA:

1. comprobar que el signo pertenece al IPA oficial vigente o documentar que es una convención externa;
2. registrar la entrada y el idioma/variedad;
3. indicar si aparece entre / /, [ ] o ambos;
4. no copiar al índice una interpretación fonética más estrecha de la que la entrada haya validado;
5. añadir diacríticos por separado cuando su función sea relevante;
6. si una fuente usa el mismo símbolo con otro análisis, conservar ambas ocurrencias y explicar la diferencia.

## 10. Actualización frente a nuevas versiones de la tabla IPA

La International Phonetic Association indica que:

- solo los cambios aprobados por su Council forman parte del IPA oficial;
- desde 2025 la tabla se reemite anualmente;
- la revisión sustantiva indicada en las emisiones actuales sigue siendo 2015/2005.

Por ello, MLS-SND distinguirá:

- **año de la emisión consultada**;
- **revisión sustantiva del alfabeto/tabla**.

Una nueva fecha de copyright no se tratará automáticamente como cambio fonético o cambio de inventario.

## 11. Licencia y eventual reproducción gráfica

La IPA informa que la tabla Kiel y sus subpartes están disponibles bajo **CC BY-SA 4.0** con atribución.

Si MLS-SND reproduce o adapta gráficamente la tabla/subtabla, la composición final deberá:

- conservar la atribución requerida;
- respetar CC BY-SA 4.0;
- registrar la versión/año consultados.

Este índice textual no requiere reproducir la tabla completa para funcionar.

## 12. Fuente

International Phonetic Association. (2026). *The International Phonetic Alphabet and the IPA Chart*. https://www.internationalphoneticassociation.org/content/ipa-chart

International Phonetic Association. (2026). *The IPA Chart and sub-charts in four fonts*. https://www.internationalphoneticassociation.org/IPAcharts/IPA_charts_E/IPA_charts_E.html

## 13. Estado del gate

**EVIDENCE_CHECKED** certifica que esta versión del índice deriva sus inclusiones de ocurrencias canónicas explícitas y mantiene separadas las notaciones SOURCE_SPECIFIC. No certifica que el índice esté editorialmente cerrado ni hereda, promueve o redefine el gate de las entradas fuente.

La ampliación futura es mantenimiento normal del aparato REF y no obliga a mantener REF-002 en IN_PROGRESS.

## 14. Próxima expansión

Después de integrar las waves activas se debe ejecutar otra pasada sobre:

- perfiles de italiano, francés y alemán;
- mandarín de Taiwán;
- japonés;
- coreano;
- ruso;
- los tres perfiles piloto;
- entradas REP-003…REP-008.

La meta de REF-002 no será “tener muchas formas”, sino garantizar que **cada forma indexada que el lector encuentre pueda rastrearse a una explicación y a un uso concreto**.


## 15. Revisión lingüística wave 01

- **Fecha:** 2026-10-13.
- **Versión revisada:** blob `14489d902b89a69e2d707fc9fa8d98bd75805027`.
- **Resultado:** PASS_WITH_SCOPE_WARNING → `LINGUISTIC_REVIEW`.
- **Objeto revisado:** aparato de consulta vivo; no inventario fonémico de ninguna lengua ni reproducción integral de la tabla IPA.
- **Representación:** se mantiene la distinción entre /fonológico/ y [fonético], y entre símbolos/diacríticos IPA, secuencias compuestas y notaciones SOURCE_SPECIFIC.
- **Atomicidad:** cadenas como `pʰ`, `tʂ` o `tɕʰ` pueden ser formas indexadas sin tratarse como un único símbolo atómico del IPA.
- **Sistemas externos:** Zhuyin y romanizaciones permanecen fuera del índice salvo uso explícito como IPA; `/S/` continúa SOURCE_SPECIFIC.
- **Scope guard:** el índice registra ocurrencias de entradas canónicas sin heredar ni resolver el análisis lingüístico de esas entradas.
- **Advertencia:** la expansión futura del índice es normal para un aparato vivo, pero toda ampliación material deberá volver a comprobar clasificación, nivel de representación y procedencia antes de heredar este gate.
- **Siguiente gate:** EDITORIAL_REVIEW sobre esta versión concreta.


## 16. Revisión editorial wave 01

- **Fecha:** 2026-10-13.
- **Versión revisada:** blob `8eb005f614d2593d79cf0e757e17ef472b27beb6`.
- **Resultado:** PASS_WITH_SCOPE_WARNING → `EDITORIAL_REVIEW`.
- **Claridad:** “forma indexada” funciona como término paraguas para símbolo, diacrítico o secuencia atestiguada sin borrar la distinción técnica entre ellos.
- **Consistencia:** se uniformó el encabezado de tablas y se sustituyeron anglicismos prescindibles en títulos internos (`Seed`, `pool`).
- **Drift resistance:** se eliminaron formulaciones que dependían del estado momentáneo de ZHTW-003; REF-002 describe ahora relaciones por función y alcance.
- **Navegabilidad:** los estados USED / EXPLAINED / SOURCE_SPECIFIC / PENDING_CLASSIFICATION permanecen separados y las exclusiones de Zhuyin, romanización y `/S/` continúan visibles.
- **Cambios lingüísticos:** ninguno; no se añadieron ni reinterpretaron símbolos, transcripciones, fuentes o localizadores.
- **Siguiente gate:** composition readiness sobre esta versión concreta.


## 17. Composition readiness

- **Fecha:** 2026-10-13.
- **Versión evaluada:** blob `bbab709531d29c9b421405c42e8e022583bd0dd5`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION` como aparato de consulta vivo.
- **Reader-facing projection:** §§1–6, §8, §10 y §12. §7, §9, §11 y §§13–17 permanecen como infraestructura/editorial interna en esta versión.
- **Pronunciation Quick Layer:** `NOT_APPLICABLE` — el índice cataloga formas y niveles de representación; no presenta una forma léxica objetivo para respelling.
- **Guard de composición:** no completar el índice, reclasificar formas, convertir notaciones SOURCE_SPECIFIC en IPA ni resolver gates de entradas fuente durante maquetación.
- **Unicode:** preservar símbolos y diacríticos combinantes como Unicode real y evitar separarlos de su base por salto de línea.
- **Handoff:** `composition/handoffs/SND-REF-002.md`.
