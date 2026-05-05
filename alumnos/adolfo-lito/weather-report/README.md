# Weather Report

App de clima construida con Vite + React. Conectada a la API real de Open-Meteo (sin clave de API).

## Cómo usar

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Inicia la app:
   ```bash
   npm run dev
   ```
3. Abre `http://localhost:5173`.

## Qué hace esta app

- Al cargar, busca Madrid automáticamente con datos reales.
- Busca cualquier ciudad del mundo y muestra clima actual (temperatura, humedad, viento).
- Muestra pronóstico de 7 días con emoji, descripción, máx y mín.
- Estado de carga visible y mensajes de error con opción de reintentar.

## APIs usadas

- Geocodificación: `https://geocoding-api.open-meteo.com/v1/search`
- Clima y pronóstico: `https://api.open-meteo.com/v1/forecast`

## Reglas del ejercicio

- No usar TypeScript
- No usar Tailwind
- No usar axios — solo `fetch` nativo
- No hacer deploy a Vercel
- La app debe funcionar en `localhost:5173`
