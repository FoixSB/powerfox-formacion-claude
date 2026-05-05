import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './WeatherMap.css'

// Leaflet's default marker icons break with bundlers — point to CDN directly
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function WeatherMap({ lat, lon, city }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([lat, lon], 10)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current)
    } else {
      mapRef.current.setView([lat, lon], 10)
    }

    // Remove old markers and add new one
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) layer.remove()
    })
    const popupEl = document.createElement('span')
    popupEl.textContent = city
    L.marker([lat, lon]).addTo(mapRef.current).bindPopup(popupEl).openPopup()
  }, [lat, lon, city])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return <div className="weather-map" ref={containerRef} />
}
