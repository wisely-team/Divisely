import React, { useState } from 'react';
import { Wallet, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button, Card } from '../components/UIComponents';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const resp = await authService.forgotPassword(email);
      setStatus(resp.message || 'Reset instructions sent.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to process request right now.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      <div className="hidden lg:flex w-1/2 bg-[#3f6e69] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/90 to-teal-800/50" />
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
          <h2 className="text-4xl font-bold mb-4">Forgot your password?</h2>
          <p className="text-teal-100 text-lg leading-relaxed">
            Enter your email to receive reset instructions. We keep it secure and never share your address.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start lg:hidden mb-6">
              <div className="flex items-center gap-2 text-teal-600">
                <Wallet className="w-8 h-8" />
                <span className="text-2xl font-bold">Divisely</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Reset your password</h1>
            <p className="mt-2 text-gray-500">We will email you instructions to reset your password.</p>
          </div>

          
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  placeholder="you@example.com"
                  required
                />
                <Mail className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
              </div>
              {status && <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{status}</p>}
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-500">
                Back to login
              </Link>
            </div>
          
        </div>
      </div>
    </div>
  );
};
