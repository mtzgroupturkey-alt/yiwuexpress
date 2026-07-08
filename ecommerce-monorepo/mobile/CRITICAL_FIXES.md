# 🔧 CRITICAL CODE FIXES - COPY & PASTE READY

## ⚠️ FIRST: Install Missing Dependencies

```bash
cd mobile
npm install
```

This will install:
- `expo-haptics` (for tactile feedback)
- `react-native-reanimated` (for animations)
- All other missing packages

---

## FIX #1: Touch Target Helper Component

Create this file first:

```typescript
// File: src/components/TouchableWithMinSize.tsx
import React from 'react'
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle } from 'react-native'

const MIN_TOUCH_TARGET = 44

interface Props extends TouchableOpacityProps {
  minSize?: number
}

export const TouchableWithMinSize: React.FC<Props> = ({
  children,
  style,
  minSize = MIN_TOUCH_TARGET,
  ...props
}) => {
  const touchStyle: ViewStyle = {
    minWidth: minSize,
    minHeight: minSize,
    justifyContent: 'center',
    alignItems: 'center',
  }

  return (
    <TouchableOpacity
      style={[touchStyle, style]}
      {...props}
    >
      {children}
    </TouchableOpacity>
  )
}
```

## FIX #2: Update HomeScreen.tsx Wishlist Button

**Replace this:**
```typescript
<TouchableOpacity
  style={styles.wishlistBtn}
  onPress={() => toggleFavorite(item.id)}
>
  <Heart size={14} color={isFavorite ? COLORS.badgeRed : '#9ca3af'} fill={isFavorite ? COLORS.badgeRed : 'transparent'} />
</TouchableOpacity>
```

**With this:**
```typescript
<TouchableWithMinSize
  style={styles.wishlistBtn}
  onPress={() => toggleFavorite(item.id)}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
  accessibilityState={{ selected: isFavorite }}
>
  <Heart size={16} color={isFavorite ? COLORS.badgeRed : '#9ca3af'} fill={isFavorite ? COLORS.badgeRed : 'transparent'} />
</TouchableWithMinSize>
```

**Update styles:**
```typescript
wishlistBtn: {
  // Remove explicit width/height, let TouchableWithMinSize handle it
  borderRadius: 22,  // Half of 44px
  backgroundColor: 'rgba(255,255,255,0.9)',
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
},
```

## FIX #3: Update ProductCard.tsx Quote Button

**Replace this:**
```typescript
<TouchableOpacity
  style={styles.quoteButton}
  onPress={(e) => {
    e.stopPropagation()
    onQuotePress()
  }}
>
  <Text style={styles.quoteButtonText}>Quote</Text>
</TouchableOpacity>
```

**With this:**
```typescript
<TouchableWithMinSize
  style={styles.quoteButton}
  onPress={(e) => {
    e.stopPropagation()
    onQuotePress?.()
  }}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Request quote"
>
  <Text style={styles.quoteButtonText}>Quote</Text>
</TouchableWithMinSize>
```

**Update styles:**
```typescript
quoteButton: {
  backgroundColor: colors.primary,
  paddingHorizontal: spacing.md,  // 16px
  paddingVertical: spacing.sm,     // 8px
  borderRadius: radius.full,
  minHeight: 44,  // Explicit minimum
  justifyContent: 'center',
  alignItems: 'center',
},
quoteButtonText: {
  color: '#fff',
  fontSize: 14,  // Increased from 12
  fontWeight: 'bold',
},
```

## FIX #4: Update CartScreen.tsx Quantity Buttons

**Replace this:**
```typescript
<TouchableOpacity
  onPress={() => updateQuantity(item.id, item.quantity, -1)}
  disabled={item.quantity <= 1}
  style={[styles.qtyBtn, item.quantity <= 1 && styles.qtyBtnDisabled]}
>
  <Minus size={14} color={item.quantity <= 1 ? '#cbd5e1' : COLORS.textDark} />
</TouchableOpacity>
```

