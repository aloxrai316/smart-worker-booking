import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import { Status, Alert, Avatar } from '../components/Bits.jsx';
import { gmapsLink } from '../utils.js';

function ReviewBox({ booking, done }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  return (
    <div className="inline-box">
      <div>{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" className={`star ${n <= rating ? 'on' : ''}`} onClick={() => setRating(n)}>★</button>)}</div>
      <input placeholder="Share your experience…" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn btn-primary" onClick={async () => { await api(`/bookings/${booking.id}/review`, { method: 'POST', body: { rating, comment } }); done('Thanks for your review!'); }}>Submit</button>
    </div>
  );
}

export default function MyBookings() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState({});
  const [open, setOpen] = useState(null); // {id, type}
  const [complaint, setComplaint] = useState('');

  const load = useCallback(() => api('/bookings/mine').then(setList), []);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const act = async (fn) => {
    try { const d = await fn(); setMsg({ ok: d?.message || 'Done' }); setOpen(null); load(); }
    catch (e) { setMsg({ error: e.message }); }
  };

  return (
    <>
      <h1>My bookings</h1>
      <Alert msg={msg.error} /><Alert msg={msg.ok} type="ok" />
      {list.length === 0 && <p className="muted">No bookings yet — find a worker to get started.</p>}
      {list.map((b) => (
        <div key={b.id} className="card booking">
          <div className="booking-top">
            <Avatar src={b.worker_photo} name={b.worker_name} />
            <div className="grow">
              <b>{b.worker_name}</b> <span className="muted">· {b.category}</span>
              <div className="muted small">Booked {b.created_at?.slice(0, 16)} {b.service_date && `· for ${b.service_date.slice(0, 10)}`}</div>
              <div className="muted small">📍 {b.house_address} · 📞 {b.contact_phone} {b.lat && <a href={gmapsLink(b.lat, b.lng)} target="_blank" rel="noreferrer">· 🗺 View pinned location</a>}</div>
            </div>
            <Status s={b.status} />
          </div>
          {b.status === 'pending' && <p className="muted">⏳ Waiting for response ({Math.max(0, Math.floor(b.seconds_left / 60))} min left)…</p>}
          <div className="row">
            {b.status === 'accepted' && <button className="btn btn-primary" onClick={() => act(() => api(`/bookings/${b.id}/pay`, { method: 'POST', body: { method: 'demo' } }))}>Pay Rs. 100 to confirm</button>}
            {['pending', 'accepted', 'confirmed'].includes(b.status) && <button className="btn btn-outline" onClick={() => window.confirm('Cancel this booking?') && act(() => api(`/bookings/${b.id}/cancel`, { method: 'PATCH' }))}>Cancel</button>}
            {b.status === 'completed' && !b.reviewed && <button className="btn btn-primary" onClick={() => setOpen({ id: b.id, type: 'review' })}>Rate service</button>}
            {['confirmed', 'in_progress', 'completed'].includes(b.status) && <button className="btn btn-outline" onClick={() => setOpen({ id: b.id, type: 'complaint' })}>Report a problem</button>}
          </div>
          {open?.id === b.id && open.type === 'review' && <ReviewBox booking={b} done={(m) => { setMsg({ ok: m }); setOpen(null); load(); }} />}
          {open?.id === b.id && open.type === 'complaint' && (
            <div className="inline-box">
              <input placeholder="Describe the problem" value={complaint} onChange={(e) => setComplaint(e.target.value)} />
              <button className="btn btn-primary" onClick={() => act(() => api(`/bookings/${b.id}/complaint`, { method: 'POST', body: { message: complaint } }))}>Send to admin</button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
