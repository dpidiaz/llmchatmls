# MLS-SND — PTBR source canonicalization wave 01b

**Fecha:** 2026-10-11  
**Branch:** `snd/source-canonicalization-ptbr-wave-01b`  
**Perfil desbloqueado:** `pt-BR-rio`  
**Parent vivo:** `feat/mls-snd-foundation` con `SND-SRC-0080` ya ocupado por zh-TW.

## 1. Resolución de colisión

La wave inicial #7434 reservó provisionalmente `0080…0090`. Mientras se verificaban las fuentes, #7438 integró legítimamente `SND-SRC-0080` para el diccionario MOE de Taiwán.

Control aplicado:

- no sobrescribir `0080`;
- abandonar el snapshot viejo;
- reconstruir desde la matriz viva;
- desplazar el bloque pt-BR completo a `0081…0091`;
- conservar identidades bibliográficas y alcance.

## 2. Mapeo canónico

| local | canónico | fuente |
|---|---|---|
| PTBR-W01-SRC-02 | SND-SRC-0081 | Nanini (2022), /S/ Copacabana |
| PTBR-W01-SRC-03 | SND-SRC-0082 | Callou, Moraes & Leite (1998), /R/ final |
| PTBR-W01-SRC-04 | SND-SRC-0083 | Silva (2026), FavRio coda (r) |
| PTBR-W01-SRC-05 | SND-SRC-0084 | Brandão (2008), coda fluminense |
| PTBR-W01-SRC-06 | SND-SRC-0085 | Machado et al. (2010), pretônicas |
| PTBR-W01-SRC-07 | SND-SRC-0086 | Frota & Moraes (2016), entoação Rio |
| PTBR-W01-SRC-08 | SND-SRC-0087 | Moraes & Rilliard (2018), metodologia prosódica |
| PTBR-W01-SRC-09 | SND-SRC-0088 | Orsini (1995), vogais orais |
| PTBR-W01-SRC-10 | SND-SRC-0089 | Moraes & Wetzels (1992), nasalidade/duração |
| PTBR-W01-SRC-11 | SND-SRC-0090 | Shosted (2006), nasal coda emergence |
| PTBR-W01-SRC-12 | SND-SRC-0091 | Moraes (2003), acento secundário |

`PTBR-W01-SRC-01` já corresponde a `SND-SRC-0007` (Callou 2009).  
`PTBR-W01-SRC-13` permanece deliberadamente **discovery-only** e não recebe ID evidencial.

## 3. Verificações institucionais/publisher

### 0081 — Nanini

- UFRJ/Pantheon confirma autora, título, ano 2022, arquivo PDF e handle 11422/22317.
- O registry usa o registro institucional para identidade/escopo e exige PDF para resultados quantitativos finos.

### 0082 — Callou, Moraes & Leite

- SciELO confirma DELTA 14, número especial, 1998, pp. 61–72 e DOI `10.1590/S0102-44501998000300006`.
- Datas posteriores de disponibilização web não substituem o ano bibliográfico 1998.

### 0083 — Silva

- Pantheon/UFRJ confirma dissertação 2026, handle 11422/29818, FavRio e 24 falantes.
- O alcance permanece subamostra periférica; não é sinônimo de toda a cidade.

### 0084 — Brandão

- Revista da ABRALIN identifica v. 7, n. 1 (2008) e 13 comunidades do Norte/Noroeste fluminense.
- A plataforma exibe datas web posteriores; o registry preserva 2008 e marca a discrepância editorial de plataforma.
- FLUMINENSE ≠ RIO_CARIOCA permanece regra obrigatória.

### 0085 — Machado et al.

- PDF da APL confirma título/autores, 2010, pp. 499–511, oito universitários do Rio e 1344 tokens no abstract.
- A auditoria da wave encontrou 1152 ocorrências na metodologia; o conflito **1344 ↔ 1152** permanece OPEN e não é resolvido por escolha editorial.

### 0086 — Frota & Moraes

- Wiley/Universidade de Lisboa confirmam capítulo de 2016, pp. 141–166, DOI `10.1002/9781118791844.ch9`.
- O resumo identifica explicitamente Lisboa para EP e Rio de Janeiro para BP.

### 0087 — Moraes & Rilliard

- Zenodo/Language Science Press confirma capítulo 2018, pp. 229–262 e DOI `10.5281/zenodo.1441347`.
- É fonte PB/metodológica; não recebe escopo carioca automaticamente.

### 0088 — Orsini

- Catálogo integrado UFRJ confirma dissertação 1995 e seis inquéritos NURC sobre vogais orais do dialeto carioca/voz feminina.
- Valores acústicos numéricos exigem texto integral/localizador interno.

### 0089 — Moraes & Wetzels

- UNICAMP confirma Cadernos de Estudos Linguísticos 23, pp. 153–166 e DOI `10.20396/cel.v23i0.8636851`.
- O fascículo é de 1992; a plataforma atual mostra publicação web 2012.
- Afiliação UFRJ dos autores não prova proveniência carioca dos falantes.

### 0090 — Shosted

- Cambridge confirma JIPA 36(1), 39–58, DOI `10.1017/S0025100306002350`.
- Abstract identifica Carioca/Rio, cinco vogais fonemicamente nasais no análise do artigo e três falantes para os dados aerodinâmicos.

### 0091 — Moraes

- Proceedings oficiais ICPhS 2003 confirmam título e pp. 2063–2066.
- A metodologia auditada não identifica origem dialetal dos quatro falantes; escopo permanece `PB_BROAD/EXPERIMENTAL`, não `RIO_CARIOCA`.

## 4. Integridade do registro

- 91 headings `SND-SRC-*`;
- 91 IDs únicos;
- `SND-SRC-0080` preservado para zh-TW;
- `SND-SRC-0081…0091` aparecem uma vez cada;
- zero colisões internas nesta rama;
- nenhuma entrada PTBR foi promovida neste gate.

## 5. Gate

**SOURCE_CANONICALIZATION_PASS** para identidade bibliográfica, escopo e localizadores mínimos.

Próximo passo obrigatório antes de integrar PTBR-001…010:

1. reescrever IDs locais a canônicos;
2. preservar HOLD/OPEN_QUESTION/date/sample warnings;
3. executar source-ID integrity sobre a versão reescrita;
4. aplicar a revisão lingüística independente existente somente aos claims cuja versão permaneça equivalente.
