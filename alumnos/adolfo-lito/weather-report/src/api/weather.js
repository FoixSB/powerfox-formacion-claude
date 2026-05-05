const WMO = {
  0:  { d: 'Cielo despejado',              e: '☀️'  },
  1:  { d: 'Mayormente despejado',          e: '🌤️' },
  2:  { d: 'Parcialmente nublado',          e: '⛅'  },
  3:  { d: 'Nublado',                       e: '☁️'  },
  45: { d: 'Niebla',                        e: '🌫️' },
  48: { d: 'Niebla con escarcha',           e: '🌫️' },
  51: { d: 'Llovizna ligera',               e: '🌦️' },
  53: { d: 'Llovizna moderada',             e: '🌦️' },
  55: { d: 'Llovizna intensa',              e: '🌧️' },
  61: { d: 'Lluvia ligera',                 e: '🌧️' },
  63: { d: 'Lluvia moderada',               e: '🌧️' },
  65: { d: 'Lluvia intensa',                e: '🌧️' },
  71: { d: 'Nieve ligera',                  e: '🌨️' },
  73: { d: 'Nieve moderada',                e: '❄️'  },
  75: { d: 'Nieve intensa',                 e: '❄️'  },
  80: { d: 'Chubascos ligeros',             e: '🌦️' },
  81: { d: 'Chubascos moderados',           e: '🌧️' },
  82: { d: 'Chubascos violentos',           e: '⛈️'  },
  95: { d: 'Tormenta',                      e: '⛈️'  },
  96: { d: 'Tormenta con granizo',          e: '⛈️'  },
  99: { d: 'Tormenta con granizo fuerte',   e: '⛈️'  },
};

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function wmo(code) {
  return WMO[code] ?? { d: 'Desconocido', e: '🌡️' };
}

async function geocodeCity(name) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=es`
  );
  if (!res.ok) throw new Error('Error al conectar con el geocodificador.');
  const data = await res.json();
  if (!data.results?.length) throw new Error('Ciudad no encontrada.');
  const { latitude, longitude, name: cityName, country } = data.results[0];
  return { lat: latitude, lon: longitude, name: cityName, country };
}

async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
    { headers: { 'Accept-Language': 'es' } }
  );
  if (!res.ok) throw new Error('Error al identificar la ubicación.');
  const data = await res.json();
  const addr = data.address ?? {};
  const name =
    addr.city || addr.town || addr.village || addr.municipality ||
    addr.county || data.name || 'Ubicación';
  const country = addr.country || '';
  return { name, country };
}

async function fetchForecast(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&hourly=temperature_2m,weather_code,precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al obtener el clima.');
  return res.json();
}

function normalizeWeatherData({ current, hourly: rawHourly, daily }, name, country, lat, lon) {
  const { d, e } = wmo(current.weather_code);
  const todayDate = current.time.slice(0, 10);
  const currentHourPrefix = current.time.slice(0, 13);

  const hourly = rawHourly.time
    .map((t, i) => ({
      time: t,
      label: t.slice(11, 13) + 'h',
      emoji: wmo(rawHourly.weather_code[i]).e,
      temperature: Math.round(rawHourly.temperature_2m[i]),
      precipitation: rawHourly.precipitation_probability[i],
      isCurrent: t.slice(0, 13) === currentHourPrefix,
    }))
    .filter((h) => h.time.slice(0, 10) === todayDate && h.time.slice(0, 13) >= currentHourPrefix);

  const forecast = daily.time.map((date, i) => {
    const { d: dd, e: ee } = wmo(daily.weather_code[i]);
    const day = new Date(date + 'T12:00:00');
    return {
      date,
      label: DAYS[day.getDay()],
      emoji: ee,
      description: dd,
      max: Math.round(daily.temperature_2m_max[i]),
      min: Math.round(daily.temperature_2m_min[i]),
    };
  });

  return {
    current: {
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windspeed: Math.round(current.wind_speed_10m),
      description: d,
      emoji: e,
    },
    hourly,
    forecast,
    name,
    country,
    lat,
    lon,
  };
}

export async function getWeatherByCity(city) {
  const { lat, lon, name, country } = await geocodeCity(city);
  const raw = await fetchForecast(lat, lon);
  return normalizeWeatherData(raw, name, country, lat, lon);
}

export async function getWeatherByCoords(lat, lon) {
  const [{ name, country }, raw] = await Promise.all([
    reverseGeocode(lat, lon),
    fetchForecast(lat, lon),
  ]);
  return normalizeWeatherData(raw, name, country, lat, lon);
}
