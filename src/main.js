import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import tripCsv from '../data/trip.csv?raw';
import { parseTripCsv } from './csv.js';
import { createRouteAnimation } from './animation.js';
import { ATTRIBUTION_TEXT, basemapStyle } from './basemap.js';
import { createControls } from './controls.js';
import { downloadBlob, exportMp4 } from './exporter.js';

const points = parseTripCsv(tripCsv);
const coordinates = points.map((p) => [p.lon, p.lat]);

const map = new maplibregl.Map({
  container: 'map',
  style: basemapStyle,
  center: coordinates[0],
  zoom: 11,
  // Keep the last frame readable so the exporter can copy it after rendering.
  canvasContextAttributes: { preserveDrawingBuffer: true },
});

map.on('load', () => {
  // Full route as a faint guide; the animated line is drawn on top of it.
  map.addSource('route', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'LineString', coordinates } },
  });
  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    paint: { 'line-color': '#e4572e', 'line-width': 3, 'line-opacity': 0.25 },
  });

  // Stops are drawn as map layers (not DOM markers) so they appear in exported videos.
  map.addSource('stops', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: points.map((p) => ({
        type: 'Feature',
        properties: { label: p.label, timestamp: p.timestamp },
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      })),
    },
  });
  map.addLayer({
    id: 'stops',
    type: 'circle',
    source: 'stops',
    paint: {
      'circle-radius': 5,
      'circle-color': '#3a86ff',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  });
  map.addLayer({
    id: 'stop-labels',
    type: 'symbol',
    source: 'stops',
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Open Sans Semibold'],
      'text-size': 13,
      'text-offset': [0, 1.2],
      'text-anchor': 'top',
    },
    paint: { 'text-color': '#222', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
  });
  map.on('click', 'stops', (e) => {
    const { label, timestamp } = e.features[0].properties;
    new maplibregl.Popup().setLngLat(e.lngLat).setText(`${label} (${timestamp})`).addTo(map);
  });
  map.on('mouseenter', 'stops', () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', 'stops', () => (map.getCanvas().style.cursor = ''));

  const bounds = coordinates.reduce(
    (b, c) => b.extend(c),
    new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
  );
  map.fitBounds(bounds, { padding: 60, duration: 0 });

  const controls = createControls(document.body);
  const animation = createRouteAnimation(map, points, { onFrame: controls.update });
  // Keep stops above the animated line but below its moving head.
  map.moveLayer('stops', 'route-head');
  map.moveLayer('stop-labels');
  controls.bind(animation, {
    async onExport(onProgress) {
      animation.pause();
      // Freeze the camera so the video isn't affected by accidental drags.
      map.getCanvasContainer().style.pointerEvents = 'none';
      try {
        const blob = await exportMp4(map, animation, { attribution: ATTRIBUTION_TEXT, onProgress });
        downloadBlob(blob, 'trip.mp4');
      } finally {
        map.getCanvasContainer().style.pointerEvents = '';
      }
    },
  });
  animation.play();
});
