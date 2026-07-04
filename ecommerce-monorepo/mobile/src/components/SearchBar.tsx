import React, { useState } from 'react'
import { View, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native'
import { Search, Mic, Camera, X } from 'lucide-react-native'
import { colors, spacing, radius } from '../theme'

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  onFocus?: () => void
  onBlur?: () => void
  style?: ViewStyle
}

export function SearchBar({
  placeholder = 'Search...',
  value: controlledValue,
  onChangeText,
  onFocus,
  onBlur,
  style,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState('')
  const value = controlledValue !== undefined ? controlledValue : internalValue

  const handleChangeText = (text: string) => {
    if (onChangeText) {
      onChangeText(text)
    } else {
      setInternalValue(text)
    }
  }

  const handleClear = () => {
    handleChangeText('')
  }

  return (
    <View style={[styles.container, style]}>
      <Search size={16} color={colors.textSecondary} style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={handleChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        accessible
        accessibilityLabel="Search input"
        accessibilityHint="Type to search for products or services"
      />
      <View style={styles.rightIcons}>
        {value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.iconButton}
            accessible
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.iconButton}
          accessible
          accessibilityLabel="Voice search"
          accessibilityRole="button"
        >
          <Mic size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          accessible
          accessibilityLabel="Visual search"
          accessibilityRole="button"
        >
          <Camera size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  rightIcons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    padding: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
