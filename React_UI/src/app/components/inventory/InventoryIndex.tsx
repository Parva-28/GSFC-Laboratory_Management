import Layout from '../layout/Layout';
import {
  Plus, PackageOpen, AlertCircle, TrendingDown, TrendingUp, RefreshCw, ShieldCheck
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface InventoryIndexProps {
  user: any;
  onNavigate: (page: string, extra?: any) => void;
  onLogout: () => void;
}

interface BalanceItem {
  material: string;
  balance: number;
}

const MATERIAL_META: Record<string, { unit: string; minStock: number; maxStock: number }> = {
  'Nitrogen': { unit: 'MT', minStock: 500, maxStock: 2000 },
  'Sulphuric Acid': { unit: 'MT', minStock: 400, maxStock: 1500 },
  'Caustic Soda': { unit: 'MT', minStock: 300, maxStock: 1200 },
  'Phosphoric Acid': { unit: 'MT', minStock: 250, maxStock: 1000 },
  'Ammonia': { unit: 'MT', minStock: 500, maxStock: 2500 },
  'Potassium Chloride': { unit: 'MT', minStock: 200, maxStock: 800 },
};

const DISPLAY_NAMES: Record<string, string> = {
  'Nitrogen': 'Nitrogen (N₂)',
  'Sulphuric Acid': 'Sulphuric Acid (H₂SO₄)',
  'Caustic Soda': 'Caustic Soda (NaOH)',
  'Phosphoric Acid': 'Phosphoric Acid (H₃PO₄)',
  'Ammonia': 'Ammonia (NH₃)',
  'Potassium Chloride': 'Potassium Chloride (KCl)',
};

export default function InventoryIndex({ user, onNavigate, onLogout }: InventoryIndexProps) {
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isEmployee = user?.role === 'PLANT_EMPLOYEE';
  const isAdmin = user?.role === 'CENTRAL_ADMIN';

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/inventory/balance/');
      const data = await response.json();
      if (data.ok) {
        setBalances(data.balances);
      } else {
        setError(data.error || 'Failed to load balances');
      }
    } catch {
      setError('Backend offline — start the Django server.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 30 seconds so balances update after approvals
  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  const pct = (current: number, max: number) => Math.min((current / max) * 100, 100);

  return (
    <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="inventory">
      <div>
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
            <p className="text-gray-600">Raw material stock levels and tracking</p>
          </div>

          <div className="flex gap-3">
            {/* Manual refresh */}
            <button
              onClick={fetchBalances}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            {/* EMPLOYEE actions */}
            {isEmployee && (
              <>
                <button
                  onClick={() => onNavigate('inventory-add')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Stock (IN)
                </button>
                <button
                  onClick={() => onNavigate('inventory-borrow', { material: '' })}
                  className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  <PackageOpen className="w-5 h-5" />
                  Borrow / Withdraw
                </button>
              </>
            )}

            {/* ADMIN action */}
            {isAdmin && (
              <button
                onClick={() => onNavigate('inventory-admin')}
                className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                <ShieldCheck className="w-5 h-5" />
                Manage Approvals
              </button>
            )}
          </div>
        </div>

        {/* Role hint banners */}
        {isEmployee && (
          <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            👷 <strong>Plant Employee view</strong> — use the buttons above to add incoming stock or submit a borrow request for admin approval.
          </div>
        )}
        {isAdmin && (
          <div className="mb-4 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 text-sm">
            🔑 <strong>Admin view</strong> — stock balances update automatically when you approve requests. Use <em>Manage Approvals</em> to process pending requests.
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow border-l-4 border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-2 bg-gray-200 rounded w-full mb-2" />
                <div className="h-8 bg-gray-200 rounded w-1/3 mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Inventory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {balances.map((item) => {
                const meta = MATERIAL_META[item.material] || { unit: 'MT', minStock: 0, maxStock: 1000 };
                const isLow = item.balance < meta.minStock;
                const p = pct(item.balance, meta.maxStock);

                return (
                  <div
                    key={item.material}
                    className={`bg-white rounded-lg shadow border-l-4 p-6 ${isLow ? 'border-red-500' : 'border-green-500'}`}
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {DISPLAY_NAMES[item.material] || item.material}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Live balance from inventory.xlsx</p>
                      </div>
                      {isLow && (
                        <div className="bg-red-100 p-2 rounded-full">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                      )}
                    </div>

                    {/* Balance */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-gray-800">{item.balance.toLocaleString()}</span>
                        <span className="text-gray-600">{meta.unit}</span>
                        <div className={`ml-auto flex items-center gap-1 ${isLow ? 'text-red-600' : 'text-green-600'}`}>
                          {isLow ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${p}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Min: {meta.minStock} {meta.unit}</span>
                        <span>Max: {meta.maxStock} {meta.unit}</span>
                      </div>
                    </div>

                    {/* Status + per-card Borrow button (employees only) */}
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isLow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {isLow ? '⚠ Low Stock' : '✓ Normal'}
                      </span>

                      {isEmployee && (
                        <button
                          onClick={() => onNavigate('inventory-borrow', { material: item.material })}
                          className="flex items-center gap-1.5 bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-700 transition-colors"
                        >
                          <PackageOpen className="w-3.5 h-3.5" />
                          Borrow / Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Table */}
            {balances.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Inventory Summary</h3>
                  <p className="text-xs text-gray-500">Auto-refreshes every 30 s</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Material', 'Current Balance', 'Min Stock', 'Max Stock', 'Status'].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {balances.map((item) => {
                        const meta = MATERIAL_META[item.material] || { unit: 'MT', minStock: 0, maxStock: 1000 };
                        const isLow = item.balance < meta.minStock;
                        return (
                          <tr key={item.material} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {DISPLAY_NAMES[item.material] || item.material}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 font-semibold">
                              {item.balance.toLocaleString()} {meta.unit}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{meta.minStock} {meta.unit}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{meta.maxStock} {meta.unit}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${isLow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {isLow ? 'Low Stock' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
