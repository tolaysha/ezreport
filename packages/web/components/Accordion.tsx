'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-green-500 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-black text-green-500 hover:bg-green-950 transition-colors font-mono"
      >
        <span className="text-left">{title}</span>
        <ChevronRight
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-black text-green-500 border-t border-green-500">
          {children}
        </div>
      )}
    </div>
  );
}
