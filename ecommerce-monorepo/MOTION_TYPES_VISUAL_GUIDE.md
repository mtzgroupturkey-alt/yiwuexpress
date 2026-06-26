# 🎨 MOTION TYPES - VISUAL GUIDE

**See what each animation looks like before you use it!**

---

## 🎬 ANIMATION PREVIEWS

### **1. SLIDE (Default)**

```
┌─────────────────────────────────────┐
│  Previous Slide                     │
│  [Sliding Out] ←──                  │
└─────────────────────────────────────┘

         ──→ [Sliding In]
              ┌─────────────────────────────────────┐
              │             NEW SLIDE                │
              │         Your Content Here            │
              └─────────────────────────────────────┘
```

**Motion:**
- Horizontal slide from right to left (or vice versa)
- Smooth spring physics (elastic bounce)
- Slight scale effect (95% → 100%)

**Code:**
```typescript
enter: { x: 1000, opacity: 0, scale: 0.95 }
center: { x: 0, opacity: 1, scale: 1 }
exit: { x: -1000, opacity: 0, scale: 0.95 }
```

**Best For:** Classic sliders, e-commerce, general use  
**Feel:** Professional, expected, reliable  
**Speed:** Medium (0.4s)

---

### **2. FADE**

```
┌─────────────────────────────────────┐
│       Previous Slide                │
│   [Opacity: 100% → 0%]              │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   [Opacity: 0% → 100%]              │
│            NEW SLIDE                 │
│        Your Content Here             │
└─────────────────────────────────────┘
```

**Motion:**
- Pure opacity transition
- No movement or scaling
- Crossfade effect

**Code:**
```typescript
enter: { opacity: 0, scale: 1 }
center: { opacity: 1, scale: 1 }
exit: { opacity: 0, scale: 1 }
```

**Best For:** Elegant presentations, luxury brands, minimal design  
**Feel:** Smooth, sophisticated, subtle  
**Speed:** Slow (0.6s recommended)

---

### **3. ZOOM**

```
      [50% size]
         ·
        ·  ·
       ·    ·
      ·  →  ·
     ·────────·
    ┌─────────────────────┐
    │      NEW SLIDE      │
    │  [Growing to 100%]  │
    └─────────────────────┘
           ↓
    ┌─────────────────────────────────┐
    │         FULL SIZE                │
    │      Your Content Here           │
    └─────────────────────────────────┘
           ↓
    [Exit: Zooms to 150%]
         ▓▓▓▓▓▓▓▓
```

**Motion:**
- Enters at 50% scale, grows to 100%
- Exits by growing to 150% (zoom out)
- Center origin (scales from middle)

**Code:**
```typescript
enter: { opacity: 0, scale: 0.5 }
center: { opacity: 1, scale: 1 }
exit: { opacity: 0, scale: 1.5 }
```

**Best For:** Product reveals, announcements, modern design  
**Feel:** Dynamic, energetic, bold  
**Speed:** Fast (0.4s)

---

### **4. FLIP (3D)**

```
Side View:

     ↓ [Entering]
    |      ╱
    |     ╱
    |    ╱   [Rotating on Y-axis]
    |   ╱
    |  ╱
    | ╱
    |▓
    ┌─────────────────────────────────┐
    │           NEW SLIDE              │
    │    [Rotated 0°, Front View]      │
    └─────────────────────────────────┘
    
    [Exit: Rotates 90° away]
         ▓|
          \|
           \|
            \|
```

**Motion:**
- 3D rotation on Y-axis (vertical)
- Enters at 90° (edge view)
- Centers at 0° (front view)
- Exits at -90° (opposite edge)

**Code:**
```typescript
enter: { rotateY: 90, opacity: 0, scale: 0.8 }
center: { rotateY: 0, opacity: 1, scale: 1 }
exit: { rotateY: -90, opacity: 0, scale: 0.8 }
```

**Best For:** Tech products, creative agencies, modern brands  
**Feel:** Creative, 3D, impressive  
**Speed:** Medium (0.5s)

**Note:** Requires perspective for 3D effect

---

### **5. ROTATE**

