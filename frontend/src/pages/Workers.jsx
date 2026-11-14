import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Avatar, Stars } from '../components/Bits.jsx';
import { getPosition, savedLoc, saveLoc, fmtKm } from '../utils.js';

export default function Workers() {
  const [params] = useSearchParams();
  const toast = useToast();
  const [cats, setCats] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [q, setQ] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [minRating, setMinRating] = useState('');
  const [available, setAvailable] = useState(false);
  const [loc, setLoc] = useState(savedLoc());
  const [sort, setSort] = useState(savedLoc() ? 'distance' : 'rating');
  const [loading, setLoading] = useState(true);

  useEffect(() => { api('/categories').then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ q, category, minRating, available: available ? '1' : '', sort, ...(loc ? { lat: loc.lat, lng: loc.lng } : {}) }).toString();
    const t = setTimeout(() => api(`/workers?${qs}`).then(setWorkers).catch((e) => toast(e.message, 'error')).finally(() => setLoading(false)), 250);
    return () => clearTimeout(t);
  }, [q, category, minRating, available, sort, loc]); // eslint-disable-line

  const locate = async () => {
    try { const p = await getPosition(); saveLoc(p); setLoc(p); setSort('distance'); toast('Location set! Sorted by nearest.'); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <h1>Find a worker</h1>
      <div className="card filters">
        <input placeholder="Search name, skill or area…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All services</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={minRating} onChange={(e) => setMinRating(e.target.value)}>
          <option value="">Any rating</option><option value="4">4★ & up</option><option value="3">3★ & up</option>
        </select>
        <select value={sort} onChange={(e) => (e.target.value === 'distance' && !loc ? locate() : setSort(e.target.value))}>
          <option value="rating">Top rated</option><option value="distance">Nearest to me</option>
        </select>
        <label className="check"><input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} /> Available now</label>
      </div>
      {!loc && <p className="muted small">💡 <a href="#loc" onClick={(e) => { e.preventDefault(); locate(); }}>Share your location</a> to see which workers are closest to you.</p>}
      {loading ? <p className="muted">Loading…</p> : workers.length === 0 ? <p className="muted">No verified workers match your search.</p> : (
        <div className="grid workers">
          {workers.map((w) => (
            <Link to={`/workers/${w.id}`} key={w.id} className="card worker">
              <Avatar src={w.photo} name={w.full_name} size={64} />
              <div>
                <b>{w.full_name}</b>
                <div className="muted">{w.category} · {w.experience_years} yrs</div>
                <Stars value={w.avg_rating} count={w.rating_count} />
                {w.distance_km != null && <div className="dist">📍 {fmtKm(Number(w.distance_km))}</div>}
                <div className="muted small">{w.skills}</div>
                <span className={`badge ${w.is_available ? 'st-confirmed' : 'st-cancelled'}`}>{w.is_available ? 'Available' : 'Busy'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
