import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Avatar, Stars, Alert } from '../components/Bits.jsx';
import LocationPicker from '../components/LocationPicker.jsx';

// What the worker sees when viewing their own profile (same info customers see)
export default function WorkerMyProfile() {
  const [w, setW] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/workers/me/profile').then(setW).catch((e) => setErr(e.message)); }, []);
  if (!w) return <Alert msg={err} />;
  return (
    <>
      <div className="row-between" style={{ alignItems: 'center' }}>
        <h1>My profile</h1>
        <div className="row"><Link to="/worker/profile" className="btn btn-outline">Edit profile</Link><Link to="/worker" className="btn btn-primary">Go to dashboard</Link></div>
      </div>
      <Alert type={w.is_verified ? 'ok' : 'warn'} msg={w.is_verified ? '✅ You are verified. Customers can find and book you.' : '⏳ Waiting for admin verification. Customers can’t see your profile yet.'} />
      <div className="two-col even">
        <div>
          <div className="card profile-head">
            <Avatar src={w.photo} name={w.full_name} size={96} />
            <div>
              <h1>{w.full_name}</h1>
              <div className="muted">{w.category} · {w.experience_years} years experience</div>
              <Stars value={w.avg_rating} count={w.rating_count} />
            </div>
          </div>
          <div className="card">
            <h3>Details</h3>
            <dl className="info">
              <dt>Phone</dt><dd>{w.phone || '—'}</dd>
              <dt>Address</dt><dd>{w.address || '—'}</dd>
              <dt>Skills</dt><dd>{w.skills || '—'}</dd>
              <dt>Service info</dt><dd>{w.service_info || '—'}</dd>
              <dt>Availability</dt><dd>{w.availability} {w.is_available ? '🟢' : '🔴 not available'}</dd>
            </dl>
            {w.bio && <p>{w.bio}</p>}
          </div>
        </div>
        <div>
          <div className="card"><h3>📍 Service location</h3>
            {w.lat != null ? <LocationPicker readOnly value={{ lat: Number(w.lat), lng: Number(w.lng) }} height={220} /> : <p className="muted">No location set. <Link to="/worker/profile">Add it</Link> so nearby customers can find you.</p>}
          </div>
          <div className="card"><h3>Reviews ({w.reviews.length})</h3>
            {w.reviews.length === 0 && <p className="muted">No reviews yet.</p>}
            {w.reviews.map((r, i) => <div key={i} className="review"><Stars value={r.rating} /> <b>{r.customer}</b><p>{r.comment}</p></div>)}
          </div>
        </div>
      </div>
    </>
  );
}
