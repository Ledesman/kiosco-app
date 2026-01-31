import React, { useState, useEffect } from 'react';
import { X, Save, Tag, AlignLeft, AlertTriangle, ImageIcon, Upload } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api';

const CategoryModal = ({ isOpen, onClose, onSave, category = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: null,
        imagePreview: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
        setFormData({
            name: category.name || '',
            description: category.description || ''
        });
    } else {
        setFormData({
            name: '',
            description: ''
        });
    }
    setError('');
}, [category, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    if (formData.image) {
        formDataToSend.append('image', formData.image);
    }

    try {
        if (category) {
            await api.put(`/categories/${category.id}`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            Swal.fire({
                title: 'Actualizada',
                text: 'Categoría actualizada exitosamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-3xl' }
            });
        } else {
            await api.post('/categories', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            Swal.fire({
                title: 'Creada',
                text: 'Categoría creada exitosamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-3xl' }
            });
        }
        onSave();
        onClose();
    } catch (err) {
        setError(err.response?.data?.error || 'Error al guardar la categoría');
    } finally {
        setLoading(false);
    }
};

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Tag size={24} />
                        </div>
                        <h2 className="text-xl font-bold">
                            {category ? 'Editar Categoría' : 'Nueva Categoría'}
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
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <Tag size={16} className="text-emerald-500" /> Nombre de la Categoría
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ej: Bebidas, Snacks, etc."
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <AlignLeft size={16} className="text-emerald-500" /> Descripción
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                                placeholder="Breve descripción de los productos en esta categoría..."
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
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                'Guardando...'
                            ) : (
                                <>
                                    <Save size={20} />
                                    {category ? 'Actualizar' : 'Guardar'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryModal;
