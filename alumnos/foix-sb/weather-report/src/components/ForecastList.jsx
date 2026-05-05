const CODE_ICON = {
  0: 'sunny',
  1: 'partly_cloudy_day', 2: 'partly_cloudy_day', 3: 'cloud',
  45: 'foggy', 48: 'foggy',
  51: 'grain', 53: 'grain', 55: 'grain',
  61: 'rainy', 63: 'rainy', 65: 'rainy',
  71: 'weather_snowy', 73: 'weather_snowy', 75: 'weather_snowy',
  80: 'rainy', 81: 'rainy', 82: 'rainy',
  95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm',
}

const CODE_TEXT = {
  0: 'Despejado',
  1: 'Poco nublado', 2: 'Nublado', 3: 'Muy nublado',
  45: 'Niebla', 48: 'Niebla con escarcha',
  51: 'Llovizna ligera', 53: 'Llovizna', 55: 'Llovizna intensa',
  61: 'Lluvia ligera', 63: 'Lluvia', 65: 'Lluvia intensa',
  71: 'Nieve ligera', 73: 'Nieve', 75: 'Nieve intensa',
  80: 'Chubascos ligeros', 81: 'Chubascos', 82: 'Chubascos intensos',
  95: 'Tormenta', 96: 'Tormenta con granizo', 99: 'Tormenta fuerte',
}

export default function ForecastList({ forecast, displayTemp, unit }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[10px] text-white/70 uppercase tracking-widest font-semibold px-1">
        Previsión 7 días
      </h3>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
        {forecast.map((item, i) => (
          <div
            key={i}
            className={`glass-panel flex-shrink-0 w-28 py-5 rounded-2xl flex flex-col items-center gap-2 transition-all ${
              i === 0 ? 'bg-white/25 ring-1 ring-white/40' : ''
            }`}
          >
            <span className="text-[11px] text-white/80 font-semibold uppercase tracking-wide">
              {item.day}
            </span>
            <span
              className="material-symbols-outlined text-white text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {CODE_ICON[item.code] ?? 'thermostat'}
            </span>
            <span className="text-[10px] text-white/60 text-center px-1 leading-tight">
              {CODE_TEXT[item.code] ?? 'Variable'}
            </span>
            <div className="flex flex-col items-center mt-1">
              <span className="text-sm font-bold text-white">{displayTemp(item.max)}°{unit}</span>
              <span className="text-[11px] font-medium text-white/40">{displayTemp(item.min)}°</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
