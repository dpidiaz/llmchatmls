# Coordinador local R33

El comando exacto `R33 local siguiente` usa `tools/r33-local/coordinator.cjs` y reserva lotes locales con worker ID automático. El estado compartido vive bajo `.git/r33-local-coordinator/state.json`, fuera del repositorio. La cola inicial se dividió en diez particiones balanceadas; el piloto limita el trabajo a cinco leases activos de 20 entradas. Cada chat puede reclamar otra asignación después de cerrar la anterior. La integración al checkout de recuperación se serializa y valida por entrada. `VERIFIED` requiere Evidence canónica vigente y `assessEntry` exitoso; los casos sin respaldo quedan como pendientes documentadas.

Estado piloto del 10-10-2026: el checkpoint contenía 2,680 pendientes; cinco ya tenían revisiones locales completas con resultado pendiente de soporte y no necesitan un nuevo lease. Quedan 2,675 por asignar, en particiones de 267 o 268. Se comprobó el asignador con cinco procesos simultáneos: 100 códigos únicos, cinco leases liberados y cero leases activos. Aún no se ha ejecutado la prueba con cinco chats Codex. No se activó la escala a diez.

- MLS-V07-0772: PENDING_SOURCE_SUPPORT; falta estudio acústico de preguntas retóricas en mandarín taiwanés que respalde la generalización prosódica y los ejemplos de la ficha. Un estudio de conversaciones en Taiwán identificado en el resumen examina formas/funciones, no prosodia; el experimento prosódico localizado estudia Standard Chinese, no una muestra taiwanesa. No se modificó artículo ni se creó Evidence canónica. Revisión por entrada: reviews/MLS-V07-0772-revision.json.
- MLS-V07-0770: nueva VERIFIED con la entrada oficial del MOE 法國; la ficha conserva fǎguó, la lectura antigua fàguó y la definición; no atribuye un contorno hablado sin datos fonéticos de esa palabra. APA 7 y cotejo fuente-afirmación aprobados.
- MLS-V07-0771: nueva VERIFIED con Hsu y German (2018), centrada en el diseño y los resultados medidos de foco en sintagmas numeral–clasificador–sustantivo; se retiraron ejemplos genéricos no evaluados por el estudio. APA 7 y cotejo fuente-afirmación aprobados.
- Validación conjunta 2026-10-10: 7453/10,133 VERIFIED, cero errores/advertencias; 2680 pendientes semánticas. Cloudflare/D1: cero; PDFs completos pendientes de actualización.
- MLS-V07-0771: nueva VERIFIED con Hsu y German (2018), artículo primario sobre realización prosódica del foco en mandarín taiwanés. La ficha conserva el diseño numeral–clasificador–sustantivo, las medidas F0/duración/intensidad y resultados por estructura prosódica; se retiraron ejemplos y reglas generales no probados por el experimento. APA 7 y cotejo fuente-afirmación aprobados.
- Validación conjunta 2026-10-10: 7452/10,133 VERIFIED, cero errores/advertencias; 2681 pendientes semánticas. Cloudflare/D1: cero; PDFs completos pendientes de actualización.
- MLS-V07-0769: nueva VERIFIED con la entrada oficial MOE 垃圾; se conservaron pronunciación lè sè, sentido y ejemplo lexicográficos. Se eliminaron comparaciones regionales no respaldadas por esa entrada. APA 7 y cotejo fuente-afirmación aprobados.
- Validación conjunta 2026-10-10: 7451/10,133 VERIFIED, cero errores/advertencias; 2682 pendientes semánticas. Cloudflare/D1: cero; PDFs completos pendientes de actualización.
- MLS-V07-0768: nueva VERIFIED con la entrada del diccionario revisado MOE 和; la ficha solo afirma la lectura hàn para el valor conjuntivo y distingue el ejemplo que el diccionario etiqueta hé. Se retiraron la frecuencia y ejemplos no documentados. APA 7 y cotejo fuente-afirmación aprobados.
- Validación conjunta 2026-10-10: 7450/10,133 VERIFIED, cero errores/advertencias; 2683 pendientes semánticas. Cloudflare/D1: cero; PDFs completos pendientes de actualización.
- MLS-V07-0764: nueva VERIFIED con Huang (2018), estudio acústico primario del tono neutro en mandarín taiwanés. Se limitaron las afirmaciones al tono medio-bajo estático, falta de ascenso pos-tono-3 y a la propuesta de análisis no acentuado, identificada como interpretación de la autora; se quitaron generalizaciones sobre palabras no cotejadas. APA 7 y validador canónico aprobados.
- Validación conjunta 2026-10-10: 7449/10,133 VERIFIED, cero errores/advertencias; 2684 pendientes semánticas. Cloudflare/D1: cero; PDFs completos pendientes de actualización.
- MLS-V07-0760: PENDING_SOURCE_SUPPORT; el diccionario oficial define 兒化音, pero no mide productividad regional ni respalda los ejemplos de comparación Taiwan/Beijing. No se editó el artículo ni se creó Evidence canónica. Revisión por entrada: reviews/MLS-V07-0760-revision.json. Cloudflare/D1: cero.
- MLS-V07-0721: VERIFIED con la entrada oficial MOE 看出; se conservó la definición 察覺 y el ejemplo exacto 可以看出, y se retiraron las generalizaciones sobre 可看出, registro y frecuencia. APA 7 y cotejo fuente-afirmación aprobados.
- MLS-V07-0722: VERIFIED con la entrada oficial MOE 根據; se conservó la definición 憑靠、依據 y el ejemplo policial exacto, y se retiraron las generalizaciones sobre 根據結果, combinaciones y registro. APA 7 y cotejo fuente-afirmación aprobados.
- Validación conjunta 2026-10-10: 7448/10,133 VERIFIED, cero errores/advertencias; 2685 pendientes semánticas. Cloudflare/D1: cero; PDFs completos pendientes de actualización.
- MLS-V07-0528: nueva VERIFIED; reenfocada en el patrón oficial 只有…才… de condición necesaria y su ejemplo documentado. El análisis de Xiang (2019) respalda la distinción de marcadores 只/才, sin generalizarlo a la construcción completa.
- Validación conjunta 2026-10-10: 7,446/10,133 VERIFIED, cero errores/advertencias; 2,687 pendientes semánticas. Cloudflare/D1: cero; PDFs completos pendientes de actualización.
- MLS-V07-0462: nueva VERIFIED; reescrita con Li y Thompson (1978) para relativas prenominales con 的 y elementos no expresos de sujeto/objeto directo; se eliminó la generalización sobre todas las posiciones.
- MLS-V07-0483: nueva VERIFIED; reescrita con Sun (2016), que analiza 紅的 como nominalización no referencial «things that are red»; retiradas glosas singulares no documentadas.
- Validación conjunta 2026-10-10: 7,445/10,133 VERIFIED, cero errores/advertencias; 2,688 pendientes semánticas. Cloudflare/D1: cero; PDFs completos pendientes de actualización.
- MLS-V07-0404: nueva VERIFIED; cotejada con Müller y Lipenkova (2009), incluidos objeto compartido, V1 de adquisición/V2 de disposición y el ejemplo de cocinar para comer. Se separó el ejemplo citado del pedagógico. APA 7 y validación canónica aprobadas.
- Validación conjunta 2026-10-10: 7,443/10,133 VERIFIED, cero errores/advertencias; 2,690 pendientes semánticas. Cloudflare/D1: cero; PDFs completos pendientes de actualización.
- MLS-V07-0524: nueva VERIFIED; entradas oficiales del MOE respaldan los valores de 也 y 不; el análisis de la combinación se limita a una inferencia composicional contextual. Sin afirmaciones de frecuencia o alcance fijo. APA 7 y validación canónica aprobadas.
- Validación conjunta 2026-10-10: 7,442/10,133 VERIFIED, cero errores/advertencias; 2,691 pendientes semánticas. Cloudflare/D1: cero; PDFs completos pendientes de actualización.
- MLS-V07-0448: nueva VERIFIED; se reescribió conforme al artículo de Zhou (2008), que analiza cuatro matices de exhaustividad de 遍. Se eliminó la oposición absoluta con 次 y se identifican los ejemplos como pedagógicos. APA 7 y validación canónica aprobadas.
- Validación conjunta 2026-10-10: 7,441/10,133 VERIFIED, cero errores/advertencias; 2,692 pendientes semánticas. Cloudflare/D1: cero; PDFs completos pendientes de actualización.
- MLS-V07-0759: nueva VERIFIED; se restringió a las fusiones nasales finales condicionadas por [i]/[ə] y al contraste social medido por Hsu y Tse (2007), sin generalizar a otros contextos. Fuente primaria institucional, APA 7 y Evidence cotejadas.
- MLS-V07-0763: nueva VERIFIED; pronunciación qí, sentidos y ejemplos cotejados con la entrada oficial del diccionario MOE. APA 7 y Evidence validadas.
- Validación conjunta 2026-10-10: 7,440/10,133 VERIFIED, cero errores/advertencias; 2,693 pendientes semánticas. Preflight estructural únicamente; Cloudflare/D1: cero. PDFs completos aún pendientes de actualizar.
- MLS-V07-0758: nueva VERIFIED; reescrita con el experimento de foco y medidas acústicas de Hsu y German (2018), limitando resultados al material estudiado. APA 7, Evidence y validadores aprobados; total 7,438 VERIFIED, 2,695 pendientes.
- MLS-V07-0754: PENDING_SOURCE_SUPPORT; las fuentes halladas no sostienen conjuntamente los valores atribuidos a 咧 final en mandarín de Taiwán. Sin cambios al artículo ni Evidence.
- MLS-V07-0755: PENDING_SOURCE_SUPPORT; falta un estudio/corpus que respalde 捏 final como partícula escrita y sus matices pragmáticos. Sin cambios al artículo ni Evidence.
- MLS-V07-0757: PENDING_SOURCE_SUPPORT; el artículo actual excede los hallazgos localizados sobre honh en interacción instructiva. Sin cambios al artículo ni Evidence.
- MLS-V07-0730: revalidada con la acepción 日語べんとう y ejemplo del diccionario MOE; se eliminaron composición fija y generalizaciones culturales no documentadas.
- MLS-V07-0732: revalidada con la entrada MOE que registra hàn como lectura de 和 conjuntiva; se quitaron afirmaciones de frecuencia regional y distribución no descritas por el diccionario. Validador/índices: 7,438 VERIFIED, cero errores/advertencias; 2,695 pendientes. Cloudflare/D1: cero; PDFs pendientes de actualización.
- MLS-V07-0725: Evidence anterior ya decía VERIFIED, pero carecía de localizador; revalidada con definición y ejemplo del diccionario MOE para 敬請. Se reemplazaron la afirmación y el artículo amplios por el contenido respaldado.
- MLS-V07-0726: Evidence anterior ya decía VERIFIED, pero sin localizador; revalidada con el aviso oficial de NERA que dice 請於…前回覆意見. La ficha se limita a esa secuencia temporal y ejemplo.
- MLS-V07-0727: Evidence anterior ya decía VERIFIED, pero sin localizador; revalidada con 謝謝您的協助與配合 en la página oficial del MOEA. Se retiraron las generalizaciones de frecuencia y registro.
- MLS-V07-0728: Evidence anterior ya decía VERIFIED, pero sin localizador; revalidada con la definición documental y el ejemplo de correo del diccionario MOE. Total canónico: 7,437 VERIFIED, 2,696 pendientes; cero errores/advertencias. Cloudflare/D1: cero; PDFs pendientes de actualización.
- MLS-V07-0723: VERIFIED; revisada según definición y ejemplo del diccionario oficial MOE; se retiraron afirmaciones de registro, frecuencia y ejemplos sin respaldo. APA 7 y validadores aprobados; total 7,437 VERIFIED y 2,696 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- MLS-V07-0724: VERIFIED; se limitó al ejemplo de correo institucional que termina en 敬祝 身體健康，順心如意 (Zhong, 2006, p. 52); se quitaron generalizaciones y fórmulas no cotejadas. APA 7 y validadores aprobados; 7,437 VERIFIED y 2,696 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- MLS-V07-0721: PENDING_SOURCE_SUPPORT; el diccionario respalda 看出/可以看出, no la construcción exacta 可看出 ni las generalizaciones del artículo. No se cambió el artículo ni se añadió Evidence canónica.
- MLS-V07-0722: PENDING_SOURCE_SUPPORT; el diccionario respalda 根據 y un ejemplo con 通報, pero no 根據結果 ni los ejemplos estadísticos. No se cambió el artículo ni se añadió Evidence canónica.
- Entrada MLS-V07-0575: VERIFIED con Liu (2018, §6, ejemplo 31); el artículo se limita a la estructura con 來 de finalidad y a su dependencia contextual. Validador/índices: 7435 VERIFIED; preflight: 2698 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Entrada MLS-V07-0719: VERIFIED con la definición y el ejemplo oficiales de 認為 del MOE; se retiraron las generalizaciones de registro y contrastes léxicos no cubiertos. Validador/índices: 7435 VERIFIED; preflight: 2698 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Entrada MLS-V07-0550: VERIFIED tras reducir la ficha a la lectura átona, la función de partícula final equivalente a 了/啦 y los ejemplos 來囉/看見囉 del diccionario oficial del MOE. Se eliminaron los ejemplos y generalizaciones no respaldados. Validador/índices: 7433 VERIFIED, cero errores/advertencias; preflight: 2700 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Entrada MLS-V07-0549: VERIFIED tras ajustar la explicación de 嘛 al estudio de corpus de Lepadat (2017, ejemplo 20, §§1, 4.4 y 5); se retiraron ejemplos no localizados y la distinción ortográfica no respaldada. Validador/índices: 7432 VERIFIED, cero errores/advertencias; preflight estructural: 2701 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Lote de revisión MLS-V07-0345 y MLS-V07-0646: dos fichas VERIFIED tras cotejo con Wang (2006, complemento direccional 起), Wang (2021, 著/了 existencial) y Shi (2002); se retiraron los ejemplos creados que carecían de apoyo. Validador/índices: 7431 VERIFIED, cero errores/advertencias; preflight estructural: 2702 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Entrada MLS-V07-0646: VERIFIED con el contraste de 著/了 en construcciones existenciales cotejado con Wang (2021, §4.3) y Shi (2002); se eliminó el ejemplo no respaldado de 著 + 了 final. Validador/índices: 7430 VERIFIED, cero errores/advertencias; preflight estructural: 2703 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Entrada MLS-V07-0645: VERIFIED con dos ejemplos de 沒在 progresivo cotejados en la disertación de Yang (2012, §7.8); se retiraron generalizaciones de frecuencia y distribución taiwanesa no sustentadas por esa fuente. Validador/índices: 7429 VERIFIED, cero errores/advertencias; preflight estructural: 2704 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Entrada MLS-V07-0495: VERIFIED con dos estudios revisados por pares (An, 2021; Zhang y Lee, 2018); se corrigió el análisis de 除非…才… y se retiraron ejemplos sin fuente directa. Validador/índices: 7428 VERIFIED, cero errores/advertencias; preflight estructural: 2705 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Lote MLS-V07-0438–0439: dos revisiones VERIFIED con Lu y Müller (2026), *Journal of Linguistics*; 0438 precisa la compatibilidad de 了 frente a otros marcadores aspectuales y 0439 limita el alcance al sentido delimitativo. Validador/índices: 7427 VERIFIED, cero errores/advertencias; preflight estructural: 2706 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Lote de conectores MLS-V07-0652–0655–0656–0657: 4 fichas VERIFIED, acotadas a las acepciones y ejemplos del diccionario oficial MOE (2021). Validador/índices: 7425 VERIFIED, cero errores/advertencias; preflight estructural: 2708 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Entrada MLS-V07-0653: revisión con Fang (2013), estudio comparativo de corpus oral; la descripción de 耶 se limita al uso coloquial e íntimo documentado. Validador/índices: 7421 VERIFIED, cero errores/advertencias; preflight estructural: 2712 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Entrada MLS-V07-0552: revisión con Fang (2013), estudio comparativo de corpus oral; la descripción de 耶 se limita al uso coloquial e íntimo documentado. Validador/índices: 7420 VERIFIED, cero errores/advertencias; preflight estructural: 2713 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Entrada MLS-V07-0552: revisión con Fang (2013), estudio comparativo de corpus oral; la descripción de 耶 se limita al uso coloquial e íntimo documentado. Validador/índices: 7420 VERIFIED, cero errores/advertencias; preflight estructural: 2713 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Entrada MLS-V07-0551: acotada a la acepción de 欸 (èi) para respuesta/llamada y al ejemplo del diccionario MOE. Validador/índices: 7419 VERIFIED, cero errores/advertencias; preflight estructural: 2714 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Entrada MLS-V07-0641: acotada a la definición oficial de 已經 y al ejemplo 他已經去過日本了 de NAER. Validador/índices: 7418 VERIFIED, cero errores/advertencias; preflight estructural: 2715 pendientes. Cloudflare/D1: cero; PDF pendiente de refresco.
- Lote MLS-V07-0642–0643: dos fichas VERIFIED con los ejemplos y puntuaciones exactos de la tabla 2 de Chen (2012), encuesta de 94 participantes. Validador/índices: 7417 VERIFIED, cero errores/advertencias; preflight: 2716 pendientes (solo estructural). Cloudflare/D1: cero; PDF pendientes de refresco.
- Lote MLS-V07-0620–0622: tres fichas VERIFIED con el curso MIT OCW y los pasajes de Jiang (2007) y Zhou (2014). Validador e índices: 7415 VERIFIED, cero errores/advertencias; preflight estructural: 2718 pendientes (no demuestra entailment). Cloudflare/D1: cero; PDF pendientes de refresco.
- Lote MLS-V07-0617–0618: ambas fichas VERIFIED con ejemplos exactos y categorías de complementos de estado/potencial de Jiang (2007). Validador e índices: 7412 VERIFIED, cero errores/advertencias; preflight estructural: 2721 pendientes (no demuestra entailment). Cloudflare/D1: cero; PDF pendientes de refresco.
- Entrada MLS-V07-0582: VERIFIED con el ejemplo académico「我借了一本书给他」y la ambigüedad借-in/借-out documentada por Zhang (2020). Validador/índices: 7406 VERIFIED, cero errores/advertencias; preflight estructural: 2727 pendientes (no es validación semántica). Cloudflare/D1: cero; PDF no regenerados.

