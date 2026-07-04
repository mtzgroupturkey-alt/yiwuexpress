import { useCallback, useRef } from 'react'
import { InteractionManager } from 'react-native'

export function usePerformance() {
  const tasks = useRef<Array<() => void>>([])

  const runAfterInteractions = useCallback((task: () => void) => {
    tasks.current.push(task)
    InteractionManager.runAfterInteractions(() => {
      tasks.current.forEach(t => t())
      tasks.current = []
    })
  }, [])

  const debounce = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => fn(...args), delay)
    }
  }, [])

  const throttle = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ) => {
    let inThrottle = false
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }, [])

  return {
    runAfterInteractions,
    debounce,
    throttle,
  }
}
