import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import tripCsv from '../data/trip.csv?raw';
import { parseTripCsv } from './csv.js';

const points = parseTripCsv(tripCsv);
const coordinates = points.map((p) => [p.lon, p.lat]);

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: coordinates[0],
  zoom: 11,
});

map.on('load', () => {
  map.addSource('route', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'LineString', coordinates } },
  });
  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    paint: { 'line-color': '#e4572e', 'line-width': 4 },
  });

  for (const p of points) {
    new maplibregl.Marker()
      .setLngLat([p.lon, p.lat])
      .setPopup(new maplibregl.Popup().setText(`${p.label} (${p.timestamp})`))
      .addTo(map);
  }

  const bounds = coordinates.reduce(
    (b, c) => b.extend(c),
    new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
  );
  map.fitBounds(bounds, { padding: 60 });
});
