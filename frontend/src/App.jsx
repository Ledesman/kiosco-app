import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Expenses from './pages/Expenses';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Devoluciones from './pages/Devoluciones';
import Users from './pages/Users';
import Unauthorized from './pages/Unauthorized';

const PrivateRoute = ({ children, useLayout = true }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;

  if (!user) return <Navigate to="/login" />;

  return useLayout ? <Layout>{children}</Layout> : children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
          <Route path="/pos" element={<PrivateRoute useLayout={false}><Sales isKiosk={true} /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
          <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
          <Route path="/suppliers" element={<PrivateRoute><Suppliers /></PrivateRoute>} />
          <Route path="/devoluciones" element={<AdminRoute><Devoluciones /></AdminRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
