# Prompt: Rediseño UI Weather App — Google Stitch

**Propósito:** Prompt para Google Stitch que transforma el diseño de la weather app del curso en una interfaz moderna con fondo dinámico según el clima, tipografía limpia y UX mejorada.

**Dónde usar:** Google Stitch → New design → paste prompt

---

## Prompt completo

```
Design a modern weather app UI with the following specifications:

**App structure (existing components to redesign):**
- Full-page layout with header, search bar, weather card, 5-day forecast list, and a map panel
- Two-column desktop layout (left: weather info + forecast, right: map)
- Single column on mobile

**Typography:**
- Use Inter or Geist as the primary font (import from Google Fonts)
- Temperature: 5rem, weight 300 (thin/light — let the number breathe)
- City name: 1.8rem, weight 600
- Labels (humidity, wind): 0.8rem, uppercase, letter-spacing 0.08em, muted color
- No more than 2 font weights across the whole UI

**Dynamic background — changes based on weather condition:**
- Clear sky / sunny: warm gradient, top #f9c74f → #f3722c (golden-orange)
- Cloudy / overcast: cool grey gradient, #b8c0cc → #8d99ae
- Rain / drizzle: deep blue gradient, #4361ee → #3a0ca3
- Snow: soft white-blue gradient, #e0f0ff → #caf0f8
- Thunderstorm: dramatic dark gradient, #1a1a2e → #16213e
- Night (after sunset): deep indigo gradient, #0f0c29 → #302b63
- The gradient covers the full viewport (background of .app)
- Transition: `transition: background 1.2s ease` when weather changes

**Buttons (modern style):**
- Search button: pill-shaped (border-radius: 9999px), no border, background uses current weather accent color, white text, subtle shadow: `0 4px 14px rgba(0,0,0,0.15)`, hover lifts: `transform: translateY(-2px)`
- Retry button: outlined style (transparent background, 2px solid current accent, colored text)
- All buttons: `font-weight: 500`, `letter-spacing: 0.02em`, `padding: 0.65rem 1.5rem`

**Weather card redesign:**
- Semi-transparent frosted glass effect: `background: rgba(255,255,255,0.15)`, `backdrop-filter: blur(20px)`, border: `1px solid rgba(255,255,255,0.25)`
- White text throughout (ensure contrast against gradients)
- Weather icon (emoji or SVG) displayed large (4rem) above the temperature
- Temperature and city name centered, description in a small pill badge below temp
- Humidity and wind speed as two mini-cards side by side at the bottom (icon + value + label)

**Forecast list redesign:**
- Horizontal scrollable row on mobile, grid of 5 equal columns on desktop
- Each day: small card with frosted glass same as weather card, day name (Mon/Tue), weather emoji, high/low temps
- Active/today card slightly more opaque

**Search bar:**
- Full-width input, max-width 560px, centered
- Frosted glass style input: `background: rgba(255,255,255,0.2)`, white placeholder text, no hard border (use box-shadow focus ring instead)
- Icon (magnifying glass) inside input on the left

**Loading state:**
- Replace plain text with a centered animated weather icon (spinning sun or pulsing cloud SVG)

---

**Feature 1 — Search history (localStorage):**
- Below the search bar, show a row of up to 5 pill chips with recently searched cities
- Chips: `background: rgba(255,255,255,0.2)`, white text, small ✕ to remove each entry
- Clicking a chip triggers a new search for that city
- Persist in localStorage under key `weather_history`
- On first load with no history, show nothing (do not show placeholder chips)

**Feature 2 — Geolocation button:**
- A small circular icon button (📍) placed inside the search bar on the right side
- On click: call `navigator.geolocation.getCurrentPosition`, then reverse-geocode using OpenWeatherMap's `/geo/1.0/reverse` endpoint to get the city name, then trigger a weather search
- While detecting: button shows a small spinner animation
- If geolocation is denied: show a brief inline tooltip "Activa la ubicación en tu navegador" that fades out after 3s
- Style: same frosted glass as the input, no background fill, icon color matches current weather accent

**Feature 3 — Sunrise / Sunset with day progress bar:**
- Add a new section inside WeatherCard, below the humidity/wind mini-cards
- Show sunrise time (🌅) and sunset time (🌇) on the left and right ends of a horizontal progress bar
- The progress bar fill represents how far through the daylight window the current time is (0% at sunrise, 100% at sunset)
- Progress bar: `height: 4px`, `border-radius: 9999px`, track `rgba(255,255,255,0.2)`, fill white or current accent color
- A small sun icon (●) sits on the bar at the current progress position
- After sunset, the bar is fully filled and the sun icon is at the right end
- Times displayed in HH:MM local format

---

**Additional UX micro-interactions:**
- Card entrance: `transform: translateY(12px) → translateY(0)` + `opacity: 0 → 1` on load, 0.3s ease-out
- Animated weather icons — CSS keyframe: sun rotates slowly (360deg, 20s linear infinite), rain drops fall, clouds drift
- "Last updated" timestamp — small muted text below description showing HH:MM refresh time
- °C / °F pill toggle in the top-right corner of the header

**Color palette per weather (for text, icons, accents):**
- Sunny: accent #f3722c, text white
- Cloudy: accent #4a4e69, text #f2e9e4
- Rain: accent #4cc9f0, text white
- Snow: accent #90e0ef, text #023e8a
- Storm: accent #7209b7, text white
- Night: accent #a8dadc, text white

**Output:** Provide the complete updated App.css, WeatherCard.css, and any new CSS variables in :root for the weather theme tokens. Also output the updated App.jsx and WeatherCard.jsx with the geolocation button logic and localStorage history wired up.
```

---

## Variaciones

**Solo CSS (sin lógica):** eliminar los párrafos de Feature 1 y Feature 2, pedir únicamente los archivos CSS.

**Versión mobile-first:** añadir al inicio `Design mobile-first. Desktop layout is an enhancement, not the base.`

---

## Ejemplo de uso

1. Abrir [Google Stitch](https://stitch.withgoogle.com)
2. Crear nuevo proyecto → "From prompt"
3. Pegar el bloque de código completo
4. Iterar sobre el resultado ajustando colores o componentes específicos
