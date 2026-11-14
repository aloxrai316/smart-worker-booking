import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Status, Alert } from '../components/Bits.jsx';
import { gmapsLink } from '../utils.js';

function Countdown({ seconds }) {
  const [s, setS] = useState(seconds);
  useEffect(() => { setS(seconds); const t = setInterval(() => setS((x) => x - 1), 1000); return () => clearInterval(t); }, [seconds]);
  if (s <= 0) return <b className="danger">Time is up</b>;
  return <b className="warn">⏱ {String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')} left to respond</b>;
}

export default function WorkerDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [list, setList] = useState([]);
  const [profile, setProfile] = useState(null);

  const load = useCallback(() => api('/bookings/mine').then(setList).catch(() => {}), []);
  useEffect(() => { api('/workers/me/profile').then(setProfile).catch((e) => toast(e.message, 'error')); load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]); // eslint-disable-line

  const act = async (fn) => {
    try { const d = await fn(); toast(d.message); } catch (e) { toast(e.message, 'error'); }
    load();
  };

  const pending = list.filter((b) => b.status === 'pending' && b.seconds_left > 0);
  const active = list.filter((b) => ['accepted', 'confirmed', 'in_progress'].includes(b.status));
  const done = list.filter((b) => ['completed', 'rejected', 'expired', 'cancelled'].includes(b.status));
  const completed = list.filter((b) => b.status === 'completed').length;
  const incomplete = profile && (!profile.photo || !profile.lat);

  return (
    <>
      <h1>Welcome, {user.full_name.split(' ')[0]} 👷</h1>
      {profile && (
        <div className="card welcome">
          <div className="grow">
            <b>{profile.category}</b> · ⭐ {Number(profile.avg_rating).toFixed(1)} ({profile.rating_count} reviews)
            <div className="muted small">Status: {profile.is_verified ? '✅ Verified — customers can find and book you' : '⏳ Waiting for admin verification'} · {profile.is_available ? '🟢 Available for work' : '🔴 Not available'}</div>
          </div>
          <div className="row" style={{ marginTop: 0 }}>
            <Link to="/worker/me" className="btn btn-outline">View my profile</Link>
            <Link to="/worker/profile" className="btn btn-primary">Edit profile</Link>
          </div>
        </div>
      )}
      {incomplete && <Alert type="warn" msg="Your profile is incomplete. Add a photo and your service location so customers can trust and find you." />}
      {profile && !profile.is_verified && <Alert type="warn" msg="Your profile is awaiting admin verification. Customers cannot see or book you until you are verified." />}

      <div className="grid stats">
        <div className="card stat"><h3>{pending.length}</h3><small>New requests</small></div>
        <div className="card stat"><h3>{active.length}</h3><small>Active jobs</small></div>
        <div className="card stat"><h3>{completed}</h3><small>Completed jobs</small></div>
      </div>

      <h2>🔔 New requests ({pending.length})</h2>
      {pending.length === 0 && <div className="card empty">⏳ Waiting for work… new booking requests will appear here automatically. Keep this page open.</div>}
      {pending.map((b) => (
        <div key={b.id} className="card booking hl">
          <div className="booking-top">
            <div className="grow"><b>{b.category} job</b> · {b.description || 'No description'}<div className="muted small">Date: {b.service_date?.slice(0, 10) || 'flexible'} · customer details unlock after payment</div></div>
            <Countdown seconds={b.seconds_left} />
          </div>
          <div className="row">
            <button className="btn btn-primary" onClick={() => act(() => api(`/bookings/${b.id}/respond`, { method: 'PATCH', body: { action: 'accept' } }))}>Accept</button>
            <button className="btn btn-outline" onClick={() => act(() => api(`/bookings/${b.id}/respond`, { method: 'PATCH', body: { action: 'reject' } }))}>Reject</button>
          </div>
        </div>
      ))}

      <h2>Active bookings ({active.length})</h2>
      {active.length === 0 && <p className="muted">Nothing active.</p>}
      {active.map((b) => (
        <div key={b.id} className="card booking">
          <div className="booking-top">
            <div className="grow">
              <b>{b.customer_name}</b>
              {b.contact_phone ? (
                <div>📞 {b.contact_phone}<br />📍 {b.house_address}
                  {b.lat && <><br /><a className="btn btn-sm btn-primary" style={{ marginTop: 6 }} href={gmapsLink(b.lat, b.lng)} target="_blank" rel="noreferrer">🗺 Open customer location in Google Maps</a></>}
                </div>
              ) : <div className="muted small">Waiting for customer to pay Rs. 100 — then phone, address & map pin unlock.</div>}
              <div className="muted small">{b.description}</div>
            </div>
            <Status s={b.status} />
          </div>
          <div className="row">
            {b.status === 'confirmed' && <button className="btn btn-primary" onClick={() => act(() => api(`/bookings/${b.id}/status`, { method: 'PATCH', body: { status: 'in_progress' } }))}>Start work</button>}
            {b.status === 'in_progress' && <button className="btn btn-primary" onClick={() => act(() => api(`/bookings/${b.id}/status`, { method: 'PATCH', body: { status: 'completed' } }))}>Mark completed</button>}
          </div>
        </div>
      ))}

      <h2>History</h2>
      <div className="card">
        <table>
          <thead><tr><th>#</th><th>Customer</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {done.map((b) => <tr key={b.id}><td>{b.id}</td><td>{b.status === 'completed' ? b.customer_name : '—'}</td><td>{b.created_at?.slice(0, 10)}</td><td><Status s={b.status} /></td></tr>)}
            {done.length === 0 && <tr><td colSpan="4" className="muted">No history yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
