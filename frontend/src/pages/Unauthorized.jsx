import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 rounded-full p-4">
            <ShieldAlert size={48} className="text-red-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Acceso Denegado
        </h1>
        
        <p className="text-gray-600 mb-6">
          No tienes permisos suficientes para acceder a esta sección. 
          Esta funcionalidad está restringida solo para administradores.
        </p>
        
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Home size={20} />
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
