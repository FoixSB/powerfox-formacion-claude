function HourlyForecast({ hourly }) {
  if (!hourly?.length) return null;

  return (
    <section className="card">
      <h3>Hoy hora a hora</h3>
      <div className="hourly-strip">
        {hourly.map((h) => (
          <div
            key={h.time}
            className={`hourly-item${h.isCurrent ? ' hourly-item--current' : ''}`}
          >
            <div className="hourly-time">{h.label}</div>
            <div className="hourly-emoji">{h.emoji}</div>
            <div className="hourly-temp">{h.temperature}°</div>
            {h.precipitation > 0 && (
              <div className="hourly-precip">💧{h.precipitation}%</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default HourlyForecast;