- Lote MLS-V07-0605–0607: tres entradas VERIFIED con ejemplos exactos de Gao et al. (2022) y del manual universitario Boya (2012). Validador/índices: 7405 VERIFIED, cero errores/advertencias; preflight estructural: 2728 pendientes (no es validación semántica). Cloudflare/D1: cero; PDF no regenerados.

- Lote seleccionado MLS-V07-0583–0589: 0583, 0585, 0586, 0588 y 0589 quedaron VERIFIED con ejemplos del compendio oficial NAER (2021). Validador/índices: 7402 VERIFIED, cero errores/advertencias; preflight estructural: 2731 pendientes. 0582 sigue pendiente por falta de ejemplo V+objeto+給+persona. Cloudflare/D1: cero; PDF no regenerados.

- Lote seleccionado MLS-V07-0608–0609: ambas fichas se redujeron a los ejemplos publicados 聊了一会儿天 y 见了一次面 en Pang y Zhang (2022), *外国语*, 45(2), 72–83. Validador/índices: 7397 VERIFIED, cero errores/advertencias; preflight estructural: 2736 pendientes. Cloudflare/D1: cero; PDF no regenerados.

- Lote MLS-V07-0594–0597: cuatro entradas VERIFIED con alcance acotado a manuales oficiales de OCAC (上班, 上課, 下班) y el estudio universitario de Zhang (下了課 como ítem de inserción de 了). Validador e índices: 7410 VERIFIED, cero errores/advertencias; preflight estructural: 2723 pendientes (no demuestra entailment). Cloudflare/D1: cero; PDF pendientes de refresco.

- Lote seleccionado MLS-V07-0591–0592: ambas entradas se limitaron a ejemplos de expresiones separables V-O y componentes de medida citados en el estudio de Chen (2013). Validador e índices: 7395 VERIFIED, cero errores/advertencias; preflight estructural: 2738 pendientes (no certifica entailment). Cloudflare/D1: cero interacciones. PDF pendiente de refresco.

- Lote seleccionado MLS-V07-0580–0590: 0580, 0581, 0587 y 0590 quedaron VERIFIED con ejemplos institucionales de NAER y el Ministerio. Validador e índices: 7393 VERIFIED, cero errores/advertencias; preflight: 2740 pendientes. 0582, 0585, 0586, 0588 y 0589 siguen sin certificación. Cloudflare/D1: cero interacciones. PDF pendiente de refresco.

- Lote seleccionado MLS-V07-0570–0578: 0570, 0571, 0572, 0573, 0576, 0577 y 0578 quedaron VERIFIED con los pasajes exactos de NAER y Pan y Liu (2023); 0574 y 0579 ya estaban VERIFIED. Validador e índices: 7389 VERIFIED, cero errores/advertencias; preflight: 2744 pendientes. Cloudflare/D1: cero interacciones. PDF pendiente de refresco.

