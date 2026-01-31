import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-blue-100 p-4 rounded-full">
                            <LogIn className="text-blue-600" size={40} />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Bienvenido</h2>
                    <p className="text-center text-gray-500 mb-8">Ingresa tus credenciales para continuar</p>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400">
                                    <User size={20} />
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Tu usuario"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400">
                                    <Lock size={20} />
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-full transition-colors shadow-lg flex justify-center items-center gap-2"
                        >
                            {loading ? 'Iniciando sesión...' : 'Ingresar'}
                        </button>
                    </form>
                </div>

                <div className="bg-gray-50 p-4 text-center">
                    <p className="text-xs text-gray-400">Kiosco App v1.0 - Gestión Inteligente</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
