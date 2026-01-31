import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
    Users as UsersIcon,
    Plus,
    Shield,
    User,
    Calendar,
    Trash2,
    Edit2,
    RefreshCw
} from 'lucide-react';
import api from '../services/api';
import UserModal from '../components/UserModal';

const MySwal = withReactContent(Swal);

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/auth/users');
            setUsers(response.data.users);
        } catch (error) {
            console.error('Error fetching users:', error);
            MySwal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSave = async (userData) => {
        try {
            if (editingUser) {
                // Backend doesn't have an update user endpoint yet, 
                // but we'll implement it or just register for now as per plan
                // For now, let's assume we can only create or we skip edit logic if not supported
                // Looking at auth.js, it only has /register.
                MySwal.fire('Info', 'La edición de usuarios no está implementada en el backend aún.', 'info');
            } else {
                await api.post('/auth/register', userData);
                MySwal.fire({
                    title: 'Éxito',
                    text: 'Usuario creado correctamente',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-3xl' }
                });
            }
            setModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            MySwal.fire('Error', error.response?.data?.error || 'No se pudo guardar el usuario', 'error');
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <UsersIcon className="text-blue-600" size={32} />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-gray-500 mt-1">Administra los accesos de administradores y cajeros.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    Nuevo Usuario
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Nombre Completo</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-4"><div className="h-10 bg-gray-100 rounded-xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <UsersIcon size={48} />
                                            <p className="text-lg font-medium">No hay usuarios registrados</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="font-bold text-gray-800">{u.username}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">
                                            {u.full_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${u.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-600'
                                                    : 'bg-emerald-100 text-emerald-600'
                                                }`}>
                                                <Shield size={12} />
                                                {u.role === 'admin' ? 'Administrador' : 'Cajero'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* Currently no edit/delete endpoints in backend for users, so we disable these for now */}
                                            <div className="flex justify-end gap-2 opacity-30 grayscale cursor-not-allowed">
                                                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all" disabled>
                                                    <Edit2 size={18} />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all" disabled>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                user={editingUser}
            />
        </div>
    );
};

export default Users;