- Lote seleccionado MLS-V07-0561–0569: siete entradas VERIFIED con definiciones y ejemplos lexicográficos oficiales. Validador e índice: 7.382 VERIFIED, cero errores/advertencias; preflight: 2751 pendientes. Cloudflare/D1: cero interacciones. PDF sin regenerar.

- Lote seleccionado MLS-V07-0538–0554: tres entradas VERIFIED con el contraste de alcance de The Open University y definiciones oficiales del Ministerio. Validador e índice: 7.375 VERIFIED, cero errores/advertencias; preflight: 2758 pendientes. Cloudflare/D1: cero interacciones. PDF sin regenerar.

- Lote seleccionado MLS-V07-0545–0566: ocho entradas VERIFIED con definiciones y ejemplos lexicográficos oficiales. Validador e índice: 7.372 VERIFIED, cero errores/advertencias; preflight: 2761 pendientes. Cloudflare/D1: cero interacciones. PDF sin regenerar.

- Lote MLS-V07-0533–0536: cuatro entradas quedaron VERIFIED con estructuras, definiciones y ejemplos explícitos de NAER/Ministerio. Validador e índice: 7.364 VERIFIED, cero errores/advertencias; preflight: 2769 pendientes. Cloudflare/D1: cero interacciones. PDF sin regenerar.

- Lote MLS-V07-0521–0531: ocho entradas quedaron VERIFIED, limitadas a ejemplos y glosas explícitos de NAER/Ministerio. MLS-V07-0524 y 0528 permanecen PENDING_SOURCE_SUPPORT por falta de un ejemplo institucional de la forma exacta. Validador e índice: 7.360 VERIFIED, cero errores/advertencias; preflight: 2773 pendientes. Cloudflare/D1: cero interacciones. PDF sin regenerar.

- Lote MLS-V07-0521–0531: ocho entradas quedaron VERIFIED, limitadas a ejemplos y glosas explícitos de NAER/Ministerio. MLS-V07-0524 y 0528 permanecen PENDING_SOURCE_SUPPORT por falta de un ejemplo institucional de la forma exacta. Validador e índice: 7.360 VERIFIED, cero errores/advertencias; preflight: 2773 pendientes. Cloudflare/D1: cero interacciones. PDF sin regenerar.

- Lote MLS-V07-0490–0501: nueve entradas quedaron VERIFIED con patrones, definiciones y ejemplos de NAER/Ministerio. MLS-V07-0495 sigue PENDING_SOURCE_SUPPORT porque el material localizado documenta 除非……否則……, no 除非……才……. Validador e índice: 7.352 VERIFIED, cero errores/advertencias; preflight: 2781 pendientes. Cloudflare/D1: cero interacciones. PDF sin regenerar.

- Lote MLS-V07-0479–0489: nueve entradas quedaron VERIFIED con patrones y ejemplos acotados a fuentes primarias de NAER y del Ministerio de Educación. MLS-V07-0483 queda PENDING_SOURCE_SUPPORT: la fuente localizada documenta 藍的, no 紅的. Validador e índice: 7.343 VERIFIED, cero errores/advertencias; preflight: 2790 pendientes. Cloudflare/D1: cero interacciones. PDF sin regenerar.

- Lotes 0420–0466: 25 entradas nuevas quedaron VERIFIED con afirmaciones acotadas a ejemplos/definiciones de NAER o del Ministerio. 0425–0430 ya tenían Evidence canónica y se dejaron intactas. 0421, 0438, 0439, 0448 y 0462 se mantienen PENDING_SOURCE_SUPPORT, sin Evidence nueva. El índice registra 7.334 VERIFIED, cero errores/advertencias; el preflight cuenta 2799 pendientes. Cloudflare/D1: cero interacciones. PDF sin regenerar.

- Lote 0420–0452: se añadieron 11 validaciones con fuentes institucionales, restringiendo cada artículo a ejemplos localizados. 0425–0430 ya tenían Evidence canónica y se dejaron intactas. 0421, 0438, 0439 y 0448 permanecen PENDING_SOURCE_SUPPORT; no se creó Evidence para ellas. El índice registra 7.324 VERIFIED, cero errores/advertencias; el preflight cuenta 2809 pendientes. Cloudflare/D1: cero interacciones. PDFs sin regenerar.

- Lote 0420–0430: cuatro entradas nuevas (0420, 0422–0424) fueron ajustadas y validadas con ejemplos oficiales de NAER. 0425–0430 ya tenían Evidence canónica y se dejaron intactas. 0421 queda PENDING_SOURCE_SUPPORT: falta fuente primaria para la cantidad diferencial del patrón A比B+adjetivo. El índice canónico registra 7.313 VERIFIED, cero errores/advertencias; preflight: 2820 pendientes. Cloudflare/D1: cero interacciones. Los PDF no se regeneraron.

# MLS R33 — Continuidad en una computadora

Rama: `feat/r33-local-recovery`. Base: `5bee9a8530d07cea2bf2c82ed409278a70da2c10` de `main`.

Objetivo: respaldar las 10.133 entradas mediante fuentes trazables que sostengan sus afirmaciones y presentar referencias APA 7 en los diez PDF completos.

## Estado actual — continuación local, 10 de octubre de 2026

**7,382/10.133 VERIFIED; 2751 pendientes.** El validador R33 canónico y los índices pasan sin errores ni advertencias. Los lotes MLS-V07-0292–0297 y MLS-V07-0317–0322 validaron diez entradas con el manual de gramática y el recurso de complementos resultativos del Centre for Teaching Chinese as a Foreign Language de Oxford, acotando las reglas a los ejemplos localizados. Los lotes 0323–0339 validaron quince entradas adicionales sobre complementos direccionales. El lote 0341–0345 validó cuatro entradas; 0345 sigue pendiente porque las fuentes primarias consultadas no sostienen el significado ascendente ni los ejemplos del artículo. El lote 0346–0352 añadió seis validaciones basadas en los ejemplos exactos del manual de Oxford. La entrada 0353 documenta con una fuente editorial primaria la extensión continuativa de 下去. En 0354 se validó un uso inferencial de 出來 con material docente de la Universidad de Washington; 0355 y 0356, que ya constaban VERIFIED, se revalidaron con ejemplos de manuales oficiales/editoriales. La entrada 0357 valida el uso de 過來 para volver a un estado previo con la acepción y el ejemplo del diccionario del Ministerio de Educación de Taiwán. La entrada 0358 corrige una comparación exagerada entre complemento potencial y 能, limitándola a la regla y los ejemplos verificables de Oxford. Las entradas 0359, 0361 y 0362 se cotejaron con ejemplos de la gramática de Oxford; 0361 ya estaba VERIFIED y se revalidó. La entrada 0360 quedó validada con ejemplos del material docente de Middlebury. Las entradas 0363–0365 se cotejaron con ejemplos localizados de la gramática de Oxford. Las entradas 0366 y 0367 se limitaron a ejemplos localizados de complementos potenciales de Oxford. Las entradas 0368–0370 se cotejaron con ejemplos localizados del Taiwan Mandarin Educational Resources Center y Oxford. Las entradas 0372–0376 se cotejaron con ejemplos de la página oficial de ejercicios de Oxford; 0376 ya constaba VERIFIED y se revalidó. Las entradas 0377 y 0378 se ajustaron y validaron con los contrastes de la página de ejercicios de Oxford. El preflight registra 2.857 pendientes; siguiente: 0379. Cloudflare/D1: cero interacciones.

## Estado del checkpoint anterior — 9 de octubre de 2026

El validador R33 canónico registra 7.094 de 10.133 entradas como `VERIFIED` (70,01 %); quedan 3.039 fuera del índice. El tramo local 0449–0710 conserva registros por entrada. El lote 0701–0710 añadió nueve Evidence con 45 afirmaciones cubiertas y preflight R4 aprobado. La compilación PDF más reciente corresponde al checkpoint anterior (0676–0700); falta integrar 0701–0710.

Los diez PDF completos se regeneraron: 10,133 páginas nuevas, una por entrada, 7.097 referencias APA 7 y 30,381 enlaces relacionados; hay cero enlaces rotos y cero desajustes de título. Se conservan los volúmenes originales, capítulos y banderas. Las 140 versiones antiguas de PDF siguen señaladas; la comparación registra 9.991 versiones exactas y 142 distintas. El validador canónico de Evidence terminó con cero errores y advertencias; los checks Gate 500 y Gate 1000 aún señalan `CONTENT_BLOB_DRIFT`, por lo que no se consideran validados. Cloudflare y D1 registran cero interacciones/escrituras. El checkpoint detalla hashes y conteos.

## Empezar

Se necesita Git, Python 3.11 o posterior, espacio suficiente para el backup y SQLite local, y conexión gratuita a las fuentes que se investiguen. Importar el SQL requiere RAM suficiente para leer el export de unos 342 MB. La auditoría utiliza solo la biblioteca estándar de Python; no necesita claves ni cuenta de Cloudflare.

```bash
git clone --branch feat/r33-local-recovery --single-branch https://github.com/dpidiaz/llmchatmls.git
cd llmchatmls
python tools/r33-local/import_backup.py --sql /ruta/al/backup.sql
python tools/r33-local/auditar_r33.py
python tools/r33-local/preparar_reparaciones.py
```

Si la computadora ya tiene el repositorio, usar `git fetch origin feat/r33-local-recovery` y cambiar a esa rama cuando no haya cambios locales pendientes. No sobrescribir otro trabajo.

El SQL está en `MLS-backup.zip`, entregado en la conversación de recuperación. Conservarlo intacto; `checkpoint.json` contiene su SHA-256 esperado. El importador crea una base nueva y rechaza sobrescrituras. No añadir el SQL o la base SQLite al repositorio.

Para una base SQLite ya importada, omitir el importador:

```bash
python tools/r33-local/auditar_r33.py --database /ruta/al/mls.sqlite
python tools/r33-local/preparar_reparaciones.py --database /ruta/al/mls.sqlite
```

Todos los resultados se generan en `tools/r33-local/workspace/output/r33/`, excluido de Git. Se puede cambiar con `--output`; usar el mismo destino en los dos scripts. Las bases se abren en modo lectura para la auditoría y la preparación.

### Último registro por entrada

