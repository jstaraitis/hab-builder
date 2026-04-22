import React from 'react';

type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  green:  'bg-accent/20 text-accent',
  amber:  'bg-amber-500/20 text-amber-400',
  red:    'bg-red-500/20 text-red-400',
  blue:   'bg-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/20 text-purple-400',
  gray:   'bg-white/10 text-white/70',
};

/** Small status badge — e.g. "Healthy", "Doing Well", "Overdue" */
export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
