import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Avatar, Alert } from '../components/Bits.jsx';

export default function CustomerProfile() {
  const [p, setP] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [msg, setMsg] = useState({});
  const load = () => api('/auth/me').then(setP);
  useEffect(() => { load(); }, []);
  if (!p) return null;
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    ['full_name', 'phone', 'address'].forEach((k) => fd.append(k, p[k] ?? ''));
    if (photo) fd.append('photo', photo);
    try { const d = await api('/profile', { method: 'PUT', form: fd }); setMsg({ ok: d.message }); load(); }
    catch (e) { setMsg({ error: e.message }); }
  };
  return (
    <form className="card form narrow" onSubmit={save}>
      <h2>My profile</h2>
      <Alert msg={msg.error} /><Alert msg={msg.ok} type="ok" />
      <div className="row"><Avatar src={p.photo} name={p.full_name} size={80} /><input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} /></div>
      <label>Full name<input required value={p.full_name} onChange={set('full_name')} /></label>
      <label>Email<input disabled value={p.email} /></label>
      <label>Phone<input value={p.phone || ''} onChange={set('phone')} /></label>
      <label>Default house address<textarea rows="3" value={p.address || ''} onChange={set('address')} /></label>
      <button className="btn btn-primary">Save</button>
    </form>
  );
}
