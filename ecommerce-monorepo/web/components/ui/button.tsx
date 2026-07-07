import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'gold' | 'outline' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon'
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary-500 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden"

    const variantStyles = {
      default: `
        bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700
        text-white
        shadow-premium
        hover:shadow-premium-lg
        hover:-translate-y-1
        active:translate-y-0
        before:absolute before:inset-0
        before:bg-gradient-to-tr before:from-white/0 before:to-white/20
        before:opacity-0 hover:before:opacity-100
        before:transition-opacity before:duration-300
      `,
      primary: `
        bg-primary-600
        text-white
        shadow-premium
        hover:shadow-premium-lg
        hover:-translate-y-1
        active:translate-y-0
      `,
      gold: `
        bg-gradient-to-r from-[#c9a84c] via-[#d4b15c] to-[#e8d48b]
        text-[#1a1a2e]
        shadow-gold
        hover:shadow-gold-lg
        hover:-translate-y-1
        hover:scale-[1.03]
        active:scale-100 active:translate-y-0
        font-bold
        before:absolute before:inset-0
        before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
        before:translate-x-[-100%] hover:before:translate-x-[100%]
        before:transition-transform before:duration-700
      `,
      outline: `
        border-2 border-gray-200
        bg-white/90 backdrop-blur-sm
        text-gray-700
        hover:border-primary-500 hover:bg-primary-50
        hover:text-primary-700
        hover:shadow-premium
        hover:-translate-y-0.5
        active:translate-y-0
      `,
      ghost: "hover:bg-gray-100 text-gray-700 active:bg-gray-200",
      link: "text-primary-600 underline-offset-4 hover:underline hover:text-primary-700",
      destructive: `
        bg-gradient-to-br from-red-600 to-red-700
        text-white
        shadow-[0_4px_14px_rgba(220,38,38,0.35)]
        hover:shadow-[0_8px_20px_rgba(220,38,38,0.45)]
        hover:-translate-y-1
        active:translate-y-0
      `
    }

    const sizeStyles = {
      sm: "h-9 px-4 py-2 text-xs rounded-lg",
      default: "h-11 px-6 py-3 text-sm rounded-xl",
      lg: "h-14 px-10 py-4 text-base rounded-2xl",
      xl: "h-16 px-12 py-5 text-lg rounded-2xl",
      icon: "h-10 w-10 rounded-lg"
    }

    const LoadingSpinner = () => (
      <span className="flex items-center gap-2 animate-fade-in">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Processing...</span>
      </span>
    )

    return (
      <button
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <LoadingSpinner /> : children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
