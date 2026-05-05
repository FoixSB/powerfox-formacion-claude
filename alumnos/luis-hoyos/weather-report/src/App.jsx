import { useState } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import WeatherCard from './components/WeatherCard';
import ForecastList from './components/ForecastList';
import { getWeatherByCity } from './api/weather';

export default function App() {
  const [weather, setWeather] = useState(getWeatherByCity('Madrid'));

  const handleSearch = (city) => {
    const result = getWeatherByCity(city);
    setWeather(result);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Weather Report</h1>
      </header>
      <main className="app-main">
        <SearchBar onSearch={handleSearch} />
        <WeatherCard weather={weather} />
        {weather && <ForecastList forecast={weather.forecast} />}
      </main>
    </div>
  );
}
