# Caso de estudio: desarrollo del módulo Secaderos con Claude Code

> **Propósito.** Este documento es el análisis post-mortem honesto del desarrollo del módulo Secaderos para [Cliente], pensado para la sesión de formación práctica sobre Power Apps + IA. No es marketing: se cubren igual los aciertos que los retrabajos, los tokens que nos ahorramos y los pain points que nos costaron horas. Fuentes: repositorio `[cliente-repo]/` (commits, specs, handoffs, YAML generado) y memorias del proyecto.

**Cliente:** [Cliente] · **Entorno:** [ENTORNO PROD] (EMEA) · **Publisher:** `xxx_` · **Estado a 2026-04-09:** desplegado a producción, ~90 % funcional tras la demo con el cliente · **Idioma del entregable:** español.

---

## 0. Aclaraciones sobre el estado real del repo

Antes de entrar en materia: el prompt de análisis original contenía tres asunciones que no reflejan el repo. Se corrigen aquí para que el caso de estudio sea preciso.

| Asunción del prompt | Realidad en el repo |
|---|---|
| Las tablas viven en `SistemadeTratamientosSolution` | Viven en la solución **`ProcesosIA`** v1.0.0.0 ([solutions/ProcesosIA/Entities/](../../solutions/ProcesosIA/Entities/)). `SistemadeTratamientosSolution` solo contiene la Canvas App y la modificación del `OptionSet`. |
| Valor 105="Secaderos" añadido al picklist global `xxx_tiposdeprocesos` | Añadido al **MultiSelect `xxx_tiposdeprocesos` de la tabla `xxx_stt_Empresa`** ([solutions/SistemadeTratamientosSolution/Entities/xxx_stt_Empresa/Entity.xml](../../solutions/SistemadeTratamientosSolution/Entities/xxx_stt_Empresa/Entity.xml)). No es un picklist global. |
| El archivo `Prompt_Analisis_Secaderos_ClaudeCode.md` existe en el repo | **No existe** como archivo del repo. Fue un prompt pegado en una conversación; no se asume como artefacto persistente. |

---

## 1. Resumen ejecutivo

El módulo Secaderos digitaliza en la Canvas App de producción de [Cliente] un flujo que antes se llevaba en Excel: apertura de un ciclo de secadero, registro de paquetes de madera (leídos por chapa) entrando y saliendo, captura de datos de máquina (sondas, consumo, duración) y cierre con validaciones específicas por empresa. Se construyó en **3 sesiones efectivas entre 2026-04-08 y 2026-04-09** usando Claude Code como asistente principal. El backend (3 tablas Dataverse con 44 campos custom) salió rápido y casi sin retrabajo — lo difícil fue la Canvas App maestro-detalle: ~3.100 líneas de YAML generadas por IA, 8 chunks pegados en Power Apps Studio, ~15 categorías de errores de sintaxis específicos al pegar, y un conjunto estable de correcciones manuales que ahora vive como memoria reutilizable del proyecto. **ROI estimado: 60-70 % de ahorro** vs desarrollo sin IA, pero con dos condiciones innegociables: (1) un desarrollador que domine Power Fx para validar y corregir, y (2) preparación previa de herramientas (PAC CLI, unpack de Canvas App, DeviceCode auth) que el tutorial "IA hace tu app en 5 minutos" omite siempre.

### Cifras clave

