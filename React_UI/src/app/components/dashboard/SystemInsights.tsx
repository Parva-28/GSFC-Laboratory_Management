import { useState, useEffect } from 'react';
import { Lightbulb, AlertCircle, TrendingUp, Bell, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import api from '../../api';

interface SystemInsightsProps {
    recentTests?: any[];
    isLoading?: boolean;
    onNavigate?: (page: string) => void;
}

export default function SystemInsights({ recentTests = [], isLoading = false, onNavigate }: SystemInsightsProps) {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [prediction, setPrediction] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        setLoading(true);
        try {
            // 1. Fetch active alerts
            const alertsRes = await api.get('alerts/');
            if (alertsRes.data.success) {
                setAlerts(alertsRes.data.data?.alerts || []);
            }

            // 2. Fetch ML prediction
            const aiRes = await api.get('ai/predict-material-usage/?material=Ammonia');
            if (aiRes.data.success) {
                setPrediction(aiRes.data.data?.prediction);
            }
        } catch (err) {
            console.error('Failed to fetch system insights:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-full mb-2"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow border-l-4 border-indigo-500 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-indigo-600" />
                    System Insights & AI
                </h3>
                <button onClick={fetchInsights} className="text-xs text-indigo-600 hover:underline">
                    Refresh
                </button>
            </div>

            <div className="p-6">
                {/* Alerts Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                            <Bell className="w-4 h-4 text-gray-500" /> Active Alerts & Recent Tests
                        </h4>
                        {onNavigate && (
                            <button
                                onClick={() => onNavigate('all-samples')}
                                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                View All Tests
                                <ArrowRight className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-3">
                        {alerts.length === 0 && recentTests.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No active system alerts or recent tests.</p>
                        ) : null}

                        {/* Traditional Alerts */}
                        {alerts.map((alert, idx) => (
                            <div key={`alert-${idx}`} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">{alert.message}</p>
                                    <p className="text-xs text-red-600 mt-1">Threshold: {alert.threshold} | Current: {alert.current_balance}</p>
                                </div>
                            </div>
                        ))}

                        {/* Recent Test Results (Latest 3) */}
                        {recentTests.map((test, idx) => {
                            const isPassed = test.anomaly_flag !== 'YES';
                            return (
                                <div key={`test-${idx}`} className={`flex items-start gap-3 p-3 rounded-lg border ${isPassed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    {isPassed 
                                        ? <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> 
                                        : <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    }
                                    <div className="w-full flex justify-between items-center">
                                        <div>
                                            <p className={`text-sm font-medium ${isPassed ? 'text-green-800' : 'text-red-800'}`}>
                                                Sample: {test.sample_id || `#${test.id}`} | Product: {test.product} 
                                                {!isPassed && test.anomaly_reason ? ` | ${test.anomaly_reason}` : ''}
                                            </p>
                                            <p className={`text-xs mt-1 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                                Analyst: {test.analyst} | Date: {test.date || test.sample_date}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            isPassed 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {isPassed ? 'Passed' : 'Anomaly'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* AI Prediction Section */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" /> AI Consumption Forecast
                    </h4>
                    {prediction ? (
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                            <p className="text-sm text-indigo-900 mb-1">
                                Predicted <b>{prediction.material}</b> usage (Next 7 days):
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-indigo-700">
                                    {prediction.predicted_usage_next_week}
                                </span>
                                <span className="text-sm text-indigo-500 font-medium">MT</span>
                            </div>
                            {prediction.message && (
                                <p className="text-xs text-indigo-400 mt-2 italic">{prediction.message}</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Prediction data unavailable.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