`MLS-V07-0011` tiene evidencia y revisión semántica detallada en `reviews/MLS-V07-0011-revision.json`. El ejemplo moderno 日 + 月 para 明 se conserva solo como explicación didáctica de 六書 y se distingue de la forma antigua 朙 descrita por el diccionario oficial. `MLS-V07-0012` tiene su revisión en `reviews/MLS-V07-0012-revision.json`; se retiraron afirmaciones no respaldadas sobre memoria, fluidez y reconocimiento, y se dejó 三 como ejemplo explícito de la regla oficial. `MLS-V07-0013` reemplaza ejemplos no confirmados con 仁 y 川, citados literalmente por el Ministerio para la regla de izquierda a derecha. `MLS-V07-0014` `MLS-V07-0016` y `MLS-V07-0017`, `MLS-V07-0018` y `MLS-V07-0019` `MLS-V07-0020` y `MLS-V07-0021` y `MLS-V07-0022` y `MLS-V07-0023` y `MLS-V07-0024` corrige la diferencia entre el colon chino de ancho completo y el símbolo español ASCII, y valida los usos con el manual oficial. `MLS-V07-0016` acota sus afirmaciones de escritura horizontal a las direcciones que sí especifican las normas gubernamentales consultadas. `MLS-V07-0017` documenta el orden vertical de lectura conforme a la norma de tránsito taiwanesa. `MLS-V07-0018` y `MLS-V07-0019` usan las reglas oficiales sobre contornos y trazos horizontales/verticales; se retiraron ejemplos no citados y explicaciones causales sin respaldo. `MLS-V07-0020` repara además un artículo truncado y resume el concepto con la definición y las 17 reglas del Ministerio. `MLS-V07-0021` corrige la ubicación tipográfica del punto chino según el manual (centrado en la celda, no abajo). `MLS-V07-0022` contrasta cinco signos con las reglas específicas del manual de puntuación, sin generalizar el ancho de todos los signos. `MLS-V07-0023` elimina generalizaciones sobre logogramas, sílabas y bloques cuadrados y ajusta el apartado de 部首 a lo que documenta el diccionario. `MLS-V07-0024` (revalidada; ya constaba en el índice) distingue la función clasificatoria de 部首 de los componentes semánticos y fonéticos de 河.

### Preflight automático de la cola pendiente

Desde la raíz del repositorio, ejecuta `node tools/r33-local/preflight_pendientes.cjs`. El script recorre el corpus contra el índice canónico, compara la versión del artículo con Evidence, comprueba la cobertura estructural, fuentes APA y conflictos, y guarda un resultado JSONL por entrada en `tools/r33-local/workspace/output/r33-preflight/`. Es de solo lectura: no modifica Evidence, el índice, Cloudflare ni D1, y nunca asigna `VERIFIED`. Pasar hashes y estructura no demuestra que una fuente sostenga semánticamente una afirmación; esos casos quedan identificados como pendientes de revisión de contenido.

## Estado entregado

- Diagnóstico completo: 229 entradas con fuentes vinculadas a su versión actual; 15 con evidencia antigua; 4.338 con referencias candidatas; 5.551 sin referencias identificadas en los campos inspeccionados.
- 225 diferencias entre estados resumidos y registros de afirmaciones.
- 8.406 recibos R44 recuperables y 1.476 propuestas preview.
- Revisiones locales en `reviews/`: abecedario español contrastado y propuestas parciales para `celui-ci / celui-là` y la clasificación acentual de `contándoselo`. El lote de `MLS-V10-0051` contrastó también enclisis/proclisis, imperativos negativos y voseo guatemalteco con el DPD y la NGLE; esos hallazgos locales no amplían la Evidence canónica.
- **Veintitrés entradas nuevas validadas canónicamente en este checkpoint:** `MLS-V10-0416`, `MLS-V10-0417`, `MLS-V10-0420`–`MLS-V10-0424`, `MLS-V10-0426`–`MLS-V10-0429`, `MLS-V10-0431`, `MLS-V10-0432`, `MLS-V10-0434`–`MLS-V10-0437` y `MLS-V10-0441`, `MLS-V10-0444`–`MLS-V10-0448`. 0432 quedó en 8/8 afirmaciones con localizadores NGLE §§23.1g/h, 23.16ñ/q/r/s/w/y; 0435 en 10/10 con NGLE §§24.3 y 24.5; 0436 en 11/11 con §24.4; 0437 en 12/12 con §24.5 y el DPD; 0441 en 16/16 con §24.8 y el DPD voseo. Las entradas 0425, 0430, 0438–0440 y 0442–0443 ya eran VERIFIED y se revalidaron con cobertura ampliada; 0439 quedó en 15/15, 0440 en 15/15, 0442 en 16/16 y 0443 en 20/20, con preflight aprobado y localizadores RAE/ASALE. El validador canónico informa 6.923 entradas VERIFIED, 0 errores y 0 advertencias. 0438 pasó de 1 a 13 afirmaciones y 0425 quedó en 9/9.
- `MLS-V10-0433` ya estaba VERIFIED; se revalidaron once afirmaciones, se ajustaron ejemplos voseantes a las formas documentadas para Guatemala y se enlazaron la NGLE, el DPD y las tablas académicas de conjugación. El estado global era 6.917 tras validar 0434–0437 y subió a 6.918 al validar 0441; luego aumentó a 6.923 al validar 0444–0448. Las revalidaciones de 0439, 0440, 0442 y 0443 no aumentaron el total.
- La base local se recuperó desde el SQL con el SHA esperado y pasó la comprobación de integridad de SQLite. La comparación actualizada con los artículos y Evidence canónicos encontró 9.991 versiones del backup iguales a la versión canónica y 142 distintas. Hay 6.923 entradas VERIFIED en el índice canónico y 6.783 versiones del backup cuya Evidence VERIFIED corresponde a la versión actual; no se reutilizaron estados del backup como certificaciones nuevas.
- Se compilaron los diez PDF completos en `output/pdf/`: un apéndice final de 10.133 páginas (una por entrada), 6.916 referencias APA 7 y 30.381 enlaces internos. El cuerpo, los capítulos y la paginación del índice original quedan intactos; cada apéndice identifica su entrada por código y enlaza las entradas relacionadas. El manifiesto registra cero enlaces rotos y cero títulos discrepantes. Las 140 entradas VERIFIED cuyo PDF corresponde a una versión anterior se marcan sin atribuirles fuentes de la versión nueva. Las páginas 0432, 0435, 0436 y 0438–0443 muestran evidencia y referencias APA 7; las páginas 0433, 0434 y 0437 quedan marcadas porque sus artículos canónicos difieren del backup.
- La revisión sustantiva sigue parcial: quedan 3.210 entradas sin `VERIFIED`, además de conflictos, discrepancias y fuentes por validar. Los PDF son salidas editoriales, no una validación R33. Las entradas verificadas cuya versión del PDF de backup difiere de la canónica permanecen señaladas y sin reutilizar fuentes de la versión nueva.
- El conflicto del backup para `MLS-V10-0051` se contrastó con la RAE: `contándoselo` se analiza como sobresdrújula. Se guardó una propuesta por entrada; el artículo canónico y su Evidence permanecen sin cambios hasta la validación canónica.

La auditoría reconstruye el CSV individual y los datos recuperados desde el SQL, sin publicarlos. La preparación reconstruye 10.133 apartados de fuentes como datos separados y 102 lotes con código, fecha y hash. Los paquetes ya entregados `MLS-R33-diagnostico-y-recuperacion.zip` y `MLS-coleccion-completa.pdfs.zip` sirven para recuperar los resultados y el generador editorial; sus hashes constan en `checkpoint.json`.

## Contratos de esta rama

Este trabajo local de recuperación fue autorizado expresamente. No es una invocación de MLS Unified, MLS R44 ni del Dispatcher. No ejecutar sus comandos para obtener tareas locales, ni reactivar runners, procesos de fondo, Cloudflare o escrituras D1.

- FREE ONLY: sin OpenAI API, otras APIs de IA de pago, TinyFish ni servicios de pago.
- Comparar el backup con el contenido y Evidence canónicos de esta rama antes de integrar. El backup no sustituye una versión GitHub más reciente.
- Leer el contrato R33 existente y su validador antes de declarar `VERIFIED`. El índice canónico `MLS R32 EDITORIAL/evidence git/indexes/verified.json` debe reconciliarse por versión; este diagnóstico no reemplaza esa autoridad.
- `AUDITED_DURABLE`, una bibliografía y una compilación correcta no equivalen a validación R33.
- Toda revisión debe guardar código, fecha, hash original, hash final si cambia el texto, afirmaciones, fuentes, localizadores, método, resultados y contradicciones.
- Conservar los textos originales y separar propuestas. No aplicar automáticamente correcciones preview ni rehabilitar cuarentenas por su cuenta.
- Un PDF completo por idioma, sin volúmenes; cada entrada comienza en página nueva; capítulos numerados, banderas, resúmenes legibles y navegación.
- Las entradas relacionadas deben enlazar a su destino y validarse por cobertura, además de ausencia de enlaces rotos. Los PDF quedan pendientes de refresco para MLS-V10-0455 y MLS-V10-0517 por el cambio de texto y de Evidence.
- Guardar avances locales por entrada y hacer commits revisables por lote. No hacer push continuo por cada consulta, ni merge o despliegue automático.

## Orden de trabajo

1. Inventariar contenido y Evidence de GitHub, comparar hashes con el backup y evitar regresiones.
2. Resolver los dos conflictos documentados y las 225 discrepancias de estado.
3. Validar todas las afirmaciones sustanciales de las 229 entradas con fuentes actuales.
4. Contrastar referencias recuperadas: leer fuentes y comprobar cada afirmación y localizador.
5. Investigar las entradas restantes. Registrar bloqueos reales sin inventar citas ni páginas.
6. Revisar APA 7; presentar el estado de evidencia y las referencias en cada entrada.
7. Regenerar los diez PDF desde las versiones aceptadas, verificar contenido y navegación, y revisar muestras visuales.

Priorizar resultados verificables; no declarar el lote completo porque solo parte de sus entradas pasó. Los artefactos de `reviews/` guardan la validación canónica por entrada y la propuesta no aceptada para 0455.

## Instrucción para continuar con Codex local

> Trabaja en `feat/r33-local-recovery`. Lee `AGENTS.md`, este README y `checkpoint.json`. Usa el backup local para reconstruir la auditoría y la cola sin conectar a Cloudflare. Compara primero los hashes y la Evidence canónica de GitHub. Continúa por lotes con revisiones de afirmaciones y fuentes, preservando los checkpoints por entrada. No declares VERIFIED sin ejecutar el contrato R33 aplicable y conservar su evidencia. Mantén FREE ONLY. Integra los apartados APA 7 y los enlaces relacionados en el generador PDF local. Conserva diez PDF completos, una entrada por página nueva, capítulos numerados y banderas. No despliegues ni fusiones a main.

- Lote siguiente: MLS-V10-0552 y MLS-V10-0554–MLS-V10-0557 quedaron VERIFIED tras revisión acotada de una afirmación por entrada contra la NGLE §§32.2–32.6. MLS-V10-0553 y MLS-V10-0558–MLS-V10-0559 ya tenían estado VERIFIED. El validador global informa 6.983 VERIFIED de 6.985 registros Evidence, cero errores/advertencias y cero interacciones Cloudflare/D1. Gate 500/1000 informan CONTENT_BLOB_DRIFT; se conserva esa alerta. Los diez PDF se regeneraron con 6.982 referencias APA 7, 30.381 enlaces y cero destinos rotos.\n

