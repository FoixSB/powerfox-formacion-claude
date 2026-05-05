# Sesión Weather App — foix-sb

**Fecha:** 30 abril 2026  
**Rama:** `feature/weather-foix-sb`  
**Carpeta:** `alumnos/foix-sb/weather-report/`

---

## Qué se construyó

App del clima en React + Vite que:

- Carga **Madrid por defecto** al arrancar
- Tiene barra de búsqueda para cualquier ciudad del mundo
- Muestra temperatura, descripción, humedad y viento (datos reales de Open-Meteo)
- Incluye un **mapa interactivo** (Leaflet + OpenStreetMap) con marcador en la ciudad buscada
- Muestra el **pronóstico de 7 días** en tarjetas horizontales con icono, descripción, máxima y mínima
- Gestiona estados de **carga** y **error** (con botón Reintentar)
- **Barra solar** con amanecer/atardecer reales y posición actual del sol
- **Gradiente dinámico** de fondo que cambia según el tiempo (naranja=sol, azul=lluvia, gris=tormenta…)
- **Toggle °C / °F** en el header
- Layout **dos columnas en escritorio** (info + mapa siempre visibles), **tabs en móvil** (Tiempo / Mapa)

---

## Fuente de datos

**Open-Meteo** — `open-meteo.com`

API meteorológica de código abierto que usa datos de organismos oficiales (ECMWF, DWD, Meteofrance). Gratuita, sin registro ni API key.

Dos llamadas encadenadas:

1. **Geocoding** — nombre de ciudad → coordenadas (lat/lon)
   ```
   GET https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=es
   ```

2. **Forecast** — coordenadas → temperatura actual, viento, humedad, previsión 7 días, amanecer y atardecer
   ```
   GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&hourly=relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset&timezone=auto
   ```

---

## Stack

| Pieza | Para qué |
|-------|----------|
| React 18 + Vite 5 | Framework UI + servidor de desarrollo |
| Tailwind CSS v4 | Utilidades de estilos (con plugin `@tailwindcss/vite`) |
| Material Symbols (Google Fonts) | Iconos del tiempo y UI |
| Inter (Google Fonts) | Tipografía principal |
| `fetch` nativo | Llamadas HTTP sin axios |
| Open-Meteo | API de clima gratuita, sin API key |
| Leaflet + OpenStreetMap | Mapa interactivo gratuito, sin API key |

---

## Pasos seguidos

### Setup
```bash
node --version          # verificar Node 20+
git switch main && git pull
git switch -c feature/weather-foix-sb
mkdir -p alumnos/foix-sb/weather-report
```

### P1 — App con datos mock
Claude creó toda la estructura de archivos con datos hardcodeados:
- `index.html`, `package.json`, `vite.config.js`
- `src/main.jsx`, `src/App.jsx`, `src/App.css`
- `src/components/SearchBar.jsx`, `WeatherCard.jsx`, `ForecastList.jsx`
- `src/api/weather.js`

```bash
npm install && npm run dev   # http://localhost:5173
```

### P2 — Conexión a Open-Meteo (API real)
Se reemplazó `src/api/weather.js` con las dos llamadas reales descritas arriba.  
Si la ciudad no existe → `throw new Error("Ciudad no encontrada")`.

### Extra — Mapa con Leaflet
```bash
npm install leaflet
```
Se añadió `src/components/WeatherMap.jsx`. Requiere un fix manual para los iconos del marcador (Vite rompe la resolución de rutas de Leaflet por defecto).

### P3 — Pulido final
- Estados `loading`, `error`, `lastCity` en `App.jsx`
- `useEffect` para cargar Madrid al arrancar
- Bloque de error con botón Reintentar
- Animación fadeIn en resultados

### Extra — Rediseño UI (glassmorphism + Tailwind v4)

Rediseño completo de la interfaz a partir de un mockup HTML con diseño glassmorphism:

```bash
npm install -D tailwindcss @tailwindcss/vite
```

**Truco clave — Tailwind v4 vs v3:**

