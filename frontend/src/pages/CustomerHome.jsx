import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Avatar, Stars } from '../components/Bits.jsx';
import { getPosition, savedLoc, saveLoc, fmtKm } from '../utils.js';

export default function CustomerHome() {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState(savedLoc());
  const [near, setNear] = useState([]);

  useEffect(() => { api('/categories').then(setCats).catch((e) => toast(e.message, 'error')); }, []); // eslint-disable-line
  useEffect(() => {
    const qs = new URLSearchParams({ limit: 6, ...(loc ? { lat: loc.lat, lng: loc.lng, sort: 'distance' } : {}) });
    api(`/workers?${qs}`).then(setNear).catch(() => {});
  }, [loc]);

  const locate = async () => {
    try { const p = await getPosition(); saveLoc(p); setLoc(p); toast('Location set! Showing workers nearest to you.'); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <section className="hero left">
        <h1>Hi {user.full_name.split(' ')[0]} 👋<br />What type of worker do you need?</h1>
        <form className="searchbar" onSubmit={(e) => { e.preventDefault(); nav(`/workers?q=${encodeURIComponent(q)}`); }}>
          <input placeholder="Search electrician, plumber, painter…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-primary">Search</button>
        </form>
        <div className="row">
          <button className="btn btn-outline-light" onClick={locate}>📍 {loc ? 'Update my location' : 'Use my location to find nearby workers'}</button>
          {loc && <small style={{ color: '#d1d5db' }}>Location saved · results sorted by distance</small>}
        </div>
      </section>

      <h2 className="section-title">Choose a service</h2>
      <div className="grid cats">
        {cats.map((c) => (
          <Link key={c.id} to={`/workers?category=${c.id}`} className="card cat"><b>{c.name}</b></Link>
        ))}
        {cats.length === 0 && <p className="muted">Loading services…</p>}
      </div>

      <div className="row-between" style={{ alignItems: 'baseline' }}>
        <h2 className="section-title">{loc ? '📍 Workers near you' : '⭐ Top rated workers'}</h2>
        <Link to="/workers">See all →</Link>
      </div>
      {near.length === 0 ? <p className="muted">No verified workers yet.</p> : (
        <div className="grid workers">
          {near.map((w) => (
            <Link to={`/workers/${w.id}`} key={w.id} className="card worker">
              <Avatar src={w.photo} name={w.full_name} size={64} />
              <div>
                <b>{w.full_name}</b>
                <div className="muted">{w.category} · {w.experience_years} yrs</div>
                <Stars value={w.avg_rating} count={w.rating_count} />
                {w.distance_km != null && <div className="dist">📍 {fmtKm(Number(w.distance_km))}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}

    </>
  );
}