- Lote 0566–0571: 0566, 0568, 0569 y 0571 quedaron `VERIFIED` con claims y localizadores RAE/ASALE. La revisión de 0570 detectó que el artículo atribuye más plural a la posición posverbal, mientras la NGLE §33.8a especifica que la alternancia se da con independencia de la posición; se guardó una propuesta de corrección local y no se creó Evidence. El estado global es 6.992 VERIFIED de 6.994 entradas Evidence. Los diez PDF contienen 6.996 referencias APA 7 y 30.381 enlaces relacionados sin destinos rotos.

- Lote 0566–0571: 0566, 0568, 0569 y 0571 quedaron `VERIFIED` con claims y localizadores de la *Nueva gramática de la lengua española. Manual* (2010); el DPD respalda los ejemplos voseantes. La revisión de 0570 detectó que el artículo atribuye mayor frecuencia de plural a la posición posverbal, mientras la NGLE §33.8a establece que la alternancia se da con independencia de la posición. Se guardó una propuesta local y no se creó Evidence canónica. Se recalcularon los hashes del backup; 6.852 entradas PDF pueden reutilizar Evidence de versión exacta y 140 versiones antiguas siguen marcadas.

- Lote 0573–0577: las cinco entradas quedaron `VERIFIED` tras cobertura completa, preflight R4 y validación del índice Git. Se usaron localizadores de la NGLE Manual §§34.1.2, 34.2.1–34.2.2, 34.3.1–34.3.2, 34.4.2, 16.4–16.6, y NGLE §43.2.3; no se modificó contenido canónico. Global: 6.997 `VERIFIED`, cero errores/advertencias, cero interacciones Cloudflare/D1. Los diez PDF completos se regeneraron con 7,008 referencias APA 7, 30,381 enlaces internos, cero enlaces rotos y cero títulos discrepantes.

- Lote 0578–0586: nueve Evidence contrastadas con la *Nueva gramática de la lengua española* (RAE/ASALE, 2009), capítulos 34.1, 34.3–34.7, 34.8–34.11; se ampliaron los claims de seis artefactos existentes y se crearon tres Evidence que faltaban. Todas pasaron preflight R4, cobertura completa y validación canónica. El índice global quedó en 7.003 `VERIFIED`, cero errores/advertencias e interacciones Cloudflare/D1. Los diez PDF completos se regeneraron con 7.008 referencias APA 7 y 30.381 enlaces internos, sin enlaces rotos ni títulos discrepantes; se conserva una página nueva por entrada.

- Lote 0587–0589: las tres entradas quedaron `VERIFIED` tras contrastar 0587 con *Nueva gramática de la lengua española. Manual* (2010), §34.7.2, y 0588–0589 con la entrada oficial «Complemento indirecto» del *Glosario de términos gramaticales* de RAE/ASALE. Las diez afirmaciones pasaron cobertura completa, preflight R4 y validación canónica. El índice global quedó en 7.006 `VERIFIED`, con cero errores/advertencias e interacciones Cloudflare/D1. Los diez PDF se regeneraron con 7.011 referencias APA 7, 30.381 enlaces internos, cero enlaces rotos y cero títulos discrepantes. Continúa desde MLS-V10-0590; las verificaciones Gate 500/1000 con `CONTENT_BLOB_DRIFT` siguen fuera de estado validado.

- Lote 0591–0593: las quince afirmaciones quedaron cubiertas con la NGLE Manual, el GTG de RAE/ASALE y el DPD, segunda edición de 2025. Se documentaron grupos con *a*, diferencias frente a la *a* personal y grupos con *para*, duplicación de clíticos y variación del voseo en Guatemala. Las tres Evidence pasaron preflight R4 y validación canónica; el índice global quedó en 7.009 `VERIFIED`, con cero errores/advertencias e interacciones Cloudflare/D1. Los diez PDF se regeneraron con 7.019 referencias APA 7, 30.381 enlaces relacionados y cero enlaces rotos o títulos discrepantes.

- Lote 0596–0598: se añadieron 13 afirmaciones sobre dativo ético/concordado y complemento de régimen preposicional, contrastadas con la *Nueva gramática de la lengua española. Manual* (RAE/ASALE, 2010), §§35.4 y 36.1–36.4, y el DPD, segunda edición, para los ejemplos voseantes. Las tres Evidence pasaron preflight R4 y validación canónica; el índice global quedó en 7.012 `VERIFIED`, cero errores/advertencias e interacciones Cloudflare/D1. Los diez PDF se regeneraron con 7.097 referencias APA 7, 30.381 enlaces relacionados y cero enlaces rotos o títulos discrepantes.


- Lote 0600–0606 (entradas nuevas 0600–0602 y 0606; 0603–0605 ya estaban VERIFIED): las cuatro Evidence nuevas pasaron cobertura completa, preflight R4 y validador canónico con la NGLE Manual §§36.1–36.4 y 37.1. El índice quedó en 7.016 VERIFIED de 7.018 registros Evidence, con cero errores/advertencias e interacciones Cloudflare/D1. Los diez PDF se regeneraron con 7.097 referencias APA 7, 30.381 enlaces relacionados, cero enlaces rotos y cero títulos discrepantes. Continúa la revisión de las entradas restantes; no se declara cobertura total todavía.


- Lote 0607–0609: las tres Evidence nuevas pasaron cobertura completa, preflight R4 y validación del índice canónico con la NGLE Manual §§37.1–37.6 y 38.1–38.4. Las afirmaciones cubren función y formas del atributo, concordancia y sustitución por lo, construcciones copulativas y semicopulativas, y la distinción frente a complementos predicativos. El índice global quedó en 7.019 VERIFIED de 7.021 registros, cero errores/advertencias e interacciones Cloudflare/D1. Los diez PDF completos contienen 7.097 referencias APA 7, 30.381 enlaces relacionados, cero enlaces rotos y cero títulos discrepantes.


- Lote 0611–0618: ocho Evidence nuevas, 40 afirmaciones cubiertas con la NGLE Manual §§37.2.3–37.5.3; todas pasaron preflight R4 y validación canónica.
- Lote 0620–0627 (nuevas: 0620–0622 y 0624–0627; 0623 ya estaba VERIFIED): siete Evidence nuevas, 35 afirmaciones cubiertas con NGLE Manual §§37.6.2 y 38.1.1–38.2.7; todas pasaron preflight R4 y validación canónica. El índice global queda en 7.034 VERIFIED de 7.036 registros, sin errores ni advertencias. Los diez PDF completos tienen 7.097 referencias APA 7, 30.381 enlaces relacionados, cero enlaces rotos y cero títulos discrepantes.


- Lote 0629–0633: cinco Evidence, 25 afirmaciones cubiertas con la NGLE Manual §§38.1.1, 38.2.1–38.2.7, 38.3.1–38.3.2 y 38.4.1–38.4.2; todas pasaron preflight R4 y validación canónica.
- Lote 0638–0640: tres Evidence, 15 afirmaciones cubiertas con NGLE Manual §§38.6.1–38.6.3; todas pasaron preflight R4 y validación canónica.
- Lote 0642–0650 (nuevas: 0642–0645 y 0647–0650; 0646 ya estaba VERIFIED): ocho Evidence, 40 afirmaciones cubiertas con NGLE Manual §§39.1.1–39.3.3 y 39.4.1; todas pasaron preflight R4 y validación canónica. Global: 7.050 VERIFIED de 7.052 registros, cero errores/advertencias e interacciones Cloudflare/D1. PDF: 7.097 referencias APA 7, 30.381 enlaces relacionados, cero enlaces rotos y títulos discrepantes.


- Lote 0652–0655: cuatro Evidence y 20 afirmaciones cubiertas con NGLE Manual §§39.5.1–39.5.2 y 40.1.1–40.1.2; preflight R4 y validador canónico aprobados.
- Lote 0657–0659: tres Evidence y 15 afirmaciones cubiertas con NGLE Manual §§40.2.2–40.2.3 y 40.3.1; preflight R4 y validador canónico aprobados.
- Lote 0661–0673 (nuevas: 0661–0664 y 0666–0673; 0665 ya estaba VERIFIED): doce Evidence y 60 afirmaciones cubiertas con NGLE Manual §§40.3.3, 40.4.1–40.4.6 y 40.5.1–40.5.6. Todas pasaron preflight R4 y validación canónica. Global: 7.069 VERIFIED de 7.071 registros, cero errores y advertencias, cero interacciones Cloudflare/D1. Los diez PDF incluyen 7.097 referencias APA 7, 30.381 enlaces relacionados y cero enlaces rotos o títulos discrepantes.


- Lote 0676–0691 (nuevas: 0676, 0680–0682, 0685–0686, 0688–0691; las demás ya estaban VERIFIED): diez Evidence y 50 afirmaciones cubiertas con NGLE Manual §§41.2.1, 41.3.2, 41.4.1–41.4.5, 41.5.1–41.5.3 y 41.6.1–41.6.3; todas pasaron preflight R4 y validación canónica.
- Lote 0693–0700 (nuevas: 0693–0695 y 0698–0700; 0696–0697 ya estaban VERIFIED): seis Evidence y 30 afirmaciones cubiertas con NGLE Manual §§41.7.1–41.7.3, 42.1.1–42.1.2 y 42.2.1–42.2.4; todas pasaron preflight R4 y validación canónica. El índice registra 7.085 VERIFIED de 7.087 entradas, con cero errores y advertencias. Los PDF completos suman 7.097 referencias APA 7 y 30.381 enlaces relacionados, sin enlaces rotos ni títulos discrepantes.


- Lote 0701–0710 (nuevas: 0701–0702 y 0704–0710; 0703 ya estaba VERIFIED): nueve Evidence, 45 afirmaciones cubiertas con NGLE Manual §§42.3.1–42.3.6 y 42.4.1–42.4.4. Las entradas pasaron preflight R4 y el índice canónico global quedó en 7.094 VERIFIED de 7.096 registros, cero errores/advertencias e interacciones Cloudflare/D1. La actualización de los diez PDF queda pendiente para el próximo lote, por la pausa solicitada.


- Continuación local del 9 de octubre: MLS-V05-0911 (*worüber*) y MLS-V05-0912 (*wovon*) quedaron `VERIFIED`, con 14 afirmaciones cubiertas mediante Duden e IDS; el validador global informa 7.096 `VERIFIED` de 7.098 Evidence, sin errores ni advertencias. El preflight deja 3.037 entradas pendientes, aún por revisar semánticamente. Cloudflare/D1: cero interacciones/escrituras. Los PDF esperan la integración de este lote.

