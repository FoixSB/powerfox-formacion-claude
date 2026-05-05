export default function SolarProgress({ sunrise, sunset }) {
  if (!sunrise || !sunset) return null

  const now = new Date()
  const rise = new Date(sunrise)
  const set = new Date(sunset)
  const progress = Math.max(0, Math.min(100, ((now - rise) / (set - rise)) * 100))

  const fmt = (d) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <section className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center text-white/70">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>wb_twilight</span>
          <span className="text-xs font-semibold tracking-wide">{fmt(rise)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wide">{fmt(set)}</span>
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bedtime</span>
        </div>
      </div>

      <div className="relative h-2 w-full bg-white/10 rounded-full">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-300 to-white rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-orange-400 transition-all duration-1000"
          style={{ left: `${progress}%` }}
        />
      </div>

      <div className="text-center">
        <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">
          {progress >= 100 ? 'Tras el horizonte' : `${Math.round(progress)}% del día`}
        </span>
      </div>
    </section>
  )
}
