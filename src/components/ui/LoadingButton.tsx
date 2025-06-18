'use client';

import React, { ButtonHTMLAttributes } from 'react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
}

export default function LoadingButton({
  isLoading,
  loadingText = 'Loading...',
  children,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: LoadingButtonProps) {
  // Define variant styles
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700',
    secondary: 'bg-gray-600 hover:bg-gray-700',
    success: 'bg-green-600 hover:bg-green-700',
    danger: 'bg-red-600 hover:bg-red-700',
  };

  const baseStyle = 'px-6 py-3 rounded-lg font-medium text-lg transition-colors';
  const disabledStyle = 'bg-gray-600 cursor-not-allowed';
  
  const buttonStyle = `${baseStyle} ${
    disabled || isLoading ? disabledStyle : variantStyles[variant]
  } ${className}`;

  return (
    <button 
      className={buttonStyle} 
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg 
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
