import React, { useState } from 'react';
import { Wallet, Mail, Key, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button, Input } from '../components/UIComponents';
import { useApp } from '../context/AppContext';

type Step = 'email' | 'code' | 'newPassword' | 'success';

export const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useApp();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await authService.forgotPassword(email);
            setStep('code');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to process request.';
            if (message === 'email_not_found') {
                setError('No account found with this email address. Please check the email or sign up for a new account.');
            } else {
                setError(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (code.length !== 6) {
            setError('Please enter the 6-digit code.');
            return;
        }

        setStep('newPassword');
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            await authService.resetPassword(email, code, newPassword);
            // Auto-login after successful password reset
            await login(email, newPassword);
            // Clear password from memory
            setNewPassword('');
            setConfirmPassword('');
            // App.tsx will automatically redirect to redirectAfterLogin or dashboard
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to reset password.';
            if (message === 'invalid_code') {
                setError('Invalid code. Please try again.');
                setStep('code');
            } else if (message === 'code_expired') {
                setError('Code has expired. Please request a new one.');
                setStep('email');
            } else {
                setError(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'email':
                return (
                    <form className="space-y-4" onSubmit={handleEmailSubmit}>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <div className="relative mt-1">
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
                        </div>
                        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
                        <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : 'Send Reset Code'}
                        </Button>
                    </form>
                );

            case 'code':
                return (
                    <form className="space-y-4" onSubmit={handleCodeSubmit}>
                        <div className="text-center mb-4">
                            <div className="flex justify-center mb-4">
                                <Key className="w-16 h-16 text-teal-500" />
                            </div>
                            <p className="text-gray-600">
                                We sent a 6-digit code to<br />
                                <span className="font-semibold text-gray-900">{email}</span>
                            </p>
                        </div>
                        <div>
                            <Input
                                label="Verification Code"
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                placeholder="000000"
                                maxLength={6}
                                className="text-center text-lg tracking-widest font-mono"
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
                        <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                            Verify Code
                        </Button>
                        <button
                            type="button"
                            onClick={() => { setStep('email'); setCode(''); setError(null); }}
                            className="w-full text-sm text-teal-600 hover:text-teal-500"
                        >
                            Use a different email
                        </button>
                    </form>
                );

            case 'newPassword':
                return (
                    <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                        <div className="text-center mb-4">
                            <div className="flex justify-center mb-4">
                                <Lock className="w-16 h-16 text-teal-500" />
                            </div>
                            <p className="text-gray-600">Create your new password</p>
                        </div>
                        <div>
                            <Input
                                label="New Password"
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                required
                            />
                        </div>
                        <div>
                            <Input
                                label="Confirm Password"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Repeat your password"
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
                        <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isSubmitting}>
                            {isSubmitting ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </form>
                );

            case 'success':
                return (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Password Reset!</h2>
                        <p className="text-gray-600">Your password has been successfully reset.</p>
                        <Button onClick={() => navigate('/login')} className="w-full bg-teal-600 hover:bg-teal-700">
                            Go to Login
                        </Button>
                    </div>
                );
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
                    <h2 className="text-4xl font-bold mb-4">Reset your password</h2>
                    <p className="text-teal-100 text-lg leading-relaxed">
                        {step === 'email' && "Enter your email to receive a reset code."}
                        {step === 'code' && "Enter the code we sent to your email."}
                        {step === 'newPassword' && "Create a strong new password."}
                        {step === 'success' && "You are all set!"}
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
                        {step !== 'success' && (
                            <>
                                <h1 className="text-3xl font-bold text-gray-900">Reset your password</h1>
                                <p className="mt-2 text-gray-500">
                                    {step === 'email' && "We will email you a code to reset your password."}
                                    {step === 'code' && "Check your inbox for the verification code."}
                                    {step === 'newPassword' && "Choose a secure new password."}
                                </p>
                            </>
                        )}
                    </div>

                    {renderStep()}

                    {step !== 'success' && (
                        <div className="mt-4 text-center text-sm text-gray-500">
                            <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-500">
                                Back to login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
