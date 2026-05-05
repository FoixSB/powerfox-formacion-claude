import { useState, useEffect } from 'react'
import SearchBar from './components/SearchBar'
import WeatherCard from './components/WeatherCard'
import WeatherMap from './components/WeatherMap'
import ForecastList from './components/ForecastList'
import SolarProgress from './components/SolarProgress'
import { getWeatherByCity } from './api/weather'
import './App.css'

function getGradient(code) {
  if (code === 0) return 'from-amber-400 via-orange-400 to-orange-500'
  if (code <= 3) return 'from-slate-400 via-slate-500 to-blue-600'
  if (code <= 48) return 'from-slate-400 via-slate-500 to-slate-700'
  if (code <= 65 || (code >= 80 && code <= 82)) return 'from-blue-400 via-blue-500 to-slate-700'
  if (code <= 75) return 'from-slate-200 via-blue-300 to-blue-400'
  return 'from-slate-600 via-slate-700 to-slate-900'
}

const TABS = [
  { id: 'weather', icon: 'sunny', label: 'Tiempo' },
  { id: 'radar', icon: 'map', label: 'Mapa' },
]

export default function App() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastCity, setLastCity] = useState('Madrid')
  const [activeTab, setActiveTab] = useState('weather')
  const [unit, setUnit] = useState('C')

  useEffect(() => { handleSearch('Madrid') }, [])

  async function handleSearch(city) {
    setLoading(true)
    setError(null)
    setLastCity(city)
    setActiveTab('weather')
    try {
      const data = await getWeatherByCity(city)
      setWeather(data)
    } catch (err) {
      setError(err.message || 'Error al obtener el clima')
    } finally {
      setLoading(false)
    }
  }

  function displayTemp(celsius) {
    return unit === 'F' ? Math.round(celsius * 9 / 5 + 32) : celsius
  }

  const gradient = getGradient(weather?.code ?? 0)

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient} font-sans transition-all duration-700`}>

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 glass-nav rounded-b-3xl border-b border-white/20 shadow-2xl">
        <button className="text-white hover:bg-white/10 p-2 rounded-full transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-semibold text-white leading-tight">
            {weather ? `${weather.city}, ${weather.country}` : 'Weather Report'}
          </h1>
          {weather && (
            <span className="text-[10px] text-white/70 uppercase tracking-widest font-medium">
              Actualizado: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/20">
          {['C', 'F'].map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                unit === u ? 'bg-white/30 text-white' : 'text-white/60 hover:text-white'
              }`}
            >{u}</button>
          ))}
        </div>
      </header>

      {/* Main */}
      <main className="pt-28 pb-32 px-4">
        <div className="max-w-md mx-auto lg:max-w-5xl flex flex-col gap-5">

          <SearchBar onSearch={handleSearch} />

          {loading && (
            <div className="flex justify-center py-16">
              <span
                className="material-symbols-outlined text-white text-6xl"
                style={{ animation: 'spin 1.5s linear infinite' }}
              >refresh</span>
            </div>
          )}

          {error && !loading && (
            <div className="glass-panel rounded-2xl p-8 text-center border border-red-400/30">
              <span className="material-symbols-outlined text-red-300 text-5xl block mb-3"
                style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <p className="text-white/90 mb-5">{error}</p>
              <button
                onClick={() => handleSearch(lastCity)}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full text-sm font-semibold transition-all"
              >Reintentar</button>
            </div>
          )}

          {weather && !loading && !error && (
            <>
              {/* Tabs (solo en móvil cuando hay mapa) */}
              <div className="flex gap-2 lg:hidden">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-white/30 text-white'
                        : 'glass-panel text-white/60 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm"
                      style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Layout móvil: tabs */}
              <div className="lg:hidden">
                {activeTab === 'weather' && (
                  <div className="flex flex-col gap-5">
                    <WeatherCard data={weather} displayTemp={displayTemp} unit={unit} />
                    <SolarProgress sunrise={weather.sunrise} sunset={weather.sunset} />
                    <ForecastList forecast={weather.forecast} displayTemp={displayTemp} unit={unit} />
                  </div>
                )}
                {activeTab === 'radar' && (
                  <WeatherMap lat={weather.lat} lon={weather.lon} city={weather.city} />
                )}
              </div>

              {/* Layout escritorio: dos columnas siempre visibles */}
              <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
                <div className="flex flex-col gap-5">
                  <WeatherCard data={weather} displayTemp={displayTemp} unit={unit} />
                  <SolarProgress sunrise={weather.sunrise} sunset={weather.sunset} />
                  <ForecastList forecast={weather.forecast} displayTemp={displayTemp} unit={unit} />
                </div>
                <div>
                  <WeatherMap lat={weather.lat} lon={weather.lon} city={weather.city} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Bottom Nav (solo móvil) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 glass-nav rounded-t-3xl border-t border-white/20">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center px-6 py-2 rounded-full transition-all ${
              activeTab === tab.id ? 'bg-white/20 text-orange-300' : 'text-white/50 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined"
              style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}
            >{tab.icon}</span>
            <span className="text-[10px] uppercase tracking-widest font-semibold mt-1">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
