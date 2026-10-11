# MLS-SND — Fuentes propuestas para romanización/transliteración

Estas fuentes quedan localmente propuestas para evitar colisiones de IDs globales entre workers. El integrador decidirá su canonicalización.

## REP-PROP-001 — UNGEGN Romanization Systems

- **Institución:** United Nations Group of Experts on Geographical Names (UNGEGN).
- **URL:** https://unstats.un.org/unsd/ungegn/romanization/
- **Tier propuesto:** A institucional.
- **Cobertura:** definición operativa de romanización como conversión desde escritura no romana hacia escritura romana; principios de estandarización y reversibilidad para sistemas UNGEGN de nombres geográficos.
- **Limitación:** su mandato es la estandarización de nombres geográficos, no la enseñanza general de pronunciación.
- **Estado:** PROPOSED_PENDING_GLOBAL_REGISTRY.

## REP-PROP-002 — Unicode CLDR Transliteration Guidelines

- **Institución:** Unicode Consortium / CLDR.
- **URL:** https://cldr.unicode.org/index/cldr-spec/transliteration-guidelines
- **Tier propuesto:** A/B técnico-institucional.
- **Cobertura:** transliteración como conversión de caracteres entre scripts; distinción respecto de traducción; nota explícita de que CLDR usa el término en sentido amplio y no exige reversibilidad.
- **Limitación:** la terminología CLDR es deliberadamente amplia y no debe proyectarse como única definición aceptada en lingüística o normalización.
- **Estado:** PROPOSED_PENDING_GLOBAL_REGISTRY.

## Control de terminología

MLS-SND deberá declarar el sistema concreto cuando use una romanización o transliteración. No asumirá que “romanización” equivale a pronunciación ni que “transliteración” implica reversibilidad absoluta.