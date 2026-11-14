import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Workers from './pages/Workers.jsx';
import WorkerDetail from './pages/WorkerDetail.jsx';
import MyBookings from './pages/MyBookings.jsx';
import WorkerDashboard from './pages/WorkerDashboard.jsx';
import WorkerProfile from './pages/WorkerProfile.jsx';
import WorkerMyProfile from './pages/WorkerMyProfile.jsx';
import CustomerProfile from './pages/CustomerProfile.jsx';
import Admin from './pages/Admin.jsx';
import Hire from './pages/Hire.jsx';
import Work from './pages/Work.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

function Protected({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hire" element={<Hire />} />
          <Route path="/work" element={<Work />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/workers/:id" element={<WorkerDetail />} />
          <Route path="/my-bookings" element={<Protected roles={['customer']}><MyBookings /></Protected>} />
          <Route path="/my-profile" element={<Protected roles={['customer']}><CustomerProfile /></Protected>} />
          <Route path="/worker" element={<Protected roles={['worker']}><WorkerDashboard /></Protected>} />
          <Route path="/worker/me" element={<Protected roles={['worker']}><WorkerMyProfile /></Protected>} />
          <Route path="/worker/profile" element={<Protected roles={['worker']}><WorkerProfile /></Protected>} />
          <Route path="/admin" element={<Protected roles={['admin']}><Admin /></Protected>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </ErrorBoundary>
      </main>
    </>
  );
}
