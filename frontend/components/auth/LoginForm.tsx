import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button, Input } from '../UIComponents';

interface LoginFormProps {
  onSubmit: (email: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('kevin@divisely.com');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-11 bg-black border-gray-800 text-white placeholder-gray-500"
        />

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <a href="#" className="text-sm font-medium text-teal-600 hover:text-teal-500">
              Forgot Password?
            </a>
          </div>
          <div className="relative">
            <input
              type="password"
              className="w-full px-3 py-2.5 bg-black border border-gray-800 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors placeholder-gray-500"
              placeholder="Enter your password"
              defaultValue="password123"
            />
            <Eye className="w-5 h-5 text-gray-500 absolute right-3 top-3 cursor-pointer" />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-teal-400 hover:bg-teal-500 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all"
      >
        Sign In
      </Button>
    </form>
  );
};