| Métrica | Valor | Fuente |
|---|---|---|
| Tablas Dataverse creadas | 3 | [solutions/ProcesosIA/Entities/](../../solutions/ProcesosIA/Entities/) |
| Campos custom totales | 44 (14 + 16 + 14) | Entity.xml × 3 |
| Forms / Views | 9 / 21 | FormXml/ y SavedQueries/ |
| Pantallas Canvas App | 2 nuevas + 1 modificada | [canvas-apps-output/](../../canvas-apps-output/) |
| LOC YAML inicial (IA) | **~3.134 líneas** | `Secaderos_Screen-1-generated.yaml` (508) + 8 chunks Secado_Form (2.626) |
| LOC Python (creación tablas) | 1.140 líneas | [scripts/dataverse/create_secaderos*.py](../../scripts/dataverse/) |
| LOC spec + handoffs | 1.114 líneas | spec + 4 handoffs |
| Commits Secaderos | 4 (556c7e7, 74cdfe4, 5fdda74, 6298fbf) | `git log` |
| Sesiones efectivas | 3 (backend / canvas v1 / deploy+fix) | handoffs |
| Categorías de error pegado YAML | ~15 | [feedback_canvas_app_powerfx.md](#) (memoria) |
| Estado final | Desplegado, ~90 % funcional post-demo | memoria `project_secaderos.md` |

---

## 2. Qué se construyó (inventario duro)

### 2.1 Dataverse — solución `ProcesosIA`

**[solutions/ProcesosIA/Entities/xxx_Secado/Entity.xml](../../solutions/ProcesosIA/Entities/xxx_Secado/Entity.xml)** — Registro padre del ciclo. 14 campos custom: `xxx_nolote` (correlativo por empresa), `xxx_empresalookup`, `xxx_maquinalookup`, `xxx_usuariolookup`, `xxx_clientelookup`, `xxx_fechainicio`, `xxx_fechafin`, `xxx_estado` (Abierto=100/Cerrado=101), `xxx_tipodematerial` (Nuevo=100/Reciclado=101), `xxx_entidaddemarcado`, `xxx_observaciones`, `xxx_fechaalbaran`, `xxx_noalbaran`.

**[solutions/ProcesosIA/Entities/xxx_LineaSecado/Entity.xml](../../solutions/ProcesosIA/Entities/xxx_LineaSecado/Entity.xml)** — Hijo. 16 campos custom: `xxx_secadolookup`, `xxx_paqueteproductolookup` (→ `xxx_srr_PaqueteProducto`), `xxx_canteadoralookup` (→ `xxx_Entrada_Canteadoras`), `xxx_productolookup`, `xxx_origen` (PaqueteExistente=100/Manual=101), `xxx_nopaqueteref`, `xxx_largo`, `xxx_ancho`, `xxx_grueso`, `xxx_unidades`, `xxx_volumenm3`, `xxx_fechaentrada`, `xxx_fechasalida`, `xxx_estado` (EnSecado=100/Finalizado=101).

**[solutions/ProcesosIA/Entities/xxx_ConsumoSecado/Entity.xml](../../solutions/ProcesosIA/Entities/xxx_ConsumoSecado/Entity.xml)** — 1:1 con Secado. 14 campos custom: `xxx_secadolookup`, `xxx_duracionciclohoras`, `xxx_duracionciclominutos`, `xxx_consumocombustible`, `xxx_consumoelectricidad`, 5 sondas (`xxx_sondaaire`, `xxx_sondacaldera`, `xxx_sondamadera1..3`), `xxx_fotourl`, `xxx_observaciones`.

**Modificación a tabla existente:** valor `105 = Secaderos` añadido al MultiSelect `xxx_tiposdeprocesos` de [solutions/SistemadeTratamientosSolution/Entities/xxx_stt_Empresa/Entity.xml](../../solutions/SistemadeTratamientosSolution/Entities/xxx_stt_Empresa/Entity.xml). Valores previos: 100=Rellenados, 101=Tratamientos, 102=Sierras, 103=Pellets, 104=Canteadoras.

**Model-driven App:** grupo "Secaderos" añadido a [solutions/SistemadeTratamientosSolution/AppModuleSiteMaps/xxx_AppPrincipal/AppModuleSiteMap.xml](../../solutions/SistemadeTratamientosSolution/AppModuleSiteMaps/xxx_AppPrincipal/AppModuleSiteMap.xml) con las 3 subáreas. 21 vistas repartidas (7 por entidad).

### 2.2 Canvas App — `xxx_appcanvas_cliente`

- **`Home_Screen` modificado**: botón "Secaderos" con `Visible: ='Tipos de Procesos (Empresas)'.Secaderos in _operador_record.Empresa.'Tipos de Procesos'`. Data sources `Secados`, `'Líneas de Secado'`, `'Consumos de Secado'` añadidos.
- **`Secaderos_Screen`** (nueva, pantalla lista): header, gallery de secados abiertos, barra de botones (Home / Nuevo / Editar). YAML inicial: 508 líneas ([canvas-apps-output/Secaderos_Screen-1-generated.yaml](../../canvas-apps-output/Secaderos_Screen-1-generated.yaml)).
- **`Secado_Form_Screen`** (nueva, maestro-detalle): 8 chunks YAML pegados incrementalmente.

| Chunk | Archivo | Líneas | Función |
|---|---|---|---|
| 1 | `Secado_Form_Screen-chunk1-header.yaml` | 113 | Container raíz + header con `btn_DatosMaquina`, `btn_CerrarSecado` |
| 2 | `Secado_Form_Screen-chunk2-form.yaml` | 882 | Formulario de cabecera con 10 cards tipados |
| 3 | `Secado_Form_Screen-chunk3-search.yaml` | 245 | Buscador de paquete (LookUp sierra → canteadora) |
| 4 | `Secado_Form_Screen-chunk4-gallery.yaml` | 333 | Tabs EnSecado/Finalizados/Todos + gallery con checkboxes |
| 5 | `Secado_Form_Screen-chunk5-footer.yaml` | 121 | Resumen totales + botones "Sacar Seleccionados/Todos" |
| 6 | `Secado_Form_Screen-chunk6-consumo.yaml` | 562 | Modal Datos Máquina (5 sondas, combustible, electricidad) |
| 7 | `Secado_Form_Screen-chunk7-manual.yaml` | 303 | Modal entrada manual (producto, unidades, m³) |
| 8 | `Secado_Form_Screen-chunk8-cerrar.yaml` | 67 | Fórmula (no control) — se copia a `btn_CerrarSecado.OnSelect` |
| | **Total** | **2.626** | |

### 2.3 Scripts Python

- [scripts/dataverse/create_secaderos_tables.py](../../scripts/dataverse/create_secaderos_tables.py) · 473 líneas · Fase 1 (tablas+columnas), Fase 2 (lookups), Fase 3 (optionset), Fase 4 (publish). Auth `DeviceCodeCredential`.
- [scripts/dataverse/create_secaderos_remaining.py](../../scripts/dataverse/create_secaderos_remaining.py) · 162 líneas · Intermedio (redundante post-merge).
- [scripts/dataverse/create_secaderos_final.py](../../scripts/dataverse/create_secaderos_final.py) · 187 líneas · Cierra los lookups que quedaron pendientes.
- [scripts/dataverse/create_secaderos_demo_records.py](../../scripts/dataverse/create_secaderos_demo_records.py) · 318 líneas · Genera datos demo.

### 2.4 Documentación

- **Spec funcional**: [docs/specs/secaderos-spec.md](../specs/secaderos-spec.md) · 402 líneas · 6 secciones (tablas, búsqueda de paquetes, cierre, pantallas, sitemap, exclusiones).
- **Handoffs (4)**: [secaderos-2026-04-08.md](../handoffs/secaderos-2026-04-08.md) (143) · [secaderos-canvas-app-2026-04-08.md](../handoffs/secaderos-canvas-app-2026-04-08.md) (117) · [secado-form-screen-2026-04-08.md](../handoffs/secado-form-screen-2026-04-08.md) (184) · [secado-form-screen-production-2026-04-09.md](../handoffs/secado-form-screen-production-2026-04-09.md) (268).
- **Checklist de QA**: [docs/checklists/secaderos-user-testing.html](../checklists/secaderos-user-testing.html) · 1073 líneas HTML.

---

## 3. Prerequisitos y pipeline — qué hay que tener montado antes de pedir nada a la IA

La mayoría de tutoriales "IA genera tu Power App en 5 minutos" omiten esto. Sin esta preparación, Claude Code trabaja a ciegas y produce código que referencia tablas y campos inventados.

### 3.1 Herramientas instaladas

| Herramienta | Rol en el proyecto | ¿Claude Code la usa directamente? |
|---|---|---|
| **PAC CLI** (`<ruta-local>/pac.exe`) | Exportar solución, `pac solution unpack` para convertir `.zip` en XML editables, `pac canvas unpack` para convertir `.msapp` en carpeta YAML | Sí, vía `Bash` |
| **Dataverse DevTools (VS Code)** | Navegar metadata (tablas, columnas, relaciones, option sets) sin salir del editor; extraer display names reales | Manual — el desarrollador consulta y pasa el dato al prompt |
| **Power Apps Source File Pack/Unpack** | `.msapp` ↔ carpeta YAML; necesario para que Claude Code pueda leer las pantallas existentes antes de inventar nombres de controles | Sí, vía PAC CLI |
| **`python + azure-identity`** (DeviceCodeCredential) | Scripts de creación masiva de tablas/columnas vía Dataverse Web API | Sí, Claude Code los escribe y ejecuta |
| **`git`** | Versionado de soluciones post-export | Sí |
| **Power Apps Studio (web)** | Única forma soportada para pegar el YAML en la app real y publicar | **Manual — insustituible** |

### 3.2 Autenticación

Todos los scripts Python usan **`DeviceCodeCredential`** con `client_id="[client-id-azure]"` (memoria `feedback_dataverse_auth.md`). No se usa `InteractiveBrowserCredential` porque cuelga en terminales no interactivos (Git Bash, WSL, la terminal embebida de Claude Code). La credencial se guarda como variable global del módulo y se llama `get_token()` antes de cada request porque los tokens expiran a la hora. Esto es un detalle operativo crítico que hay que copiar-pegar en todo script nuevo del proyecto.

**PAC CLI auth index [2]** apunta a `[admin]@[cliente].com` en [ENTORNO PROD] (`https://[entorno-prod].crm4.dynamics.com/`). No se comparten credenciales con la IA — el login es interactivo y local.

### 3.3 Skills y repos de referencia

- **Microsoft `Dataverse-skills`** (github.com/microsoft/Dataverse-skills) clonado en `/tmp/Dataverse-skills/` — aporta tres SKILL.md: `dv-metadata` (creación de tablas/columnas/relaciones), `dv-solution` (export/import/pack), `dv-connect`. Lecciones clave adoptadas: (1) creación por fases con espera de 15-30s entre tablas y lookups para evitar lock contention, (2) usar header `MSCRM.SolutionUniqueName` para auto-añadir componentes, (3) código de idioma 3082 (es-ES) en todos los labels.
- **Skill custom del proyecto: `.claude/skills/canvas-apps-ui-gen/`** — usada en modo 3 para generar los chunks de YAML de Canvas App. Esta skill es la que produce el formato bare (starting con `- controlName:`) apto para pegar.
- **Knowledge base centralizada PowerFox**: `<knowledge-base-path>/` con guías topic-specific (pac-cli-scripts, power-automate, ribbons) referenciada desde el `CLAUDE.md` del repo.

### 3.4 Contexto inicial que se le pasó a Claude Code

1. **Transcripción de la reunión con el cliente** — capturó requisitos: apertura del ciclo, chapa física con número alfanumérico, salida parcial con checkboxes, mandato específico de EmpresaA (datos de consumo obligatorios para libro de registro HT), [stakeholder] quiere saber m³ activos por secadero.
2. **Inventario de tablas existentes** leído desde los Entity.xml ya presentes en `solutions/` — sin esto, la IA habría inventado nombres como `xxx_Maquinas` en vez de `xxx_stt_Maquina`.
3. **Inventario de pantallas existentes** de la Canvas App (Tratamientos_Screen, Tratamiento_Form_Screen) extraído del unpack — para que los nuevos screens heredaran el mismo layout, theme (`modernesqueTheme`, RGBA 56,96,178), naming convention (`btn_`, `txt_`, `gal_`, etc.).
4. **Spec como "contrato"**: [secaderos-spec.md](../specs/secaderos-spec.md) se escribió en una sesión de Claude chat (no Claude Code) antes de tocar nada. 402 líneas con tablas, fórmulas Power Fx tentativas, flujos y exclusiones. Este documento es lo que permitió que Claude Code pudiera trabajar sin re-preguntar cada 5 mensajes.

### 3.5 Pipeline completo del desarrollo

```
[Reunión cliente] ──► [Transcripción + requisitos]
                          │
                          ▼
[Claude chat]     ──► [spec MD + spec HTML + mockup HTML]  ←── "contrato"
                          │
                          ▼
[pac solution export + unpack]  ──► Entity.xml + Canvas YAML (snapshot base)
                          │
                          ▼
[Claude Code sesión 1]    ──► create_secaderos_tables.py ──► run ──► DataVerse
                                              ↓
                                      [re-export + unpack]
                                              ↓
                                      [git commit 556c7e7]  (2026-04-08 09:44)
                          │
                          ▼
[Claude Code sesión 2]    ──► Secaderos_Screen YAML (508 líneas)
                              ──► paste en PA Studio (blank screen → paste code)
                              ──► Find & Replace de datasource names
                              ──► ajustes manuales post-paste
                              ──► probar en dispositivo
                          │
                          ▼
[Claude Code sesión 3]    ──► Secado_Form_Screen en 8 chunks
                              ──► chunk-a-chunk: generar → pegar → error → fix → pegar → verificar
                              ──► re-export Canvas App
                                              ↓
                                      [git commit 74cdfe4]  (2026-04-08 15:29)
                          │
                          ▼
[Deploy a prod + demo con cliente]  ──► feedback 90% funcional
                                              ↓
                                      [git commit 5fdda74]  (2026-04-09 12:21)  + docs commit 6298fbf
```

### 3.6 Seguridad y gobernanza (datos expuestos a la IA)

- **Expuesto**: nombres de tablas, campos, display names de PA, lógica de negocio, nombres de empresas del cliente (EmpresaA, EmpresaB, EmpresaC), nombres de usuarios operarios en la transcripción, fórmulas Power Fx, estructura del sitemap.
- **NO expuesto**: credenciales (login interactivo local), connection strings, datos reales de producción (solo se leyó metadata, nunca filas), secretos, registros financieros, emails de clientes reales.
- **Riesgo residual**: la transcripción de reunión contenía nombres de personas y operaciones internas — se pegó a Claude Code en texto plano. Para consultoría externa, el equivalente sería anonimizar nombres de personas antes de pasarlos al LLM, o usar un tenant dedicado con cláusulas de no-entrenamiento.

---

## 4. Timeline real (del repo)

Extraído de `git log` y los handoffs. Cada commit incluye los retrabajos que llevaron hasta él.

| Fecha/hora | Commit | Evento | Impacto |
|---|---|---|---|
| 2026-04-08 09:44 | `556c7e7` | **Backend creado**: 3 tablas + relaciones + optionset, scripts Python, handoff inicial | 143 líneas handoff + 3 Entity.xml grandes (`xxx_ConsumoSecado/Entity.xml` ~1.272 líneas) + 1.140 líneas Python |
| 2026-04-08 10:14 | `51738dd` | Reorganización `docs/` y `scripts/` por carpetas (specs/handoffs/checklists y pac/dataverse) | Limpia la raíz para que futuras sesiones encuentren cosas rápido |
| 2026-04-08 15:29 | `74cdfe4` | **Canvas App v1**: pantallas Secaderos + sitemap del model-driven + exports completos + canvas-apps-output con unpack entero | ~500 archivos (incluye binarios assets). `Secaderos_Screen-1-generated.yaml` (508 líneas) añadido en este commit |
| 2026-04-09 12:21 | `5fdda74` | Re-export post-deploy: msapp crece de 11.3 MB → 12.1 MB (~770 KB, por los chunks de `Secado_Form_Screen` integrados) | Canvas App de producción con todos los chunks pegados y correcciones manuales hechas en PA Studio |
| 2026-04-09 12:38 | `6298fbf` | Handoffs finales + checklist QA + gitignore de `canvas-apps-output/` (ahora se trata como scratch, la verdad vive dentro del msapp) | 1.531 líneas nuevas: `secado-form-screen-2026-04-08.md` (184), `secado-form-screen-production-2026-04-09.md` (268), `secaderos-user-testing.html` (1.073) |

**Handoffs entre fases.** El proyecto usa el patrón `<nombre>-YYYY-MM-DD.md` (memoria `feedback_handoff_naming.md`) porque las sesiones de Claude Code pierden contexto entre runs y cada handoff es el "punto de guardado" que la siguiente sesión lee para no re-explicar. 4 handoffs en 2 días = uno cada sesión efectiva + uno post-deploy.

**Post-IA — gestión de la solución.**
- **Conflictos al importar**: cero. Las tablas nuevas vivían en `ProcesosIA` (solución separada), no chocaron con `SistemadeTratamientosSolution`. El único cruce fue el `OptionSet` modificado en `xxx_stt_Empresa`, que se importó sin problema porque añadía un valor (105) a un MultiSelect existente, no sustituía nada.
- **Regresiones detectadas**: ninguna conocida en el demo del 2026-04-09. Las pantallas de Tratamientos, Sierras, Canteadoras siguieron funcionando — el nuevo botón Home_Screen es aditivo y condicional.
- **Versionado del .msapp**: solo hay "la versión actual" (lo que está en el msapp binario). No hay "YAML inicial guardado" en git para diff textual. Los chunks intermedios sobreviven en `canvas-apps-output/` como scratch pero fueron `.gitignore`-ados en `6298fbf` porque no son la fuente de verdad — solo un intermediario.

---

## 5. Complejidad, tokens y esfuerzo (estimaciones marcadas)

### 5.1 Complejidad objetiva (datos duros)

| Métrica | Secaderos_Screen | Secado_Form_Screen | Total |
|---|---|---|---|
| LOC YAML inicial | 508 | 2.626 (8 chunks) | 3.134 |
| Controles aproximados | 26 | ~179 | ~205 |
| Fórmulas Filter/LookUp/Patch | ~3 | **26** (1+2+5+7+6+2+1+2 por chunk) | ~29 |
| Modales / overlays | 0 | 3 (consumo, manual, cerrar) | 3 |
| Variables globales nuevas | 0 (usa las del form screen) | 11 (`_secadoRecord`, `_newSecadoMode`, `_consumoModalVisible`, `_manualModalVisible`, `_activeTab`, `_searchState`, `_paqueteEncontrado`, `_paqueteEncontrado_Canteadora`, `_origenPaquete`, `_consumoRecord`, `colSelectedLineas`) | 11 |
| Tablas Dataverse referenciadas | 1 (Secados) | 6 (Secados, 'Líneas de Secado', 'Consumos de Secado', 'Paquete Productos', Canteadoras, Productos) | 6 |

**Clasificación:** la `Secaderos_Screen` es complejidad **baja** (lista + botones). El `Secado_Form_Screen` es **media-alta** (maestro-detalle + 3 modales + búsqueda cross-table + validaciones + selección múltiple + cierre con reglas por empresa). No es el nivel de Tratamientos_Screen (existente) pero es el segundo o tercero más complejo de la Canvas App.

### 5.2 Tokens estimados **[Estimación]**

Base de cálculo: **~12 tokens/línea YAML**, **~15 tokens/línea MD o Python**, **~8 tokens/línea Entity.xml** (xml es denso en tags). Se considera input (repo leído + contexto de prompt) + output (lo generado por el LLM).

| Fase | Input estimado | Output estimado | Notas |
|---|---|---|---|
| Análisis en Claude chat → spec | ~8-12k tokens | ~6-10k tokens (402 líneas de spec final + 2-3 iteraciones) | Transcripción + conocimiento del dominio |
| Entity.xml + CLAUDE.md leídos (setup) | ~25-40k tokens | ~1k tokens (respuestas) | Solo lectura de contexto, sin generación |
| Scripts Python tablas | ~5k tokens | ~17-22k tokens (1.140 líneas + iteraciones + debugging) | 2-3 iteraciones por fallo de auth/schema |
| Handoff backend | ~2k | ~3k (143 líneas) | |
| Canvas App — Secaderos_Screen | ~3k (spec + inventario pantalla Tratamientos) | ~8-12k (508 líneas YAML + 2-3 iteraciones de Find&Replace) | |
| Canvas App — Secado_Form_Screen (8 chunks) | ~5-8k por chunk × 8 = ~40-65k | ~32-50k (2.626 líneas + correcciones) | Muchas iteraciones por errores de pegado |
| Handoffs Canvas (2) + checklist HTML | ~4k | ~20-25k (452 líneas MD + 1.073 líneas HTML) | |
| Documentación final + memoria del proyecto | ~3-5k | ~8-12k | |
| **Total por proyecto** | **~100-150k** | **~100-160k** | **Rango total ≈ 200-300k tokens** |

**[Estimación]** Con claude-opus-4-6 a los precios públicos del momento (input ~$15/M, output ~$75/M), esto equivale a un coste aproximado de **$9-14 por proyecto completo**. Un desarrollador senior factura eso en 10-20 minutos. El coste de tokens es ruido frente al coste/hora.

**Handoffs (cambios de contexto).** Hubo **4 handoffs** formales entre sesiones: backend → canvas design, canvas v1 → chunks, chunks → deploy, deploy → docs. Cada handoff es un documento MD de 120-270 líneas que la siguiente sesión lee al arrancar. **Sin los handoffs, cada sesión nueva hubiera vuelto a inventar nombres de campos** — los probamos en un experimento temprano y la IA llegó a sugerir `xxx_Secadero_Linea` porque no recordaba la convención del proyecto.

### 5.3 Comparativa horas-hombre **[Estimación]**

Base: desarrollador Power Platform senior (5+ años, domina Dataverse + Canvas Apps + Power Fx).

| Tarea | Sin IA | Con Claude Code (real) | Ahorro |
|---|---|---|---|
| Diseño de tablas + validación con cliente | 4-6 h | 2-3 h | 40-50 % |
| Creación de 3 tablas + 44 campos + lookups + option sets en Dataverse | 6-10 h (UI manual o scripts ad-hoc) | 1,5-2 h (scripts Python + 2 iteraciones auth) | 70-80 % |
| Sitemap + 21 vistas + 9 forms | 4-6 h | 2-3 h (UI, IA ayuda a diseñar columnas) | 40-50 % |
| Spec funcional documentada | 6-8 h | 2-3 h (Claude chat escribe, humano revisa) | 60-70 % |
| Canvas App — Secaderos_Screen | 4-6 h | 1,5-2,5 h (generar + pegar + Find&Replace + ajustes) | 50-60 % |
| Canvas App — Secado_Form_Screen | 30-50 h | **10-15 h** (8 chunks × ~1h cada uno + debugging pegado + ajustes manuales) | 55-70 % |
| Pruebas + ajustes demo cliente | 4-6 h | 3-4 h (IA ayuda poco aquí, es trabajo manual) | 15-30 % |
| Documentación (handoffs, checklist) | 6-10 h | 2-3 h (IA escribe, humano corrige) | 65-75 % |
| **Total** | **64-102 h** | **24-35 h** | **~60-70 %** |

**[Estimación]** Traducido: un proyecto que hubiera sido ~2 semanas para un senior solo se completó en **3 sesiones efectivas entre 2026-04-08 y 2026-04-09**. El factor multiplicador real observado es **2-3×**.

**Donde la IA SUMÓ tiempo (no restó):**
- Los primeros 2-3 chunks de Canvas App, cuando aún no teníamos la tabla Find & Replace consolidada. Cada error de pegado exigía re-explicar el contexto, borrar el chunk, regenerarlo.
- La primera iteración de los scripts Python, donde hubo que descubrir empíricamente que `InteractiveBrowserCredential` cuelga en Git Bash.
- El modal "Datos Máquina" del chunk 6 — se regeneró parcialmente dos veces porque los nombres de campo de sondas estaban mal en la primera pasada.

### 5.4 Diff YAML inicial vs producción — qué sabemos y qué no

**Lo que se puede medir textualmente es limitado.** La versión "producción" vive dentro del `.msapp` binario (`xxx_appcanvas_cliente_b9ed4_DocumentUri.msapp`, 12 MB), y aunque PAC CLI puede unpackearlo a YAML, el resultado en `canvas-apps-output/tratamientos-app/Other/Src/Secaderos_Screen.pa.yaml` aparece con **177 líneas** — no coincide con las 508 iniciales porque el unpack de PA reagrupa estructuras y muchas propiedades quedan implícitas por defaults del control. **No es un diff línea-a-línea comparable.**

**Lo que sí se puede afirmar con evidencia de los handoffs:**

- **De las ~15 categorías de error de pegado YAML** documentadas en [secado-form-screen-2026-04-08.md](../handoffs/secado-form-screen-2026-04-08.md) y consolidadas en la memoria `feedback_canvas_app_powerfx.md`, todas se resolvieron con **Find & Replace antes de pegar** o con **ajustes manuales post-paste** — no requirieron regenerar el chunk entero.
- **Botones `btn_DatosMaquina` y `btn_CerrarSecado`**: recreados manualmente en PA Studio (no desde YAML) porque el paste dentro del `HeaderContainer_Secado` daba problemas de jerarquía. **~2 controles de ~205 reescritos a mano ≈ 1 %**.
- **`OnVisible` del screen**: reescrito completamente en PA Studio para aplicar el patrón de Typed Blank y colecciones inicializadas (ver sección 6.D). **~15 líneas de Power Fx reescritas**.
- **Checkboxes de la gallery**: dimensiones ajustadas a mano (`Width: =28/20`, `Height: =20`). **~6 líneas tocadas manualmente**.
- **TextInput Format → Number**: cambio manual en el panel de propiedades porque `Format:` no funciona en `TextInput@0.0.54`. Afecta a ~6-8 inputs numéricos. **0 líneas cambiadas en YAML, pero 6-8 clicks manuales**.

**[Estimación] de "porcentaje de supervivencia del YAML inicial"**: entre **80 % y 90 %** del YAML generado por la IA sobrevive a producción tras Find & Replace. El 10-20 % restante se descompone en: ~5 % reescrito (OnVisible, botones del header, fórmulas de cierre), ~10 % ajustes cosméticos manuales (Format, Icon, sizing de checkboxes), ~5 % correcciones de nombres (datasource, optionset, schema). **No es el 40 % catastrófico del que hablan los detractores, pero tampoco el 100 % del que hablan los demos** — es un ~85 % con una curva de aprendizaje importante en las primeras 2-3 horas.

---

## 6. Pain points reales del approach Canvas App + Claude Code

Esta sección es lo más valioso para la formación. Son los ~15 errores concretos que nos costaron iteraciones, extraídos de los handoffs [secado-form-screen-2026-04-08.md](../handoffs/secado-form-screen-2026-04-08.md) y [secado-form-screen-production-2026-04-09.md](../handoffs/secado-form-screen-production-2026-04-09.md) y consolidados en la memoria `feedback_canvas_app_powerfx.md`.

### A. Display names ≠ schema names (el pain point más caro)

La IA genera por defecto nombres de datasource derivados del schema name (`xxx_srr_PaqueteProducto` → `'Paquetes Productos'`), pero PA Studio muestra los **display names** configurados en la app, que no coinciden.

| Generado por IA | Real en PA Studio |
|---|---|
| `'Lineas de Secado'` | `'Líneas de Secado'` (con acento) |
| `'Paquetes Productos'` | `'Paquete Productos'` (singular) |
| `'Entrada Canteadoras'` | `Canteadoras` (sin prefijo) |
| `'Consumos Secado'` | `'Consumos de Secado'` ("de" en medio) |
| `Productos` | `Productos` (coincide — excepción) |

**Coste:** sin el Find & Replace, **cada chunk falla al pegar con error de "Data source not found"**. Con tabla consolidada, ~30 segundos por chunk.

### B. Campo primario con nombre de tabla → schema name obligatorio

La tabla `xxx_Secado` tiene el campo primario "Secado". La IA genera `record.Secado` para acceder al ID, pero PA exige:
- ID: `record.'Secado (xxx_secadoid)'`
- Nombre: `record.'Secado (xxx_secadoname)'`

**Aplica a:** `_secadoRecord`, Filter sobre 'Líneas de Secado', colSelectedLineas, Patches. **Aparece en ~20+ lugares del chunk 4 solo**.

### C. OptionSet: columna ≠ valor (la regla más confusa)

```
Patch('Líneas de Secado', Defaults('Líneas de Secado'), {
    'Estado (xxx_estado)': 'Estado (Líneas de Secado)'.'En Secado'
    //  ← columna ───         ← valor del optionset global ────
})
```

Columna = `'Estado (xxx_estado)'` (con schema name). Valor = `'Estado (Líneas de Secado)'.'En Secado'`. **No son el mismo nombre.** Y encima hay excepciones: `Origen` funciona sin schema name como columna, pero `Estado` no. No hay regla universal — hay que verificar con autocomplete.

### D. Variables tipadas — `Set(var, Blank())` no sirve

```powerfx
// Mal (warning "No type found", después var.Campo falla):
Set(_paqueteEncontrado, Blank())

// Bien (LookUp que nunca devuelve nada, pero tipa):
Set(_paqueteEncontrado, LookUp('Paquete Productos', false))
```

Aplicar a **toda variable que después va a acceder a campos** del record. El `OnVisible` final del `Secado_Form_Screen` usa este patrón 3 veces.

### E. Colecciones vacías tipadas

```powerfx
// Mal (falla en primera carga, col no existe):
Clear(colSelectedLineas)

// Bien (crea col con esquema + la vacía):
ClearCollect(colSelectedLineas, {ID: GUID()});
Remove(colSelectedLineas, First(colSelectedLineas))
```

### F. Propiedades inválidas en modern controls

| Control | Propiedad que la IA pone y PA rechaza | Alternativa |
|---|---|---|
| `Button@0.0.45` | `Size:`, `Icon:` (string), `BorderColor:`, `BorderThickness:` | Usar Appearance variants + cambiar Icon en UI |
| `TextInput@0.0.54` | `Format:`, `Size:` | Cambiar Format → Number manualmente post-paste |
| `Gallery@2.15.0` (Vertical) | `Layout:` | El variant ya lo define |
| `Header@0.0.44` | `LogoToolTip` (PA2108) | Eliminar — no existe |
| `Rectangle@2.4.1` | Versión inexistente | Usar `Rectangle@2.3.0` |

### G. YAML gotcha — dos puntos + espacio dentro de string

```yaml
# MAL — YAML parsea como key-value, revienta el pegado
Placeholder: ="Buscar ej: A12591"

# BIEN
Placeholder: ="Buscar ej A12591"

# O con literal block si el ":" es obligatorio
Placeholder: |-
    ="Buscar ej: A12591"
```

### H. Campos con caracteres especiales → comillas simples obligatorias

`'Volumen m³'`, `'Nº Paquete Ref'`, `'Líneas de Secado'`, `'Fecha Inicio'`. Una vez pegado, PA Studio los muestra igual — no quitar las comillas después.

### I. Paste format — nunca usar `Screens:` wrapper

Memoria `feedback_yaml_paste.md`: el formato `Screens:` (el que genera `pac canvas unpack`) **no funciona** para la función "Paste code" de PA Studio — da error PA1001. Hay que generar en formato bare empezando por `- controlName:`. El skill `canvas-apps-ui-gen` ya lo sabe, pero cualquier regeneración ad-hoc que no use el skill hay que corregirla.

### J. Jerarquía de containers al pegar

El paste de PA Studio pega controles al **control seleccionado en el árbol**. Si el chunk asume un padre que es un `GroupContainer` y tú tienes seleccionado un `Rectangle`, el paste falla silenciosamente o ubica los controles fuera de sitio. **Fix:** cada chunk documenta su contenedor padre esperado ("pegar dentro de `ScreenContainer_Secado`").

### K. Iconos en botones

`Button@0.0.45` no acepta `Icon: ="Notebook"` en YAML. Alternativa adoptada: meter el símbolo inline en el `Text`: `Text: ="+ Manual"`, `Text: ="× Cerrar"`. Feo pero funciona.

### L. Tabla `.Unidades` vs `.Filas`

La IA generó `.Unidades` para acceder al número de piezas del paquete, pero en `xxx_srr_PaqueteProducto` el campo se llama **`Filas`** (decisión histórica del cliente). No estaba documentado en la spec inicial — se descubrió al probar.

### M. Contexto y memoria de la IA dentro del mismo proyecto

**Incidentes detectados:**
- En el chunk 6 (modal consumo), la IA llegó a sugerir **4 sondas** cuando la spec y el handoff previo decían **5** (aire, caldera, madera1, madera2, madera3). Se corrigió al revisar, pero demuestra que la ventana de contexto va desgastándose — el handoff se leía al principio de la sesión y ~30 mensajes después la información ya se había "diluido".
- **[Estimación]** Entre **3 y 6 veces por sesión larga** hubo que re-explicar una decisión ya tomada en la spec o en un handoff previo. Estas re-explicaciones son relativamente baratas (1-2 mensajes) pero rompen el flow.

### N. Errores silenciosos — compilaba pero funcionaba mal

Dos casos documentados:
1. **Filter con lookup mal referenciado**: `Filter('Líneas de Secado', Secado = _secadoRecord)` compilaba sin error, pero devolvía 0 registros siempre porque PA compara objetos record completos, no IDs. Fix: `Secado.'Secado (xxx_secadoid)' = _secadoRecord.'Secado (xxx_secadoid)'`.
2. **LookUp de paquete sin `!IsBlank(xxx_cierredepaquete)`**: la búsqueda funcionaba pero devolvía paquetes aún abiertos, cosa que el cliente no quería. Fix: añadir la condición de cierre explícita.

### Ñ. La IA nunca se equivoca en los triviales — siempre en los sutiles

Los errores que nos costaron tiempo nunca fueron cosas obvias tipo "se olvidó un punto y coma". Siempre fueron cosas que **compilaban perfectamente** y requerían **conocimiento del comportamiento de PA** para detectar: el OptionSet column vs value, el `.Unidades` vs `.Filas`, el Filter que devuelve 0, la variable sin tipar que peta 3 pantallas después.

**Moraleja para la formación:** la IA es una máquina de producir código sintácticamente correcto que puede ser funcionalmente incorrecto. El desarrollador humano que la supervisa **debe dominar Power Fx lo suficiente para oler los problemas sutiles**.

---

## 7. Qué delegar y qué NO delegar a la IA en Power Apps

Esta es la guía que los asistentes a la formación se llevan a casa.

### 7.1 Delegar con los ojos cerrados (muy eficiente)

| Tarea | Por qué funciona | Evidencia del proyecto |
|---|---|---|
| **Creación de tablas Dataverse** (scripts Python vía Web API) | El Web API tiene schema bien documentado, la IA genera payloads correctos el 95 % de las veces. Ahorro enorme vs UI clic-a-clic. | 3 tablas, 44 campos, 8 lookups creados en ~2h. Sin IA: 6-10h. |
| **Generación de specs técnicas** a partir de una transcripción de reunión | El LLM estructura muy bien requisitos difusos en tablas, flujos y exclusiones. | [docs/specs/secaderos-spec.md](../specs/secaderos-spec.md), 402 líneas, ~2h de Claude chat |
| **Vistas (SavedQueries) para model-driven app** | XML repetitivo con filtros sencillos. | 21 vistas × 3 entidades generadas casi sin retrabajo |
| **Documentación (handoffs, checklists, READMEs)** | Trabajo de escritura estructurada sin riesgo funcional. | 4 handoffs + 1 checklist HTML de 1073 líneas |
| **Scripts de automatización PAC CLI** (export/unpack/pack) | Shell scripts simples con manejo de errores. | [scripts/pac/*.sh](../../scripts/pac/) |
| **Mockups HTML** del layout antes de tocar PA Studio | Genera HTML+Tailwind bien, sirve de contrato visual. | `Mockup_Secado_Form_Screen.html` referenciado en handoffs |

### 7.2 Delegar con supervisión (aceptable, pero revisa todo)

| Tarea | Por qué necesita revisión | Evidencia |
|---|---|---|
| **Generación de YAML Canvas App** | Funciona con una tabla de Find & Replace bien mantenida. Sin ella, 30-40 % del código falla al pegar. | Los 8 chunks de `Secado_Form_Screen` — todos necesitaron correcciones, ninguno pegó limpio al primer intento |
| **Fórmulas Power Fx complejas** (Filter anidados, Patch con lookups, validaciones) | Compilan pero pueden tener bugs funcionales sutiles (ver sección 6.Ñ). | Fórmula de cierre del chunk 8, OnVisible reescrito |
| **Dashboards Model-Driven** | El XML es verboso y la IA a veces pone referencias inválidas a columnas. | No implementado en este proyecto — spec lo excluyó |
| **Power Automate flows** (JSON) | Estructura compleja, la IA genera pero hay que validar conexiones y triggers en el designer. | Fuera del scope de Secaderos, pero experiencia previa del proyecto con flows de Parcelas |

### 7.3 NO delegar (la IA estorba más que ayuda)

| Tarea | Por qué fracasa | Evidencia |
|---|---|---|
| **Layouts pixel-perfect** (alineación, spacing exacto, z-index de overlays) | Requiere ojo humano + prueba visual en dispositivo. La IA puede generar `X`, `Y`, `Width`, `Height` pero nunca queda bien al primer intento. | Checkboxes del chunk 4 ajustados a mano, alineación del header reajustada |
| **Controles anidados con drag-and-drop complejo** (containers dentro de containers dentro de galleries) | El paste falla por jerarquía y el fix es más caro que hacerlo a mano. | `btn_DatosMaquina`, `btn_CerrarSecado` → recreados manualmente en PA Studio |
| **Cambios de propiedades que requieren la UI de PA** (Format, Icon picker, Theme selection) | Literalmente imposibles vía YAML con los controles modernos. | 6-8 TextInput cambiados Format → Number manualmente |
| **Lógica que depende del estado runtime** (qué variable tiene qué valor en qué momento) | La IA razona bien sobre código estático pero mal sobre máquinas de estado. | `_searchState` (idle/found/not_found/duplicate) requirió 2 iteraciones humanas |
| **Decisiones de UX** ("¿mejor un tab o un filtro?", "¿el botón va arriba o en el footer?") | El usuario/negocio decide, no la máquina. | Decisión tabs EnSecado/Finalizados/Todos tomada por el humano |

### 7.4 El factor humano — ¿se puede hacer sin saber Power Apps?

**Respuesta honesta: no.** Esta sección es dura pero necesaria para la formación.

- **Sin experiencia en Dataverse**: no sabes que `xxx_srr_PaqueteProducto` es una tabla real ni por qué tiene un prefijo `srr_` distinto de `stt_`. La IA te va a sugerir nombres que suenan bien pero no existen.
- **Sin Power Fx**: no detectas que `Filter('Líneas de Secado', Secado = _secadoRecord)` compila pero devuelve 0. No sabes que hay que usar `.xxx_secadoid`.
- **Sin haber usado PA Studio**: no sabes que `Format:` no se puede cambiar en YAML y hay que ir al panel Properties manualmente. Te vas a frustrar pensando que la IA miente.
- **Sin haber deployado Canvas Apps**: no distingues los modern controls (`@0.0.45`) de los clásicos, no sabes que el `msapp` es la fuente de verdad y los YAML son intermediarios.

**Conclusión:** La IA **multiplica por 2-3** a un desarrollador experto. Al principiante **lo pone a generar código roto que no puede arreglar** — coste negativo, frustración alta. El perfil ideal para un proyecto Canvas App + Claude Code es un desarrollador con 1-2 años de experiencia en Power Platform que quiere acelerarse, no alguien que está aprendiendo la plataforma usando la IA como muleta.

---

## 8. Anexos operativos para la formación

### 8.1 Canvas App vs Code Apps (Power Apps code-first) **[Estimación]**

Code Apps es el nuevo paradigma de Power Apps basado en React/TypeScript. Comparativa especulativa para el mismo módulo:

| Dimensión | Canvas App (real en este proyecto) | Code Apps (hipotético) |
|---|---|---|
| Lenguaje del código | YAML propietario + Power Fx | React + TypeScript + Fluent UI |
| Soporte en Claude Code | Skill custom `canvas-apps-ui-gen` + memoria del proyecto | Nativo — React/TS es lo que mejor hace cualquier LLM |
| LOC estimadas | ~3.134 líneas YAML | **[Est.]** ~2.000-2.500 líneas TS/TSX |
| % código correcto al primer intento | ~80-85 % tras Find & Replace | **[Est.]** ~90-95 % (menos trampas sintácticas) |
| Iteraciones por chunk | 2-4 (paste → error → fix → repaste) | **[Est.]** 1-2 (el TypeScript compiler da feedback inmediato) |
| Debugging | Prueba en dispositivo → error runtime → volver al YAML | **[Est.]** TypeScript compile errors + React DevTools |
| Despliegue | `pac solution import` + paste manual | **[Est.]** CI/CD estándar de npm/git |
| Acceso a metadata Dataverse | `Set(var, LookUp(...))` y rezar | **[Est.]** TypeScript types autogenerados desde Dataverse |
| **Horas estimadas con IA** | **24-35 h** (real) | **[Est.] 15-25 h** |

**[Estimación] conclusión**: Code Apps probablemente habría recortado otro **30-40 %** del tiempo. El freno es que Code Apps aún no tiene la paridad de features visuales de Canvas App y el ecosistema está menos maduro. Para un proyecto con deadline cerrado en 2026-04-09, Canvas App seguía siendo la apuesta segura.

### 8.2 Tres prompts para demo en vivo

**Prompt 1 — MALO (vago, sin contexto):**
```
Créame una pantalla en Power Apps para gestionar secaderos de madera.
Necesita abrir secados, meter paquetes y cerrarlos.
```
**Resultado esperado:** la IA inventa nombres de tabla (`Secaderos`, `Paquetes`, `Secados`), controles genéricos sin theme, fórmulas Power Fx que no referencian lookups del proyecto, y nada que se pueda pegar en PA Studio sin 2 horas de corrección.

**Prompt 2 — MISMA idea con contexto completo:**
```
Necesito generar el YAML del Secado_Form_Screen para la Canvas App
xxx_appcanvas_cliente (Tratamientos App - GVN) siguiendo exactamente la
spec en docs/specs/secaderos-spec.md.

Contexto del entorno:
- Theme: modernesqueTheme (azul RGBA 56,96,178). Layout tablet 1366x768.
- Display names reales (NO los schema names — ya verificados en PA Studio):
  Secados, 'Líneas de Secado', 'Consumos de Secado', 'Paquete Productos',
  Canteadoras, Productos, Maquinas, Empresas.
- Primary key pattern: las tablas con campo primario = nombre tabla requieren
  schema name: 'Secado (xxx_secadoid)' para ID, 'Secado (xxx_secadoname)' para display.
- OptionSets: columna 'Estado (xxx_estado)', valor 'Estado (Líneas de Secado)'.'En Secado'.
- Modern controls: Button@0.0.45, TextInput@0.0.54, Gallery@2.15.0, Header@0.0.44,
  Rectangle@2.3.0. NO incluir: Format, Size, Icon (string), BorderColor, Layout,
  LogoToolTip (son inválidas en estas versiones).
- Formato de paste: bare, empezando por `- screenRoot:`. NUNCA `Screens:` wrapper.
- Variables tipadas: Set(_var, LookUp(DataSource, false)) en vez de Set(_var, Blank()).

Genera SOLO el chunk 4 (Tabs + Gallery de líneas de secado) respetando el
árbol de containers del chunk 1 ya pegado. El padre esperado es
ScreenContainer_Secado > BodyContainer_Secado.
```
**Resultado esperado:** YAML que compila al primer intento con 0-2 correcciones, no 15.

**Prompt 3 — EDICIÓN QUIRÚRGICA:**
```
En canvas-apps-output/Secado_Form_Screen-chunk4-gallery.yaml, el botón
'btn_Check_Sec' tiene Width: =14 y Height: =14 — los checkboxes salen
demasiado pequeños en el dispositivo.

Cambia SOLO esos dos valores a Width: =20 y Height: =20. No toques
NINGÚN otro control, ninguna propiedad, ningún comentario. No reformatees
el archivo. Muéstrame el diff antes de aplicarlo.
```
**Técnica de prompt engineering:** constraint explícito + petición de diff antes de aplicar = evita el "pero ya que estoy aquí refactorizo otras cositas" que destroza pantallas.

### 8.3 Q&A preparado

**P1: ¿Cuánto cuesta usar Claude Code al mes para este tipo de proyecto?**
- Suscripción Claude Max ~$100-200/mes cubre este volumen sin problema. **[Estimación]** de tokens del proyecto entero: 200-300k tokens ≈ $9-14 en pago por uso. El coste real no son los tokens, es **la hora del desarrollador que supervisa**. Mil veces más caro que los tokens, mil veces más valioso.

**P2: ¿Funciona igual con Model-Driven Apps o solo Canvas?**
- **Mejor con Model-Driven**, curiosamente. Model-driven es XML estructurado (Entity.xml, SavedQueries, RibbonDiff) que la IA genera muy bien. Canvas App tiene la complejidad extra del YAML propietario + Power Fx + quirks de los modern controls. En este proyecto, todo el backend Model-Driven (tablas, sitemap, views) fue ~2h y quedó perfecto; la Canvas App fue ~12h y quedó al 90 %.

**P3: ¿Y con Copilot Studio / Copilot en Power Apps no es suficiente?**
- Copilot en Power Apps es excelente para **generar un primer draft de una pantalla sencilla** dentro del propio Studio. Lo que NO hace: trabajar con el repositorio fuera del Studio, versionar con git, razonar sobre múltiples pantallas a la vez, generar scripts Python para crear 44 campos en lote, escribir specs de 400 líneas, mantener memoria del proyecto entre sesiones. Claude Code complementa a Copilot; no compite con él.

**P4: ¿Qué pasa cuando Microsoft cambia la estructura de los YAML?**
- Pasó durante este proyecto de hecho — el versionado de modern controls (`@0.0.44` vs `@0.0.45`, `Rectangle@2.3.0` vs `@2.4.1`) es frágil. **Mitigación:** la memoria del proyecto (`feedback_canvas_app_powerfx.md`) se actualiza cada vez que descubrimos un nuevo caso. Es el equivalente al "Notion de equipo" — la regla no vive en la cabeza del desarrollador, vive en archivos versionados. Si Microsoft cambia algo, actualizas la memoria y todas las sesiones futuras lo heredan.

**P5: ¿Se puede usar con soluciones managed de terceros?**
- Sí para **leerlas** (la IA lee Entity.xml sin problema). No para **modificarlas** — las soluciones managed son read-only por diseño de Power Platform, no por limitación de la IA. Para personalizar sobre una managed, se crea una solución unmanaged propia encima que haga extensión (ej: añadir columnas a una tabla managed vía una nueva tabla relacionada).

### 8.4 Recomendaciones para futuros desarrollos Power Apps con IA

1. **Empieza invirtiendo 1-2h en la preparación** (instalar PAC CLI, configurar auth, unpack de la app existente, leer memorias previas del equipo). Sin esto, cualquier ahorro de IA queda anulado por horas de debugging.
2. **Escribe la spec ANTES de tocar código con la IA.** En Claude chat, no en Claude Code. La spec es el contrato. 400 líneas de spec ahorran 40 horas de desarrollo.
3. **Usa handoffs con fecha** (`<tema>-YYYY-MM-DD.md`). Cada sesión de Claude Code lee el handoff previo para reanudar contexto. El formato ya es convención del proyecto (memoria `feedback_handoff_naming.md`).
4. **Mantén una memoria viva** de los pain points específicos del stack (el ruleset de Canvas App YAML, el nombre real de cada datasource, el patrón de variable tipada). Cada descubrimiento nuevo va a la memoria del proyecto, no a un Notion paralelo.
5. **Divide la Canvas App en chunks** lógicos (header, form, gallery, modales). Cada chunk = una unidad de pegado → error → fix → verificar. Chunks más grandes = debugging más caro.
6. **Reserva 20 % del tiempo** para correcciones manuales post-paste. Si el cliente espera 10h, planifica 12-13h.
7. **Pasa el display name exacto en cada prompt.** El skill `canvas-apps-ui-gen` toma esta tabla como input. Sin ella la IA inventa.
8. **Para fórmulas complejas, pide que te enseñe el diff primero** — evita el refactor por sorpresa.
9. **Si el cliente tiene fecha fija**, no introduzcas Code Apps aún si no lo dominas. Canvas App es el camino conocido; el ahorro marginal de Code Apps no compensa el riesgo de estrenarlo en producción con deadline.
10. **Documenta qué NO funcionó**. La negativa es igual de valiosa que la positiva para el siguiente proyecto.

---

## Mapeo a las 15 secciones del prompt original

Para que quede claro que ninguna sección del prompt se omitió, solo se reorganizaron:

| # | Sección del prompt | Bloque en este doc |
|---|---|---|
| 1 | Inventario de trabajo realizado | §2 |
| 2 | Prerequisitos antes de escribir código | §3 |
| 3 | Análisis de complejidad y tokens | §5.1 y §5.2 |
| 4 | Pain points Canvas App | §6 |
| 5 | Comparativa Code Apps | §8.1 |
| 6 | Diff YAML inicial vs producción | §5.4 |
| 7 | Métricas de contexto y memoria | §6.M |
| 8 | Cost-benefit real | §5.3 |
| 9 | Guía "qué sí y qué no" delegar | §7 |
| 10 | Limitaciones y errores honestos | §6.N, §6.Ñ |
| 11 | Gestión de la solución post-IA | §4 (final) |
| 12 | Seguridad y gobernanza | §3.6 |
| 13 | Factor humano — skill del desarrollador | §7.4 |
| 14 | Demo en vivo — prompt engineering | §8.2 |
| 15 | Q&A preparado | §8.3 |

---

## Fuentes consultadas (trazabilidad)

- Specs: [docs/specs/secaderos-spec.md](../specs/secaderos-spec.md)
- Handoffs: [secaderos-2026-04-08.md](../handoffs/secaderos-2026-04-08.md), [secaderos-canvas-app-2026-04-08.md](../handoffs/secaderos-canvas-app-2026-04-08.md), [secado-form-screen-2026-04-08.md](../handoffs/secado-form-screen-2026-04-08.md), [secado-form-screen-production-2026-04-09.md](../handoffs/secado-form-screen-production-2026-04-09.md)
- Entity.xml: [xxx_Secado](../../solutions/ProcesosIA/Entities/xxx_Secado/Entity.xml), [xxx_LineaSecado](../../solutions/ProcesosIA/Entities/xxx_LineaSecado/Entity.xml), [xxx_ConsumoSecado](../../solutions/ProcesosIA/Entities/xxx_ConsumoSecado/Entity.xml)
- Canvas App YAML generado: [canvas-apps-output/Secaderos_Screen-1-generated.yaml](../../canvas-apps-output/Secaderos_Screen-1-generated.yaml), 8 chunks en `canvas-apps-output/Secado_Form_Screen-chunk[1-8]-*.yaml`
- Scripts: [create_secaderos_tables.py](../../scripts/dataverse/create_secaderos_tables.py), [create_secaderos_final.py](../../scripts/dataverse/create_secaderos_final.py), [create_secaderos_remaining.py](../../scripts/dataverse/create_secaderos_remaining.py), [create_secaderos_demo_records.py](../../scripts/dataverse/create_secaderos_demo_records.py)
- Git log: commits `556c7e7`, `74cdfe4`, `5fdda74`, `6298fbf` (rango 2026-04-08 → 2026-04-09)
- Memorias del proyecto: `project_secaderos.md`, `feedback_canvas_app_powerfx.md`, `feedback_yaml_paste.md`, `feedback_pa_datasource_names.md`, `feedback_dataverse_auth.md`, `feedback_handoff_naming.md`, `reference_dataverse_skills.md`

**Estimaciones marcadas con [Estimación]** se basan en: (a) contajes LOC reales del repo, (b) ratios de tokens/línea estándar por tipo de archivo, (c) recuerdo del desarrollador sobre el flujo de sesiones. Las estimaciones de horas sin-IA se apoyan en benchmarks informales del equipo PowerFox, no en estudios formales. Cualquier número marcado [Estimación] debería validarse/refutarse con el siguiente proyecto de tamaño similar y actualizar este documento.
