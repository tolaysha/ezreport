'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

const CORRECT_PASSWORD = 'unimatch';

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

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
        router.push('/data');
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

  return (
    <div 
      className="min-h-screen bg-black flex items-center justify-center p-4"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="text-center">
        {/* Logo */}
        <h1 
          className={`text-6xl md:text-8xl font-bold mb-16 tracking-tight transition-all duration-500 ${
            success ? 'text-green-400' : error ? 'text-red-500' : 'text-zinc-700'
          }`}
          style={{
            textShadow: success
              ? '0 0 20px rgba(34, 197, 94, 1), 0 0 40px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.6), 0 0 100px rgba(34, 197, 94, 0.4)'
              : error
              ? '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)'
              : 'none',
          }}
        >
          ezreport
        </h1>

        {/* Terminal input */}
        <div 
          className={`font-mono text-lg transition-all duration-300 ${
            error ? 'animate-shake' : ''
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span className={`${error ? 'text-red-500' : 'text-green-500'} transition-colors`}>
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
                  error ? 'text-red-400' : 'text-green-400'
                }`}
                autoComplete="off"
                spellCheck={false}
                disabled={success}
              />
              {/* Block cursor */}
              <span 
                className={`absolute top-0 transition-all ${
                  error ? 'text-red-500' : 'text-green-500'
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
            success ? 'text-green-400' : error ? 'text-red-500' : 'text-zinc-600'
          }`}
        >
          {success ? 'access granted' : error ? 'access denied' : 'enter access code'}
        </p>
      </div>

      {/* Background glow */}
      <div 
        className={`fixed inset-0 pointer-events-none transition-opacity duration-500 ${
          success ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, transparent 50%)',
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
    </div>
  );
}
