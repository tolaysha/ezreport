'use client';

import { ReactNode } from 'react';

interface ConsolePanelProps {
  children: ReactNode;
  className?: string;
}

export function ConsolePanel({ children, className = '' }: ConsolePanelProps) {
  return (
    <div
      className={`border border-green-500 p-6 bg-black shadow-[0_0_10px_rgba(0,255,0,0.3)] ${className}`}
    >
      {children}
    </div>
  );
}

