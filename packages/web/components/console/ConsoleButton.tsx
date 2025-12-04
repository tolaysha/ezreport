'use client';

import { ReactNode } from 'react';
import { useColor } from '@/lib/colorContext';

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
  const { colorScheme } = useColor();
  const baseClasses = `border ${colorScheme.border} px-4 py-3 font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed`;
  
  const variantClasses = {
    primary: `${colorScheme.primary} hover:${colorScheme.accent} hover:text-black`,
    secondary: `${colorScheme.primary} opacity-70 hover:${colorScheme.accent}/20 hover:${colorScheme.secondary}`,
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
