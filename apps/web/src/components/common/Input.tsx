'use client';

import React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-2xl border px-4 py-3.5
            bg-slate-950/78 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
            border-white/12 placeholder:text-slate-500
            focus:border-sky-400/70 focus:outline-none focus:ring-4 focus:ring-sky-400/15
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${error ? 'border-red-400/90 focus:border-red-400 focus:ring-red-400/15' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-300">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm leading-6 text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
