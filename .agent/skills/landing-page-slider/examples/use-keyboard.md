```tsx
import { useEffect, useCallback } from 'react'

interface UseKeyboardOptions {
  onNext: () => void
  onPrev: () => void
  onEscape: () => void
  onFullscreen: () => void
  onTogglePresentation: () => void
  isPresenting: boolean
}

export function useKeyboard({
  onNext,
  onPrev,
  onEscape,
  onFullscreen,
  onTogglePresentation,
  isPresenting
}: UseKeyboardOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // P key should ALWAYS work to toggle presentation
    if (event.code === 'KeyP') {
      event.preventDefault()
      onTogglePresentation()
      return
    }

    // Other keys only work in presentation mode
    if (!isPresenting) return

    // Prevent default for navigation keys
    const navigationKeys = [
      'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown',
      'Space', 'Escape', 'Enter', 'KeyF'
    ]

    if (navigationKeys.includes(event.code)) {
      event.preventDefault()
    }

    switch (event.code) {
      // Next slide
      case 'ArrowRight':
      case 'ArrowDown':
      case 'Space':
      case 'Enter':
        onNext()
        break

      // Previous slide
      case 'ArrowLeft':
      case 'ArrowUp':
        onPrev()
        break

      // Exit presentation
      case 'Escape':
        onEscape()
        break

      // Toggle fullscreen
      case 'KeyF':
        onFullscreen()
        break
    }
  }, [isPresenting, onNext, onPrev, onEscape, onFullscreen, onTogglePresentation])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `P` | Toggle presentation mode |
| `←` / `↑` | Previous slide |
| `→` / `↓` / `Space` / `Enter` | Next slide |
| `Escape` | Exit presentation |
| `F` | Toggle fullscreen |
