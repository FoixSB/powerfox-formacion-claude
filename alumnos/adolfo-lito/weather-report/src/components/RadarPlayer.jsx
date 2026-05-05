import { useEffect, useRef, useState } from 'react';

const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';
const TILE_HOST = 'https://tilecache.rainviewer.com';

function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RadarPlayer({ lat, lon }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const radarLayerRef = useRef(null);

  const [frames, setFrames] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loadingFrames, setLoadingFrames] = useState(true);
  const [errorFrames, setErrorFrames] = useState(false);

  // Fetch radar timestamps once
  useEffect(() => {
    fetch(RAINVIEWER_API)
      .then((r) => r.json())
      .then((data) => {
        const past = (data.radar?.past ?? []).map((f) => ({ ...f, nowcast: false }));
        const nowcast = (data.radar?.nowcast ?? []).map((f) => ({ ...f, nowcast: true }));
        const all = [...past, ...nowcast];
        setFrames(all);
        setIndex(past.length - 1);
      })
      .catch(() => setErrorFrames(true))
      .finally(() => setLoadingFrames(false));
  }, []);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || !window.L) return;
    const map = window.L.map(containerRef.current);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      opacity: 0.6,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      radarLayerRef.current = null;
    };
  }, []);

  // Re-center map when city changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([lat, lon], 6);
  }, [lat, lon]);

  // Swap radar layer when frame or city changes
  useEffect(() => {
    if (!mapRef.current || !frames[index]) return;
    if (radarLayerRef.current) {
      mapRef.current.removeLayer(radarLayerRef.current);
    }
    const layer = window.L.tileLayer(
      `${TILE_HOST}${frames[index].path}/256/{z}/{x}/{y}/2/1_1.png`,
      { opacity: 0.65, zIndex: 10 }
    );
    layer.addTo(mapRef.current);
    radarLayerRef.current = layer;
  }, [frames, index, lat, lon]);

  // Playback
  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % frames.length), 700);
    return () => clearInterval(id);
  }, [playing, frames.length]);

  const current = frames[index];
  const pastCount = frames.filter((f) => !f.nowcast).length;

  return (
    <section className="card">
      <h3>Radar de precipitación</h3>

      {errorFrames ? (
        <p className="radar-error">No se pudo cargar el radar. Inténtalo más tarde.</p>
      ) : (
        <>
          <div ref={containerRef} className="radar-map" />

          <div className="radar-controls">
            <button
              className="radar-btn"
              onClick={() => setPlaying((p) => !p)}
              disabled={!frames.length}
            >
              {playing ? '⏸' : '▶'}
            </button>

            <div className="radar-slider-wrap">
              <input
                type="range"
                min={0}
                max={Math.max(0, frames.length - 1)}
                value={index}
                onChange={(e) => { setPlaying(false); setIndex(Number(e.target.value)); }}
                disabled={!frames.length}
              />
              {frames.length > 0 && (
                <div
                  className="radar-nowcast-marker"
                  style={{ left: `${(pastCount / frames.length) * 100}%` }}
                  title="Inicio del pronóstico"
                />
              )}
            </div>

            <span className="radar-time">
              {loadingFrames
                ? 'Cargando...'
                : current
                  ? `${formatTime(current.time)}${current.nowcast ? ' · pronóstico' : ''}`
                  : '–'}
            </span>
          </div>

          <p className="radar-credit">
            Radar:{' '}
            <a href="https://rainviewer.com" target="_blank" rel="noreferrer">
              RainViewer
            </a>
            {' · '}
            {pastCount} fotogramas (~2h) + {frames.length - pastCount} nowcast (~30min)
          </p>
        </>
      )}
    </section>
  );
}

export default RadarPlayer;
