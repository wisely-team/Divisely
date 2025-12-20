import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../UIComponents';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in. Please try again.';
      if (message === 'invalid_credentials') setError('Invalid email/username or password.');
      else if (message === 'email_not_verified') setError('Please verify your email first. Check your inbox for the verification code.');
      else if (message === 'missing_fields') setError('Email and password are required.');
      else setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Email or Username"
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com or username"
          autoComplete="username"
          className="h-11 bg-black border-gray-800 text-white placeholder-gray-500"
        />

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <Link to="/forgot-password" className="text-sm font-medium text-teal-600 hover:text-teal-500">
              Forgot your password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2.5 bg-black border border-gray-800 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors placeholder-gray-500"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}
        className={`w-full h-11 bg-teal-400 hover:bg-teal-500 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </Button>
    </form>
  );
};
