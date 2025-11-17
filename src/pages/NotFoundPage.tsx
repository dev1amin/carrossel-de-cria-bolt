import { useNavigate } from 'react-router-dom';
import { MouseFollowLight } from '../components/MouseFollowLight';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-light to-light flex items-center justify-center p-4">
      <MouseFollowLight />
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-dark">404</h1>
          <h2 className="text-2xl font-semibold text-dark">Página não encontrada</h2>
          <p className="text-gray">
            Desculpe, não conseguimos encontrar a página que você está procurando.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-3 text-white bg-blue rounded-lg hover:bg-blue-dark transition-colors"
          >
            Voltar para o Feed
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full px-4 py-3 text-gray-dark bg-white border border-gray-light rounded-lg hover:bg-light transition-colors"
          >
            Voltar para página anterior
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;