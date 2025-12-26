import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { validateToken, isAuthenticated } from '../services/auth';

const ProtectedRoute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const validationAttempted = useRef(false);

  // Verifica autenticação local imediatamente
  const hasLocalAuth = isAuthenticated();

  useEffect(() => {
    // Só valida uma vez por montagem
    if (validationAttempted.current) return;
    validationAttempted.current = true;

    const validateAuth = async () => {
      if (!hasLocalAuth) {
        return; // O Navigate abaixo já vai redirecionar
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
      } catch (error) {
        console.warn('Token validation failed:', error);
        navigate('/login');
      }
    };

    validateAuth();
  }, [navigate, location.pathname, hasLocalAuth]);

  // Se não tem autenticação local, redireciona imediatamente para login
  if (!hasLocalAuth) {
    return <Navigate to="/login" replace />;
  }

  // Se tem autenticação local, mostra o conteúdo imediatamente
  // A validação do token acontece em background
  return <Outlet />;
};

export default ProtectedRoute;