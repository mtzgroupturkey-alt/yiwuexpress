import React from 'react'
import { TouchableOpacity, TouchableOpacityProps } from 'react-native'

interface TouchableWithMinSizeProps extends TouchableOpacityProps {
  minSize?: number
  children: React.ReactNode
}

export function TouchableWithMinSize({
  minSize = 44,
  children,
  style,
  ...props
}: TouchableWithMinSizeProps) {
  return (
    <TouchableOpacity
      {...props}
      style={[
        {
          minWidth: minSize,
          minHeight: minSize,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  )
}
