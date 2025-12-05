'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useColor } from '@/lib/colorContext';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const { colorScheme } = useColor();
  const [logoHovered, setLogoHovered] = useState(false);
  
  return (
    <div className="flex items-center gap-2 mb-2">
      <Link 
        href="/menu" 
        className="font-bold tracking-tight"
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => setLogoHovered(false)}
      >
        <span className={`transition-colors duration-300 ${logoHovered ? 'text-white' : colorScheme.primary}`}>ez</span>
        <span className={`transition-colors duration-300 ${logoHovered ? colorScheme.primary : 'text-white'}`}>report</span>
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          <span className={`${colorScheme.primary} opacity-50`}>/</span>
          {item.href ? (
            <Link href={item.href} className={`${colorScheme.primary} font-mono text-sm hover:brightness-125 transition-all`}>
              {item.label}
            </Link>
          ) : (
            <span className={`${colorScheme.primary} font-mono text-sm`}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
