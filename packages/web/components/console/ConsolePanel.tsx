'use client';

import { ReactNode } from 'react';

interface ConsolePanelProps {
  children: ReactNode;
  className?: string;
}

export function ConsolePanel({ children, className = '' }: ConsolePanelProps) {
  return (
    <div className={`p-6 bg-black ${className}`}>
      {children}
    </div>
  );
}

