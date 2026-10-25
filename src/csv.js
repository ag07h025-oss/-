// Parses trip CSV with header: timestamp,lat,lon,label
export function parseTripCsv(text) {
  const [header, ...rows] = text.trim().split(/\r?\n/);
  const keys = header.split(',').map((k) => k.trim());
  return rows
    .filter((row) => row.trim() !== '')
    .map((row) => {
      const values = row.split(',');
      const record = Object.fromEntries(keys.map((k, i) => [k, values[i]?.trim()]));
      return { ...record, lat: Number(record.lat), lon: Number(record.lon) };
    });
}
