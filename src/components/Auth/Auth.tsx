import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { track } from '../../services/analyticsService';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot-password'>('signin');

  // Check for auth errors in URL (expired link, etc.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error_description');
    if (error) {
      setMessage('Error: ' + error.replace(/\+/g, ' '));
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const switchMode = (next: 'signin' | 'signup' | 'forgot-password') => {
    setMode(next);
    setMessage('');
    setPassword('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profile`,
    });

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('✓ Check your email for a password reset link.');
    }

    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/care-calendar`,
        },
      });

      if (error) {
        setMessage('Error: ' + error.message);
      } else if (data.user?.identities?.length === 0) {
        // User already exists but not confirmed
        setMessage(
          'Error: This email is already registered. Check your email for confirmation link, or try signing in if already confirmed.'
        );
      } else {
        track('signup_completed');
        setMessage('✓ Account created! Signing you in...');
        // Auto sign in after signup
        setTimeout(() => window.location.reload(), 1000);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('Email not confirmed')
        ) {
          setMessage(
            'Error: Invalid credentials or email not confirmed yet. Check your inbox for confirmation email.'
          );
        } else {
          setMessage('Error: ' + error.message);
        }
      } else {
        setMessage('✓ Signed in successfully!');
        setTimeout(() => window.location.reload(), 500);
      }
    }

    setLoading(false);
  };

  // Forgot password view
  if (mode === 'forgot-password') {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-card rounded-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-muted">Enter your email and we'll send you a reset link.</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-divider rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent bg-card-elevated text-white"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-accent hover:bg-accent-dim disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded-xl text-sm ${message.startsWith('✓') ? 'bg-accent/10 text-accent' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}
            >
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => switchMode('signin')}
              className="text-sm text-accent hover:underline"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-card rounded-xl p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            {mode === 'signin' ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p className="text-muted">
            {mode === 'signin'
              ? 'Sign in to access your care tasks'
              : 'Create an account to start tracking care tasks'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-divider rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent bg-card-elevated text-white"
              required
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-secondary">
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => switchMode('forgot-password')}
                  className="text-xs text-accent hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-divider rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent bg-card-elevated text-white"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-accent hover:bg-accent-dim disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-sm ${message.startsWith('✓') ? 'bg-accent/10 text-accent' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-sm text-accent hover:underline"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-divider">
          <p className="text-xs text-muted text-center">Password must be at least 6 characters</p>
        </div>
      </div>
    </div>
  );
}
