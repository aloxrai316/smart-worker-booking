import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Avatar, Stars, Alert } from '../components/Bits.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import { distanceKm, fmtKm, savedLoc } from '../utils.js';

export default function WorkerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [w, setW] = useState(null);
  const [f, setF] = useState({ service_date: '', description: '', contact_phone: '', house_address: '' });
  const [pin, setPin] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { api(`/workers/${id}`).then(setW).catch((e) => setErr(e.message)); }, [id]);
  useEffect(() => {
    if (user?.role === 'customer')
      api('/auth/me').then((m) => setF((x) => ({ ...x, contact_phone: m.phone || '', house_address: m.address || '' }))).catch(() => {});
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!pin) return setErr('Please pin your work location on the map before sending the request.');
    try {
      const d = await api('/bookings', { method: 'POST', body: { ...f, ...pin, worker_id: id } });
      toast(d.message);
      nav('/my-bookings');
    } catch (e) { setErr(e.message); }
  };

  if (!w) return <Alert msg={err} />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const mine = savedLoc();
  const km = w.lat != null ? distanceKm(mine, { lat: Number(w.lat), lng: Number(w.lng) }) : null;

  return (
    <div className="two-col">
      <div>
        <p style={{ margin: 0 }}><Link to="/workers">← Back to workers</Link></p>
        <div className="card profile-head">
          <Avatar src={w.photo} name={w.full_name} size={96} />
          <div>
            <h1>{w.full_name}</h1>
            <div className="muted">{w.category} · {w.experience_years} years experience</div>
            <Stars value={w.avg_rating} count={w.rating_count} />
            {km != null && <div className="dist">📍 {fmtKm(km)}</div>}
          </div>
        </div>
        <div className="card">
          <h3>Worker profile</h3>
          <dl className="info">
            <dt>Specialization</dt><dd>{w.category}</dd>
            <dt>Skills</dt><dd>{w.skills || '—'}</dd>
            <dt>Experience</dt><dd>{w.experience_years} years</dd>
            <dt>Service information</dt><dd>{w.service_info || '—'}</dd>
            <dt>Availability</dt><dd>{w.availability} {w.is_available ? '✅' : '⛔ currently busy'}</dd>
            <dt>Area</dt><dd>{w.address || '—'}</dd>
            <dt>Phone</dt><dd>Shared after booking is confirmed</dd>
          </dl>
          {w.bio && <p>{w.bio}</p>}
        </div>
        {w.lat != null && <div className="card"><h3>📍 Worker location</h3><LocationPicker readOnly value={{ lat: Number(w.lat), lng: Number(w.lng) }} height={220} /></div>}
        <div className="card">
          <h3>Reviews ({w.reviews.length})</h3>
          {w.reviews.length === 0 && <p className="muted">No reviews yet.</p>}
          {w.reviews.map((r, i) => (
            <div key={i} className="review"><Stars value={r.rating} /> <b>{r.customer}</b> <small className="muted">{r.created_at?.slice(0, 10)}</small><p>{r.comment}</p></div>
          ))}
        </div>
      </div>

      <aside>
        <form className="card form" onSubmit={submit}>
          <h3>Book {w.full_name.split(' ')[0]}</h3>
          {!user ? <p>Please <Link to="/login">log in</Link> as a customer to book.</p>
            : user.role !== 'customer' ? <p className="muted">Only customers can book workers.</p> : (
            <>
              <Alert msg={err} />
              <label>Preferred date<input type="date" value={f.service_date} min={new Date().toISOString().slice(0, 10)} onChange={set('service_date')} /></label>
              <label>Phone number *<input required value={f.contact_phone} onChange={set('contact_phone')} /></label>
              <label>Full house address *<textarea required rows="2" value={f.house_address} onChange={set('house_address')} /></label>
              <label>Work location pin * <span className="muted small">(share where the worker should come)</span></label>
              <LocationPicker value={pin} onChange={setPin} height={240} />
              <label>What do you need?<textarea rows="3" value={f.description} onChange={set('description')} /></label>
              <button className="btn btn-primary" disabled={!w.is_available}>Send request</button>
              <p className="muted small">The worker has 10 minutes to accept. A Rs. 100 booking charge is paid after acceptance. Your phone, address and map pin are shown to the worker only after payment.</p>
            </>
          )}
        </form>
      </aside>
    </div>
  );
}
