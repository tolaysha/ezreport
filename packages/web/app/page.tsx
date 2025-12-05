'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useColor } from '@/lib/colorContext';

const CORRECT_PASSWORD = 'unimatch';

// Map color scheme to RGB values for glow effects
const colorToRgb: Record<string, string> = {
  'text-green-500': '34, 197, 94',
  'text-amber-500': '245, 158, 11',
  'text-cyan-500': '6, 182, 212',
  'text-purple-500': '168, 85, 247',
  'text-red-500': '239, 68, 68',
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colorScheme } = useColor();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [showBlackOverlay, setShowBlackOverlay] = useState(false);
  const [fadeOutOverlay, setFadeOutOverlay] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const primaryRgb = colorToRgb[colorScheme.primary] || '34, 197, 94';

  // Handle fromDelete parameter - show black screen that fades out
  useEffect(() => {
    if (searchParams.get('fromDelete') === 'true') {
      setShowBlackOverlay(true);
      // Start fade out after a small delay
      setTimeout(() => {
        setFadeOutOverlay(true);
      }, 100);
      // Remove overlay after fade completes
      setTimeout(() => {
        setShowBlackOverlay(false);
        // Clean up URL
        router.replace('/');
      }, 2100);
    }
  }, [searchParams, router]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!input.trim()) return;

    if (input.trim().toLowerCase() === CORRECT_PASSWORD) {
      setSuccess(true);
      setError(false);
      setTimeout(() => {
        router.push('/menu');
      }, 800);
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 1000);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Get logo colors based on state and hover
  const getEzColor = () => {
    if (success) return colorScheme.secondary;
    if (error) return 'text-red-500';
    return logoHovered ? 'text-zinc-700' : colorScheme.primary.replace('-500', '-800');
  };
  
  const getReportColor = () => {
    if (success) return colorScheme.secondary;
    if (error) return 'text-red-500';
    return logoHovered ? colorScheme.primary.replace('-500', '-800') : 'text-zinc-700';
  };

  return (
    <div 
      className={`min-h-screen ${colorScheme.bg} flex items-center justify-center p-4`}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="text-center">
        {/* Logo */}
        <h1 
          className="text-6xl md:text-8xl font-bold mb-16 tracking-tight cursor-default"
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
          style={{
            textShadow: success
              ? `0 0 20px rgba(${primaryRgb}, 1), 0 0 40px rgba(${primaryRgb}, 0.8), 0 0 60px rgba(${primaryRgb}, 0.6), 0 0 100px rgba(${primaryRgb}, 0.4)`
              : error
              ? '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)'
              : 'none',
          }}
        >
          <span className={`transition-colors duration-500 ${getEzColor()}`}>ez</span>
          <span className={`transition-colors duration-500 ${getReportColor()}`}>report</span>
        </h1>

        {/* Terminal input */}
        <div 
          className={`font-mono text-lg transition-all duration-300 ${
            error ? 'animate-shake' : ''
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span className={`${error ? 'text-red-500' : colorScheme.primary} transition-colors`}>
              {'>'}
            </span>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`bg-transparent outline-none caret-transparent font-mono text-lg min-w-[180px] transition-colors ${
                  error ? 'text-red-400' : colorScheme.secondary
                }`}
                autoComplete="off"
                spellCheck={false}
                disabled={success}
              />
              {/* Block cursor */}
              <span 
                className={`absolute top-0 transition-all ${
                  error ? 'text-red-500' : colorScheme.primary
                } ${showCursor && !success ? 'opacity-100' : 'opacity-0'}`}
                style={{ left: `${input.length}ch` }}
              >
                █
              </span>
            </div>
          </div>
        </div>

        {/* Status text */}
        <p 
          className={`mt-8 text-sm font-mono transition-all duration-300 ${
            success ? colorScheme.secondary : error ? 'text-red-500' : 'text-zinc-600'
          }`}
        >
          {success ? 'access granted' : error ? 'access denied' : 'enter access code'}
        </p>

        {/* Slogan */}
        <p className="mt-16 text-sm font-bold text-green-600/70 tracking-widest uppercase">
          Stop Reporting. Start Executing.
        </p>
      </div>

      {/* Background glow */}
      <div 
        className={`fixed inset-0 pointer-events-none transition-opacity duration-500 ${
          success ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `radial-gradient(circle at center, rgba(${primaryRgb}, 0.15) 0%, transparent 50%)`,
        }}
      />

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>

      {/* Black overlay for fromDelete transition */}
      {showBlackOverlay && (
        <div 
          className={`fixed inset-0 bg-black z-50 transition-opacity duration-[2000ms] ${
            fadeOutOverlay ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
    </div>
  );
}
