# MLS Traductor — QA

## Automatizado aprobado

Run T4–T5 técnico:
`35529732780` — SUCCESS

Run T6–T7:
`35535564896` — SUCCESS

Run T8 certificación técnica final:
`35536193278` — SUCCESS

Cobertura:

- shell y ruta;
- 10 slugs;
- contexto `?lang=`;
- sintaxis de scripts inline;
- Normal / Lento;
- cancelación;
- repetición;
- selección de voz;
- degradación de pronunciación ambigua;
- XSS mediante textContent;
- endpoint online;
- validación de idioma;
- same-language shortcut;
- mock real de Workers AI;
- privacidad de logs;
- packs;
- hashes;
- proxy allowlist;
- cache separado;
- estado parcial;
- reintento;
- eliminación;
- local-first;
- memoria por cambio de par;
- predeploy;
- recovery;
- deploy contract;
- Wrangler dry-run.

## Baseline de MLS

El Traductor debe preservar:
- `test:chat-editorial`;
- `qa:baseline`;
- 10,133 entradas;
- 10 idiomas;
- 10,669 chunks semánticos.

## QA manual que no puede sustituirse por CI

- calidad real de voz en Safari/iPhone;
- funcionamiento de voz local en modo avión;
- inteligibilidad pedagógica de rate 0.65;
- teclado virtual/safe areas;
- traducción local real en dispositivo con memoria limitada.

Estos puntos no deben marcarse PASS sin observación real.


## Chromium final

Run `35536193278`:

- viewports: `320 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920`;
- idioma contextual `?lang=portugues`: PASS;
- overflow horizontal: PASS;
- targets interactivos móviles: PASS;
- skip link como primer foco: PASS;
- modo Pronunciar y resultado dinámico: PASS;
- reflow equivalente 200%: PASS;
- reflow equivalente 400%: PASS;
- recarga de `/traductor` sin red mediante App Shell: PASS.

Resultado del harness:

`TRANSLATOR_CHROMIUM_QA {"issues":[]}`

## Pack policy certificada

- runtime Bergamot: **5.06 MiB**;
- total de nueve packs descargables: **508.14 MiB comprimidos**;
- pack individual máximo: **71.78 MiB**;
- direcciones del registry: **18**;
- descarga: opt-in por idioma;
- descarga automática de todos los idiomas: no.

## Frontera de certificación

T8 certifica el comportamiento web y offline del App Shell en Chromium.

No sustituye la validación física de Safari/iPhone para:
- disponibilidad real de voz local en modo avión;
- inteligibilidad del modo Lento con voces reales de iOS;
- memoria/temperatura/batería durante traducción Bergamot prolongada;
- teclado virtual y safe areas en dispositivo físico.
