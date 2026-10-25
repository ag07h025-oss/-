// Animates the route along trip timestamps. Rendering is a pure function of
// progress (0..1) so a future video exporter can step frames deterministically.

const EMPTY_LINE = { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } };

export function createRouteAnimation(map, points, { durationMs = 20000, onFrame } = {}) {
  const coords = points.map((p) => [p.lon, p.lat]);
  const times = points.map((p) => Date.parse(p.timestamp));
  const start = times[0];
  const span = times[times.length - 1] - start;

  map.addSource('route-progress', { type: 'geojson', data: EMPTY_LINE });
  map.addSource('route-head', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: coords[0] } },
  });
  map.addLayer({
    id: 'route-progress',
    type: 'line',
    source: 'route-progress',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#e4572e', 'line-width': 5 },
  });
  map.addLayer({
    id: 'route-head',
    type: 'circle',
    source: 'route-head',
    paint: {
      'circle-radius': 8,
      'circle-color': '#ffffff',
      'circle-stroke-color': '#e4572e',
      'circle-stroke-width': 4,
    },
  });

  let progress = 0;
  let speed = 1;
  let playing = false;
  let lastTs = null;
  let rafId = null;

  function renderAt(p) {
    progress = Math.min(Math.max(p, 0), 1);
    const time = start + span * progress;
    // Last point index whose timestamp is <= current time.
    let i = 0;
    while (i < times.length - 2 && times[i + 1] <= time) i++;
    const segSpan = times[i + 1] - times[i];
    const f = segSpan > 0 ? Math.min((time - times[i]) / segSpan, 1) : 1;
    const [lon0, lat0] = coords[i];
    const [lon1, lat1] = coords[i + 1];
    const head = [lon0 + (lon1 - lon0) * f, lat0 + (lat1 - lat0) * f];

    map.getSource('route-progress').setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [...coords.slice(0, i + 1), head] },
    });
    map.getSource('route-head').setData({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: head },
    });
    onFrame?.({ progress, time: new Date(time), playing });
  }

  function tick(ts) {
    if (lastTs !== null) {
      const next = progress + ((ts - lastTs) * speed) / durationMs;
      if (next >= 1) {
        playing = false;
        renderAt(1);
        rafId = null;
        lastTs = null;
        return;
      }
      renderAt(next);
    }
    lastTs = ts;
    rafId = requestAnimationFrame(tick);
  }

  function play() {
    if (playing) return;
    if (progress >= 1) progress = 0;
    playing = true;
    lastTs = null;
    rafId = requestAnimationFrame(tick);
  }

  function pause() {
    playing = false;
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    lastTs = null;
    renderAt(progress);
  }

  renderAt(0);

  return {
    play,
    pause,
    toggle: () => (playing ? pause() : play()),
    restart() {
      renderAt(0);
      play();
    },
    seek: renderAt,
    setSpeed(value) {
      speed = value;
    },
    get playing() {
      return playing;
    },
  };
}
