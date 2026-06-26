import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-primary text-white",
    secondary: "bg-gray-100 text-gray-900",
    destructive: "bg-red-100 text-red-900",
    outline: "border border-gray-300 text-gray-700",
    success: "bg-green-100 text-green-900",
    warning: "bg-yellow-100 text-yellow-900"
  }
  
  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    />
  )
}

export { Badge }
