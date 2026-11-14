import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Avatar, Alert, Modal } from '../components/Bits.jsx';
import LocationPicker from '../components/LocationPicker.jsx';

export default function WorkerProfile() {
  const nav = useNavigate();
  const toast = useToast();
  const [p, setP] = useState(null);
  const [cats, setCats] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pin, setPin] = useState(null);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => api('/workers/me/profile').then((d) => { setP(d); if (d.lat != null) setPin({ lat: Number(d.lat), lng: Number(d.lng) }); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); api('/categories').then(setCats).catch((e) => setErr(e.message)); }, []);
  if (!p) return <Alert msg={err} />;
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    const fd = new FormData();
    ['full_name', 'phone', 'address', 'category_id', 'skills', 'bio', 'experience_years', 'service_info', 'availability'].forEach((k) => fd.append(k, p[k] ?? ''));
    fd.append('is_available', p.is_available ? '1' : '0');
    fd.append('lat', pin?.lat ?? ''); fd.append('lng', pin?.lng ?? '');
    if (photo) fd.append('photo', photo);
    try { await api('/workers/me/profile', { method: 'PUT', form: fd }); setDone(true); load(); }
    catch (e) { setErr(e.message); toast(e.message, 'error'); }
    setBusy(false);
  };

  return (
    <>
      <form className="card form narrow" onSubmit={save}>
        <h2>My worker profile</h2>
        <p className="muted" style={{ margin: 0 }}>Status: {p.is_verified ? '✅ Verified by admin' : '⏳ Waiting for admin verification'}</p>
        <Alert msg={err} />
        <div className="row">
          {preview ? <img className="avatar" style={{ width: 80, height: 80 }} src={preview} alt="" /> : <Avatar src={p.photo} name={p.full_name} size={80} />}
          <label style={{ flex: 1 }}>Profile photo<input type="file" accept="image/*" onChange={(e) => { setPhoto(e.target.files[0]); setPreview(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null); }} /></label>
        </div>
        <label>Full name<input required value={p.full_name} onChange={set('full_name')} /></label>
        <label>Phone<input value={p.phone || ''} onChange={set('phone')} /></label>
        <label>Address<input value={p.address || ''} onChange={set('address')} /></label>
        <label>Specialization (service category)
          <select required value={p.category_id} onChange={set('category_id')}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </label>
        <label>Skills<input value={p.skills || ''} onChange={set('skills')} /></label>
        <label>Experience (years)<input type="number" min="0" value={p.experience_years} onChange={set('experience_years')} /></label>
        <label>Service information<input placeholder="e.g. Home visit, tools included" value={p.service_info || ''} onChange={set('service_info')} /></label>
        <label>About me<textarea rows="3" value={p.bio || ''} onChange={set('bio')} /></label>
        <label>Availability (days / hours)<input value={p.availability || ''} onChange={set('availability')} /></label>
        <label>Your service location <span className="muted small">(so customers can find workers near them)</span></label>
        <LocationPicker value={pin} onChange={setPin} height={260} />
        <label className="check"><input type="checkbox" checked={!!p.is_available} onChange={(e) => setP({ ...p, is_available: e.target.checked })} /> I am available for new bookings</label>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>

      {done && (
        <Modal title="Profile created successfully!">
          <p className="muted">Your profile has been saved{p.is_verified ? '.' : ' and sent to the admin for verification.'} You can view your profile and wait here for booking requests.</p>
          <div className="row center">
            <button className="btn btn-outline" onClick={() => nav('/worker/me')}>View my profile</button>
            <button className="btn btn-primary" onClick={() => nav('/worker')}>Go to dashboard</button>
          </div>
        </Modal>
      )}
    </>
  );
}