```
    [180° Rotation + Scale]
    
      Entering:
         ↻
        ↻ ↻
       ↻   ↻  [30% size]
      ↻     ↻
       ↻   ↻
        ↻ ↻
         ↻
         
    ┌─────────────────────────────────┐
    │       NEW SLIDE [0°]             │
    │     [100% size]                  │
    └─────────────────────────────────┘
    
      Exiting:
         ↺
        ↺ ↺
       ↺   ↺  [Shrinking to 30%]
      ↺     ↺
       ↺   ↺
        ↺ ↺
         ↺
```

**Motion:**
- Full 180° rotation (Z-axis)
- Combined with scale animation
- Enters at 30% size, exits at 30%

**Code:**
```typescript
enter: { rotate: 180, opacity: 0, scale: 0.3 }
center: { rotate: 0, opacity: 1, scale: 1 }
exit: { rotate: -180, opacity: 0, scale: 0.3 }
```

**Best For:** Playful brands, creative content, unique presentations  
**Feel:** Playful, unique, eye-catching  
**Speed:** Fast (0.5s)

---

### **6. SCALE**

```
    [Growing from Center]
    
         ·  [0% size]
        · ·
       ·   ·
      ·  ↓  ·
     ·───────·
    ┌─────────────┐
    │  GROWING    │
    └─────────────┘
         ↓
    ┌───────────────────────┐
    │     50% SIZE          │
    └───────────────────────┘
         ↓
    ┌─────────────────────────────────┐
    │         100% SIZE                │
    │      Your Content Here           │
    └─────────────────────────────────┘
         
    [Exit: Shrinks to 0%]
         ·
```

**Motion:**
- Grows from center point (0% → 100%)
- Like a popup or modal opening
- Exits by shrinking to 0%

**Code:**
```typescript
enter: { opacity: 0, scale: 0 }
center: { opacity: 1, scale: 1 }
exit: { opacity: 0, scale: 0 }
```

**Best For:** Product launches, announcements, focused content  
**Feel:** Direct, focused, impactful  
**Speed:** Medium (0.4s)

---

## 🎭 SIDE-BY-SIDE COMPARISON

| Feature | Slide | Fade | Zoom | Flip | Rotate | Scale |
|---------|-------|------|------|------|--------|-------|
| **Direction** | Horizontal | None | Toward/Away | Y-axis | Z-axis | Center |
| **Movement** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Scale** | Slight | None | Heavy | Slight | Heavy | Heavy |
| **3D Effect** | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Drama Level** | Medium | Low | High | High | Very High | High |
| **Smoothness** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Performance** | Excellent | Excellent | Excellent | Good | Good | Excellent |
| **Mobile** | Perfect | Perfect | Perfect | Good | Good | Perfect |

---

## 🎨 DESIGN GUIDELINES

### **When to Use Each:**

#### **SLIDE** ⭐ Most Common
```
Use for:
✅ Default slides
✅ Product showcases
✅ General content
✅ When unsure

Avoid:
❌ Overuse (boring if all slides)
```

#### **FADE** ⭐ Most Elegant
```
Use for:
✅ Luxury brands
✅ Photography
✅ Elegant content
✅ Minimal design

Avoid:
❌ Action/excitement
❌ Fast-paced content
```

#### **ZOOM** ⭐ Most Dramatic
```
Use for:
✅ New product reveals
✅ Important announcements
✅ "Hero" moments
✅ Call-to-action slides

Avoid:
❌ Subtle content
❌ Every slide (overwhelming)
```

#### **FLIP** ⭐ Most Creative
```
Use for:
✅ Tech products
✅ Creative agencies
✅ Modern brands
✅ Interactive feel

Avoid:
❌ Professional/corporate
❌ Conservative brands
```

#### **ROTATE** ⭐ Most Playful
```
Use for:
✅ Fun brands
✅ Creative content
✅ Youth-oriented
✅ Unique presentations

Avoid:
❌ Professional services
❌ Luxury brands
❌ Serious content
```

#### **SCALE** ⭐ Most Focused
```
Use for:
✅ Announcements
✅ Pop-up style
✅ Important messages
✅ Single focus

Avoid:
❌ Background content
❌ Multiple elements
```

---

## 🎯 RECOMMENDED COMBINATIONS

