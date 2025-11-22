import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rectangular' | 'text';
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', animation = 'pulse', ...props }, ref) => {
    const variantClasses = {
      default: 'rounded-md',
      circular: 'rounded-full',
      rectangular: 'rounded-none',
      text: 'rounded-sm h-4',
    };

    const animationClasses = {
      pulse: 'animate-pulse',
      wave: 'animate-shimmer',
      none: '',
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]",
          variantClasses[variant],
          animationClasses[animation],
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// Skeleton presets for common use cases
const SkeletonCard = () => (
  <div className="rounded-card border border-gray-100 bg-white p-6 shadow-sm">
    <div className="flex items-start gap-4">
      <Skeleton variant="circular" className="h-12 w-12" />
      <div className="flex-1 space-y-3">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
  </div>
);

const SkeletonMetric = () => (
  <div className="rounded-card border border-gray-100 bg-white p-6 shadow-sm">
    <Skeleton variant="text" className="w-1/3 mb-2" />
    <Skeleton variant="text" className="w-1/2 h-8 mb-2" />
    <Skeleton variant="text" className="w-2/3" />
  </div>
);

const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="rounded-card border border-gray-100 bg-white overflow-hidden">
    <div className="p-4 border-b border-gray-100">
      <Skeleton variant="text" className="w-1/4 h-5" />
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <Skeleton variant="circular" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
          <Skeleton variant="rectangular" className="h-8 w-20" />
        </div>
      ))}
    </div>
  </div>
);

const SkeletonAvatar = ({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
  };
  return <Skeleton variant="circular" className={sizeClasses[size]} />;
};

export { Skeleton, SkeletonCard, SkeletonMetric, SkeletonTable, SkeletonAvatar };

