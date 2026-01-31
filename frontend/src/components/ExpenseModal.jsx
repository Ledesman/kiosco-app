import React, { useState, useEffect } from 'react';
import { X, Save, FileText, DollarSign, Tag, Calendar, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api';

const ExpenseModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Mercadería',
        expense_date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const categories = ['Sueldos', 'Servicios', 'Mercadería', 'Otros'];

    useEffect(() => {
        if (isOpen) {
            setFormData({
                description: '',
                amount: '',
                category: 'Mercadería',
                expense_date: new Date().toISOString().split('T')[0]
            });
            setError('');
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/expenses', formData);
            Swal.fire({
                title: 'Registrado',
                text: 'Gasto registrado exitosamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-3xl' }
            });
            onSave();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrar el gasto');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-orange-600 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                        <h2 className="text-xl font-bold">Registrar Gasto</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 rounded-r-xl">
                            <AlertTriangle size={20} />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="space-y-5">
                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <FileText size={16} className="text-orange-500" /> Descripción
                            </label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ej: Pago de Luz Edesur"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                    <DollarSign size={16} className="text-orange-500" /> Monto
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        name="amount"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                    <Tag size={16} className="text-orange-500" /> Categoría
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <Calendar size={16} className="text-orange-500" /> Fecha del Gasto
                            </label>
                            <input
                                type="date"
                                name="expense_date"
                                value={formData.expense_date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                'Guardando...'
                            ) : (
                                <>
                                    <Save size={20} />
                                    Registrar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
