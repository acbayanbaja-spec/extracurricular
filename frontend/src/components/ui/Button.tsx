import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98]';

    const variants = {
      default: 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md hover:shadow-primary-500/20 shadow-sm border border-primary-500/30',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm border border-border/60',
      outline: 'border border-input bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:border-primary-500/40 shadow-sm',
      ghost: 'hover:bg-accent/80 hover:text-accent-foreground',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm hover:shadow-rose-500/25',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-emerald-500/25',
      gradient: 'bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-700 text-white shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/35 hover:brightness-105 border border-white/20',
    };

    const sizes = {
      sm: 'h-8 rounded-lg px-3 text-xs font-semibold',
      md: 'h-10 rounded-xl px-4 text-sm font-semibold',
      lg: 'h-12 rounded-xl px-6 text-base font-bold',
      icon: 'h-10 w-10 rounded-xl p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
