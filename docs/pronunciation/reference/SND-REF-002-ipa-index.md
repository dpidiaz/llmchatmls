# SND-REF-002 — Índice IPA de MLS-SND

**Estado:** EVIDENCE_CHECKED.  
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

## 3. Qué registra cada símbolo

Cada registro puede contener:

- **símbolo**;
- **clase IPA**;
- **estatus MLS-SND**;
- **entradas donde aparece**;
- **nivel de representación observado**: /fonológico/, [fonético] o ambos;
- **idioma/variedad**;
- **nota de alcance**;
- **primera evidencia o fuente pertinente**.

El índice no define por sí solo el valor fonético que un símbolo tiene en una lengua concreta.

## 4. Estados del índice

### USED

El símbolo aparece en una entrada MLS-SND integrada.

### EXPLAINED

El símbolo o familia de símbolos está explicado en una entrada de representación aunque todavía no aparezca en un perfil.

### SOURCE_SPECIFIC

La forma pertenece a una convención analítica o notación de una fuente y **no debe asumirse automáticamente como un símbolo IPA autónomo**.

### PENDING_CLASSIFICATION

La forma fue detectada, pero necesita comprobación antes de catalogarse.

## 5. Seed v0.1 — símbolos actualmente observados

Este seed se construyó a partir de entradas ya presentes en `feat/mls-snd-foundation` el 11 de octubre de 2026. Es deliberadamente parcial: se ampliará al integrarse nuevas waves.

| Símbolo | Clase IPA | Estado | Uso observado | Entradas/idiomas | Nota |
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

| Símbolo | Clase IPA | Estado | Uso observado | Entrada | Nota |
|---|---|---|---|---|---|
| `v` | consonante pulmonar | USED | /v/ | SND-RU-007 | La entrada documenta realizaciones debilitadas/aproximantes sin fijar aquí una transcripción fonética más estrecha. |
| `j` | consonante pulmonar/aproximante | USED | /j/ | SND-RU-007 | El índice registra el símbolo; las realizaciones condicionadas siguen perteneciendo a la entrada y su evidencia. |

`vʲ` se representa en MLS-SND como base `v` + marca de palatalización `ʲ`; no se crea un símbolo atómico nuevo.

### Taiwan Mandarin — ocurrencias del mapa segmental en RESEARCHED_PARTIAL

SND-ZHTW-003 es todavía **RESEARCHED_PARTIAL**. Los signos siguientes se indexan como ocurrencias textuales canónicas, pero **su presencia aquí no promueve el análisis segmental ni cierra el gate de la entrada**.

| Símbolo | Clase IPA | Estado | Uso observado | Entrada | Alcance |
|---|---|---|---|---|---|
| `p`, `t`, `k` | consonantes pulmonares | USED | [p], [t], [k] | SND-ZHTW-003 | Miembros no aspirados de pares descritos por Wan et al. (2024). |
| `pʰ`, `tʰ`, `kʰ` | consonantes pulmonares + aspiración | USED | [pʰ], [tʰ], [kʰ] | SND-ZHTW-003 | La aspiración se conserva como `ʰ`; no se interpreta como símbolo independiente de segmento. |
| `tʂ`, `ts`, `tɕ` | secuencias/representaciones consonánticas usadas por la fuente | USED | [tʂ], [ts], [tɕ] | SND-ZHTW-003 | Se conserva la representación escrita en el mapa; REF-002 no decide aquí su análisis fonológico. |
| `tʂʰ`, `tsʰ`, `tɕʰ` | representaciones consonánticas + aspiración | USED | [tʂʰ], [tsʰ], [tɕʰ] | SND-ZHTW-003 | Mismo límite analítico; la entrada fuente sigue pre-gate. |
| `s`, `ʂ`, `ɕ` | consonantes pulmonares | USED | [s], [ʂ], [ɕ] | SND-ZHTW-003 | El mapa conserva variación interhablante/contextual; el índice no la colapsa. |
| `n`, `ŋ` | consonantes pulmonares | USED | /n/, /ŋ/ | SND-ZHTW-003 | Finales estudiadas por Chiu & Lu; el merger documentado es dependiente del contexto y potencialmente incompleto. |
| `ʰ` | diacrítico/modificador | USED | aspiración en [pʰ tʰ kʰ tʂʰ tsʰ tɕʰ] | SND-ZHTW-003 | Se registra por separado para que el lector pueda rastrear la marca. |

**Gate de alcance:** estas filas certifican indexación de signos observados, no suficiencia R33 de SND-ZHTW-003. Si la revisión lingüística cambia la representación adoptada, REF-002 deberá sincronizarse.

## 7. Suprasegmentales y tonos: pool explicado, no inventario de uso

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

**EVIDENCE_CHECKED** certifica que esta versión del índice deriva sus inclusiones de ocurrencias canónicas explícitas y mantiene separadas las notaciones SOURCE_SPECIFIC. No certifica que el índice esté editorialmente cerrado ni que las entradas fuente pre-gate hayan avanzado de estado.

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

La meta de REF-002 no será “tener muchos símbolos”, sino garantizar que **cada signo que el lector encuentre pueda rastrearse a una explicación y a un uso concreto**.
