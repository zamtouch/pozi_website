import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, children, disabled, asChild = false, ...props }, ref) => {
    const variants = {
      primary: 'text-white font-medium px-6 py-3 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center',
      secondary: 'text-gray-900 font-medium px-6 py-3 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center',
      outline: 'border border-gray-300 hover:border-gray-400 text-gray-900 font-medium px-6 py-3 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center',
      ghost: 'hover:bg-gray-100 text-gray-900 font-medium px-6 py-3 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center',
    };

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };
    
    // Darker yellow-green for buttons (#d4c84a)
    const getButtonStyle = () => {
      if (variant === 'primary' || variant === 'secondary') {
        return {
          backgroundColor: '#d4c84a',
          color: variant === 'primary' ? 'white' : '#111827',
        };
      }
      return {};
    };

    const buttonClasses = cn(
      variants[variant],
      sizes[size],
      loading && 'opacity-50 cursor-not-allowed',
      disabled && 'opacity-50 cursor-not-allowed',
      (variant === 'primary' || variant === 'secondary') && 'hover:brightness-110',
      className
    );
    
    const buttonStyle = getButtonStyle();

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(buttonClasses, (children.props as any).className),
        style: { ...buttonStyle, ...((children.props as any).style || {}) },
        disabled: disabled || loading,
        ...props,
      } as any);
    }

    return (
      <button
        className={buttonClasses}
        style={buttonStyle}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
