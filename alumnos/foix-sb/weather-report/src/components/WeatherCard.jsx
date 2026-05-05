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

export default function WeatherCard({ data, displayTemp, unit }) {
  const icon = CODE_ICON[data.code] ?? 'thermostat'
  const isSunny = data.code === 0

  return (
    <section className="glass-panel rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-[60px] rounded-full pointer-events-none" />

      <div className="mb-4">
        <span
          className={`material-symbols-outlined text-white ${isSunny ? 'animate-slow-rotate' : ''}`}
          style={{ fontSize: '120px', fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>

      <div className="flex flex-col items-center gap-2 mb-6">
        <span className="bg-white/20 px-6 py-1.5 rounded-full text-xs font-semibold tracking-widest text-white uppercase">
          {data.description}
        </span>
        <div className="relative inline-flex items-start">
          <span className="text-[80px] font-thin text-white leading-none">
            {displayTemp(data.temperature)}
          </span>
          <span className="text-3xl font-light text-white mt-3 ml-1">°{unit}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 w-full pt-6 border-t border-white/10">
        <div className="flex flex-col items-center gap-1">
          <span
            className="material-symbols-outlined text-white/70 text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >humidity_percentage</span>
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Humedad</span>
          <span className="text-white font-semibold">{data.humidity}%</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span
            className="material-symbols-outlined text-white/70 text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >air</span>
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Viento</span>
          <span className="text-white font-semibold">{data.windspeed} km/h</span>
        </div>
      </div>
    </section>
  )
}