**With this:**
```typescript
<TouchableWithMinSize
  onPress={() => updateQuantity(item.id, item.quantity, -1)}
  disabled={item.quantity <= 1}
  style={[styles.qtyBtn, item.quantity <= 1 && styles.qtyBtnDisabled]}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Decrease quantity"
  accessibilityHint={`Current quantity: ${item.quantity}`}
>
  <Minus size={16} color={item.quantity <= 1 ? '#cbd5e1' : COLORS.textDark} />
</TouchableWithMinSize>
```

**Update styles:**
```typescript
qtyBtn: {
  minWidth: 44,
  minHeight: 44,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 8,
},
qtyBtnDisabled: {
  opacity: 0.5,
},
```

## FIX #5: Unified Theme Usage

**Step 1: Delete this file:**
```bash
rm src/constants/theme.ts
```

**Step 2: Update all screen imports**

**Replace:**
```typescript
const COLORS = {
  primary: '#1A3C5E',
  accent: '#F59E0B',
  // ...
}
```

**With:**
```typescript
import { colors, spacing, typography, radius } from '../theme'

// Use colors.primary instead of COLORS.primary
// Use spacing.md instead of 16
// Use typography.body instead of { fontSize: 16 }
// Use radius.lg instead of borderRadius: 12
```

## FIX #6: Font Size Updates

**Find and replace in all files:**

```typescript
// BEFORE → AFTER

fontSize: 9   → fontSize: 12
fontSize: 10  → fontSize: 12
fontSize: 11  → fontSize: 14
fontSize: 12  → fontSize: 14 (for body text)
fontSize: 12  → fontSize: 12 (for labels/captions, OK to keep)
```

**Specific fixes:**

```typescript
// HomeScreen.tsx
discountBadgeText: {
  fontSize: 12,  // Was 9
  fontWeight: 'bold',
  letterSpacing: 0.5,
},
ratingText: {
  fontSize: 12,  // Was 10
  fontWeight: '600',
},
reviewsText: {
  fontSize: 12,  // Was 10
},
productName: {
  fontSize: 14,  // Was 11
  fontWeight: '600',
  lineHeight: 20,  // Adjust for readability
},
quoteBtnText: {
  fontSize: 14,  // Was 11
  fontWeight: 'bold',
},
```

## FIX #7: Add Haptic Feedback

**Already installed via npm install above** ✅

**Usage example:**
```typescript
import * as Haptics from 'expo-haptics'

const handlePress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  // Your action here
}

// Light - for selections, toggles
// Medium - for notifications, confirmations  
// Heavy - for errors, destructive actions
```

**Add to all buttons:**
```typescript
<TouchableWithMinSize
  onPress={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }}
>
  {children}
</TouchableWithMinSize>
```

## FIX #8: Add Image to All Buttons

**Add import:**
```typescript
import { TouchableWithMinSize } from '../components/TouchableWithMinSize'
```

**Update all buttons systematically:**

1. HomeScreen.tsx (10 locations)
2. ProductListScreen.tsx (5 locations)
3. ProductDetailScreen.tsx (4 locations)
4. CartScreen.tsx (6 locations)
5. LoginScreen.tsx (3 locations)
6. ProductCard.tsx (2 locations)
7. AppHeader.tsx (2 locations)

## Testing Checklist

After applying fixes:

- [ ] npm install (ensure all deps installed)
- [ ] Clear metro cache: `npx expo start -c`
- [ ] Test on iOS device/simulator
- [ ] Test on Android device/emulator
- [ ] Test with VoiceOver enabled (iOS Settings > Accessibility > VoiceOver)
- [ ] Test with TalkBack enabled (Android)
- [ ] Verify all buttons are easy to tap
- [ ] Verify all text is readable
- [ ] Check haptic feedback works

## Quick Test Script

```bash
# Start fresh
npx expo start -c

# Or restart with specific platform
npx expo start --ios -c
npx expo start --android -c
```

---

**Next Steps:**
1. Apply FIX #1 (create TouchableWithMinSize component)
2. Apply FIX #2-4 (update buttons in order)
3. Apply FIX #5 (unify theme)
4. Apply FIX #6 (font sizes)
5. Apply FIX #7 (haptic feedback)
6. Test thoroughly
7. Move to P2 fixes in MOBILE_APP_DESIGN_AUDIT_REPORT.md
