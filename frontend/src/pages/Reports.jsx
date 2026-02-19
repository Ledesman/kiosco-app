import React, { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, Package, AlertTriangle, Calendar, RefreshCw, DollarSign,
    ShoppingCart, CreditCard, PieChart as PieChartIcon, Tag
} from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { Eye, Download, FileText, User, Hash, Clock, X } from 'lucide-react';
import Pagination from '../components/Pagination';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Reports = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalSales, setTotalSales] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dates, setDates] = useState({
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    const [data, setData] = useState({
        summary: null, trend: [], categories: [], payments: [], topProducts: [], lowStock: [],
        sales: []
    });
    const [selectedSale, setSelectedSale] = useState(null);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const [trendRes, categoryRes, paymentRes, stockRes] = await Promise.all([
                api.get(`/reports/date-range?start_date=${dates.start_date}&end_date=${dates.end_date}`),
                api.get(`/reports/by-category?start_date=${dates.start_date}&end_date=${dates.end_date}`),
                api.get(`/reports/by-payment?start_date=${dates.start_date}&end_date=${dates.end_date}`),
                api.get('/reports/low-stock')
            ]);
            const dailyRes = await api.get(`/reports/daily?date=${dates.end_date}`);
            const salesRes = await api.get(`/sales?start_date=${dates.start_date}&end_date=${dates.end_date}&page=${currentPage}&limit=${itemsPerPage}`);

            setData({
                summary: trendRes.data.summary,
                trend: trendRes.data.daily_sales,
                categories: categoryRes.data.categories,
                payments: paymentRes.data.payment_methods,
                topProducts: dailyRes.data.top_products,
                lowStock: stockRes.data.low_stock_products,
                sales: salesRes.data.sales
            });
            setTotalSales(salesRes.data.total || 0); // Update total sales count
        } catch (error) {
            console.error('Error fetching reports:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los reportes', customClass: { popup: 'rounded-3xl' } });
        } finally {
            setLoading(false);
        }
    }, [dates, currentPage, itemsPerPage]); // Add currentPage and itemsPerPage to dependencies

    useEffect(() => { fetchReports(); }, [fetchReports]);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDates(prev => ({ ...prev, [name]: value }));
    };


    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 shadow-xl rounded-2xl border border-gray-100">
                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">{label}</p>
                    <p className="text-indigo-600 font-bold text-lg">${parseFloat(payload[0].value).toFixed(2)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <PieChartIcon className="text-indigo-600" size={32} />
                        Reportes e Inteligencia
                    </h1>
                    <p className="text-gray-500 mt-1">Analiza el rendimiento y la salud de tu negocio.</p>
                </div>

                <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400" />
                    <input type="date" name="start_date" value={dates.start_date} onChange={handleDateChange} className="text-sm font-medium outline-none bg-transparent" />
                    <span className="text-gray-300">|</span>
                    <input type="date" name="end_date" value={dates.end_date} onChange={handleDateChange} className="text-sm font-medium outline-none bg-transparent" />
                    <button onClick={fetchReports} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard icon={<DollarSign size={24} />} label="Ingresos Totales" value={`$${parseFloat(data.summary?.total_revenue || 0).toFixed(2)}`} color="indigo" />
                <SummaryCard icon={<ShoppingCart size={24} />} label="Ventas" value={data.summary?.total_transactions || 0} color="emerald" />
                <SummaryCard icon={<TrendingUp size={24} />} label="Ticket Promedio" value={`$${parseFloat(data.summary?.average_sale || 0).toFixed(2)}`} color="orange" />
                <SummaryCard icon={<AlertTriangle size={24} />} label="Stock Critico" value={data.lowStock.length} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard title="Tendencia de Ventas" icon={<TrendingUp size={24} className="text-indigo-500" />}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.trend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => new Date(val).getDate()} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} fill="#4f46e5" fillOpacity={0.1} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Ventas por Categoria" icon={<Tag size={24} className="text-emerald-500" />}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.categories} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="category_name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 'bold' }} width={100} />
                            <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                            <Bar dataKey="total_revenue" radius={[0, 10, 10, 0]} barSize={20}>
                                {data.categories.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-[400px] flex flex-col">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-between">Metodos de Pago <CreditCard size={24} className="text-blue-500" /></h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data.payments.filter(p => p.amount > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="amount" nameKey="method">
                                {data.payments.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-[400px] flex flex-col col-span-2">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-between">Top 10 Productos Hoy <Package size={24} className="text-indigo-500" /></h3>
                    <div className="overflow-y-auto">
                        <table className="w-full text-left">
                            <thead><tr className="text-xs font-bold text-gray-400 uppercase border-b border-gray-50"><th className="pb-3 px-2">Producto</th><th className="pb-3 text-center">Cant.</th><th className="pb-3 text-right">Ingresos</th></tr></thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.topProducts.map((p, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="py-3 px-2 font-medium text-gray-700">{p.name}</td>
                                        <td className="py-3 text-center text-gray-500 font-bold">{parseFloat(p.total_quantity).toFixed(0)}</td>
                                        <td className="py-3 text-right font-black text-indigo-600">${parseFloat(p.total_revenue).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3"><AlertTriangle size={24} className="text-red-600" /> Alerta de Stock Crítico</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="text-xs font-bold text-gray-400 uppercase border-b border-gray-100"><th className="pb-4 px-4">Producto</th><th className="pb-4 px-4 text-center">Stock</th><th className="pb-4 px-4 text-center">Mínimo</th><th className="pb-4 px-4">Estado</th></tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.lowStock.map((p) => (
                                <tr key={p.id} className="hover:bg-red-50/30">
                                    <td className="py-4 px-4 font-bold text-gray-800">{p.name}</td>
                                    <td className="py-4 px-4 text-center font-black text-red-600">{parseFloat(p.stock_quantity).toFixed(0)}</td>
                                    <td className="py-4 px-4 text-center text-gray-400">{parseFloat(p.min_stock_alert).toFixed(0)}</td>
                                    <td className="py-4 px-4"><span className="text-red-500 font-bold text-xs bg-red-50 px-3 py-1 rounded-full">REABASTECER</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sales History Table */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3"><FileText size={24} className="text-indigo-600" /> Historial de Ventas</h3>

                    <button
                        onClick={() => {
                            try {
                                if (!data.sales || data.sales.length === 0) {
                                    Swal.fire('Atención', 'No hay datos para exportar en este rango de fechas.', 'warning');
                                    return;
                                }

                                const exportData = data.sales.map(s => ({
                                    'Fecha': new Date(s.sale_date).toLocaleString(),
                                    'Ticket': s.ticket_number,
                                    'Cajero': s.cashier_name || 'Desconocido',
                                    'Monto Total': parseFloat(s.total_amount) || 0,
                                    'Efectivo': parseFloat(s.payment_method_efectivo) || 0,
                                    'Débito': parseFloat(s.payment_method_debito) || 0,
                                    'Crédito': parseFloat(s.payment_method_credito) || 0,
                                    'Transferencia / MP': (parseFloat(s.payment_method_transferencia) || 0) + (parseFloat(s.payment_method_mercadopago) || 0),
                                    'Ref': s.payment_note || ''
                                }));

                                const ws = XLSX.utils.json_to_sheet(exportData);
                                const wb = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wb, ws, "Ventas");
                                XLSX.writeFile(wb, `Ventas_${dates.start_date}_a_${dates.end_date}.xlsx`);

                                Swal.fire({
                                    icon: 'success',
                                    title: 'Exportación Exitosa',
                                    text: 'El archivo se ha descargado correctamente.',
                                    timer: 2000,
                                    showConfirmButton: false,
                                    customClass: { popup: 'rounded-3xl' }
                                });
                            } catch (error) {
                                console.error('Export error:', error);
                                Swal.fire('Error', 'Hubo un problema al exportar. Intente nuevamente.', 'error');
                            }
                        }}
                        className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl font-bold hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm shadow-emerald-500/10"
                    >
                        <Download size={20} /> Exportar a Excel
                    </button>

                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs font-bold text-gray-400 uppercase border-b border-gray-50">
                                <th className="pb-4 px-4">Fecha / Hora</th>
                                <th className="pb-4 px-4">Ticket</th>
                                <th className="pb-4 px-4">Cajero</th>
                                <th className="pb-4 px-4 text-right">Monto</th>
                                <th className="pb-4 px-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.sales.map((s) => (
                                <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-gray-300" />
                                            <span className="font-medium text-gray-700">{new Date(s.sale_date).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 font-black text-gray-600">#{s.ticket_number}</td>
                                    <td className="py-4 px-4 font-bold text-gray-500">{s.cashier_name}</td>
                                    <td className="py-4 px-4 text-right font-black text-indigo-600 text-lg">${parseFloat(s.total_amount).toFixed(2)}</td>
                                    <td className="py-4 px-4 text-center">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await api.get(`/sales/ticket/${s.ticket_number}`);
                                                    setSelectedSale(res.data);
                                                    // eslint-disable-next-line no-unused-vars
                                                } catch (err) {
                                                    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el detalle' });
                                                }
                                            }}
                                            className="p-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-gray-100 group-hover:scale-110 active:scale-95"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="5" className="px-6 py-4 border-t border-gray-100">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={Math.ceil(totalSales / itemsPerPage)}
                                        onPageChange={setCurrentPage}
                                    />
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Sale Detail Modal */}
            {
                selectedSale && (
                    <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">Detalle de Venta</h2>
                                    <p className="text-indigo-600 font-bold">Ticket #{selectedSale.sale.ticket_number}</p>
                                </div>
                                <button onClick={() => setSelectedSale(null)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">FECHA Y HORA</p>
                                    <p className="font-bold text-gray-700">{new Date(selectedSale.sale.sale_date).toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">CAJERO</p>
                                    <p className="font-bold text-gray-700">{selectedSale.sale.cashier_name}</p>
                                </div>
                                {selectedSale.sale.payment_note && (
                                    <div className="col-span-2 space-y-1 pt-2 border-t border-dashed">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">REFERENCIA / NOTA</p>
                                        <p className="font-bold text-gray-700">{selectedSale.sale.payment_note}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-white"><tr className="text-xs font-bold text-gray-400 uppercase border-b"><th className="pb-3">Producto</th><th className="pb-3 text-center">Pts.</th><th className="pb-3 text-right">Subtotal</th></tr></thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {selectedSale.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50">
                                                <td className="py-4">
                                                    <p className="font-bold text-gray-800">{item.product_name}</p>
                                                    <p className="text-xs text-gray-400">${parseFloat(item.unit_price).toFixed(2)} x {parseFloat(item.quantity).toFixed(2)}</p>
                                                </td>
                                                <td className="py-4 text-center font-bold text-gray-500">{parseFloat(item.quantity).toFixed(0)}</td>
                                                <td className="py-4 text-right font-black text-gray-800">${parseFloat(item.subtotal).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pt-6 border-t space-y-4">
                                <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-500/20 flex justify-between items-center text-white">
                                    <span className="font-bold">TOTAL VENDIDO</span>
                                    <span className="text-3xl font-black">${parseFloat(selectedSale.sale.total_amount).toFixed(2)}</span>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setSelectedSale(null)}
                                        className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all text-center"
                                    >
                                        Cerrar Detalle
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

const SummaryCard = ({ icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className={`flex items-center gap-4 mb-3 text-${color}-600`}>{icon} <span className="text-sm font-bold text-gray-400 uppercase">{label}</span></div>
        <h3 className="text-3xl font-black text-gray-800">{value}</h3>
    </div>
);

const ChartCard = ({ title, icon, children }) => (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-[450px] flex flex-col">
        <div className="flex items-center justify-between mb-8"><div><h3 className="text-xl font-bold text-gray-800">{title}</h3></div>{icon}</div>
        <div className="flex-1 w-full translate-x-[-15px]">{children}</div>
    </div>
);

export default Reports;
