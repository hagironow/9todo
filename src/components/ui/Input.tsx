'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={id}
            className="text-[var(--fs-tag)] font-medium text-[var(--foreground)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={[
            'w-full h-9 px-3 rounded-[var(--radius)]',
            'bg-[var(--background)] text-[var(--foreground)]',
            'border-none',
            'text-[var(--fs-item)] placeholder:text-[var(--muted-foreground)]',
            'outline-none transition-all duration-150',
            'shadow-[inset_0_0_0_1px_var(--input)] focus:shadow-[inset_0_0_0_1.5px_var(--foreground)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-[var(--destructive)]' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && (
          <span className="text-[var(--fs-tag)] text-[var(--destructive)]">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
