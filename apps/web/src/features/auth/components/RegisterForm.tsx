'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/common/Input';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/common/Toast';
import { validateRegisterForm } from '@/lib/validation';

interface FormData {
  username: string;
  email: string;
  displayName: string;
  password: string;
  confirmPassword: string;
}

export function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, error } = useAuthStore();
  const { addToast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
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
    const validationErrors = validateRegisterForm(
      formData.username,
      formData.email,
      formData.password,
      formData.confirmPassword,
      formData.displayName
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!agreedToTerms) {
      addToast('You must agree to the terms to continue.', 'error');
      return;
    }

    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.displayName
      );
      addToast('Account created successfully!', 'success');
      router.push('/onboarding');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Registration failed.';
      addToast(message, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {error && (
        <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <Input
        label="Display Name"
        type="text"
        name="displayName"
        placeholder="John Doe"
        value={formData.displayName}
        onChange={handleChange}
        disabled={isLoading}
        error={errors.displayName}
        autoComplete="name"
      />

      <Input
        label="Username"
        type="text"
        name="username"
        placeholder="johndoe"
        value={formData.username}
        onChange={handleChange}
        disabled={isLoading}
        error={errors.username}
        helperText="1-15 characters, letters, numbers, and underscores only"
        autoComplete="username"
      />

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
          placeholder="Create a strong password"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading}
          error={errors.password}
          helperText="At least 8 characters with uppercase, lowercase, number, and special character"
          autoComplete="new-password"
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

      <div className="relative">
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirmPassword"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={isLoading}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((v) => !v)}
          className="absolute right-3 top-[38px] text-slate-400 hover:text-white transition-colors"
          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
        >
          {showConfirmPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>

      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-sky-400 cursor-pointer"
        />
        <span className="text-sm text-slate-400 leading-snug">
          By signing up, you agree to the{' '}
          <span className="text-sky-400">NemApp demo terms</span> and local browser storage policy.
        </span>
      </label>

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
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}
