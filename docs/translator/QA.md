# MLS Traductor — QA

## Automatizado aprobado

Run T4–T5 técnico:
`35529732780` — SUCCESS

Run T6–T7:
pendiente de registrar al cierre.

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
