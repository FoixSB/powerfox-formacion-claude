export default function ForecastList({ forecast }) {
  if (!forecast || forecast.length === 0) {
    return <div className="forecast-list empty">No hay pronóstico disponible</div>;
  }

  return (
    <div className="forecast-list">
      <h3>Pronóstico de 7 días</h3>
      <div className="forecast-grid">
        {forecast.map((day, index) => (
          <div key={index} className="forecast-item">
            <div className="forecast-day">{day.day}</div>
            <div className="forecast-icon">{getWeatherIcon(day.code)}</div>
            <div className="forecast-temps">
              <span className="max">{day.max}°</span>
              <span className="min">{day.min}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getWeatherIcon(code) {
  const icons = {
    '01d': '☀️',
    '02d': '⛅',
    '04d': '☁️',
    '09d': '🌧️',
    '10d': '🌦️',
    '01n': '🌙',
    '02n': '🌙',
  };
  return icons[code] || '🌤️';
}
