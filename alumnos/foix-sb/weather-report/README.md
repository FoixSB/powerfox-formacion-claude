# Weather Report

App del clima con React + Vite. Muestra temperatura, descripción, mapa y pronóstico de 7 días para cualquier ciudad del mundo.

## Arrancar

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Carga Madrid por defecto al arrancar.

## API

Usa [Open-Meteo](https://open-meteo.com) — gratuita, sin API key.  
Dos llamadas: geocoding (ciudad → coordenadas) + forecast (coordenadas → clima).

## Estructura

```
src/
├── App.jsx                  — estado global: loading, error, weather
├── App.css                  — estilos globales y layout
├── api/
│   └── weather.js           — getWeatherByCity(city): geocoding + forecast
└── components/
    ├── SearchBar.jsx         — input + botón de búsqueda
    ├── WeatherCard.jsx       — temperatura, descripción, humedad, viento
    ├── WeatherMap.jsx        — mapa Leaflet con marcador en la ciudad
    └── ForecastList.jsx      — pronóstico 7 días con emoji, máxima y mínima
```
