// GSI (Geospatial Information Authority of Japan) tiles. Usage requires showing the source.
// https://maps.gsi.go.jp/development/ichiran.html
export const ATTRIBUTION_TEXT = '出典: 国土地理院';

export const basemapStyle = {
  version: 8,
  // GSI tiles are raster-only, so stop labels borrow MapLibre's demo glyphs.
  // Japanese characters are rendered with local fonts and don't depend on these.
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    gsi: {
      type: 'raster',
      tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
      tileSize: 256,
      minzoom: 2,
      maxzoom: 18,
      attribution:
        '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル</a>',
    },
  },
  layers: [{ id: 'gsi', type: 'raster', source: 'gsi' }],
};
