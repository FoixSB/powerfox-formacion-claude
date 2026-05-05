import MapView from './MapView.jsx';

function WeatherCard({ weather, city, coords, onMapClick }) {
  return (
    <section className="card weather-card">
      <div className="weather-info">
        <h2>{city}</h2>
        <p className="weather-description">
          <span className="weather-emoji">{weather.emoji}</span>
          {weather.description}
        </p>
        <div className="weather-values">
          <p>Temperatura: <strong>{weather.temperature}°C</strong></p>
          <p>Humedad: <strong>{weather.humidity}%</strong></p>
          <p>Viento: <strong>{weather.windspeed} km/h</strong></p>
        </div>
      </div>

      {coords && (
        <div className="weather-map">
          <MapView lat={coords.lat} lon={coords.lon} onMapClick={onMapClick} />
        </div>
      )}
    </section>
  );
}

export default WeatherCard;
