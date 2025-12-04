'use client';

import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Link href="/" className="group font-bold tracking-tight">
        <span className="text-green-500 group-hover:text-white transition-colors">ez</span>
        <span className="text-white group-hover:text-green-500 transition-colors">report</span>
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          <span className="text-green-500/50">/</span>
          {item.href ? (
            <Link href={item.href} className="text-green-500 font-mono text-sm hover:text-green-300 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-green-500 font-mono text-sm">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

