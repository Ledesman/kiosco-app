import React, { useState, useEffect } from 'react';
import { X, User, Lock, Shield, UserCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const UserModal = ({ isOpen, onClose, onSave, user = null }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'cajero'
    });

    useEffect(() => {
        if (user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                username: user.username,
                password: '', // Don't show password for editing
                full_name: user.full_name,
                role: user.role
            });
        } else {
            setFormData({
                username: '',
                password: '',
                full_name: '',
                role: 'cajero'
            });
        }
    }, [user, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.username || !formData.full_name || (!user && !formData.password)) {
            Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
            return;
        }

        onSave(formData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-blue-600 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        {user ? <UserCircle size={28} /> : <UserCircle size={28} />}
                        {user ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                            <User size={16} className="text-blue-500" /> Nombre de Usuario
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Ej: juan.perez"
                        />
                    </div>

                    {!user && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <Lock size={16} className="text-blue-500" /> Contraseña
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="********"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                            <Shield size={16} className="text-blue-500" /> Rol
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-no-repeat bg-right"
                        >
                            <option value="cajero">Cajero</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                        >
                            {user ? 'Guardar Cambios' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
