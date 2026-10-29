import React from 'react';
import { cn } from '@/lib/utils';

export default function Badge({ children, variant = 'default', className, ...props }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    due: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    receivable: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
    settled: 'bg-slate-100 text-slate-600 border-slate-200 font-medium',
    bazar: 'bg-amber-50 text-amber-800 border-amber-200',
    fixed: 'bg-sky-50 text-sky-800 border-sky-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        selectedVariant,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