- Lote local 1070–1072: tres Evidence nuevas, 20 afirmaciones cubiertas con fuentes primarias del Leibniz IDS sobre Verbletztsatz, anáfora pronominal y elipsis. Validador global: 7.099 `VERIFIED` de 7.101 Evidence, cero errores y advertencias. El preflight actualizado deja 3.034 entradas pendientes de revisión semántica. Los diez PDF esperan regeneración tras completar los lotes aplicables; Cloudflare/D1: cero interacciones/escrituras.
### Continuación local — 9 de octubre de 2026 (MLS-V07-0025)

Se revisaron cinco afirmaciones de `MLS-V07-0025` contra el manual oficial taiwanés de puntuación y dos entradas del diccionario del Ministerio. Se guardó el registro en `reviews/MLS-V07-0025-revision.json`; los cambios del artículo y Evidence están asociados a sus hashes. La validación canónica actual registra 7.112 `VERIFIED` de 7.114 entradas, con cero errores y advertencias; quedan 3.021 entradas fuera de `VERIFIED`. El índice está sincronizado. No hubo interacciones con Cloudflare ni lecturas/escrituras en D1. Los diez PDF quedan pendientes de refrescar para los cambios anotados en el checkpoint.

La entrada `MLS-V07-0026` se revisó por cinco afirmaciones y se contrastó con las reglas y diccionarios oficiales del Ministerio taiwanés. El registro detallado está en `reviews/MLS-V07-0026-revision.json`. Tras aplicar Evidence, el validador canónico registra 7.113 `VERIFIED` de 7.115 entradas (cero errores/advertencias); quedan 3.020 fuera de `VERIFIED`. `indexes.cjs --check` confirmó índice sincronizado.

`MLS-V07-0027` se ajustó al alcance que respalda la fuente: el apóstrofo se usa cuando la escritura continua puede confundir límites silábicos; se retiraron ejemplos y generalizaciones no demostrados. Su revisión por cuatro afirmaciones, fuente APA 7 y hash quedó en `reviews/MLS-V07-0027-revision.json`. El validador ahora registra 7.114 `VERIFIED` de 7.116 entradas, sin errores ni advertencias; quedan 3.019 pendientes.

Las entradas `MLS-V07-0027` y `MLS-V07-0028` ya tienen registros semánticos por afirmación y referencias APA 7 en `reviews/`. Se corrigió el alcance de la regla del apóstrofo y se documentaron las definiciones y ejemplos de finales con fuentes del Ministerio y la Academia Nacional de Investigación Educativa. El validador canónico registra ahora 7.115 `VERIFIED` de 7.117 entradas, cero errores y advertencias; quedan 3.018 pendientes.

`MLS-V07-0028` quedó validada con tres afirmaciones sobre la definición de 韻母 y ejemplos de la tabla oficial. `MLS-V07-0029` ya constaba `VERIFIED`; se revalidó la versión actual con cuatro afirmaciones y fuentes del Ministerio y la Academia. Ambas revisiones detalladas están en `reviews/`. El conteo neto permanece en 7.115 `VERIFIED` de 7.117 entradas; quedan 3.018 pendientes.

`MLS-V07-0030` se revisó con cuatro afirmaciones contra la tabla oficial de sílabas Hanyu Pinyin. El registro incluye localizadores, referencias APA 7 y hashes. El validador registra 7.116 `VERIFIED` de 7.118 entradas, sin errores ni advertencias; quedan 3.017 pendientes.

`MLS-V07-0031` quedó revisada con tres afirmaciones sobre el sistema zhuyin y la ubicación oficial de las marcas tonales. Se corrigió la posición de signos y la excepción del tono neutro conforme al manual del Ministerio. La revisión con APA 7 y hashes está en `reviews/`. El validador registra 7.117 `VERIFIED` de 7.119 entradas, sin errores ni advertencias; quedan 3.016 pendientes.

`MLS-V07-0033` se verificó con tres afirmaciones limitadas al papel de y/w indicado por el Ministerio y a ejemplos del cuadro oficial. El registro por afirmación incluye APA 7 y hashes. El validador registra 7.118 `VERIFIED` de 7.120 entradas, con cero errores y advertencias; quedan 3.015 pendientes.

`MLS-V07-0034` se revisó con cuatro afirmaciones sobre la clasificación de símbolos zhuyin y sus correspondencias en los cuadros oficiales. Se eliminaron equivalencias fonéticas con español que no estaban respaldadas. El validador registra 7.119 `VERIFIED` de 7.121 entradas, sin errores ni advertencias; quedan 3.014 pendientes.

`MLS-V07-0035` ya estaba `VERIFIED`; se revalidó la versión actual con tres afirmaciones sobre los diacríticos tonales, ejemplos y posición de la marca, según la guía oficial. No aumentó el total canónico: permanece en 7.119 `VERIFIED`; quedan 3.014 entradas pendientes.

`MLS-V07-0036` se verificó con tres afirmaciones basadas en la cláusula 6.5.5 de GB/T 16159-2012, alojada por el Ministerio de Educación de China. La fuente permite números/letras en procesamiento técnico y asigna 1–4 y 0 a los tonos. La revisión con APA 7 y hashes está en `reviews/`. El validador registra 7.120 `VERIFIED` de 7.122 entradas, cero errores/advertencias; quedan 3.013 pendientes.

`MLS-V07-0037` se validó con tres afirmaciones limitadas a la comparación de las transcripciones Zhuyin y Hanyu Pinyin de 謝謝 según el diccionario del Ministerio. Se retiraron afirmaciones de prevalencia no sustentadas. El validador registra 7.121 `VERIFIED` de 7.123 entradas; quedan 3.012 pendientes.

`MLS-V07-0038` quedó verificada con tres afirmaciones sobre usos que el manual oficial atribuye a Zhuyin y un ejemplo comparativo del diccionario. El validador registra 7.122 `VERIFIED` de 7.124 entradas, cero errores/advertencias; quedan 3.011 pendientes.

`MLS-V07-0039` quedó verificada con tres afirmaciones sobre la regla de escritura de las finales ü tras j/q/x y la conservación de ü con n/l, según el esquema Hanyu Pinyin y su tabla oficial publicados por el Ministerio de Educación de Taiwán. Se eliminaron explicaciones causales no sustentadas y un ejemplo ajeno a la regla. Revisión por afirmación, APA 7 y hashes: `reviews/MLS-V07-0039-revision.json`. El validador registra 7.123 `VERIFIED` de 7.125 entradas, cero errores/advertencias; quedan 3.010 pendientes. El preflight ve 3.008 sin Evidence, una entrada bloqueada por conflicto y una que necesita revisión semántica.

`MLS-V07-0040` quedó verificada con tres afirmaciones sobre las consonantes ㄅ/ㄆ/ㄇ/ㄈ y los pares de ejemplo ㄅㄚ/bā, ㄆㄚ/pā, ㄇㄚ/mā y ㄈㄚ/fā, conforme a las tablas oficiales del Ministerio de Educación de Taiwán. Se retiraron aproximaciones al español y descripciones articulatorias no citadas. Revisión por afirmación, APA 7 y hashes: `reviews/MLS-V07-0040-revision.json`. El validador registra 7.124 `VERIFIED` de 7.126 entradas, cero errores/advertencias; quedan 3.009 pendientes. El preflight ve 3.007 sin Evidence, una entrada bloqueada por conflicto y una que necesita revisión semántica.

`MLS-V07-0041` quedó verificada con tres afirmaciones sobre las iniciales ㄉ/ㄊ/ㄋ/ㄌ y las correspondencias tabuladas ㄉㄚˋ/dà/大, ㄊㄚ/tā/他, ㄋㄚˋ/nà/那 y ㄌㄧˊ/lí/梨. Se retiraron comparaciones con el español y explicaciones articulatorias no sustentadas. La revisión por afirmación, APA 7 y hashes está en `reviews/MLS-V07-0041-revision.json`. El validador registra 7.125 `VERIFIED` de 7.127 entradas, con cero errores y advertencias; quedan 3.008 pendientes.

`MLS-V07-0042` quedó verificada con tres afirmaciones sobre las correspondencias ㄍ/g, ㄎ/k y ㄏ/h y los ejemplos tabulados 哥, 科 y 好. La revisión por afirmación, APA 7 y hashes está en `reviews/MLS-V07-0042-revision.json`; se eliminaron explicaciones fonéticas y comparaciones con español no sustentadas por la tabla. El validador registra 7.126 `VERIFIED` de 7.128 Evidence, con cero errores y advertencias; quedan 3.007 pendientes.

`MLS-V07-0043` quedó verificada con dos afirmaciones: correspondencia ㄐ/ㄑ/ㄒ con j/q/x y ejemplos oficiales ㄐㄧ/jī/雞, ㄑㄧ/qī/七 y ㄒㄧ/xī/西. La revisión por afirmación, APA 7 y hashes está en `reviews/MLS-V07-0043-revision.json`; se retiraron afirmaciones fonéticas que la tabla no valida. El validador registra 7.127 `VERIFIED` de 7.129 Evidence, con cero errores y advertencias; quedan 3.006 pendientes.

`MLS-V07-0032` quedó verificada con cuatro afirmaciones respaldadas por un artículo experimental revisado por pares: uso de Pinyin como apoyo de pronunciación, activación ortográfica de caracteres en lectores expertos, el estímulo zhū zi/珠子 y los límites de generalización del estudio. Se retiró la recomendación absoluta de dejar la romanización y la afirmación de que impide la fluidez. APA 7, revisión semántica y hashes: `reviews/MLS-V07-0032-revision.json`. El validador registra 7.128 `VERIFIED` de 7.130 Evidence, sin errores ni advertencias; quedan 3.005 pendientes.

`MLS-V07-0045` quedó verificada con tres afirmaciones sobre las iniciales ㄗ/ㄘ/ㄙ y los ejemplos tabulados 字, 次 y 四. La revisión por afirmación, referencia APA 7 y hashes está en `reviews/MLS-V07-0045-revision.json`; se retiraron comparaciones articulatorias no sustentadas por la tabla ortográfica. El validador registra 7.129 `VERIFIED` de 7.131 Evidence, con cero errores y advertencias; quedan 3.004 pendientes.


`MLS-V07-0046` quedó verificada con cuatro afirmaciones mapeadas al manual oficial de Hanyu Pinyin de Taiwán (transcripciones y ejemplos ba 巴/pa 趴) y al cuadro IPA (modificador ʰ para aspiración). La descripción del contraste como no aspirado/aspirado se identifica como inferencia de ambas convenciones. Revisión, APA 7 y hashes: `reviews/MLS-V07-0046-revision.json`. El validador registra 7.130 `VERIFIED` de 7.132 Evidence, cero errores y advertencias; quedan 3.003 entradas pendientes. El preflight clasifica 3.001 sin Evidence, un conflicto y una que requiere revisión semántica.


