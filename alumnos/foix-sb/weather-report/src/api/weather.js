const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function weatherCodeToText(code) {
  if (code === 0) return 'Despejado'
  if (code <= 3) return 'Parcialmente nublado'
  if (code === 45 || code === 48) return 'Niebla'
  if (code >= 51 && code <= 55) return 'Llovizna'
  if (code >= 61 && code <= 65) return 'Lluvia'
  if (code >= 71 && code <= 75) return 'Nieve'
  if (code >= 80 && code <= 82) return 'Chubascos'
  if (code >= 95 && code <= 99) return 'Tormenta'
  return 'Variable'
}

export async function getWeatherByCity(city) {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`
  )
  if (!geoRes.ok) throw new Error(`Error de geocodificación (${geoRes.status})`)
  const geoData = await geoRes.json()

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error('Ciudad no encontrada')
  }

  const { name, country, latitude, longitude } = geoData.results[0]

  const forecastRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset&timezone=auto`
  )
  if (!forecastRes.ok) throw new Error(`Error al obtener el pronóstico (${forecastRes.status})`)
  const forecastData = await forecastRes.json()

  const cw = forecastData.current_weather
  const daily = forecastData.daily
  const humidity = forecastData.hourly.relative_humidity_2m[0]

  const forecast = daily.time.slice(0, 7).map((dateStr, i) => ({
    day: DAYS_ES[new Date(dateStr).getDay()],
    code: daily.weathercode[i],
    max: Math.round(daily.temperature_2m_max[i]),
    min: Math.round(daily.temperature_2m_min[i]),
  }))

  return {
    city: name,
    country,
    lat: latitude,
    lon: longitude,
    code: cw.weathercode,
    temperature: Math.round(cw.temperature),
    description: weatherCodeToText(cw.weathercode),
    humidity,
    windspeed: Math.round(cw.windspeed),
    sunrise: daily.sunrise[0],
    sunset: daily.sunset[0],
    forecast,
  }
}
