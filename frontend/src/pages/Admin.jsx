import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Status, Stars, Alert } from '../components/Bits.jsx';

const TABS = ['Overview', 'Workers', 'Customers', 'Categories', 'Bookings', 'Complaints', 'Reviews'];
const URLS = {
  Overview: '/admin/stats', Workers: '/admin/users?role=worker', Customers: '/admin/users?role=customer',
  Categories: '/categories', Bookings: '/admin/bookings', Complaints: '/admin/complaints', Reviews: '/admin/reviews',
};

const Bar = ({ label, n, max }) => (
  <div className="bar"><span>{label.replace('_', ' ')}</span><div><i style={{ width: `${max ? (n / max) * 100 : 0}%` }} /></div><b>{n}</b></div>
);

export default function Admin() {
  const toast = useToast();
  const [tab, setTab] = useState('Overview');
  const [res, setRes] = useState({ tab: null, data: null, error: '' }); // data is stored WITH its tab name
  const [newCat, setNewCat] = useState('');
  const [notes, setNotes] = useState({});
  const [search, setSearch] = useState('');

  const load = useCallback((t) =>
    api(URLS[t]).then((data) => setRes({ tab: t, data, error: '' })).catch((e) => setRes({ tab: t, data: null, error: e.message })), []);

  useEffect(() => { setSearch(''); load(tab); }, [tab, load]);

  // only use data that belongs to the tab being shown (prevents crashes while switching)
  const data = res.tab === tab ? res.data : null;
  const error = res.tab === tab ? res.error : '';

  const act = async (fn) => {
    try { const d = await fn(); toast(d?.message || 'Done'); await load(tab); }
    catch (e) { toast(e.message, 'error'); }
  };

  const filtered = Array.isArray(data) && (tab === 'Workers' || tab === 'Customers')
    ? [...data].filter((u) => `${u.full_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => Number(a.is_verified ?? 1) - Number(b.is_verified ?? 1))
    : [];

  return (
    <>
      <h1>Admin panel</h1>
      <div className="tabs wide">
        {TABS.map((t) => <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      <Alert msg={error} />
      {!data && !error && <p className="muted">Loading…</p>}

      {tab === 'Overview' && data && !Array.isArray(data) && (
        <>
          <div className="grid stats">
            {[['Customers', data.customers], ['Workers', data.workers], ['Awaiting verification', data.pending_verification],
              ['Total bookings', data.bookings], ['Completed', data.completed], ['Open complaints', data.open_complaints],
              ['Revenue (Rs.)', data.revenue]].map(([l, v]) => <div key={l} className="card stat"><h3>{v}</h3><small>{l}</small></div>)}
          </div>
          {Number(data.pending_verification) > 0 && (
            <div className="alert warn row-between" style={{ alignItems: 'center' }}>
              <span>{data.pending_verification} worker(s) are waiting for verification.</span>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => setTab('Workers')}>Review now</button>
            </div>
          )}
          <div className="two-col even">
            <div className="card"><h3>Bookings by status</h3>{data.byStatus.length === 0 && <p className="muted">No bookings yet.</p>}{data.byStatus.map((s) => <Bar key={s.status} label={s.status} n={s.count} max={data.bookings} />)}</div>
            <div className="card"><h3>Bookings by service</h3>{data.byCategory.map((s) => <Bar key={s.name} label={s.name} n={s.count} max={data.bookings} />)}</div>
          </div>
        </>
      )}

      {(tab === 'Workers' || tab === 'Customers') && Array.isArray(data) && (
        <div className="card scroll">
          <input placeholder={`Search ${tab.toLowerCase()} by name or email…`} value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 10 }} />
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th>{tab === 'Workers' && <><th>Service</th><th>Verification</th></>}<th>Account</th></tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td><td>{u.email}</td><td>{u.phone || '—'}</td>
                  {tab === 'Workers' && (
                    <>
                      <td>{u.category}</td>
                      <td>
                        <button type="button" className={`btn btn-sm ${u.is_verified ? 'btn-outline' : 'btn-primary'}`}
                          onClick={() => act(() => api(`/admin/workers/${u.id}/verify`, { method: 'PATCH', body: { verified: !u.is_verified } }))}>
                          {u.is_verified ? '✅ Verified · Undo' : 'Verify worker'}
                        </button>
                      </td>
                    </>
                  )}
                  <td>
                    <button type="button" className="btn btn-sm btn-outline"
                      onClick={() => (u.is_active ? window.confirm(`Block ${u.full_name}?`) : true) && act(() => api(`/admin/users/${u.id}/active`, { method: 'PATCH', body: { is_active: !u.is_active } }))}>
                      {u.is_active ? 'Block' : 'Unblock'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="6" className="muted">No {tab.toLowerCase()} found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Categories' && Array.isArray(data) && (
        <div className="card">
          <form className="row" style={{ marginTop: 0 }} onSubmit={(e) => { e.preventDefault(); if (!newCat.trim()) return; act(async () => { const d = await api('/admin/categories', { method: 'POST', body: { name: newCat.trim() } }); setNewCat(''); return d; }); }}>
            <input placeholder="New service category (e.g. Welder)" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button className="btn btn-primary">Add category</button>
          </form>
          <table>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}><td>{c.name}</td>
                  <td style={{ textAlign: 'right' }}><button type="button" className="btn btn-sm btn-outline" onClick={() => window.confirm(`Delete ${c.name}?`) && act(() => api(`/admin/categories/${c.id}`, { method: 'DELETE' }))}>Delete</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Bookings' && Array.isArray(data) && (
        <div className="card scroll">
          <table>
            <thead><tr><th>#</th><th>Customer</th><th>Worker</th><th>Service</th><th>Created</th><th>Paid</th><th>Status</th></tr></thead>
            <tbody>
              {data.map((b) => <tr key={b.id}><td>{b.id}</td><td>{b.customer}</td><td>{b.worker}</td><td>{b.category}</td><td>{b.created_at?.slice(0, 16)}</td><td>{b.amount ? `Rs. ${b.amount}` : '—'}</td><td><Status s={b.status} /></td></tr>)}
              {data.length === 0 && <tr><td colSpan="7" className="muted">No bookings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Complaints' && Array.isArray(data) && (data.length === 0 ? <p className="muted">No complaints.</p> : data.map((c) => (
        <div key={c.id} className="card">
          <div className="booking-top">
            <div className="grow"><b>{c.from_name}</b> → {c.against_name || '—'} <span className="muted small">(booking #{c.booking_id})</span><p>{c.message}</p></div>
            <span className={`badge ${c.status === 'open' ? 'st-pending' : 'st-completed'}`}>{c.status}</span>
          </div>
          {c.status === 'open' ? (
            <div className="row">
              <input placeholder="Admin note / action taken" value={notes[c.id] || ''} onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })} />
              <button type="button" className="btn btn-primary" onClick={() => act(() => api(`/admin/complaints/${c.id}`, { method: 'PATCH', body: { admin_note: notes[c.id] || '' } }))}>Resolve</button>
            </div>
          ) : <p className="muted small">Admin note: {c.admin_note || '—'}</p>}
        </div>
      )))}

      {tab === 'Reviews' && Array.isArray(data) && (
        <div className="card">
          {data.length === 0 && <p className="muted">No reviews yet.</p>}
          {data.map((r) => (
            <div key={r.id} className="review row-between">
              <div><Stars value={r.rating} /> <b>{r.customer}</b> → {r.worker}<p className={r.is_hidden ? 'strike' : ''}>{r.comment}</p></div>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => act(() => api(`/admin/reviews/${r.id}/hide`, { method: 'PATCH', body: { hidden: !r.is_hidden } }))}>{r.is_hidden ? 'Restore' : 'Hide'}</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