`MLS-V07-0047` quedó verificada con cuatro afirmaciones sobre las grafías finales -n/-ng, la articulación de [n]/[ŋ], la variación reportada para hablantes de Taiwán y el par 林 lín / 零 líng. Se retiraron afirmaciones prescriptivas sobre “errores comunes”. Revisión por afirmación, APA 7 y hashes: `reviews/MLS-V07-0047-revision.json`. El validador registra 7.131 `VERIFIED` de 7.133 Evidence, cero errores y advertencias; quedan 3.002 entradas pendientes. El preflight clasifica 3.000 sin Evidence, un conflicto y una que requiere revisión semántica.


`MLS-V07-0048` quedó verificada con cinco afirmaciones sobre la escritura er/r en Hanyu Pinyin, la definición oficial de 兒化音 y las lecturas del diccionario 二 èr, 耳 ěr, 兒 ér y 而 ér. Se retiraron las comparaciones articulatorias y generalizaciones dialectales sin fuente suficiente. Revisión por afirmación, APA 7 y hashes: `reviews/MLS-V07-0048-revision.json`. El validador registra 7.132 `VERIFIED` de 7.134 Evidence, cero errores y advertencias; quedan 3.001 entradas pendientes. El preflight clasifica 2.999 sin Evidence, un conflicto y una que requiere revisión semántica.


`MLS-V07-0052` quedó verificada con cuatro afirmaciones sobre las grafías an/en/ang/eng, las correspondencias Zhuyin, la articulación y variación descritas en material de la Universidad Nacional de Taiwán, y ejemplos cotejados en el diccionario oficial. Se retiraron afirmaciones universales sobre la realización de -n/-ng. Revisión por afirmación, APA 7 y hashes: `reviews/MLS-V07-0052-revision.json`. El validador registra 7.133 `VERIFIED` de 7.135 Evidence, cero errores y advertencias; quedan 3.000 pendientes. El preflight clasifica 2.998 sin Evidence, un conflicto y una que requiere revisión semántica.


`MLS-V07-0053` quedó verificada con tres afirmaciones sobre las correspondencias Pinyin/Zhuyin i/u/ü, la escritura de ü tras j/q/x y al inicio de sílaba, y los ejemplos 你 nǐ, 路 lù y 女 nǚ. Revisión por afirmación, APA 7 y hashes: `reviews/MLS-V07-0053-revision.json`. El validador registra 7.134 `VERIFIED` de 7.136 Evidence, cero errores y advertencias; quedan 2.999 pendientes. El preflight clasifica 2.997 sin Evidence, un conflicto y una que requiere revisión semántica.


`MLS-V07-0054` quedó verificada con cuatro afirmaciones sobre ㄅ/b y ㄆ/p, las transcripciones de la tabla ministerial, el modificador IPA de aspiración y los ejemplos oficiales ba 巴/pa 趴. La interpretación de aspiración se identifica como inferencia conjunta de las fuentes. Revisión, APA 7 y hashes: `reviews/MLS-V07-0054-revision.json`. El validador registra 7.135 `VERIFIED` de 7.137 Evidence, cero errores y advertencias; quedan 2.998 entradas pendientes. El preflight clasifica 2.996 sin Evidence, un conflicto y una que requiere revisión semántica.


`MLS-V07-0055` quedó verificada con cuatro afirmaciones sobre ㄉ/d y ㄊ/t, las transcripciones de la tabla ministerial, el modificador IPA de aspiración y los ejemplos da 搭/ta 他. La interpretación de aspiración se identifica como inferencia conjunta de las fuentes. Revisión, APA 7 y hashes: `reviews/MLS-V07-0055-revision.json`. El validador registra 7.136 `VERIFIED` de 7.138 Evidence, cero errores y advertencias; quedan 2.997 entradas pendientes. El preflight clasifica 2.995 sin Evidence, un conflicto y una que requiere revisión semántica.


`MLS-V07-0057` quedó verificada con cuatro afirmaciones sobre las correspondencias ㄐ/ㄑ/ㄒ con j/q/x, la escritura de ü después de esas iniciales y ejemplos de las tablas oficiales. Se retiraron descripciones articulatorias no respaldadas por la fuente citada. Revisión, APA 7 y hashes: `reviews/MLS-V07-0057-revision.json`. El validador registra 7.137 `VERIFIED` de 7.139 Evidence, cero errores y advertencias; quedan 2.996 entradas pendientes. El preflight clasifica 2.994 sin Evidence, un conflicto y una que requiere revisión semántica.


`MLS-V07-0058` quedó verificada con tres afirmaciones sobre las correspondencias ㄇ/m y ㄈ/f y los ejemplos ministeriales ma 媽, fa 發, mi 咪 y feng 風. Se retiraron las instrucciones articulatorias y comparaciones con español sin fuente apropiada. Revisión, APA 7 y hashes: `reviews/MLS-V07-0058-revision.json`. El validador registra 7.138 `VERIFIED` de 7.140 Evidence, cero errores y advertencias; quedan 2.995 entradas pendientes. El preflight clasifica 2.993 sin Evidence, un conflicto y una que requiere revisión semántica.


`MLS-V07-0059` quedó verificada con tres afirmaciones sobre ㄋ/n, ㄌ/l y los ejemplos ni 尼/li 理 de las tablas ministeriales. Se retiraron descripciones articulatorias no respaldadas por la fuente citada. Revisión, APA 7 y hashes: `reviews/MLS-V07-0059-revision.json`. El validador registra 7.139 `VERIFIED` de 7.141 Evidence, cero errores y advertencias; quedan 2.994 entradas pendientes. El preflight clasifica 2.992 sin Evidence, un conflicto y una que requiere revisión semántica.


`MLS-V07-0060` quedó verificada con tres afirmaciones sobre las correspondencias ㄗ/z, ㄘ/c, ㄙ/s y los ejemplos tabulados 資/雌/思. Se retiraron descripciones articulatorias sin respaldo en la tabla citada. Revisión, APA 7 y hashes: `reviews/MLS-V07-0060-revision.json`. El validador registra 7.140 `VERIFIED` de 7.142 Evidence, cero errores y advertencias; quedan 2.993 entradas pendientes. El preflight clasifica 2.991 sin Evidence, un conflicto y una que requiere revisión semántica.


`MLS-V07-0061` quedó verificada con cuatro afirmaciones sobre las correspondencias ㄓ/ㄔ/ㄕ/ㄖ con zh/ch/sh/r, las formas zhi/chi/shi/ri y ejemplos del manual oficial. Se retiraron afirmaciones fonéticas y de variación regional que requieren fuentes descriptivas. Revisión, APA 7 y hashes: `reviews/MLS-V07-0061-revision.json`. El validador registra 7.141 `VERIFIED` de 7.143 Evidence, cero errores y advertencias; quedan 2.992 entradas pendientes. El preflight clasifica 2.990 sin Evidence, un conflicto y una que requiere revisión semántica.


`MLS-V07-0062` quedó verificada con cuatro afirmaciones sobre un estudio acústico de habla espontánea de Taiwán (15 hablantes de Taipéi y Kaohsiung), sus factores de variación y el mayor contraste en contextos prominentes y palabras de contenido. La revisión delimita los resultados a la muestra y a las sibilantes estudiadas. Referencia APA 7 y hashes: `reviews/MLS-V07-0062-revision.json`. El validador registra 7.142 `VERIFIED` de 7.144 Evidence, cero errores y advertencias; quedan 2.991 entradas pendientes. El preflight clasifica 2.989 sin Evidence, un conflicto y una que requiere revisión semántica.












- Lote MLS-V07-0292–0297: 0292, 0293, 0295, 0296 y 0297 quedaron VERIFIED con el manual *Elementary Chinese Grammar 基础汉语语法* (Centre for Teaching Chinese as a Foreign Language, University of Oxford, 2011). La evidencia cita pp. 10, 63–67 y limita de 地 a los casos que el manual especifica. MLS-V07-0297 pasó a llamarse «地 omitido con objeto simple» para retirar una generalización no respaldada sobre habla cotidiana. Validador: 7.225 VERIFIED, 0 errores/advertencias; índices y APA 7 pasan. El preflight deja 2.908 pendientes; siguiente: MLS-V07-0317. Los cinco cambios están en la cola de refresco PDF.


- Lote MLS-V07-0317–0322: 0317, 0318, 0319, 0321 y 0322 quedaron VERIFIED con el recurso institucional de complementos resultativos del Centre for Teaching Chinese as a Foreign Language, University of Oxford. Se cotejaron 走, 錯, 開, la negación con 沒 y el ejemplo 作好飯; se quitaron contrastes que el pasaje no respalda. APA 7 e índices pasan; validador: 7.230 VERIFIED, 0 errores/advertencias. Preflight: 2.903 pendientes; siguiente MLS-V07-0323. Cola PDF actualizada para las cinco entradas.


- Lote MLS-V07-0323–0327: las cinco entradas quedaron VERIFIED con el recurso institucional de complementos resultativos de Oxford. Se cotejaron los ejemplos y glosas de 飽, 錯, 到, 完 y 見. Validador R33: 7.235 VERIFIED, cero errores/advertencias; índices y APA 7 pasan. El preflight deja 2.898 pendientes; siguiente: MLS-V07-0328. Las cinco entradas quedaron en la cola de refresco PDF.


- Lote MLS-V07-0328–0333: 0328, 0330, 0331, 0332 y 0333 quedaron VERIFIED con el recurso de complementos resultativos y el manual de gramática de Oxford. Se acotaron 聽懂/說清楚, 上 y 上來/上去 a sus ejemplos documentados. Validador: 7.240 VERIFIED, cero errores/advertencias; preflight: 2.893 pendientes, siguiente MLS-V07-0335. PDF pendiente de refresco para las cinco entradas.


- Lote MLS-V07-0335–0339: cinco entradas VERIFIED con el manual de gramática de Oxford y *Boya Chinese: Elementary, Start-Up, Part II* (Li, Xu y Ren, 2005). Se cotejaron los ejemplos de 下來/下去, V+來, 出 y 出來; se quitaron ejemplos no localizados. Validador: 7.245 VERIFIED, cero errores/advertencias; preflight: 2.888 pendientes, siguiente MLS-V07-0341. PDF pendiente de refresco para este lote.


