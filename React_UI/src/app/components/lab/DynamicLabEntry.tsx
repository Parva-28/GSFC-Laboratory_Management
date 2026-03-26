import { useState, useEffect } from 'react';
import { Beaker, Save, AlertCircle, CheckCircle, Search, RefreshCcw, Info } from 'lucide-react';
import api from '../../api';

interface DynamicLabEntryProps {
    user: any;
    onNavigate: (page: string, extra?: any) => void;
    onLogout: () => void;
}

// Anomaly limit definitions for all products (shown in hover tooltip)
const ANOMALY_LIMITS: Record<string, { param: string; min?: number; max?: number }[]> = {
    "Urea":    [{ param: "Moisture", min: 0, max: 1.0 }, { param: "Purity", min: 98.0 }],
    "DAP":     [{ param: "Moisture", min: 0, max: 1.5 }, { param: "Purity", min: 90.0 }],
    "NPK":     [{ param: "Moisture", min: 0, max: 1.5 }, { param: "Purity", min: 85.0 }],
    "Ammonia": [{ param: "Moisture", min: 0, max: 0.5 }, { param: "Purity", min: 99.5 }],
    "SA III":  [{ param: "H2SO4 %", min: 98.0 }, { param: "Fe (ppm)", max: 50.0 }],
    "SA IV":   [{ param: "H2SO4 %", min: 98.0 }, { param: "Fe (ppm)", max: 50.0 }],
    "Nylon-6 (E-24)": [{ param: "RV", min: 2.40, max: 2.60 }, { param: "H2O %", max: 0.10 }],
    "Nylon-6 (E-26)": [{ param: "RV", min: 2.55, max: 2.70 }, { param: "H2O %", max: 0.10 }],
    "Nylon-6 (E-28)": [{ param: "RV", min: 2.65, max: 3.00 }, { param: "H2O %", max: 0.08 }],
    "Nylon-6 (E-35)": [{ param: "RV", min: 3.00, max: 3.65 }, { param: "H2O %", max: 0.08 }],
    "Nylon-6 (E-50)": [{ param: "RV", min: 4.50, max: 5.00 }, { param: "H2O %", max: 0.10 }],
};

