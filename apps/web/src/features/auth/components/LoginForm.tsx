'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/common/Input';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/common/Toast';
import { validateLoginForm } from '@/lib/validation';
import { DEMO_CREDENTIALS } from '@/mocks/auth';

interface FormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const { addToast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationErrors = validateLoginForm(
      formData.email,
      formData.password
    );
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await login(formData.email, formData.password);
      addToast('Login successful!', 'success');
      router.push('/home');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      addToast(message, 'error');
    }
  };

  const handleDemoLogin = async () => {
    try {
      await login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
      addToast('Demo login successful!', 'success');
      router.push('/home');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Demo login failed.';
      addToast(message, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        name="email"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange}
        disabled={isLoading}
        error={errors.email}
        autoComplete="email"
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading}
          error={errors.password}
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-[38px] text-slate-400 hover:text-white transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="
          w-full rounded-full bg-primary px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.24em] text-slate-950
          hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50
          transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_20px_45px_rgba(29,155,240,0.28)]
        "
      >
        {isLoading && <span className="animate-spin">⏳</span>}
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-slate-900 px-3 text-slate-500">
            or
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={isLoading}
        className="
          w-full rounded-full border border-white/12 bg-white/5 px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.2em]
          text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200
        "
      >
        Demo Login
      </button>

      <p className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-center text-xs text-slate-400">
        Demo credentials: {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
      </p>
    </form>
  );
}
