import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'gold'
}

function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-premium",
    secondary: "bg-gray-100 text-gray-800 border border-gray-200",
    destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg",
    outline: "border-2 border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-700 transition-colors",
    success: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg",
    warning: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 shadow-lg font-bold",
    gold: "bg-gradient-to-r from-[#c9a84c] via-[#d4b15c] to-[#e8d48b] text-[#1a1a2e] shadow-gold font-bold"
  }
  
  return (
    <div
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300 hover:scale-105 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  )
}

export { Badge }
