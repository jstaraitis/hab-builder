import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Use elevated variant for modals / popovers layered on top of cards */
  variant?: 'default' | 'elevated';
  onClick?: () => void;
}

/**
 * Base card container using the app's dark design system.
 * Replaces scattered `bg-white dark:bg-gray-800 rounded-lg` patterns.
 */
export function Card({ children, className = '', variant = 'default', onClick }: CardProps) {
  const base = variant === 'elevated' ? 'bg-card-elevated' : 'bg-card';
  const interactive = onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : '';

  return (
    <div
      className={`${base} rounded-2xl border border-divider ${interactive} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
