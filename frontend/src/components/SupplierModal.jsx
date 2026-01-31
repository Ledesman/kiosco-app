import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, MapPin, Briefcase, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api';

const SupplierModal = ({ isOpen, onClose, onSave, supplier = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        contact_name: '',
        phone: '',
        email: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name || '',
                contact_name: supplier.contact_name || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || ''
            });
        } else {
            setFormData({
                name: '',
                contact_name: '',
                phone: '',
                email: '',
                address: ''
            });
        }
        setError('');
    }, [supplier, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (supplier) {
                await api.put(`/suppliers/${supplier.id}`, formData);
                Swal.fire({
                    title: 'Actualizado',
                    text: 'Proveedor actualizado exitosamente',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-3xl' }
                });
            } else {
                await api.post('/suppliers', formData);
                Swal.fire({
                    title: 'Creado',
                    text: 'Proveedor creado exitosamente',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-3xl' }
                });
            }
            onSave();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar el proveedor');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Briefcase size={24} />
                        </div>
                        <h2 className="text-xl font-bold">
                            {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                        </h2>
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
                        {/* Company Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <Briefcase size={16} className="text-indigo-500" /> Razón Social / Empresa
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ej: Distribuidora Norte S.A."
                                required
                            />
                        </div>

                        {/* Contact Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <User size={16} className="text-indigo-500" /> Nombre de Contacto
                            </label>
                            <input
                                type="text"
                                name="contact_name"
                                value={formData.contact_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                    <Phone size={16} className="text-indigo-500" /> Teléfono
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ej: +54 9 11 1234-5678"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                    <Mail size={16} className="text-indigo-500" /> Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <MapPin size={16} className="text-indigo-500" /> Dirección
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows="2"
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                                placeholder="Ej: Av. Siempreviva 742"
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
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                'Guardando...'
                            ) : (
                                <>
                                    <Save size={20} />
                                    {supplier ? 'Actualizar' : 'Guardar'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierModal;
