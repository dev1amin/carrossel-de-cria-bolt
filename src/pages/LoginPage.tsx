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
      <div className="flex-1 flex items-center justify-center p-8 bg-[#1a1d29] min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">Sign in</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                Your email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#252938] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Charles@cromel.co"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-400">
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Forget password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#252938] border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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
              className="w-full bg-[#5b6b8f] hover:bg-[#6a7ba0] text-white rounded-lg px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1a1d29] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <button className="text-white hover:underline font-medium">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Decorative Area with Instagram Icon */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-tr from-[#ff7eb9] via-[#ff65a3] via-[#6a82fb] to-[#fc9d9a] min-h-[400px] lg:min-h-screen">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {/* Stars/dots effect */}
          <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white/30 rounded-full"></div>
          <div className="absolute top-[25%] right-[25%] w-1.5 h-1.5 bg-white/40 rounded-full"></div>
          <div className="absolute top-[45%] left-[15%] w-1 h-1 bg-white/25 rounded-full"></div>
          <div className="absolute bottom-[30%] right-[20%] w-1 h-1 bg-white/35 rounded-full"></div>
          <div className="absolute bottom-[15%] left-[30%] w-1.5 h-1.5 bg-white/30 rounded-full"></div>

          {/* Glowing orbs */}
          <div
            className="absolute top-[30%] right-[15%] w-32 h-32 rounded-full blur-3xl opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
            }}
          ></div>

          <div
            className="absolute bottom-[25%] left-[20%] w-24 h-24 rounded-full blur-2xl opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            }}
          ></div>

          {/* Decorative lines */}
          <div className="absolute top-[20%] left-1/2 w-px h-48 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
          <div className="absolute bottom-[15%] right-[30%] w-px h-32 bg-gradient-to-b from-transparent via-white/15 to-transparent"></div>
        </div>

        {/* Instagram Icon - 3D effect with hover animation */}
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
                filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.3))',
              }}
            >
              {/* Instagram Icon with 3D effect */}
              <div className="relative">
                {/* Back layer for 3D depth */}
                <div className="absolute -inset-4 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl blur-xl"></div>

                {/* Main Instagram icon */}
                <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
                  <Instagram
                    className="w-32 h-32 text-transparent"
                    style={{
                      background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                    }}
                    strokeWidth={1.5}
                  />

                  {/* Glossy overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl pointer-events-none"></div>
                </div>

                {/* Glow effect */}
                <div
                  className="absolute inset-0 -z-10 blur-2xl opacity-50 rounded-3xl"
                  style={{
                    background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom right logo */}
        <div className="absolute bottom-8 right-8">
          <svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="white" opacity="0.8">
              connect
            </text>
          </svg>
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

        .instagram-icon-container:hover {
          transform: rotate(-25deg) scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
