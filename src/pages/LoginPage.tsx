import React, { useState } from 'react';
import { Instagram, Eye, EyeOff } from 'lucide-react';
import { login } from '../services/auth';
import { useNavigate } from 'react-router-dom';

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
        navigate('/setup-business');
        return;
      }

      console.log('Navigating to home page');
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
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
            <h1 className="text-3xl font-bold text-dark mb-2">Sign in</h1>
            <p className="text-gray">Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-600 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-dark mb-2">
                Your email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-light rounded-lg px-4 py-3 text-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-dark">
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm text-blue hover:text-blue-dark transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-light rounded-lg px-4 py-3 pr-12 text-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition-all"
                  placeholder="Enter your password"
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
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray text-sm">
              Don't have an account?{' '}
              <button className="text-blue hover:text-blue-dark font-medium hover:underline transition-colors">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Decorative Area with Instagram Icon and Falling Dots */}
      <div className="flex-1 relative overflow-hidden bg-white min-h-[400px] lg:min-h-screen">
        {/* Quadriculado */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            width: '100%',
            height: '100%',
          }}
        />

        {/* Bolas de Luz */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Instagram Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="instagram-icon-container group cursor-pointer"
            style={{
              transform: 'rotate(-25deg)',
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div
              className="relative transition-transform duration-700 ease-out group-hover:translate-x-8"
              style={{
                filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.2))',
              }}
            >
              {/* Instagram Official Icon - SVG */}
              <svg
                width="200"
                height="200"
                viewBox="0 0 256 256"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-transform duration-500 group-hover:scale-110"
                fill="none"
              >
                <rect
                  x="0"
                  y="0"
                  width="256"
                  height="256"
                  rx="55"
                  fill="white"
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

              {/* Glow effect */}
              <div
                className="absolute inset-0 -z-10 blur-3xl opacity-60 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(253,244,151,0.4) 0%, rgba(253,89,73,0.4) 30%, rgba(214,36,159,0.4) 60%, rgba(40,90,235,0.3) 100%)',
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-100px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }

        .animate-fall {
          animation: fall linear infinite;
        }

        .instagram-icon-container:hover {
          transform: rotate(-25deg) scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default LoginPage;