import { useState } from 'react';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import LabDataForm from './components/labdata/LabDataForm';
import InventoryIndex from './components/inventory/InventoryIndex';
import InventoryAdd from './components/inventory/InventoryAdd';
import TankerArrival from './components/tanker/TankerArrival';
import TankerDispatch from './components/tanker/TankerDispatch';
import TankerHistory from './components/tanker/TankerHistory';
import ReportsIndex from './components/reports/ReportsIndex';
import AnalyticsIndex from './components/analytics/AnalyticsIndex';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState<any>(null);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
  };

  const navigate = (page: string) => {
    setCurrentPage(page);
  };

  if (!user || currentPage === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === 'dashboard' && <Dashboard user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'labdata-form' && <LabDataForm user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'inventory' && <InventoryIndex user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'inventory-add' && <InventoryAdd user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'tanker-arrival' && <TankerArrival user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'tanker-dispatch' && <TankerDispatch user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'tanker-history' && <TankerHistory user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'reports' && <ReportsIndex user={user} onNavigate={navigate} onLogout={handleLogout} />}
      {currentPage === 'analytics' && <AnalyticsIndex user={user} onNavigate={navigate} onLogout={handleLogout} />}
    </div>
  );
}
