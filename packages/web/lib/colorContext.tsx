'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ColorScheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  border: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  { 
    name: 'Matrix', 
    primary: 'text-green-500', 
    secondary: 'text-green-400', 
    accent: 'bg-green-500', 
    bg: 'bg-black',
    border: 'border-green-500'
  },
  { 
    name: 'Amber', 
    primary: 'text-amber-500', 
    secondary: 'text-amber-400', 
    accent: 'bg-amber-500', 
    bg: 'bg-black',
    border: 'border-amber-500'
  },
  { 
    name: 'Cyan', 
    primary: 'text-cyan-500', 
    secondary: 'text-cyan-400', 
    accent: 'bg-cyan-500', 
    bg: 'bg-black',
    border: 'border-cyan-500'
  },
  { 
    name: 'Purple', 
    primary: 'text-purple-500', 
    secondary: 'text-purple-400', 
    accent: 'bg-purple-500', 
    bg: 'bg-black',
    border: 'border-purple-500'
  },
  { 
    name: 'Red', 
    primary: 'text-red-500', 
    secondary: 'text-red-400', 
    accent: 'bg-red-500', 
    bg: 'bg-black',
    border: 'border-red-500'
  },
];

interface ColorContextType {
  colorScheme: ColorScheme;
  colorSchemeIndex: number;
  setColorSchemeIndex: (index: number) => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: ReactNode }) {
  const [colorSchemeIndex, setColorSchemeIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ezreport_color_scheme');
    if (saved) {
      const index = parseInt(saved, 10);
      if (!isNaN(index) && index >= 0 && index < COLOR_SCHEMES.length) {
        setColorSchemeIndex(index);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('ezreport_color_scheme', colorSchemeIndex.toString());
    }
  }, [colorSchemeIndex, mounted]);

  const colorScheme = COLOR_SCHEMES[colorSchemeIndex];

  return (
    <ColorContext.Provider value={{ colorScheme, colorSchemeIndex, setColorSchemeIndex }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColor() {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useColor must be used within a ColorProvider');
  }
  return context;
}