| | Tailwind v3 | Tailwind v4 |
|---|---|---|
| Integración Vite | PostCSS (`postcss.config.js`) | Plugin Vite (`@tailwindcss/vite`) |
| Config | `tailwind.config.js` | Directamente en CSS con `@theme {}` |
| Directiva CSS | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| Utilidades custom | `@layer utilities {}` | `@utility nombre {}` |

`vite.config.js` actualizado:
```js
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

`App.css` actualizado:
```css
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', system-ui, sans-serif;
}

@utility glass-panel { ... }
```

**Componentes rediseñados:**
- `WeatherCard.jsx` — hero con icono animado Material Symbols, temperatura grande, glassmorphism
- `ForecastList.jsx` — tarjetas horizontales con scroll, icono por día, descripción texto
- `SearchBar.jsx` — input pill con icono de búsqueda
- `SolarProgress.jsx` — nuevo componente con barra de progreso amanecer/atardecer

**App.jsx** añade:
- Gradiente dinámico según `weathercode` (función `getGradient`)
- Header fijo con ciudad, hora y toggle °C/°F
- Tabs Tiempo/Mapa en móvil; layout dos columnas en escritorio (`lg:grid lg:grid-cols-2`)
- Bottom nav glassmorphism en móvil

---

## Estructura final

```
alumnos/foix-sb/weather-report/
├── index.html               ← Inter + Material Symbols via Google Fonts
├── package.json
├── vite.config.js           ← plugins: [react(), tailwindcss()]
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx              ← estado global, gradiente dinámico, tabs, layout
    ├── App.css              ← @import "tailwindcss" + utilidades custom
    ├── api/
    │   └── weather.js       ← geocoding + forecast (incluye sunrise/sunset)
    └── components/
        ├── SearchBar.jsx    ← input pill glassmorphism
        ├── WeatherCard.jsx  ← hero con icono animado y temperatura grande
        ├── SolarProgress.jsx← barra progreso amanecer/atardecer
        ├── ForecastList.jsx ← tarjetas horizontales con scroll
        └── WeatherMap.jsx   ← mapa Leaflet (tab Mapa en móvil, columna derecha en desktop)
```

---

## Commits y PR

```bash
git add alumnos/foix-sb/weather-report/
git commit -m "feat(foix-sb): weather app con mapa, API real y estados de carga/error"
git push -u fork feature/weather-foix-sb
```

PR hacia `Power-Fox-Solutions/powerfox-formacion-claude`:  
`https://github.com/Power-Fox-Solutions/powerfox-formacion-claude/compare/main...FoixSB:feature/weather-foix-sb`

---

## Puntos clave aprendidos

- Claude Code construye una app funcional completa a partir de un prompt con **reglas duras** (NO TypeScript, NO Tailwind, NO axios).
- Separar en **3 prompts incrementales** (mock → API real → pulido) reduce errores y permite verificar paso a paso.
- Open-Meteo requiere **dos llamadas encadenadas**: geocoding primero, forecast después con las coordenadas.
- Leaflet necesita un **fix manual para los iconos** cuando se usa con Vite (rompe la resolución de rutas por defecto).
- **Tailwind v4 es incompatible con la configuración de v3**: usa plugin Vite en lugar de PostCSS, `@import "tailwindcss"` en lugar de directivas `@tailwind`, y `@utility` en lugar de `@layer utilities`.
- Los `weathercode` de Open-Meteo son enteros estándar WMO — se mapean a icono, texto o gradiente con un objeto de lookup simple.
- Un mismo `weathercode` puede controlar a la vez el icono, la descripción textual y el gradiente de fondo — centralizar el mapa en un solo sitio evita inconsistencias.

---

## Mejora de UI con Google Stitch

**Fecha:** 2026-04-30

### Configuración MCP de Google Stitch en Claude Code

El campo `mcpServers` ya no es válido en `settings.json`. El comando correcto:

```bash
claude mcp add --transport http --scope user stitch "https://stitch.googleapis.com/mcp" -H "X-Goog-Api-Key: TU_API_KEY"
```

Esto escribe en `~/.claude.json` (fuera del repo, nunca se commitea).

> La API key nunca debe commitearse — el repo es público.
