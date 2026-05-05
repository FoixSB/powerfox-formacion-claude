function ForecastList({ forecast }) {
  if (!forecast || forecast.length === 0) {
    return null;
  }

  return (
    <section className="card">
      <h3>Pronóstico 7 días</h3>
      <div className="forecast-grid">
        {forecast.map((day) => (
          <article key={day.date} className="forecast-item">
            <strong>{day.label}</strong>
            <div>{day.emoji} {day.description}</div>
            <div>Máx: {day.max}°C</div>
            <div>Mín: {day.min}°C</div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ForecastList;
