import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';
import { Input, Button } from '../components/UIComponents';
import { authService } from '../services/authService';

type SignUpStep = 'form' | 'verification' | 'success';

export const SignUpPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<SignUpStep>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authService.register(email, password, username);
      setStep('verification');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create account. Please try again.';
      if (message === 'email_exists') setError('Email already exists.');
      else if (message === 'username_exists') setError('Username already exists.');
      else if (message === 'missing_fields') setError('Please fill all fields.');
      else setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authService.verifyEmail(email, verificationCode);
      setStep('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      if (message === 'invalid_code') setError('Invalid verification code.');
      else if (message === 'code_expired') setError('Verification code has expired. Please request a new one.');
      else setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setIsSubmitting(true);
    setResendTimer(60);

    try {
      await authService.resendVerificationCode(email);
      setVerificationCode('');
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not resend verification code.';
      setError(message);
      setResendTimer(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormStep = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="johndoe"
          className="h-11 bg-black border-gray-800 text-white placeholder-gray-500"
          required
        />
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-11 bg-black border-gray-800 text-white placeholder-gray-500"
          required
        />

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full px-3 py-2.5 bg-black border border-gray-800 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors placeholder-gray-500"
              placeholder="Choose a strong password"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
        {isSubmitting ? 'Creating...' : 'Create Account'}
      </Button>
    </form>
  );

  const renderVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Mail className="w-16 h-16 text-teal-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
        <p className="text-gray-600">
          We've sent a verification code to<br />
          <span className="font-semibold text-gray-900">{email}</span>
        </p>
      </div>

      <form onSubmit={handleVerifyEmail} className="space-y-6">
        <Input
          label="Verification Code"
          value={verificationCode}
          onChange={e => setVerificationCode(e.target.value.toUpperCase())}
          placeholder="000000"
          maxLength={6}
          className="h-11 bg-black border-gray-800 text-white placeholder-gray-500 text-center text-lg tracking-widest font-mono"
          required
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting || verificationCode.length < 6}
          className={`w-full h-11 bg-teal-400 hover:bg-teal-500 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all ${(isSubmitting || verificationCode.length < 6) ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Verifying...' : 'Verify Email'}
        </Button>
      </form>

      <div className="text-center text-sm">
        <p className="text-gray-600 mb-3">Didn't receive the code?</p>
        <button
          onClick={handleResendCode}
          disabled={resendTimer > 0 || isSubmitting}
          className={`font-semibold ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-teal-600 hover:text-teal-500'}`}
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
        </button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="w-16 h-16 text-green-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account created successfully!</h2>
        <p className="text-gray-600">Your email has been verified. You can now log in to your account.</p>
      </div>
      <Button
        onClick={() => navigate('/login')}
        className="w-full h-11 bg-teal-400 hover:bg-teal-500 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all"
      >
        Go to Login
      </Button>
    </div>
  );

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
            {step === 'form' && (
              <>
                <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
                <p className="mt-2 text-gray-500">Join Divisely and start tracking shared expenses.</p>
              </>
            )}
            {step === 'verification' && (
              <p className="mt-2 text-gray-500">Step 2 of 2</p>
            )}
            {step === 'success' && (
              <p className="mt-2 text-gray-500">All set!</p>
            )}
          </div>

          {step === 'form' && renderFormStep()}
          {step === 'verification' && renderVerificationStep()}
          {step === 'success' && renderSuccessStep()}

          {step === 'form' && (
            <div className="text-center text-sm">
              <span className="text-gray-500">Already have an account? </span>
              <button
                className="font-semibold text-teal-600 hover:text-teal-500"
                onClick={() => navigate('/login')}
              >
                Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
