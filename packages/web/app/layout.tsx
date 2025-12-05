import './globals.css';
import type { Metadata } from 'next';
import { ColorProvider } from '@/lib/colorContext';

export const metadata: Metadata = {
  title: 'EzReport Web Console',
  description: 'Sprint Report Workflow Control Panel',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-black min-h-screen font-mono">
        <ColorProvider>
          {children}
        </ColorProvider>
      </body>
    </html>
  );
}
