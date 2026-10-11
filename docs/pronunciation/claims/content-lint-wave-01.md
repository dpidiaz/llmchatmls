# Claim — content-lint-wave-01

- Área: QA / VALIDATION
- Alcance: IDs, estados, R33 tables, localizadores, Unicode, enlaces
- Tipo: especificación + validador probado contra rama matriz
- Estado: COMPLETE
- Base: feat/mls-snd-foundation
- Inicio: 2026-10-11

Objetivo: crear controles automatizables para detectar errores estructurales sin sustituir revisión lingüística o editorial.


## Salida

- scripts/validate-pronunciation.mjs
- qa/LINT-RULES.md
- qa/LINT-RESULTS-WAVE-01.md
- PR: #7343

Pruebas ejecutadas:
- 72 archivos de entrada;
- 72 IDs únicos;
- 0 duplicados;
- muestra transversal de 9 entradas: 0 incidencias en reglas de ID/Unicode/R33/source IDs.

El script debe ejecutarse sobre un checkout completo antes de convertirse en CI obligatorio.
