import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPosition, gmapsLink } from '../utils.js';

const ITAHARI = [26.6633, 87.2833];
const pinIcon = L.divIcon({ className: 'pin', html: '<div class="pin-dot">📍</div>', iconSize: [32, 32], iconAnchor: [16, 30] });

// value = {lat,lng} | null.  readOnly = just display a pin.
export default function LocationPicker({ value, onChange, readOnly = false, height = 300 }) {
  const el = useRef(null), map = useRef(null), marker = useRef(null), cb = useRef(onChange);
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  cb.current = onChange;

  const setPin = (lat, lng) => {
    if (!marker.current) {
      marker.current = L.marker([lat, lng], { icon: pinIcon, draggable: !readOnly }).addTo(map.current);
      if (!readOnly) marker.current.on('dragend', () => {
        const p = marker.current.getLatLng();
        cb.current?.({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) });
      });
    } else marker.current.setLatLng([lat, lng]);
  };
  const goTo = (lat, lng) => { setPin(lat, lng); map.current.setView([lat, lng], 16); cb.current?.({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) }); };

  useEffect(() => {
    const start = value?.lat != null ? [Number(value.lat), Number(value.lng)] : ITAHARI;
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView(start, value?.lat != null ? 16 : 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map.current);
    if (value?.lat != null) setPin(Number(value.lat), Number(value.lng));
    if (!readOnly) map.current.on('click', (e) => { setPin(e.latlng.lat, e.latlng.lng); cb.current?.({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) }); });
    return () => { map.current.remove(); marker.current = null; };
    // eslint-disable-next-line
  }, []);

  useEffect(() => { if (value?.lat != null && map.current) setPin(Number(value.lat), Number(value.lng)); }, [value?.lat, value?.lng]); // eslint-disable-line

  const useMine = async () => { try { setNote('Getting your location…'); const p = await getPosition(); goTo(p.lat, p.lng); setNote('Pinned your current location. Drag the pin to adjust.'); } catch (e) { setNote(e.message); } };
  const search = async () => {
    if (!q.trim()) return;
    setNote('Searching…');
    try {
      const r = await (await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`)).json();
      if (!r.length) return setNote('Place not found. Try a different name or click on the map.');
      goTo(Number(r[0].lat), Number(r[0].lon)); setNote('Place found. Drag the pin to the exact spot.');
    } catch { setNote('Search failed. You can still click on the map.'); }
  };

  return (
    <div className="locpicker">
      {!readOnly && (
        <>
          <div className="row" style={{ marginTop: 0 }}>
            <input placeholder="Search a place (e.g. Itahari Chowk)" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())} />
            <button type="button" className="btn btn-outline" onClick={search}>Search</button>
            <button type="button" className="btn btn-primary" onClick={useMine}>📍 Use my location</button>
          </div>
          <small className="muted">Click on the map or drag the pin to mark the exact work location.</small>
        </>
      )}
      <div ref={el} className="map" style={{ height }} />
      {note && <small className="muted">{note}</small>}
      {value?.lat != null && (
        <small>📌 {Number(value.lat).toFixed(5)}, {Number(value.lng).toFixed(5)} · <a href={gmapsLink(value.lat, value.lng)} target="_blank" rel="noreferrer">Open in Google Maps</a></small>
      )}
    </div>
  );
}
