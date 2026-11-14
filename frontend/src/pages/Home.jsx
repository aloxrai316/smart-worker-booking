import { Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import CustomerHome from './CustomerHome.jsx';

export default function Home() {
  const { user } = useAuth();
  const [cats, setCats] = useState([]);
  useEffect(() => { if (!user) api('/categories').then(setCats).catch(() => {}); }, [user]);
  if (user?.role === 'customer') return <CustomerHome />;
  if (user?.role === 'worker') return <Navigate to="/worker" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return (
    <>
      <section className="hero">
        <h1>Smart Worker Hiring &amp; Service Booking</h1>
        <p>A simple way to connect customers with skilled local workers for verified home-service bookings.</p>
        <div className="row center">
          <Link to="/login" className="btn btn-primary btn-lg">Log in</Link>
          <Link to="/register" className="btn btn-outline-light btn-lg">Sign up</Link>
        </div>
      </section>

      <h2 className="section-title center-text">How can we help you?</h2>
      <div className="grid two">
        <div className="card help">
          <h2>Do you need a worker?</h2>
          <p className="muted">Find verified electricians, plumbers, painters and more, and book them for your home.</p>
          <Link to="/hire" className="btn btn-primary">I need a worker</Link>
        </div>
        <div className="card help alt">
          <h2>Do you need work?</h2>
          <p className="muted">Join as a skilled worker, receive booking requests and build your reputation.</p>
          <Link to="/work" className="btn btn-primary">I need work</Link>
        </div>
      </div>

      {cats.length > 0 && (
        <>
          <h2 className="section-title">Services available</h2>
          <div className="grid cats">
            {cats.map((c) => <Link key={c.id} to="/hire" className="card cat"><b>{c.name}</b></Link>)}
          </div>
        </>
      )}
    </>
  );
}
