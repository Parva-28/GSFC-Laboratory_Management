import { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import LabDataForm from './components/labdata/LabDataForm';
import InventoryIndex from './components/inventory/InventoryIndex';
import InventoryAdd from './components/inventory/InventoryAdd';
import InventoryBorrowForm from './components/inventory/InventoryBorrowForm';
import InventoryAdminPanel from './components/inventory/InventoryAdminPanel';
import TankerArrival from './components/tanker/TankerArrival';
import TankerDispatch from './components/tanker/TankerDispatch';
import TankerHistory from './components/tanker/TankerHistory';
import ReportsIndex from './components/reports/ReportsIndex';
import AnalyticsIndex from './components/analytics/AnalyticsIndex';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState<any>(null);
  const [selectedMaterial, setSelectedMaterial] = useState('');

  // ── Restore session from localStorage on first load ──────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('lims_auth');
    if (saved) {
      try {
        const userData = JSON.parse(saved);
        if (userData?.token && userData?.username) {
          setUser(userData);
          setCurrentPage('dashboard');
        }
      } catch {
        localStorage.removeItem('lims_auth');
      }
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('lims_auth');
    setUser(null);
    setCurrentPage('login');
  };

  const navigate = (page: string, extra?: any) => {
    // inventory-add is for Plant Employees; redirect admin to the approvals panel
    if (page === 'inventory-add' && user?.role === 'CENTRAL_ADMIN') {
      setCurrentPage('inventory-admin');
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
      {currentPage === 'dashboard' && <Dashboard user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'labdata-form' && <LabDataForm user={user} onNavigate={navigate} onLogout={handleLogout} />}

      {/* Inventory */}
      {currentPage === 'inventory' && <InventoryIndex user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'inventory-add' && <InventoryAdd user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'inventory-borrow' && <InventoryBorrowForm user={user} onNavigate={navigate} onLogout={handleLogout} selectedMaterial={selectedMaterial} />}
      {currentPage === 'inventory-admin' && <InventoryAdminPanel user={user} onNavigate={navigate} onLogout={handleLogout} />}

      {/* Tanker */}
      {currentPage === 'tanker-arrival' && <TankerArrival user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'tanker-dispatch' && <TankerDispatch user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'tanker-history' && <TankerHistory user={user} onNavigate={navigate} onLogout={handleLogout} />}

      {currentPage === 'reports' && <ReportsIndex user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'analytics' && <AnalyticsIndex user={user} onNavigate={navigate} onLogout={handleLogout} />}
    </div>
  );
}
