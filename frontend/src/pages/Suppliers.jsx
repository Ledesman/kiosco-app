import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Briefcase,
    Phone,
    Mail,
    MapPin,
    RefreshCw,
    User
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SupplierModal from '../components/SupplierModal';
import Pagination from '../components/Pagination';

const MySwal = withReactContent(Swal);

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);

    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/suppliers');
            setSuppliers(response.data.suppliers);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los proveedores',
                customClass: { popup: 'rounded-3xl' }
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleDelete = async (id) => {
        const result = await MySwal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
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
                await api.delete(`/suppliers/${id}`);
                fetchSuppliers();
                MySwal.fire({
                    title: 'Eliminado',
                    text: 'El proveedor ha sido eliminado.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-3xl' }
                });
            } catch (error) {
                MySwal.fire({
                    title: 'Error',
                    text: error.response?.data?.error || 'No se pudo eliminar el proveedor.',
                    icon: 'error',
                    customClass: { popup: 'rounded-3xl' }
                });
            }
        }
    };

    const openCreateModal = () => {
        setEditingSupplier(null);
        setModalOpen(true);
    };

    const openEditModal = (supplier) => {
        setEditingSupplier(supplier);
        setModalOpen(true);
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contact_name && s.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
    const currentSuppliers = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Briefcase className="text-indigo-600" size={32} />
                        Gestión de Proveedores
                    </h1>
                    <p className="text-gray-500 mt-1">Administra los proveedores que surten tu kiosco.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={openCreateModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        Nuevo Proveedor
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, contacto o email..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={fetchSuppliers}
                    className="p-3 rounded-2xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                    title="Refrescar"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Suppliers Card Grid/Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Proveedor</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Contacto</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Comunicación</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Ubicación</th>
                                {isAdmin && <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && filteredSuppliers.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={isAdmin ? 5 : 4} className="px-6 py-4">
                                            <div className="h-12 bg-gray-100 rounded-xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <Briefcase size={48} />
                                            <p className="text-lg font-medium">No se encontraron proveedores</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentSuppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-lg">
                                                    {supplier.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="font-bold text-gray-800">{supplier.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <User size={16} className="text-gray-400" />
                                                {supplier.contact_name || 'Sin contacto'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {supplier.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone size={14} className="text-indigo-400" />
                                                        {supplier.phone}
                                                    </div>
                                                )}
                                                {supplier.email && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Mail size={14} className="text-indigo-400" />
                                                        {supplier.email}
                                                    </div>
                                                )}
                                                {!supplier.phone && !supplier.email && <span className="text-gray-400 text-sm italic">Sin datos</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {supplier.address ? (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <MapPin size={16} className="text-indigo-400 shrink-0" />
                                                    <span className="truncate max-w-[200px]">{supplier.address}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">Sin dirección</span>
                                            )}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(supplier)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(supplier.id)}
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
                        {filteredSuppliers.length > 0 && (
                            <tfoot>
                                <tr>
                                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-4 border-t border-gray-100">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={Math.ceil(filteredSuppliers.length / itemsPerPage)}
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
            <SupplierModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={fetchSuppliers}
                supplier={editingSupplier}
            />
        </div>
    );
};

export default Suppliers;
