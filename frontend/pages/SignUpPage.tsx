import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Github, Eye } from 'lucide-react';
import { Input, Button } from '../components/UIComponents';

export const SignUpPage = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Backend integration will be added later
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex w-1/2 bg-[#3f6e69] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/90 to-teal-800/50"></div>

        <img
          src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop"
          alt="Workspace"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
        />

        <div className="relative z-10 text-white p-12 max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight">Divisely</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">Create and share effortlessly.</h2>
          <p className="text-teal-100 text-lg leading-relaxed">
            Start splitting expenses with friends and keep every balance transparent from day one.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start lg:hidden mb-6">
              <div className="flex items-center gap-2 text-teal-600">
                <Wallet className="w-8 h-8" />
                <span className="text-2xl font-bold">Divisely</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
            <p className="mt-2 text-gray-500">Join Divisely and start tracking shared expenses.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Display Name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Ali Veli"
                className="h-11 bg-black border-gray-800 text-white placeholder-gray-500"
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 bg-black border-gray-800 text-white placeholder-gray-500"
              />

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    className="w-full px-3 py-2.5 bg-black border border-gray-800 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors placeholder-gray-500"
                    placeholder="Choose a strong password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <Eye className="w-5 h-5 text-gray-500 absolute right-3 top-3 cursor-pointer" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-teal-400 hover:bg-teal-500 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all"
            >
              Create Account
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <button
              className="font-semibold text-teal-600 hover:text-teal-500"
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700">
              <Github className="w-5 h-5" />
              GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
