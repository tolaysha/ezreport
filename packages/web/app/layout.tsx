import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EzReport Web Console',
  description: 'Sprint Report Workflow Control Panel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-black min-h-screen font-mono">
        {children}
      </body>
    </html>
  );
}
