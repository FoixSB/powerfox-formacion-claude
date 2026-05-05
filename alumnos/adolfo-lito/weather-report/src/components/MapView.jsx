import { useEffect, useRef } from 'react';

function MapView({ lat, lon, onMapClick }) {
  const containerRef = useRef(null);
  const callbackRef = useRef(onMapClick);

  useEffect(() => {
    callbackRef.current = onMapClick;
  });

  useEffect(() => {
    if (!containerRef.current || !window.L) return;

    const map = window.L.map(containerRef.current).setView([lat, lon], 11);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    window.L.marker([lat, lon]).addTo(map);

    map.on('click', (e) => callbackRef.current(e.latlng.lat, e.latlng.lng));

    return () => map.remove();
  }, [lat, lon]);

  return <div ref={containerRef} className="weather-map-leaflet" />;
}

export default MapView;
