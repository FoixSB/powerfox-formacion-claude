export default function WeatherCard({ weather }) {
  if (!weather) {
    return <div className="weather-card error">Ciudad no encontrada</div>;
  }

  return (
    <div className="weather-card">
      <h2>{weather.name}, {weather.country}</h2>
      <div className="current-weather">
        <div className="temperature">{weather.temperature}°C</div>
        <div className="description">{weather.description}</div>
      </div>
      <div className="weather-details">
        <div className="detail">
          <span className="label">Humedad:</span>
          <span className="value">{weather.humidity}%</span>
        </div>
        <div className="detail">
          <span className="label">Viento:</span>
          <span className="value">{weather.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}
