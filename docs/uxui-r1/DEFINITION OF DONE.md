# MLS EXPERIENCE REFINEMENT R1 — DEFINITION OF DONE

## Done por workstream
Un workstream está DONE solo si:
- alcance aprobado completado;
- branch correcta;
- no cambios directos en main;
- ownership respetado;
- contratos intactos;
- dependencias documentadas;
- tests añadidos cuando aplican;
- tests existentes verdes;
- commits pequeños y reversibles;
- STATUS actualizado;
- PR abierto hacia uxui-r1-integration;
- sin deploy de producción.

## Done de una wave
Una wave está DONE cuando:
- todos sus PR necesarios están integrados;
- no existen dependency requests bloqueantes;
- CI de integración está verde;
- QA de regresión de áreas afectadas está verde.

## Done global R1
R1 está listo para proponer merge a main cuando:
- A–F integrados según alcance aprobado;
- G completa QA transversal;
- no regresiones canónicas;
- no legacy;
- no temporary workflows;
- predeploy verde;
- recovery:verify verde;
- deployment contract verde;
- Wrangler dry-run verde;
- mobile/responsive aprobado;
- accessibility aprobado;
- decisiones y status actualizados.
