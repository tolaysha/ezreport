'use client';

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
  
  return (
    <div className="flex items-center gap-2 mb-2">
      <Link href="/menu" className="group font-bold tracking-tight">
        <span className={`${colorScheme.primary} group-hover:text-white transition-colors`}>ez</span>
        <span className={`text-white group-hover:${colorScheme.primary} transition-colors`}>report</span>
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          <span className={`${colorScheme.primary} opacity-50`}>/</span>
          {item.href ? (
            <Link href={item.href} className={`${colorScheme.primary} font-mono text-sm hover:${colorScheme.secondary} transition-colors`}>
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
