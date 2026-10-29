'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { UtensilsCrossed, Lock, Mail, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await login(email, password);
      if (!res?.success) {
        setErrorMessage(res?.error || 'Invalid manager credentials.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Smart Mess Management
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Shared Bachelor Mess Financial & Meal Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Mess Manager Authentication</h3>
              <p className="text-2xs text-slate-400">Strict manager-only access control</p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Manager Email"
              type="email"
              icon={Mail}
              placeholder="manager@mess.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 shadow-sm"
                isLoading={isLoading}
              >
                Sign In to Dashboard
              </Button>
            </div>
          </form>

          {/* Secure Initialization Note */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-2xs text-slate-400 leading-relaxed">
              Public self-registration is disabled for financial integrity. To seed or reset manager credentials, execute{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">
                npm run seed
              </code>{' '}
              in backend directory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
