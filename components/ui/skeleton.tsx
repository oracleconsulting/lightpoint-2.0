import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  const baseClasses = 'skeleton rounded';
  
  const variantClasses = {
    text: 'h-4 w-full',
    rectangular: 'h-20 w-full',
    circular: 'h-12 w-12 rounded-full',
    card: 'h-64 w-full rounded-lg',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      aria-label="Loading..."
    />
  );
}

/**
 * Pre-built skeleton layouts for common UI patterns
 */
export function SkeletonCard() {
  return (
    <div className="p-6 space-y-4 border border-gray-200 rounded-lg bg-white">
      <Skeleton variant="circular" className="h-16 w-16" />
      <Skeleton variant="text" className="h-6 w-3/4" />
      <Skeleton variant="text" className="h-4 w-full" />
      <Skeleton variant="text" className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-2">
      <Skeleton variant="rectangular" className="h-12 w-full" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} variant="rectangular" className="h-16 w-full" />
      ))}
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-1/2" />
            <Skeleton variant="text" className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <Skeleton variant="text" className="h-8 w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <Skeleton variant="card" className="h-96" />
    </div>
  );
}
