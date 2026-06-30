import React, { ReactNode } from 'react'
import {
  ScrollView,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  RefreshControl,
  StyleSheet,
} from 'react-native'

interface BaseScreenProps {
  children: ReactNode
  scrollable?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  padding?: boolean
  backgroundColor?: string
  keyboardBehavior?: 'padding' | 'height' | 'position'
  showsVerticalScrollIndicator?: boolean
  bounces?: boolean
  contentContainerStyle?: any
}

export function BaseScreen({
  children,
  scrollable = true,
  refreshing = false,
  onRefresh,
  padding = true,
  backgroundColor = '#f9fafb',
  keyboardBehavior = 'padding',
  showsVerticalScrollIndicator = false,
  bounces = true,
  contentContainerStyle,
}: BaseScreenProps) {
  const content = (
    <View style={[styles.content, padding && styles.padding]}>
      {children}
    </View>
  )

  if (!scrollable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? keyboardBehavior : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          {content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? keyboardBehavior : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            padding && styles.padding,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          bounces={bounces}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical={Platform.OS === 'ios'}
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
})
