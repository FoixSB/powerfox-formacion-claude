import { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar.jsx';
import WeatherCard from './components/WeatherCard.jsx';
import HourlyForecast from './components/HourlyForecast.jsx';
import ForecastList from './components/ForecastList.jsx';
import { getWeatherByCity, getWeatherByCoords } from './api/weather.js';
import RadarPlayer from './components/RadarPlayer.jsx';

function App() {
  const [weather, setWeather] = useState(null);
  const [coords, setCoords] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [displayCity, setDisplayCity] = useState('');
  const [lastCity, setLastCity] = useState('Madrid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function applyWeatherData(data) {
    setWeather(data.current);
    setCoords({ lat: data.lat, lon: data.lon });
    setHourly(data.hourly);
    setForecast(data.forecast);
    setDisplayCity(`${data.name}${data.country ? ', ' + data.country : ''}`);
  }

  const handleSearch = async (searchCity) => {
    setLastCity(searchCity);
    setError('');
    setLoading(true);
    try {
      applyWeatherData(await getWeatherByCity(searchCity));
    } catch (err) {
      setWeather(null);
      setCoords(null);
      setHourly([]);
      setForecast([]);
      setError(err.message || 'Error al cargar el clima.');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = async (lat, lon) => {
    setError('');
    setLoading(true);
    try {
      const data = await getWeatherByCoords(lat, lon);
      setLastCity(data.name);
      applyWeatherData(data);
    } catch (err) {
      setError(err.message || 'Error al cargar el clima.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch('Madrid');
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Weather Report</h1>
        <p>Busca una ciudad o haz clic en el mapa para ver el clima.</p>
      </header>

      <main className="app-main">
        <SearchBar onSearch={handleSearch} defaultCity="Madrid" />

        {loading && <div className="status-message">Cargando...</div>}

        {error && (
          <div className="status-message error">
            {error}
            <button className="retry-btn" onClick={() => handleSearch(lastCity)}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && weather && (
          <>
            <WeatherCard
              weather={weather}
              city={displayCity}
              coords={coords}
              onMapClick={handleMapClick}
            />
            <HourlyForecast hourly={hourly} />
            <ForecastList forecast={forecast} />
            <RadarPlayer lat={coords.lat} lon={coords.lon} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
