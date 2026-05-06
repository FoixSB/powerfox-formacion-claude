const SEASONS = {
  spring: {
    name: 'Primavera',
    icon: 'local_florist',
    accent: 'text-emerald-300',
    bg: 'bg-emerald-400/10',
  },
  summer: {
    name: 'Verano',
    icon: 'sunny',
    accent: 'text-amber-300',
    bg: 'bg-amber-400/10',
  },
  autumn: {
    name: 'Otoño',
    icon: 'forest',
    accent: 'text-orange-300',
    bg: 'bg-orange-400/10',
  },
  winter: {
    name: 'Invierno',
    icon: 'ac_unit',
    accent: 'text-blue-300',
    bg: 'bg-blue-400/10',
  },
}

const OPPOSITE = { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' }

function getSeason(lat) {
  const month = new Date().getMonth()
  let northSeason
  if (month >= 2 && month <= 4) northSeason = 'spring'
  else if (month >= 5 && month <= 7) northSeason = 'summer'
  else if (month >= 8 && month <= 10) northSeason = 'autumn'
  else northSeason = 'winter'
  return lat >= 0 ? northSeason : OPPOSITE[northSeason]
}

function buildSummary(season, avgMax, avgMin, rainDays, snowDays) {
  const lines = []

  if (season === 'spring') {
    lines.push(`Temperaturas suaves entre ${avgMin}° y ${avgMax}°C, propias de la transición estacional.`)
    lines.push(rainDays >= 3 ? 'Lluvias primaverales frecuentes esta semana.' : 'Tiempo mayoritariamente seco con cielos variables.')
  } else if (season === 'summer') {
    lines.push(`${avgMax >= 32 ? 'Calor intenso' : 'Calor moderado'} con máximas de ${avgMax}°C esta semana.`)
    lines.push(rainDays >= 3 ? 'Posibles tormentas o chubascos en los próximos días.' : 'Días principalmente soleados y escasas precipitaciones.')
  } else if (season === 'autumn') {
    lines.push(`Temperaturas en descenso: máximas de ${avgMax}°C y mínimas de ${avgMin}°C.`)
    lines.push(rainDays >= 3 ? 'Lluvias otoñales frecuentes esta semana.' : 'Ambiente variable con cielos parcialmente nublados.')
  } else {
    lines.push(`Frío ${avgMin <= 0 ? 'intenso con posibles heladas' : 'moderado'}, mínimas de ${avgMin}°C.`)
    if (snowDays >= 2) lines.push('Nevadas probables en los próximos días.')
    else lines.push(rainDays >= 3 ? 'Precipitaciones frecuentes esta semana.' : 'Ambiente seco con predominio de cielos despejados.')
  }

  return lines.join(' ')
}

export default function SeasonalSummary({ lat, forecast, displayTemp, unit }) {
  const season = getSeason(lat)
  const { name, icon, accent, bg } = SEASONS[season]

  const avgMax = Math.round(forecast.reduce((s, d) => s + d.max, 0) / forecast.length)
  const avgMin = Math.round(forecast.reduce((s, d) => s + d.min, 0) / forecast.length)

  const rainDays = forecast.filter(d => d.code >= 51 && d.code <= 82).length
  const snowDays = forecast.filter(d => d.code >= 71 && d.code <= 77).length

  const summary = buildSummary(season, avgMax, avgMin, rainDays, snowDays)

  const stats = [
    { icon: 'thermometer', label: 'Máx. media', value: `${displayTemp(avgMax)}°${unit}` },
    { icon: 'thermostat', label: 'Mín. media', value: `${displayTemp(avgMin)}°${unit}` },
    { icon: 'rainy', label: 'Días de lluvia', value: `${rainDays} / 7` },
  ]

  return (
    <section className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 blur-[50px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`${bg} rounded-xl p-2.5`}>
          <span
            className={`material-symbols-outlined ${accent} text-3xl`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >{icon}</span>
        </div>
        <div>
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Estación actual</p>
          <h2 className={`text-xl font-semibold ${accent}`}>{name}</h2>
        </div>
      </div>

      {/* Summary text */}
      <p className="text-white/80 text-sm leading-relaxed mb-5">{summary}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
        {stats.map(({ icon: si, label, value }) => (
          <div key={label} className="flex flex-col items-center gap-1 text-center">
            <span
              className="material-symbols-outlined text-white/60 text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >{si}</span>
            <span className="text-[9px] text-white/45 uppercase tracking-widest font-semibold leading-tight">{label}</span>
            <span className="text-white text-sm font-semibold">{value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
