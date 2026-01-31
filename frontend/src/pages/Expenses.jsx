import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Trash2,
    DollarSign,
    Calendar,
    Tag,
    RefreshCw,
    FileText,
    TrendingDown,
    Filter
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ExpenseModal from '../components/ExpenseModal';
import Pagination from '../components/Pagination';

const MySwal = withReactContent(Swal);

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        category: ''
    });

    // Modal state
    const [isModalOpen, setModalOpen] = useState(false);

    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const categories = ['Sueldos', 'Servicios', 'Mercadería', 'Otros'];

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const indexOfLastItem = expenses.length > 0 ? currentPage * itemsPerPage : 0;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentExpenses = expenses.slice(indexOfFirstItem, indexOfLastItem);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.start_date) params.append('start_date', filters.start_date);
            if (filters.end_date) params.append('end_date', filters.end_date);
            if (filters.category) params.append('category', filters.category);

            const response = await api.get(`/expenses?${params.toString()}`);
            setExpenses(response.data.expenses);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los gastos',
                customClass: { popup: 'rounded-3xl' }
            });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleDelete = async (id) => {
        const result = await MySwal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ea580c',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl px-6 py-2',
                cancelButton: 'rounded-xl px-6 py-2'
            }
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/expenses/${id}`);
                fetchExpenses();
                MySwal.fire({
                    title: 'Eliminado',
                    text: 'El gasto ha sido eliminado.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-3xl' }
                });
            } catch (error) {
                MySwal.fire({
                    title: 'Error',
                    text: error.response?.data?.error || 'No se pudo eliminar el gasto.',
                    icon: 'error',
                    customClass: { popup: 'rounded-3xl' }
                });
            }
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <TrendingDown className="text-orange-600" size={32} />
                        Gestión de Gastos
                    </h1>
                    <p className="text-gray-500 mt-1">Controla las salidas de dinero y costos operativos.</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    Registrar Gasto
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-orange-100 rounded-2xl text-orange-600">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase">Total Gastos</p>
                        <h3 className="text-2xl font-bold text-gray-800">${totalExpenses.toFixed(2)}</h3>
                    </div>
                </div>
                {/* Visual indicator for category distribution or something else could go here */}
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase">Desde</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="date"
                                name="start_date"
                                value={filters.start_date}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase">Hasta</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="date"
                                name="end_date"
                                value={filters.end_date}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase">Categoría</label>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm appearance-none"
                            >
                                <option value="">Todas las categorías</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchExpenses}
                    className="p-3 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all h-[42px]"
                    title="Aplicar filtros / Refrescar"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Registrado por</th>
                                {isAdmin && <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && expenses.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={isAdmin ? 6 : 5} className="px-6 py-4">
                                            <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <TrendingDown size={48} />
                                            <p className="text-lg font-medium">No se encontraron gastos</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-orange-50/30 transition-colors group">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(expense.expense_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
                                                    <FileText size={16} />
                                                </div>
                                                <div className="font-medium text-gray-800">{expense.description}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-red-600">
                                            -${parseFloat(expense.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                    {expense.user_name?.charAt(0).toUpperCase()}
                                                </div>
                                                {expense.user_name}
                                            </div>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {expenses.length > 0 && (
                            <tfoot>
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-4 border-t border-gray-100">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={Math.ceil(expenses.length / itemsPerPage)}
                                            onPageChange={setCurrentPage}
                                        />
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Modal */}
            <ExpenseModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={fetchExpenses}
            />
        </div>
    );
};

export default Expenses;
