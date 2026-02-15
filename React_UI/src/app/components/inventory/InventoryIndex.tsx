import Layout from '../layout/Layout';
import { Plus, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

interface InventoryIndexProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function InventoryIndex({ user, onNavigate, onLogout }: InventoryIndexProps) {
  const inventoryData = [
    {
      id: 1,
      material: 'Nitrogen (N₂)',
      currentStock: 850,
      unit: 'MT',
      minStock: 500,
      maxStock: 2000,
      status: 'normal',
      lastUpdated: '2 hours ago',
      trend: 'down'
    },
    {
      id: 2,
      material: 'Sulphuric Acid (H₂SO₄)',
      currentStock: 320,
      unit: 'MT',
      minStock: 400,
      maxStock: 1500,
      status: 'low',
      lastUpdated: '4 hours ago',
      trend: 'down'
    },
    {
      id: 3,
      material: 'Caustic Soda (NaOH)',
      currentStock: 680,
      unit: 'MT',
      minStock: 300,
      maxStock: 1200,
      status: 'normal',
      lastUpdated: '1 hour ago',
      trend: 'up'
    },
    {
      id: 4,
      material: 'Phosphoric Acid (H₃PO₄)',
      currentStock: 180,
      unit: 'MT',
      minStock: 250,
      maxStock: 1000,
      status: 'low',
      lastUpdated: '3 hours ago',
      trend: 'down'
    },
    {
      id: 5,
      material: 'Ammonia (NH₃)',
      currentStock: 1250,
      unit: 'MT',
      minStock: 500,
      maxStock: 2500,
      status: 'normal',
      lastUpdated: '30 minutes ago',
      trend: 'up'
    },
    {
      id: 6,
      material: 'Potassium Chloride (KCl)',
      currentStock: 420,
      unit: 'MT',
      minStock: 200,
      maxStock: 800,
      status: 'normal',
      lastUpdated: '5 hours ago',
      trend: 'down'
    }
  ];

  const getStockPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  return (
    <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="inventory">
      <div>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
            <p className="text-gray-600">Raw material stock levels and tracking</p>
          </div>
          <button
            onClick={() => onNavigate('inventory-add')}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Inventory Entry
          </button>
        </div>

        {/* Inventory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventoryData.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow border-l-4 p-6 ${
                item.status === 'low' ? 'border-red-500' : 'border-green-500'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{item.material}</h3>
                  <p className="text-sm text-gray-500">Last updated: {item.lastUpdated}</p>
                </div>
                {item.status === 'low' && (
                  <div className="bg-red-100 p-2 rounded-full">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                )}
              </div>

              {/* Stock Level */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-800">{item.currentStock}</span>
                  <span className="text-gray-600">{item.unit}</span>
                  <div className={`ml-auto flex items-center gap-1 ${
                    item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.status === 'low' ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${getStockPercentage(item.currentStock, item.maxStock)}%` }}
                  ></div>
                </div>

                {/* Min/Max Info */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Min: {item.minStock} {item.unit}</span>
                  <span>Max: {item.maxStock} {item.unit}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  item.status === 'low'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {item.status === 'low' ? 'Low Stock' : 'Normal Stock'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Table */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Inventory Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.material}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.maxStock} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'low'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.status === 'low' ? 'Low Stock' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.lastUpdated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
