'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConsolePanel, ConsoleHeading, BackendStatus } from '@/components/console';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === '1') router.push('/data');
      if (e.key === '2') router.push('/analyse');
      if (e.key === '3') router.push('/report');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-green-500 pb-4">
          <ConsoleHeading level={1} className="mb-2">
            EzReport Web Console
          </ConsoleHeading>
          <p className="text-green-500 font-mono text-sm opacity-80">
            Sprint Report Workflow Control Panel
          </p>
        </div>

        {/* Backend Status */}
        <ConsolePanel className="mb-8">
          <BackendStatus />
        </ConsolePanel>

        {/* Navigation Menu */}
        <ConsolePanel>
          <ConsoleHeading level={2} className="mb-6">
            [ WORKFLOW STAGES ]
          </ConsoleHeading>

          <div className="space-y-4">
            <NavItem
              href="/data"
              number={1}
              title="Сбор данных"
              description="Сбор данных из Jira, оценка качества и полноты информации"
            />

            <NavItem
              href="/analyse"
              number={2}
              title="Анализ и генерация"
              description="Пошаговая генерация каждого блока с просмотром промптов и входных данных"
            />

            <NavItem
              href="/report"
              number={3}
              title="Финальный отчёт"
              description="Готовый отчёт для партнёров в формате Markdown"
            />
          </div>
        </ConsolePanel>

        {/* Quick Info */}
        <div className="mt-8 text-green-500/60 font-mono text-xs">
          <div className="mb-1">[ KEYBOARD SHORTCUTS ]</div>
          <div>Press number keys (1, 2, 3) to navigate to stages</div>
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  number: number;
  title: string;
  description: string;
}

function NavItem({ href, number, title, description }: NavItemProps) {
  return (
    <Link
      href={href}
      className="block border border-green-500 p-4 hover:bg-green-500 hover:text-black transition-colors group"
    >
      <div className="flex items-start gap-4">
        <div className="text-green-500 group-hover:text-black font-mono text-xl">
          [{number}]
        </div>
        <div className="flex-1">
          <div className="font-mono text-lg text-green-500 group-hover:text-black mb-1">
            {title}
          </div>
          <div className="font-mono text-sm text-green-500/70 group-hover:text-black/70">
            {description}
          </div>
        </div>
        <div className="text-green-500 group-hover:text-black font-mono">
          →
        </div>
      </div>
    </Link>
  );
}