### **Strategy 1: Progressive Energy**
```
Slide 1: Fade     (calm intro)
Slide 2: Slide    (build momentum)
Slide 3: Zoom     (peak excitement)
Slide 4: Fade     (cool down)
```

### **Strategy 2: Consistent Professional**
```
All slides: Slide or Fade
(Professional, reliable, expected)
```

### **Strategy 3: Mixed Creative**
```
Slide 1: Flip     (creative intro)
Slide 2: Rotate   (maintain energy)
Slide 3: Zoom     (focus moment)
Slide 4: Scale    (final impact)
```

### **Strategy 4: E-Commerce Focus**
```
Slide 1: Zoom     (new arrivals - dramatic)
Slide 2: Slide    (categories - normal)
Slide 3: Zoom     (sale - dramatic)
Slide 4: Fade     (about - subtle)
```

---

## 📊 TECHNICAL SPECS

### **Animation Properties:**

| Motion | Transform | Opacity | Scale | Rotate |
|--------|-----------|---------|-------|--------|
| Slide | translate | fade | 95-100% | - |
| Fade | - | fade | - | - |
| Zoom | - | fade | 50-150% | - |
| Flip | - | fade | 80-100% | 90° Y |
| Rotate | - | fade | 30-100% | 180° Z |
| Scale | - | fade | 0-100% | - |

### **Performance:**

```
GPU Accelerated Properties:
✅ transform: translateX, translateY
✅ transform: scale
✅ transform: rotate, rotateY
✅ opacity

CPU Properties (Avoid):
❌ width, height
❌ margin, padding
❌ top, left (use transform instead)
```

---

## 🎬 ANIMATION TIMELINE

### **Typical Flow:**

```
Time: 0ms
  ↓
[Previous Slide Exits]
  ↓ (exit animation: 400ms)
Time: 400ms
  ↓
[New Slide Enters]
  ↓ (enter animation: 400ms)
Time: 800ms
  ↓
[Slide Fully Visible]
  ↓ (display duration: 5000ms)
Time: 5800ms
  ↓
[Next Transition Begins]
```

### **Content Stagger:**

```
Time: 0ms - Slide enters
Time: 300ms - Badge fades in
Time: 400ms - Subtitle fades in
Time: 500ms - Title fades in
Time: 600ms - Description fades in
Time: 700ms - CTA buttons fade in
Time: 700ms - Product image scales in
```

---

## 💡 PRO TIPS

### **1. Contrast is Key**
```
Good: Fade → Zoom → Fade → Slide
(Varies energy level)

Bad: Zoom → Rotate → Flip → Scale
(Too chaotic, overwhelming)
```

### **2. Match Content to Motion**
```
Elegant content → Fade, Slide
Exciting content → Zoom, Rotate
Creative content → Flip, Scale
Important content → Scale, Zoom
```

### **3. Test Everything**
```
✓ Desktop (Chrome, Firefox, Safari)
✓ Mobile (iOS Safari, Chrome)
✓ Tablet
✓ Slow devices
✓ With/without animations
```

### **4. Accessibility Matters**
```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  .hero-slider * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## ✅ DECISION TREE

**Choose your motion type:**

```
Are you a luxury/professional brand?
├─ Yes → FADE or SLIDE
└─ No → Continue...

Is this an important announcement?
├─ Yes → ZOOM or SCALE
└─ No → Continue...

Are you a creative/modern brand?
├─ Yes → FLIP or ROTATE
└─ No → SLIDE (safe default)

Want variety?
└─ Mix: 80% Slide/Fade + 20% Others
```

---

## 🎉 FINAL THOUGHTS

**Remember:**
- **Less is more** - Don't overdo animations
- **Test on mobile** - Animations feel different
- **Match your brand** - Choose animations that fit
- **User first** - Smooth > Flashy
- **Performance matters** - Keep it at 60fps

**Start Simple:**
1. Use **Slide** for most slides
2. Add **Zoom** for 1-2 special slides
3. Test and adjust
4. Expand gradually

**Have fun experimenting!** 🎨✨

---

**Guide Status:** ✅ Complete  
**Visual Examples:** 6 motion types  
**Recommendations:** Included  
**Best Practices:** Documented
