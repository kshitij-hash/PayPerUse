'use client';

import React, { ReactNode } from 'react';

interface StatusMessageProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string | ReactNode | null;
  className?: string;
}

export default function StatusMessage({ 
  type, 
  message, 
  className = '' 
}: StatusMessageProps) {
  if (!message) return null;

  const styles = {
    error: {
      container: 'bg-red-900/30 border border-red-500 rounded-lg p-4',
      text: 'text-red-400'
    },
    success: {
      container: 'bg-green-900/30 border border-green-500 rounded-lg p-4',
      text: 'text-green-400'
    },
    warning: {
      container: 'bg-yellow-900/20 border border-yellow-700 rounded-lg p-4',
      text: 'text-yellow-400'
    },
    info: {
      container: 'bg-blue-900/20 border border-blue-500 rounded-lg p-4',
      text: 'text-blue-400'
    }
  };

  return (
    <div className={`${styles[type].container} ${className}`}>
      <p className={styles[type].text}>{message}</p>
    </div>
  );
}
