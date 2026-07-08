import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'gold' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon'
  isLoading?: boolean
}

const variantClassMap: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'text-white shadow-premium hover:shadow-premium-lg hover:-translate-y-1 active:translate-y-0',
  secondary: 'text-white shadow-premium hover:shadow-premium-lg hover:-translate-y-1 active:translate-y-0'
  primary: 'text-white shadow-premium hover:shadow-premium-lg hover:-translate-y-1 active:translate-y-0',
  gold: 'text-[#1a1a2e] shadow-gold hover:shadow-gold-lg hover:-translate-y-1 hover:scale-[1.03] active:scale-100 active:translate-y-0 font-bold',
  outline: 'border-2 border-gray-300 bg-white text-gray-700 hover:border-[#1a3a5c] hover:bg-[#f0f4f8] hover:text-[#1a3a5c] hover:shadow-premium hover:-translate-y-0.5 active:translate-y-0',
  ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200',
  link: 'text-[#1a3a5c] underline-offset-4 hover:underline hover:text-[#102a43]',
  destructive: 'text-white hover:-translate-y-1 active:translate-y-0',
}

const variantStyleMap: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
  default: {
    background: 'linear-gradient(135deg, #1a3a5c 0%, #102a43 100%)',
  },
  primary: {
    backgroundColor: '#1a3a5c',
  },
  gold: {
    background: 'linear-gradient(135deg, #c9a84c 0%, #e8d48b 50%, #c9a84c 100%)',
  },
  outline: {},
  ghost: {},
  link: {},
  secondary: {
    background: 'linear-gradient(135deg, #1a3a5c 0%, #102a43 100%)',
  },
  destructive: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    boxShadow: '0 4px 14px rgba(220,38,38,0.35)',
  },
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-9 px-4 py-2 text-xs rounded-lg',
  default: 'h-11 px-6 py-3 text-sm rounded-xl',
  lg: 'h-14 px-10 py-4 text-base rounded-2xl',
  xl: 'h-16 px-12 py-5 text-lg rounded-2xl',
  icon: 'h-9 w-9 p-0 rounded-lg',
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', isLoading = false, children, disabled, style, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1a3a5c] disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden"

    const LoadingSpinner = () => (
      <span className="flex items-center gap-2">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Processing...</span>
      </span>
    )

    return (
      <button
        className={`${baseStyles} ${variantClassMap[variant]} ${sizeStyles[size]} ${className}`}
        ref={ref}
        disabled={disabled || isLoading}
        style={{ ...variantStyleMap[variant], ...style }}
        {...props}
      >
        {isLoading ? <LoadingSpinner /> : children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
