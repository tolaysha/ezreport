'use client';

import { ReactNode } from 'react';

interface ConsoleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
  type?: 'button' | 'submit';
}

export function ConsoleButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  type = 'button',
}: ConsoleButtonProps) {
  const baseClasses =
    'border border-green-500 px-4 py-3 font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'text-green-500 hover:bg-green-500 hover:text-black',
    secondary: 'text-green-500/70 hover:bg-green-500/20 hover:text-green-400',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

