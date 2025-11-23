import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { login, verifyToken } from '../services/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const jwt = searchParams.get('jwt');
    if (jwt) {
      handleAutoLogin(jwt);
    }
  }, [searchParams]);

  const handleAutoLogin = async (jwt: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await verifyToken(jwt);
      console.log('Auto login response:', response);

      if (onLoginSuccess) {
        onLoginSuccess();
      }

      // Check if user needs business setup
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.needs_business_setup) {
        console.log('🏢 Usuário precisa configurar business, redirecionando...');
        navigate('/feed');
        return;
      }

      console.log('Navigating to home page');
      navigate('/');
    } catch (err) {
      console.error('Auto login error:', err);
      setError(err instanceof Error ? err.message : 'Falha no login automático');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt with email:', email);
    setError('');
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      console.log('Login response:', response);

      if (onLoginSuccess) {
        console.log('Calling onLoginSuccess callback');
        onLoginSuccess();
      }

      if (response.needs_business_setup) {
        console.log('🏢 Usuário precisa configurar business, redirecionando...');
        navigate('/feed');
        return;
      }

      console.log('Navigating to home page');
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-dark mb-2">Entrar</h1>
            <p className="text-gray">Bem-vindo de volta! Por favor, insira seus dados.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-600 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-dark mb-2">
                Seu e-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-light rounded-lg px-4 py-3 text-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition-all"
                placeholder="Digite seu e-mail"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-dark">
                  Senha
                </label>
                <button
                  type="button"
                  className="text-sm text-blue hover:text-blue-dark transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-light rounded-lg px-4 py-3 pr-12 text-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition-all"
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray hover:text-gray-dark transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue hover:bg-blue-dark text-white rounded-lg px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray text-sm">
              Não tem uma conta?{' '}
              <button 
                onClick={() => window.location.href = 'https://create-account-carousel-j7cp.vercel.app/create-account'}
                className="text-blue hover:text-blue-dark font-medium hover:underline transition-colors"
              >
                Criar conta
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Decorative Area with Instagram Icon and Floating Orbs */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-tr from-[#ff7eb9] via-[#ff65a3] via-[#6a82fb] to-[#fc9d9a] min-h-[400px] lg:min-h-screen">
        {/* Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating Light Orbs - Same as Home Page */}
        <div
          className="absolute pointer-events-none animate-float-slow"
          style={{
            top: '10%',
            left: '8%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.3,
            filter: 'blur(80px)',
          }}
        />

        <div
          className="absolute pointer-events-none animate-float-reverse"
          style={{
            top: '5%',
            right: '12%',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.25,
            filter: 'blur(70px)',
          }}
        />

        <div
          className="absolute pointer-events-none animate-float-slow"
          style={{
            top: '40%',
            left: '5%',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.2,
            filter: 'blur(75px)',
          }}
        />

        <div
          className="absolute pointer-events-none animate-float-reverse"
          style={{
            top: '45%',
            right: '8%',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.28,
            filter: 'blur(65px)',
          }}
        />

        <div
          className="absolute pointer-events-none animate-float-slow"
          style={{
            bottom: '15%',
            left: '15%',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.22,
            filter: 'blur(70px)',
          }}
        />

        <div
          className="absolute pointer-events-none animate-float-reverse"
          style={{
            bottom: '20%',
            right: '20%',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.26,
            filter: 'blur(68px)',
          }}
        />

        <div
          className="absolute pointer-events-none animate-float-slow"
          style={{
            top: '25%',
            left: '45%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.18,
            filter: 'blur(60px)',
          }}
        />

        <div
          className="absolute pointer-events-none animate-float-reverse"
          style={{
            top: '70%',
            left: '35%',
            width: '230px',
            height: '230px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.24,
            filter: 'blur(72px)',
          }}
        />

        {/* Instagram Icon - Official style with 0.6 opacity */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="instagram-icon-container group cursor-pointer"
            style={{
              transform: 'rotate(-25deg)',
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              opacity: 0.6,
            }}
          >
            <div
              className="relative transition-transform duration-700 ease-out group-hover:translate-x-8"
              style={{
                filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.2))',
              }}
            >
              <div className="relative">
                <svg
                  width="200"
                  height="200"
                  viewBox="0 0 256 256"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transition-transform duration-500 group-hover:scale-110"
                >
                  <defs>
                    <radialGradient id="instagramGradient" cx="30%" cy="107%">
                      <stop offset="0%" stopColor="#fdf497" />
                      <stop offset="5%" stopColor="#fdf497" />
                      <stop offset="45%" stopColor="#fd5949" />
                      <stop offset="60%" stopColor="#d6249f" />
                      <stop offset="90%" stopColor="#285AEB" />
                    </radialGradient>
                  </defs>

                  <rect
                    x="0"
                    y="0"
                    width="256"
                    height="256"
                    rx="55"
                    fill="url(#instagramGradient)"
                  />

                  <g transform="translate(38, 38)">
                    <rect
                      x="0"
                      y="0"
                      width="180"
                      height="180"
                      rx="34"
                      fill="none"
                      stroke="white"
                      strokeWidth="14"
                    />

                    <circle
                      cx="90"
                      cy="90"
                      r="45"
                      fill="none"
                      stroke="white"
                      strokeWidth="14"
                    />

                    <circle
                      cx="140"
                      cy="40"
                      r="13"
                      fill="white"
                    />
                  </g>
                </svg>

                <div
                  className="absolute inset-0 -z-10 blur-3xl opacity-60 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(253,244,151,0.4) 0%, rgba(253,89,73,0.4) 30%, rgba(214,36,159,0.4) 60%, rgba(40,90,235,0.3) 100%)',
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-15px) translateX(10px);
          }
          50% {
            transform: translateY(-25px) translateX(-5px);
          }
          75% {
            transform: translateY(-10px) translateX(-15px);
          }
        }

        @keyframes floatReverse {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-10px) translateX(-15px);
          }
          50% {
            transform: translateY(-20px) translateX(5px);
          }
          75% {
            transform: translateY(-15px) translateX(10px);
          }
        }

        .animate-float-slow {
          animation: floatSlow 8s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation: floatReverse 10s ease-in-out infinite;
        }

        .instagram-icon-container:hover {
          transform: rotate(-25deg) scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default LoginPage;