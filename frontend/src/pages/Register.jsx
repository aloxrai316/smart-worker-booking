import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Alert } from '../components/Bits.jsx';

export default function Register() {
  const [params] = useSearchParams();
  const [f, setF] = useState({ role: params.get('role') === 'worker' ? 'worker' : 'customer', full_name: '', email: '', password: '', phone: '', address: '', category_id: '', skills: '', experience_years: 0 });
  const [cats, setCats] = useState([]);
  const [catErr, setCatErr] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const loadCats = () => { setCatErr(''); api('/categories').then(setCats).catch((e) => setCatErr(e.message)); };
  useEffect(loadCats, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const d = await api('/auth/register', { method: 'POST', body: f });
      login(d);
      if (d.user.role === 'worker') { toast('Worker account created! Now complete your profile.'); nav('/worker/profile'); }
      else { toast(`Account created successfully! Welcome, ${d.user.full_name}`); nav('/'); }
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <form className="card form narrow" onSubmit={submit}>
      <h2>Create your account</h2>
      <div className="tabs">
        <button type="button" className={f.role === 'customer' ? 'active' : ''} onClick={() => setF({ ...f, role: 'customer' })}>👤 I need a worker</button>
        <button type="button" className={f.role === 'worker' ? 'active' : ''} onClick={() => setF({ ...f, role: 'worker' })}>🧰 I am a worker</button>
      </div>
      <Alert msg={err} />
      <label>Full name<input required value={f.full_name} onChange={set('full_name')} /></label>
      <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
      <label>Password (min 6)<input type="password" required minLength={6} value={f.password} onChange={set('password')} /></label>
      <label>Phone<input value={f.phone} onChange={set('phone')} /></label>
      <label>Address<input value={f.address} onChange={set('address')} /></label>
      {f.role === 'worker' && (
        <>
          <label>Service category
            <select required value={f.category_id} onChange={set('category_id')}>
              <option value="">{cats.length ? 'Select your service…' : 'Loading categories…'}</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          {catErr && <div className="alert error">{catErr} <button type="button" className="btn btn-sm btn-outline" onClick={loadCats}>Retry</button></div>}
          <label>Skills<input placeholder="e.g. wiring, fan repair, inverter" value={f.skills} onChange={set('skills')} /></label>
          <label>Years of experience<input type="number" min="0" value={f.experience_years} onChange={set('experience_years')} /></label>
          <p className="muted small">After signing up you will complete your profile with a photo and location. An admin must verify you before customers can see you.</p>
        </>
      )}
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </form>
  );
}
