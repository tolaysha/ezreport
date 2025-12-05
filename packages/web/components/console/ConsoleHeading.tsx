'use client';

import { useColor } from '@/lib/colorContext';

interface ConsoleHeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
}

export function ConsoleHeading({
  children,
  level = 2,
  className = '',
}: ConsoleHeadingProps) {
  const { colorScheme } = useColor();
  const baseClasses = `${colorScheme.primary} font-mono`;
  const sizeClasses = {
    1: 'text-2xl md:text-3xl',
    2: 'text-xl',
    3: 'text-lg',
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag className={`${baseClasses} ${sizeClasses[level]} ${className}`}>
      {children}
    </Tag>
  );
}