- Lote MLS-V07-0341–0345: cuatro entradas VERIFIED con *Boya Chinese* (p. 42) y *Elementary Chinese Grammar* de Oxford (pp. 75, 78); una revisión quedó pendiente. Los artículos se limitaron a las reglas, ejemplos y perspectivas que aparecen en las fuentes. MLS-V07-0345 no recibió Evidence: la fuente primaria Boya enumera 起 en una tabla de complementos simples, pero no explica el valor ascendente afirmado ni valida los ejemplos 拿起／抬起／举起. Validador: 7.249 VERIFIED, cero errores/advertencias; índices verificados; preflight: 2.884 pendientes. PDF pendiente de refresco para las cuatro entradas modificadas.


- Lote MLS-V07-0346–0352: seis entradas VERIFIED con *Elementary Chinese Grammar* de Oxford (pp. 74–78), sobre 起來, 進, 進來, 過, 過來 y 過去. La redacción se limitó a ejemplos y glosas del manual. Validador: 7.255 VERIFIED, cero errores/advertencias; índices verificados; preflight: 2.878 pendientes. PDF pendiente de refresco para este lote.


- MLS-V07-0353: validada con el adelanto oficial de *Reading into a New China* (Li y Liu, 2017), que define 下去 como continuación y aporta el ejemplo citado. Validador: 7.256 VERIFIED, cero errores/advertencias; índices verificados; preflight: 2.877 pendientes. PDF pendiente de refresco.


- Lote MLS-V07-0354–0356: MLS-V07-0354 se certificó con el paquete universitario de la University of Washington (lección 7, p. 107); 0355 y 0356 ya estaban VERIFIED y se revalidaron con el manual OCAC *來！學華語* y el adelanto editorial de *Reading into a New China*. Total neto nuevo: 1 VERIFIED; las tres páginas de PDF quedan pendientes de refresco. Validador: 7.257 VERIFIED, cero errores/advertencias; índices verificados; preflight: 2.876 pendientes.


- MLS-V07-0357: validada con la entrada 過來, acepción 2, del *Revised Mandarin Chinese Dictionary* del Ministerio de Educación de Taiwán. Validador: 7.258 VERIFIED, cero errores/advertencias; índices verificados; preflight: 2.875 pendientes. PDF pendiente de refresco.


- MLS-V07-0358: ajustada y validada con la FAQ 6 de los ejercicios de complementos potenciales de Oxford; incluye 吃不完 / 不能吃完 y la excepción idiomática 看不起. Validador: 7.259 VERIFIED, cero errores/advertencias; índices verificados; preflight: 2.874 pendientes. PDF pendiente de refresco.


- MLS-V07-0359: acotada con los ejemplos de resultativo/potencial de Oxford.
- MLS-V07-0361: revalidada con 拿得動 del cuadro de complementos potenciales de Oxford.
- MLS-V07-0362: validada con 今天的練習太多了，我們作不完 del manual de Oxford.
Validador: 7.261 VERIFIED, cero errores/advertencias; índice verificado; preflight: 2.872 pendientes. Las tres entradas están pendientes de refresco en PDF.


- MLS-V07-0360: revisada con el apartado V得到N/V不到N de la hoja docente de Middlebury (2016), incluidos 吃得到/吃不到, 看得到 y 能買到 = 買得到. Validador: 7.262 VERIFIED, cero errores/advertencias; índice verificado; preflight: 2.871 pendientes. PDF pendiente de refresco.


- MLS-V07-0363: validada con 看不懂 del manual Oxford.
- MLS-V07-0364: validada con 看得見 y 我聽不見你說的話。
- MLS-V07-0365: validada con 我買不起這兒的房子。
Validador: 7.265 VERIFIED, cero errores/advertencias; índice verificado; preflight: 2.868 pendientes. Las tres entradas están pendientes de refresco en PDF.


- MLS-V07-0366: cotejada con 吃不完 / 不能吃完 de la FAQ Oxford.
- MLS-V07-0367: cotejada con 看懂 / 看得懂 / 能看懂 del recurso de gramática Oxford.
Validador: 7.267 VERIFIED, cero errores/advertencias; índice verificado; preflight: 2.866 pendientes. Las dos entradas están pendientes de refresco en PDF.


- MLS-V07-0368: revisada con 聽得懂/聽不懂 y ejemplos del recurso Taiwan Mandarin Educational Resources Center.
- MLS-V07-0369: ajustada a la fila 買得/不起 y 我買不起這兒的房子 del manual Oxford.
- MLS-V07-0370: acotada a 能 antes de 把 y 你能把飯吃完嗎 del manual Oxford.
Validador: 7.270 VERIFIED, cero errores/advertencias; índice verificado; preflight: 2.863 pendientes. Las tres entradas están pendientes de refresco en PDF.


- MLS-V07-0372: reformulada como uso de 把 con objeto particular, según el ejemplo 他把酒喝完了.
- MLS-V07-0373: objeto particular y orden 把 + objeto + predicado, con ejemplos del manual.
- MLS-V07-0374: complementos direccionales en ejemplos 把 de Oxford.
- MLS-V07-0375: resultado 完 que afecta al objeto en 他把酒喝完了.
- MLS-V07-0376: ejemplos con 在/到/給; revalidada, ya constaba VERIFIED.
Validador: 7.274 VERIFIED, cero errores/advertencias; índice verificado; preflight: 2.859 pendientes. Las cinco entradas están pendientes de refresco en PDF.


- MLS-V07-0377: revisada con el contraste de verbo simple y predicado con 一下 en Oxford.
- MLS-V07-0378: revisada con las dos funciones de 了 y el ejemplo 他把酒喝了 de Oxford.
Validador: 7.276 VERIFIED, cero errores/advertencias; índice verificado; preflight: 2.857 pendientes. Las dos entradas están pendientes de refresco en PDF.


- MLS-V07-0379–0381: se revisaron la posición del pronombre en 把, una pregunta con 把 y los efectos sobre el objeto con materiales de NTU y Oxford. Una entrada del grupo ya estaba indexada; el total canónico subió en dos.
- MLS-V07-0382–0384: se limitaron las afirmaciones sobre omisión del agente, modalidad y negación con 被 a ejemplos expresos de NTU/Oxford.
- MLS-V07-0385–0390: se revisaron 給 pasivo, agente, complementos resultativos/direccionales, 了 y la lectura neutral/positiva de 被 con pasajes de Oxford y NTU. El total canónico subió en ocho para este tramo; todas las fichas quedan en refresco PDF pendiente.
Validador: 7,286 VERIFIED, cero errores/advertencias; índice reconciliado; preflight: 2,847 pendientes, solo sin Evidence canónica. El preflight no valida semántica. Siguiente: MLS-V07-0391; MLS-V07-0345 sigue retenida por falta de respaldo primario. Cloudflare/D1: cero interacciones.


- MLS-V07-0391–0393: pasiva sin agente expreso, asociación adversa como tendencia (no regla absoluta) y ejemplos coloquiales con 讓/叫, cotejados con Oxford y el estudio de Wang Yiting (NTU).
Validador: 7,289 VERIFIED, cero errores/advertencias; índice reconciliado; preflight: 2,844 pendientes, todas sin Evidence canónica. El preflight no valida semántica. Siguiente: MLS-V07-0394; MLS-V07-0345 sigue retenida por falta de respaldo primario. Cloudflare/D1: cero interacciones. Las entradas 0391–0393 quedan pendientes de refresco PDF.


- MLS-V07-0394–0396: propósito en secuencias seriales y la construcción acompañante con 著, cotejados con Li y Thompson (1978) y el texto oficial de Nueva Taipéi. Se retiraron ejemplos y reglas no localizados.
- MLS-V07-0397–0399: 来 + lugar/cláusula, orden 先…再… y 去 + lugar + predicado, contrastados con ejemplos exactos de Oxford y Nueva Taipéi.
Validador: 7,294 VERIFIED, cero errores/advertencias; índice reconciliado; preflight: 2,839 pendientes sin Evidence canónica. El preflight no valida semántica. Siguiente: MLS-V07-0400; MLS-V07-0345 sigue retenida por falta de respaldo primario. Cloudflare/D1: cero interacciones. Las seis fichas quedan pendientes de refresco PDF.


- MLS-V07-0400–0402: se contrastaron 又…又… con NAER, 坐公車去 con el material TBCL nivel 1, y 拿杯子給他 con el curso de NTU. Se limitó cada ficha a sus ejemplos y pasajes localizados. Dos entradas nuevas se añadieron al índice; una ya estaba VERIFIED.
Validador: 7,296 VERIFIED, cero errores/advertencias; índice reconciliado; preflight: 2,837 pendientes sin Evidence canónica. El preflight no valida semántica. Siguiente: MLS-V07-0403; MLS-V07-0345 permanece retenida por falta de respaldo primario. Cloudflare/D1: cero interacciones. Las tres fichas quedan pendientes de refresco PDF.


- MLS-V07-0403: se acotó a la combinación exacta 用手機上網 listada por NAER. MLS-V07-0405: se acotó al ejemplo VP+VP (連動) 我要回家吃飯了 de NAER; se retiraron generalizaciones y ejemplos no cotejados. MLS-V07-0404 queda PENDING_SOURCE_SUPPORT porque ninguna fuente primaria localizada sostiene 買東西吃 ni su relación de finalidad.
Validador: 7,298 VERIFIED, cero errores/advertencias; índice reconciliado; preflight: 2,835 entradas pendientes sin Evidence canónica. Este preflight no valida semántica. Siguiente: MLS-V07-0406; MLS-V07-0345 y 0404 siguen retenidas. Cloudflare/D1: cero interacciones. 0403 y 0405 quedan pendientes de refresco PDF.


- MLS-V07-0406–0410: se cotejaron V到2, 和2, 對……有興趣, 從……往…… y 從……到…… con ejemplos oficiales de NAER; 按照 se revisó contra su entrada en el diccionario del Ministerio. Las fichas se limitaron a pasajes exactos; 0406 ya constaba VERIFIED y se revalidó.
Validador: 7,302 VERIFIED, cero errores/advertencias; índice reconciliado; preflight: 2,831 pendientes sin Evidence canónica. El preflight no valida semántica. Siguiente: MLS-V07-0412; MLS-V07-0345 y 0404 continúan retenidas. Cloudflare/D1: cero interacciones. Las cinco fichas revisadas quedan pendientes de refresco PDF.


- MLS-V07-0412–0419: siete fichas cotejadas con NAER y diccionarios del Ministerio (替, 根據, 為, 用, 給, 跟, 關於, 離). Se retuvieron solo ejemplos y definiciones exactos. 0416 ya estaba en Evidence canónica y no se reescribió.
Validador: 7,309 VERIFIED, cero errores/advertencias; índice reconciliado; preflight: 2,824 entradas sin Evidence canónica. El preflight no valida semántica. Siguiente: MLS-V07-0420; 0345 y 0404 continúan retenidas. Cloudflare/D1: cero interacciones. Las siete fichas revisadas quedan pendientes de refresco PDF.
