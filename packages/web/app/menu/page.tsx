'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useColor, COLOR_SCHEMES } from '@/lib/colorContext';

interface MenuItem {
  id: string;
  label: string;
  action: () => void;
}

export default function MenuPage() {
  const router = useRouter();
  const { colorScheme, colorSchemeIndex, setColorSchemeIndex } = useColor();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [tempColorIndex, setTempColorIndex] = useState(colorSchemeIndex);

  const menuItems: MenuItem[] = [
    {
      id: 'start',
      label: 'start.exe',
      action: () => router.push('/data'),
    },
    {
      id: 'settings',
      label: 'settings.exe',
      action: () => {
        setTempColorIndex(colorSchemeIndex);
        setShowSettings(true);
      },
    },
    {
      id: 'project',
      label: 'force_delete_project.exe',
      action: () => router.push('/project'),
    },
  ];

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showSettings) {
      // Settings navigation
      if (e.key === 'ArrowLeft') {
        setTempColorIndex(prev => (prev - 1 + COLOR_SCHEMES.length) % COLOR_SCHEMES.length);
      } else if (e.key === 'ArrowRight') {
        setTempColorIndex(prev => (prev + 1) % COLOR_SCHEMES.length);
      } else if (e.key === 'Enter') {
        setColorSchemeIndex(tempColorIndex);
        setShowSettings(false);
      } else if (e.key === 'Escape') {
        setTempColorIndex(colorSchemeIndex);
        setShowSettings(false);
      }
      return;
    }

    // Main menu navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + menuItems.length) % menuItems.length);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % menuItems.length);
    } else if (e.key === 'Enter') {
      menuItems[selectedIndex].action();
    }
  }, [selectedIndex, menuItems, showSettings, tempColorIndex, colorSchemeIndex, setColorSchemeIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Use temp color in settings mode for preview
  const displayScheme = showSettings ? COLOR_SCHEMES[tempColorIndex] : colorScheme;

  return (
    <div className={`min-h-screen ${displayScheme.bg} flex flex-col`}>
      {/* BIOS Header */}
      <div className={`border-b-2 border-double ${displayScheme.border} p-4`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className={`font-mono ${displayScheme.primary}`}>
            <span className="text-xl font-bold">ezreport BIOS</span>
            <span className="ml-4 text-sm opacity-70">v1.0.0</span>
          </div>
          <div className={`font-mono text-sm ${displayScheme.primary} opacity-70`}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className={`w-full max-w-2xl border-2 ${displayScheme.border} shadow-2xl`}>
          {/* Menu Title */}
          <div className={`${displayScheme.accent} text-black px-4 py-2 font-mono font-bold text-center`}>
            ╔══════════════════════════════════════╗
          </div>
          <div className={`${displayScheme.accent} text-black px-4 py-1 font-mono font-bold text-center`}>
            ║         MAIN MENU                    ║
          </div>
          <div className={`${displayScheme.accent} text-black px-4 py-2 font-mono font-bold text-center`}>
            ╚══════════════════════════════════════╝
          </div>

          {/* Menu Items */}
          <div className="p-6 space-y-2">
            {!showSettings ? (
              <>
                {menuItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`font-mono text-lg py-2 px-4 cursor-pointer transition-all duration-100 ${
                      index === selectedIndex
                        ? `${displayScheme.accent} text-black font-bold`
                        : `${displayScheme.primary} hover:opacity-80`
                    }`}
                    onClick={() => {
                      setSelectedIndex(index);
                      item.action();
                    }}
                  >
                    <span className="mr-4">
                      {index === selectedIndex ? (showCursor ? '►' : ' ') : ' '}
                    </span>
                    {item.label}
                  </div>
                ))}
              </>
            ) : (
              /* Settings Panel */
              <div className="space-y-6">
                <div className={`font-mono ${displayScheme.primary} text-center text-xl mb-8`}>
                  ═══ COLOR SETTINGS ═══
                </div>
                
                <div className={`font-mono ${displayScheme.primary} text-center`}>
                  <div className="mb-4">Select Color Scheme:</div>
                  <div className="flex items-center justify-center gap-4">
                    <span className={`text-2xl ${displayScheme.secondary}`}>◄</span>
                    <span className={`text-xl font-bold ${displayScheme.secondary} min-w-[120px]`}>
                      {displayScheme.name}
                    </span>
                    <span className={`text-2xl ${displayScheme.secondary}`}>►</span>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="flex justify-center gap-2 mt-6">
                  {COLOR_SCHEMES.map((scheme, index) => (
                    <div
                      key={scheme.name}
                      className={`w-8 h-8 ${scheme.accent} ${
                        index === tempColorIndex ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''
                      }`}
                    />
                  ))}
                </div>

                <div className={`font-mono ${displayScheme.primary} opacity-60 text-center text-sm mt-8`}>
                  ← → to change | ENTER to save | ESC to cancel
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`border-t ${displayScheme.border} p-4`}>
            <div className={`font-mono text-sm ${displayScheme.primary} opacity-60 text-center`}>
              {showSettings ? (
                'Use ← → to change color | ENTER to save'
              ) : (
                '↑ ↓ to navigate | ENTER to select'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BIOS Footer */}
      <div className={`border-t-2 border-double ${displayScheme.border} p-4`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className={`font-mono text-sm ${displayScheme.primary} opacity-70`}>
            F1: Help | F10: Save & Exit | ESC: Exit
          </div>
          <div className={`font-mono text-sm ${displayScheme.primary} opacity-70`}>
            CPU: Intel Celeron 300MHz | RAM: 64MB SDRAM
          </div>
        </div>
      </div>
    </div>
  );
}
