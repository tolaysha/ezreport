'use client';

import { useState, useEffect } from 'react';
import { ping } from '@/lib/apiClient';

export function BackendStatus() {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>(
    'checking'
  );

  useEffect(() => {
    const checkBackend = async () => {
      const isOnline = await ping();
      setStatus(isOnline ? 'online' : 'offline');
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-green-500 font-mono text-sm mb-2">
      {status === 'checking' && '[BACKEND: CHECKING...]'}
      {status === 'online' && '[BACKEND: ONLINE]'}
      {status === 'offline' && (
        <span className="text-red-500">[BACKEND: OFFLINE]</span>
      )}
    </div>
  );
}

