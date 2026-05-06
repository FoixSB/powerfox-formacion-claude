---
project: <slug>
date: <YYYY-MM-DD>
workbook: <archivo.xlsx>
version: <v3 | 2026-Q2>
location: <OneDrive | SharePoint:<sitio>/<ruta> | local:<ruta> | email>
storage_url: <url-completa-o-vacio>
versioning: <sharepoint-history | onedrive-history | filename-suffix | none>
status: <complete | in-progress | blocked>
excel_version: <365-build-XXXX | 2019 | 2016 | 2010>
shared_with:
  - name: <nombre>
    version_sent: <archivo.xlsx>
    channel: <teams | email | sharepoint-link | onedrive-link>
    date: <YYYY-MM-DD>
---

# Excel Handoff — <YYYY-MM-DD> — <workbook>

## Status

| # | Item | Cell/Range | Confirmed by | Expected value |
|---|------|------------|--------------|----------------|
| S-1 | <descripción> | `Sheet!Range` | <método: cuadre / contraste / barrido errores> | <valor o N/A> |

## Resolved This Session

| # | Item | From | Resolved at | Reference |
|---|------|------|-------------|-----------|
| R-1 | <descripción> | <handoff-origen> <YYYY-MM-DD> | `Sheet!Range` o `qry_X` | <commit / version> |

## Blockers

| # | Item | Type | Owner | Action required |
|---|------|------|-------|-----------------|
| B-1 | <descripción> | broken-link / missing-data / awaiting-input / formula-error | <persona o SELF> | <acción concreta> |

## Next Step

> <Una sola frase ejecutable. Verbo al inicio. Celdas/queries con referencia absoluta. Valor esperado tras la acción.>

## Non-Obvious Decisions

| # | Decision | Location | Reason |
|---|----------|----------|--------|
| D-1 | <decisión> | `Sheet!Range` o `qry_X` o `mod_VBA` | <razón no derivable del libro> |

## Sheets Touched

| Sheet | Type | Visible | Change |
|-------|------|---------|--------|
| `<name>` | data / calc / output / helper | yes / no / very-hidden | <descripción> |

## Key Cells & Ranges

| # | Range | Purpose | Formula or note |
|---|-------|---------|-----------------|
| K-1 | `Sheet!Range` | <para qué sirve> | `<fórmula esperada o nota>` |

## Named Ranges / Tables / Queries / VBA Changed

| Type | Name | Scope | Change |
|------|------|-------|--------|
| table / named-range / power-query / vba-module / vba-sub | `<nombre>` | `<sheet>` o workbook | added / modified / deleted — <detalle> |

## Data Sources & Refresh State

| # | Source | Type | Path/URL | Last refreshed | Status | Credential expires |
|---|--------|------|----------|----------------|--------|--------------------|
| DS-1 | `<query-or-link-name>` | power-query / external-workbook / odbc / web / sharepoint-list | `<ruta>` | <YYYY-MM-DD HH:MM> | OK / BROKEN / STALE | <YYYY-MM-DD o N/A> |

## Validation State

| # | Check | Expression | Expected | Actual | Result |
|---|-------|------------|----------|--------|--------|
| V-1 | cuadre-totales | `Sum(Inputs!tbl_X[Amount]) = Output!B12` | <valor> | <valor> | OK / FAIL / NOT-RUN |
| V-2 | barrido-errores | `Ctrl+G → Special → Formulas → Errors` en hojas visibles | 0 errores | <n> | OK / FAIL |
| V-3 | sanity-check | <expresión> | <valor o rango> | <valor> | OK / FAIL / NOT-RUN |

## Carried Forward

| # | Item | Originally From | Status | Resolved at |
|---|------|-----------------|--------|-------------|
| CF-1 | <descripción> | <YYYY-MM-DD> <slug> | STILL-PENDING / RESOLVED | `Sheet!Range` o N/A |

## Tools / Add-ins / MCPs Used

| Tool | Version / Detail |
|------|------------------|
| excel | 365 build XXXX / 2019 / ... |
| power-query | yes / no |
| power-pivot | yes / no |
| add-in | <nombre> |
| mcp | ms365 / <otros> |

---

## Field reference

**Status.Confirmed by**: cuadre / contraste-externo / barrido-errores / refresh-validado / N/A
**Blockers.Type**: broken-link / missing-data / awaiting-input / formula-error / credential-expired / scope-question
**Sheets.Type**: data / calc / output / helper
**Sheets.Visible**: yes (Sheet.Visible = -1) / no (0) / very-hidden (2)
**DataSources.Status**: OK (refrescada y sin error) / BROKEN (fuente inaccesible) / STALE (refrescada pero datos antiguos en origen)
**Validation.Result**: OK / FAIL / NOT-RUN — usar NOT-RUN explícitamente, no dejar en blanco
**CarriedForward.Status**: STILL-PENDING / RESOLVED — nunca borrar filas, solo cambiar estado

## Reference syntax

- Celda: `Sheet!A1`
- Rango: `Sheet!A1:B10`
- Tabla: `tbl_Name` (workbook scope) o `Sheet!tbl_Name`
- Columna de tabla: `tbl_Name[ColumnName]`
- Named range: `RangeName` (workbook scope) o `Sheet!RangeName`
- Power Query: `qry_Name`
- VBA: `mod_Name` (módulo) o `mod_Name.SubName` (sub/función)
- Hoja con espacios: `'Sheet Name'!A1`
