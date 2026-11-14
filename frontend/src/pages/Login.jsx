import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Alert } from '../components/Bits.jsx';

const ROLES = {
  customer: { label: '👤 Customer', title: 'Customer login', hint: 'Log in to find and book workers.', go: '/' },
  worker: { label: '🧰 Worker', title: 'Worker login', hint: 'Log in to manage your profile and booking requests.', go: '/worker' },
  admin: { label: '🛡 Admin', title: 'Admin login', hint: 'Authorised administrators only.', go: '/admin' },
};

export default function Login() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(ROLES[params.get('role')] ? params.get('role') : 'customer');
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const d = await api('/auth/login', { method: 'POST', body: { ...f, role } });
      login(d);
      toast(`Login successful! Welcome, ${d.user.full_name} (${ROLES[role].label.slice(3)})`);
      nav(ROLES[role].go);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <form className="card form narrow" onSubmit={submit}>
      <div className="tabs">
        {Object.entries(ROLES).map(([k, r]) => (
          <button type="button" key={k} className={role === k ? 'active' : ''} onClick={() => { setRole(k); setErr(''); }}>{r.label}</button>
        ))}
      </div>
      <h2>{ROLES[role].title}</h2>
      <p className="muted" style={{ margin: 0 }}>{ROLES[role].hint}</p>
      <Alert msg={err} />
      <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      <label>Password<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Logging in…' : `Log in as ${ROLES[role].label.slice(3)}`}</button>
      {role !== 'admin' && <p className="muted">New here? <Link to="/register">Create an account</Link></p>}
    </form>
  );
}
