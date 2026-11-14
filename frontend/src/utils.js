export const gmapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

export function distanceKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export const fmtKm = (d) => (d == null ? null : d < 1 ? `${Math.round(d * 1000)} m away` : `${d.toFixed(1)} km away`);

export const getPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error('Location is not supported by this browser'));
  navigator.geolocation.getCurrentPosition(
    (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
    () => reject(new Error('Location permission was denied. Allow location access in your browser.')),
    { enableHighAccuracy: true, timeout: 12000 });
});

export const savedLoc = () => { try { return JSON.parse(localStorage.getItem('myloc')); } catch { return null; } };
export const saveLoc = (l) => localStorage.setItem('myloc', JSON.stringify(l));
