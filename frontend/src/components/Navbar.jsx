import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand"><span className="brand-icon">🛠</span> SmartWorker</Link>
        <nav>
          {(!user || user.role === 'customer') && <NavLink to="/" end>Home</NavLink>}
          {!user && <><NavLink to="/hire">Need a Worker</NavLink><NavLink to="/work">Need Work</NavLink></>}
          {user?.role === 'customer' && <NavLink to="/workers">Find Workers</NavLink>}
          {user?.role === 'customer' && <><NavLink to="/my-bookings">My Bookings</NavLink><NavLink to="/my-profile">Profile</NavLink></>}
          {user?.role === 'worker' && <><NavLink to="/worker" end>Requests</NavLink><NavLink to="/worker/me">My Profile</NavLink><NavLink to="/worker/profile">Edit Profile</NavLink></>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin Panel</NavLink>}
          {user ? (
            <button className="btn btn-outline-light" onClick={() => { logout(); toast('You have been logged out', 'info'); nav('/'); }}>Logout ({user.full_name.split(' ')[0]})</button>
          ) : (
            <><NavLink to="/login">Login</NavLink><Link to="/register" className="btn btn-primary">Sign up</Link></>
          )}
        </nav>
      </div>
    </header>
  );
}
