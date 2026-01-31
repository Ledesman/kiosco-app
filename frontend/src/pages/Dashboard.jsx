import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ShoppingCart,
    Package,
    TrendingDown,
    DollarSign,
    Receipt,
    AlertTriangle,
    ArrowRight,
    Plus,
    Clock,
    CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        today: {
            revenue: 0,
            transactions: 0,
            average: 0
        },
        recentSales: [],
        lowStockCount: 0
    });

    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            const [dailyRes, salesRes, stockRes] = await Promise.all([
                api.get(`/reports/daily?date=${today}`),
                api.get('/sales?limit=5'),
                api.get('/reports/low-stock')
            ]);

            setStats({
                today: {
                    revenue: parseFloat(dailyRes.data.summary?.total_revenue || 0),
                    transactions: dailyRes.data.summary?.total_transactions || 0,
                    average: dailyRes.data.summary?.total_revenue / dailyRes.data.summary?.total_transactions || 0
                },
                recentSales: salesRes.data.sales.slice(0, 5),
                lowStockCount: stockRes.data.low_stock_products.length
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Non-blocking error for dashboard
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const quickActions = [
        { label: 'Nueva Venta', icon: <ShoppingCart size={24} />, path: '/sales', color: 'bg-blue-600', hover: 'hover:bg-blue-700' },
        { label: 'Ver Stock', icon: <Package size={24} />, path: '/products', color: 'bg-emerald-600', hover: 'hover:bg-emerald-700' },
        { label: 'Registrar Gasto', icon: <TrendingDown size={24} />, path: '/expenses', color: 'bg-orange-600', hover: 'hover:bg-orange-700' },
        { label: 'Generar Reporte', icon: <Receipt size={24} />, path: '/reports', color: 'bg-indigo-600', hover: 'hover:bg-indigo-700' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">
                        ¡Hola, {user?.full_name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-500 mt-1">Así va el negocio hoy, {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
                </div>
                {stats.lowStockCount > 0 && (
                    <Link to="/reports" className="flex items-center gap-3 bg-red-50 border border-red-100 px-4 py-2 rounded-2xl text-red-600 animate-pulse">
                        <AlertTriangle size={20} />
                        <span className="text-sm font-bold">{stats.lowStockCount} productos con poco stock</span>
                    </Link>
                )}
            </div>

            {/* Daily Stats Pulse */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-tight">Ventas de Hoy</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-gray-800">${stats.today.revenue.toFixed(2)}</h3>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={80} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <ShoppingCart size={24} />
                        </div>
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-tight">Transacciones</span>
                    </div>
                    <h3 className="text-3xl font-black text-gray-800">{stats.today.transactions}</h3>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShoppingCart size={80} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-tight">Ticket Promedio</span>
                    </div>
                    <h3 className="text-3xl font-black text-gray-800">${stats.today.average.toFixed(2)}</h3>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={80} />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, idx) => (
                    <button
                        key={idx}
                        onClick={() => navigate(action.path)}
                        className={`${action.color} ${action.hover} p-6 rounded-3xl text-white shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 flex flex-col gap-3 group`}
                    >
                        <div className="bg-white/20 w-fit p-3 rounded-2xl">
                            {action.icon}
                        </div>
                        <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-lg">{action.label}</span>
                            <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Actividad Reciente</h3>
                            <p className="text-sm text-gray-400">Últimas transacciones realizadas</p>
                        </div>
                        <div className="p-2 bg-gray-50 text-gray-400 rounded-xl">
                            <Clock size={20} />
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
                            ))
                        ) : stats.recentSales.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                                <Receipt size={48} />
                                <p className="font-medium">No hay ventas registradas hoy</p>
                            </div>
                        ) : (
                            stats.recentSales.map((sale) => (
                                <div key={sale.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                            <Receipt size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">#{sale.ticket_number}</p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock size={12} /> {new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-gray-800">${parseFloat(sale.total_amount).toFixed(2)}</p>
                                        <div className="flex justify-end mt-1">
                                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle2 size={10} /> COMPLETADA
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <Link
                        to="/sales"
                        className="mt-6 flex items-center justify-center gap-2 text-blue-600 font-bold hover:underline transition-all group"
                    >
                        Ver todas las ventas <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* System Health / Tips */}
                <div className="flex flex-col gap-6">
                    {/* Critical Alert Card */}
                    {stats.lowStockCount > 0 && (
                        <div className="bg-red-600 p-8 rounded-3xl text-white shadow-lg shadow-red-200 relative overflow-hidden">
                            <div className="relative z-10">
                                <AlertTriangle size={40} className="mb-4" />
                                <h3 className="text-2xl font-black">Stock Insuficiente</h3>
                                <p className="mt-2 text-red-100">Tienes {stats.lowStockCount} productos que han alcanzado o superado el limite minimo de stock.</p>
                                <button
                                    onClick={() => navigate('/products')}
                                    className="mt-6 bg-white text-red-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-50 transition-colors"
                                >
                                    Reponer Ahora <Plus size={20} />
                                </button>
                            </div>
                            <div className="absolute -bottom-10 -right-10 opacity-10">
                                <Package size={200} />
                            </div>
                        </div>
                    )}

                    {/* Operational Tip Card */}
                    <div className="bg-indigo-900 p-8 rounded-3xl text-white flex-1 relative overflow-hidden">
                        <div className="relative z-10">
                            <DollarSign size={40} className="mb-4 text-indigo-400" />
                            <h3 className="text-2xl font-black">Control de Gastos</h3>
                            <p className="mt-2 text-indigo-200">Recuerda registrar todos los gastos operativos el dia de hoy para mantener tus reportes de utilidad precisos.</p>
                            <Link
                                to="/expenses"
                                className="mt-6 inline-flex items-center gap-2 text-white font-bold hover:underline"
                            >
                                Ir a Gastos <ArrowRight size={18} />
                            </Link>
                        </div>
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <TrendingDown size={120} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TrendingUp = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

export default Dashboard;
