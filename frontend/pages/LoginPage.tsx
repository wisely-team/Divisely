import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Mail, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LoginForm } from '../components/auth/LoginForm';
import { Button, Input } from '../components/UIComponents';
import { authService } from '../services/authService';

type LoginStep = 'form' | 'verification';

export const LoginPage = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<LoginStep>('form');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const handleLoginSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (message === 'email_not_verified') {
        // Switch to verification step and save password
        setPendingEmail(email);
        setPendingPassword(password);
        setStep('verification');
        setError('');
      } else {
        throw err;
      }
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authService.verifyEmail(pendingEmail, verificationCode);
      // Email verified successfully, now automatically login
      await login(pendingEmail, pendingPassword);
      // Clear state
      setStep('form');
      setPendingEmail('');
      setPendingPassword('');
      setVerificationCode('');
      // Redirect to dashboard
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      } else {
        navigate('/dashboard');
      }
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
      await authService.resendVerificationCode(pendingEmail);
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

  const renderVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Mail className="w-16 h-16 text-teal-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
        <p className="text-gray-600">
          Please verify your email before logging in.<br />
          <span className="font-semibold text-gray-900">{pendingEmail}</span>
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
        <p className="text-gray-500 mt-4 text-xs">
          <button
            onClick={() => {
              setStep('form');
              setPendingEmail('');
              setPendingPassword('');
              setVerificationCode('');
              setError('');
            }}
            className="text-teal-600 hover:text-teal-500"
          >
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex w-1/2 bg-[#3f6e69] relative overflow-hidden items-center justify-center">
        {/* Abstract Overlay/Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/90 to-teal-800/50"></div>

        {/* Main Image */}
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
          <h2 className="text-4xl font-bold mb-4">Split expenses, share moments.</h2>
          <p className="text-teal-100 text-lg leading-relaxed">
            Track balances, settle debts, and manage shared costs effortlessly with your friends and family.
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
                <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
                <p className="mt-2 text-gray-500">Enter your credentials to access your account.</p>
              </>
            )}
            {step === 'verification' && (
              <p className="mt-2 text-gray-500">Email verification required</p>
            )}
          </div>

          {step === 'form' && (
            <>
              <LoginForm onSubmit={handleLoginSubmit} />

              <div className="text-center text-sm">
                <span className="text-gray-500">Don't have an account? </span>
                <Link to="/signup" className="font-semibold text-teal-600 hover:text-teal-500">
                  Sign up
                </Link>
              </div>
            </>
          )}

          {step === 'verification' && renderVerificationStep()}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