export default function DynamicLabEntry({ user, onNavigate, onLogout }: DynamicLabEntryProps) {
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [schema, setSchema] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});

    // UI states
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingSchema, setLoadingSchema] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [showLimits, setShowLimits] = useState(false);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await api.get('labdata/latest/');
            if (res.data.success && res.data.data?.records) {
                setHistoryData(res.data.data.records);
            }
        } catch (err) {
            console.error("Failed to fetch history data", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // 1. Fetch available products and history on load
    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                const res = await api.get('products/');
                if (res.data.success) {
                    setProducts(res.data.data?.products || []);
                }
            } catch (err) {
                setMsg({ type: 'error', text: 'Failed to load product list.' });
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
        fetchHistory();
    }, []);

    // 2. Fetch schema when a product is selected
    useEffect(() => {
        if (!selectedProduct) {
            setSchema(null);
            setFormData({});
            return;
        }

        const fetchSchema = async () => {
            setLoadingSchema(true);
            setMsg({ type: '', text: '' });
            try {
                const res = await api.get(`products/${selectedProduct}/schema/`);
                if (res.data.success) {
                    setSchema(res.data.data?.schema);
                    setFormData({});
                }
            } catch (err) {
                setMsg({ type: 'error', text: 'Failed to load product schema.' });
                setSchema(null);
            } finally {
                setLoadingSchema(false);
            }
        };

        fetchSchema();
    }, [selectedProduct]);

    const handleInputChange = (fieldKey: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [fieldKey]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMsg({ type: '', text: '' });

        try {
            const res = await api.post(`lab-data/dynamic/${selectedProduct}/`, formData);
            if (res.data.success) {
                setMsg({ type: 'success', text: `Data saved successfully! (Assigned Sr.No: ${res.data.data?.sr_no_assigned || 'N/A'})` });
                setFormData({});
                fetchHistory(); // Refresh history
            } else {
                setMsg({ type: 'error', text: res.data.message || 'Failed to submit data.' });
            }
        } catch (err: any) {
            setMsg({ type: 'error', text: err.response?.data?.error || 'Server error during submission.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="max-w-5xl mx-auto py-8 px-4">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                        <Beaker className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Lab Data Entry</h1>
                        <p className="text-gray-500 text-sm">Select a product to dynamically lodge lab parameters into the database.</p>
                    </div>
                    {/* Anomaly Limits Hover Button */}
                    <div 
                        className="relative"
                        onMouseEnter={() => setShowLimits(true)}
                        onMouseLeave={() => setShowLimits(false)}
                    >
                        <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-semibold hover:bg-amber-100 transition-colors">
                            <Info className="w-4 h-4" />
                            Anomaly Limits
                        </button>

                        {showLimits && (
                            <div className="absolute right-0 top-full pt-1 w-[480px] z-50">
                                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3">
                                        <h4 className="text-white font-bold text-sm">Anomaly Detection Limits Reference</h4>
                                        <p className="text-amber-100 text-[10px]">Values outside these ranges will be flagged as anomalies</p>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Product</th>
                                                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Parameter</th>
                                                    <th className="text-center px-4 py-2 font-semibold text-gray-600">Min</th>
                                                    <th className="text-center px-4 py-2 font-semibold text-gray-600">Max</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(ANOMALY_LIMITS).map(([product, limits]) =>
                                                    limits.map((limit, idx) => (
                                                        <tr key={`${product}-${idx}`} className={idx === 0 ? "border-t border-gray-100" : ""}>
                                                            <td className="px-4 py-1.5 font-medium text-gray-800">{idx === 0 ? product : ""}</td>
                                                            <td className="px-4 py-1.5 text-gray-600">{limit.param}</td>
                                                            <td className="px-4 py-1.5 text-center font-mono text-blue-600">{limit.min !== undefined ? limit.min : "—"}</td>
                                                            <td className="px-4 py-1.5 text-center font-mono text-red-600">{limit.max !== undefined ? limit.max : "—"}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 1: Product Selection */}
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6 mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        1. Select Product / Sheet Configuration
                    </label>
                    <div className="relative">
                        <select
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            disabled={loadingProducts}
                        >
                            <option value="">-- Choose a Product --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                    </div>
                    {loadingProducts && <p className="text-xs text-blue-500 mt-2 flex items-center gap-1"><RefreshCcw className="w-3 h-3 animate-spin" /> Loading products...</p>}
                </div>

                {/* Submission History Table */}
                {historyData.length > 0 && (
                    <div className="bg-white rounded-xl shadow border border-gray-100 mb-6 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
                            <h3 className="text-sm font-bold text-indigo-900 tracking-wide uppercase">Submission History</h3>
                            <button 
                                onClick={fetchHistory} 
                                disabled={loadingHistory}
                                className="text-indigo-500 hover:text-indigo-700 transition"
                            >
                                <RefreshCcw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <div className="max-h-[320px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Product</th>
                                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Analyst</th>
                                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Sample ID</th>
                                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date / Time</th>
                                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Anomaly</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {historyData.map((row, idx) => (
                                        <tr key={idx} className={`hover:bg-blue-50/40 transition-colors ${idx === 0 ? 'bg-indigo-50/30' : ''}`}>
                                            <td className="px-4 py-3 font-semibold text-gray-800">{row.product}</td>
                                            <td className="px-4 py-3 text-gray-700">{row.analyst}</td>
                                            <td className="px-4 py-3 text-gray-600 font-mono text-xs">{row.sample_id}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{row.date} {row.time}</td>
                                            <td className="px-4 py-3">
                                                {row.anomaly_flag === "YES" ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full w-max">
                                                            <AlertCircle className="w-3 h-3" /> Flagged
                                                        </span>
                                                        <span className="text-[10px] text-red-400 leading-tight max-w-[200px] truncate" title={row.anomaly_reason}>{row.anomaly_reason}</span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full w-max">
                                                        <CheckCircle className="w-3 h-3" /> Cleared
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Messages */}
                {msg.text && (
                    <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${msg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                        {msg.type === 'error' ? <AlertCircle className="w-5 h-5 mt-0.5" /> : <CheckCircle className="w-5 h-5 mt-0.5" />}
                        <div className="font-medium text-sm">{msg.text}</div>
                    </div>
                )}

                {/* Step 2: Dynamic Form */}
                {loadingSchema ? (
                    <div className="p-12 text-center bg-white rounded-xl shadow border border-gray-100 flex flex-col items-center justify-center">
                        <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Generating schema configuration...</p>
                    </div>
                ) : schema ? (
                    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                {schema.name} Parameters
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">Fields are strictly bound to the Excel sheet "{schema.sheet_name}"</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                {schema.fields.map((field: any) => (
                                    <div key={field.key} className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
                                            step={field.type === 'number' ? 'any' : undefined}
                                            required={field.required}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                                            placeholder={`Enter ${field.label}...`}
                                            value={formData[field.key] || ''}
                                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
                                >
                                    {submitting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {submitting ? 'Saving to Database...' : 'Submit Lab Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : null}
            </div>
        </>
    );
}
