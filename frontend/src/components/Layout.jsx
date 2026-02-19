import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Tags,
    Receipt,
    Users,
    LogOut,
    Menu,
    X,
    TrendingDown,
    ArrowLeft
} from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/sales', icon: <ShoppingCart size={20} />, label: 'Ventas (POS)' },
        ...(user?.role === 'admin' ? [{ path: '/devoluciones', icon: <ArrowLeft size={20} />, label: 'Devoluciones' }] : []),
        { path: '/products', icon: <Package size={20} />, label: 'Productos' },
        { path: '/categories', icon: <Tags size={20} />, label: 'Categorías' },
        { path: '/expenses', icon: <TrendingDown size={20} />, label: 'Gastos' },
        { path: '/suppliers', icon: <Users size={20} />, label: 'Proveedores' },
        { path: '/reports', icon: <Receipt size={20} />, label: 'Reportes' },
        ...(user?.role === 'admin' ? [{ path: '/users', icon: <Users size={20} />, label: 'Usuarios' }] : []),
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-xl transition-all duration-300 flex flex-col`}>
                <div className={`p-4 border-b flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                    <div className="flex items-center gap-2">
                        <img src="/images/logo.png" alt="Logo" className="w-48 h-18 rounded-lg object-contain" />
                        {isSidebarOpen && <h1 className="text-xl font-bold text-blue-600"></h1>}
                    </div>
                    {isSidebarOpen && (
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-100 rounded">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {!isSidebarOpen && (
                    <div className="p-4 flex justify-center border-b">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                            <Menu size={20} />
                        </button>
                    </div>
                )}

                <nav className="flex-1 p-2 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            title={!isSidebarOpen ? item.label : ''}
                            className={`flex items-center ${isSidebarOpen ? 'gap-3 p-3' : 'justify-center p-3'} rounded-xl transition-all duration-200 ${location.pathname === item.path
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                                }`}
                        >
                            <div className="shrink-0">
                                {item.icon}
                            </div>
                            {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="p-2 border-t">
                    <button
                        onClick={handleLogout}
                        title={!isSidebarOpen ? 'Cerrar Sesión' : ''}
                        className={`flex items-center ${isSidebarOpen ? 'gap-3 p-3' : 'justify-center p-3'} w-full text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200`}
                    >
                        <div className="shrink-0">
                            <LogOut size={20} />
                        </div>
                        {isSidebarOpen && <span className="font-medium">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-700">
                        {menuItems.find(i => i.path === location.pathname)?.label || 'Kiosco'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">Hola, {user?.full_name}</span>
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                            {user?.full_name?.charAt(0)}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
