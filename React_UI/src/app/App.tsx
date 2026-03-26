import { useState, useEffect } from 'react';
import api from './api';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import AllSamples from './components/dashboard/AllSamples';
import DynamicLabEntry from './components/lab/DynamicLabEntry';
import InventoryIndex from './components/inventory/InventoryIndex';
import InventoryAdd from './components/inventory/InventoryAdd';
import InventoryBorrowForm from './components/inventory/InventoryBorrowForm';
import InventoryAdminPanel from './components/inventory/InventoryAdminPanel';
import TankerTrack from './components/tanker/TankerTrack';
import ReportsIndex from './components/reports/ReportsIndex';
import AnalyticsIndex from './components/analytics/AnalyticsIndex';
import AdminUserManagement from './components/admin/AdminUserManagement';
import InstrumentCalibration from './components/instruments/InstrumentCalibration';
import ShiftHandover from './components/shifts/ShiftHandover';
import Layout from './components/layout/Layout';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState<any>(null);
  const [selectedMaterial, setSelectedMaterial] = useState('');

  // ── Restore session from sessionStorage on first load ──────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem('lims_auth');
    if (saved) {
      try {
        const userData = JSON.parse(saved);
        if (userData?.token && userData?.username) {
          setUser(userData);
          if (currentPage === 'login') {
            setCurrentPage('dashboard');
          }

          // Validate token with backend
          api.get('auth/me/')
            .then(res => {
              if (res.data.success && res.data.data) {
                // Update with fresh data
                const freshUser = { ...userData, ...res.data.data };
                setUser(freshUser);
                sessionStorage.setItem('lims_auth', JSON.stringify(freshUser));
              }
            })
            .catch((err) => {
              console.error('Session validation failed:', err);
              // Interceptor will handle 401 by clearing storage & reloading
            });
        }
      } catch {
        sessionStorage.removeItem('lims_auth');
      }
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('lims_auth');
    setUser(null);
    setCurrentPage('login');
  };

  const navigate = (page: string, extra?: any) => {
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'LAB_ADMIN';
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isEmployee = user?.role === 'EMPLOYEE';

    if (page === 'inventory-add' && !isEmployee && !isAdmin) {
      setCurrentPage('inventory');
      return;
    }
    if (page === 'inventory-borrow' && !isEmployee && !isAdmin) {
      setCurrentPage('inventory');
      return;
    }
    if (page === 'inventory-admin' && !isAdmin) {
      setCurrentPage('inventory');
      return;
    }
    if (page === 'admin-users' && !isSuperAdmin) {
      setCurrentPage('dashboard');
      return;
    }

    if (page === 'inventory-borrow' && extra?.material) {
      setSelectedMaterial(extra.material);
    }
    setCurrentPage(page);
  };

  if (!user || currentPage === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout user={user} onNavigate={navigate} onLogout={handleLogout} currentPage={currentPage}>
        {currentPage === 'dashboard' && <Dashboard user={user} onNavigate={navigate} onLogout={handleLogout} />}
        {currentPage === 'all-samples' && <AllSamples user={user} onNavigate={navigate} onLogout={handleLogout} />}
        {currentPage === 'labdata-form' && <DynamicLabEntry user={user} onNavigate={navigate} onLogout={handleLogout} />}

        {/* Inventory */}
        {currentPage === 'inventory' && <InventoryIndex user={user} onNavigate={navigate} onLogout={handleLogout} />}
        {currentPage === 'inventory-add' && (
          (user?.role === 'EMPLOYEE' || user?.role === 'SUPER_ADMIN' || user?.role === 'LAB_ADMIN') ? <InventoryAdd user={user} onNavigate={navigate} onLogout={handleLogout} /> : <div className="p-8 text-center text-red-600 font-bold text-xl mt-10">Unauthorized Access</div>
        )}
        {currentPage === 'inventory-borrow' && (
          (user?.role === 'EMPLOYEE' || user?.role === 'SUPER_ADMIN' || user?.role === 'LAB_ADMIN') ? <InventoryBorrowForm user={user} onNavigate={navigate} onLogout={handleLogout} selectedMaterial={selectedMaterial} /> : <div className="p-8 text-center text-red-600 font-bold text-xl mt-10">Unauthorized Access</div>
        )}
        {currentPage === 'inventory-admin' && (
          (user?.role === 'SUPER_ADMIN' || user?.role === 'LAB_ADMIN') ? <InventoryAdminPanel user={user} onNavigate={navigate} onLogout={handleLogout} /> : <div className="p-8 text-center text-red-600 font-bold text-xl mt-10">Unauthorized Access</div>
        )}

        {/* Tanker */}
        {currentPage === 'tanker-track' && <TankerTrack user={user} onNavigate={navigate} onLogout={handleLogout} />}

        {/* Instruments & Shifts */}
        {currentPage === 'instruments' && <InstrumentCalibration />}
        {currentPage === 'shifts' && <ShiftHandover user={user} />}

        {/* Reports & Analytics */}
        {currentPage === 'reports' && <ReportsIndex user={user} onNavigate={navigate} onLogout={handleLogout} />}
        {currentPage === 'analytics' && <AnalyticsIndex user={user} onNavigate={navigate} onLogout={handleLogout} />}

        {/* Admin */}
        {currentPage === 'admin-users' && user?.role === 'SUPER_ADMIN' && <AdminUserManagement />}
      </Layout>
    </div>
  );
}
