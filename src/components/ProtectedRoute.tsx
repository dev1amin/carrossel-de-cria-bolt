import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { validateToken, isAuthenticated } from '../services/auth';

const ProtectedRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const validateAuth = async () => {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        await validateToken();
        
        // Verifica se o usuário precisa fazer setup de business
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          
          // Se precisa de setup, permite acesso normal (não redireciona)
          if (user.needs_business_setup) {
            console.log('🏢 Usuário precisa configurar business, mas permitindo acesso normal');
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.warn('Token validation failed:', error);
        navigate('/login');
      }
    };

    validateAuth();
  }, [navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    );
  }

  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;