import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Tag,
    RefreshCw,
    AlignLeft
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CategoryModal from '../components/CategoryModal';
import Pagination from '../components/Pagination';

const MySwal = withReactContent(Swal);

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/categories');
            setCategories(response.data.categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las categorías',
                customClass: { popup: 'rounded-3xl' }
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleDelete = async (id) => {
        const result = await MySwal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
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
                await api.delete(`/categories/${id}`);
                fetchCategories();
                MySwal.fire({
                    title: 'Eliminada',
                    text: 'La categoría ha sido eliminada.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-3xl' }
                });
            } catch (error) {
                MySwal.fire({
                    title: 'Error',
                    text: error.response?.data?.error || 'No se pudo eliminar la categoría.',
                    icon: 'error',
                    customClass: { popup: 'rounded-3xl' }
                });
            }
        }
    };

    const openCreateModal = () => {
        setEditingCategory(null);
        setModalOpen(true);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setModalOpen(true);
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Tag className="text-emerald-600" size={32} />
                        Gestión de Categorías
                    </h1>
                    <p className="text-gray-500 mt-1">Administra las categorías de productos de tu kiosco.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={openCreateModal}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        Nueva Categoría
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o descripción..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={fetchCategories}
                    className="p-3 rounded-2xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                    title="Refrescar"
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
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                                {isAdmin && <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && filteredCategories.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={isAdmin ? 4 : 3} className="px-6 py-4">
                                            <div className="h-12 bg-gray-100 rounded-xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 4 : 3} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <Tag size={48} />
                                            <p className="text-lg font-medium">No se encontraron categorías</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentCategories.map((category) => (
                                    <tr key={category.id} className="hover:bg-emerald-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold text-lg">
                                                    {category.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="font-bold text-gray-800">{category.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2 text-gray-600 max-w-md">
                                                <AlignLeft size={16} className="text-gray-400 mt-1 shrink-0" />
                                                <span className="text-sm">{category.description || 'Sin descripción'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(category.created_at).toLocaleDateString()}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(category)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(category.id)}
                                                        className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {filteredCategories.length > 0 && (
                            <tfoot>
                                <tr>
                                    <td colSpan={isAdmin ? 4 : 3} className="px-6 py-4 border-t border-gray-100">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={Math.ceil(filteredCategories.length / itemsPerPage)}
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
            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={fetchCategories}
                category={editingCategory}
            />
        </div>
    );
};

export default Categories;
