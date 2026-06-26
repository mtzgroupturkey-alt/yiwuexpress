# 🧪 FRAMER MOTION HERO SLIDER - QUICK TEST GUIDE

**Test your new animated hero slider in 5 minutes!**

---

## 🚀 QUICK START

### **1. Start the Development Server**
```bash
cd web
npm run dev
```

### **2. Open Your Browser**
```
http://localhost:3000
```

---

## ✅ VISUAL CHECKLIST

### **Automatic Tests (Just Watch):**

1. **Page Loads** 
   - [ ] Slider appears smoothly
   - [ ] First slide zooms in slightly (Ken Burns effect)
   - [ ] Content fades in with stagger (badge → subtitle → title → description → buttons)
   
2. **Auto-Play (Wait 5 seconds)**
   - [ ] Slide automatically changes
   - [ ] Old slide slides out to the left
   - [ ] New slide slides in from the right
   - [ ] Smooth spring animation (slightly bouncy)

3. **Hover Test**
   - [ ] Move mouse over slider
   - [ ] Auto-play pauses
   - [ ] Move mouse away
   - [ ] Auto-play resumes

---

## 👆 INTERACTION TESTS

### **Mouse Tests:**

1. **Drag-to-Swipe (Desktop)**
   - [ ] Click and hold on slider
   - [ ] Cursor changes to "grabbing"
   - [ ] Drag left → slide changes to next
   - [ ] Drag right → slide changes to previous
   - [ ] Elastic resistance when dragging
   - [ ] Release → smooth spring animation

2. **Navigation Arrows**
   - [ ] Hover left arrow → scales up slightly
   - [ ] Click left arrow → previous slide with smooth transition
   - [ ] Hover right arrow → scales up slightly
   - [ ] Click right arrow → next slide with smooth transition

3. **Slide Indicators (Dots)**
   - [ ] Active indicator is pill-shaped (wide)
   - [ ] Inactive indicators are circular (small)
   - [ ] Hover over indicator → scales up
   - [ ] Click indicator → jumps to that slide smoothly

4. **Play/Pause Button**
   - [ ] Shows "Pause" icon when playing
   - [ ] Click → changes to "Play" icon
   - [ ] Auto-play stops
   - [ ] Click again → resumes auto-play
   - [ ] Button scales on hover/click

---

## ⌨️ KEYBOARD TESTS

1. **Arrow Keys**
   - [ ] Press `←` (Left Arrow) → Previous slide
   - [ ] Press `→` (Right Arrow) → Next slide
   - [ ] Smooth transitions on both

2. **Spacebar**
   - [ ] Press `Space` → Pauses auto-play
   - [ ] Press `Space` again → Resumes auto-play

3. **Tab Navigation**
   - [ ] Press `Tab` multiple times
   - [ ] Focus moves through controls
   - [ ] Visible focus indicator
   - [ ] Press `Enter` on focused button → activates

---

## 📱 MOBILE/TOUCH TESTS

### **On Mobile Device or Chrome DevTools:**

1. **Switch to Mobile View**
   - Press `F12` in Chrome
   - Click device icon (top-left)
   - Choose "iPhone 12 Pro" or similar

2. **Swipe Tests**
   - [ ] Swipe left → next slide
   - [ ] Swipe right → previous slide
   - [ ] Elastic resistance at edges
   - [ ] Smooth spring animation

3. **Touch Interactions**
   - [ ] Tap left arrow → previous slide
   - [ ] Tap right arrow → next slide
   - [ ] Tap indicator dot → jumps to slide
   - [ ] Tap play/pause → toggles

---

## 🎨 ANIMATION QUALITY CHECKS

### **Smoothness Test:**
1. **Open Chrome DevTools**
   - Press `F12`
   - Click "Performance" tab
   - Click "Record" button
   - Change slides 3-4 times
   - Stop recording

2. **Check FPS**
   - [ ] Green line should be near 60 FPS
   - [ ] No significant drops
   - [ ] Smooth animation timeline

### **Visual Quality:**
- [ ] No flickering
- [ ] No layout shifts
- [ ] No janky animations
- [ ] Smooth text rendering
- [ ] Images load progressively

---

## ♿ ACCESSIBILITY TESTS

### **Screen Reader Test (Optional):**
1. **Enable Screen Reader**
   - Windows: Windows + Ctrl + Enter (Narrator)
   - Mac: Cmd + F5 (VoiceOver)

2. **Navigate Slider**
   - [ ] Announces "Hero slider region"
   - [ ] Announces "Previous slide button"
   - [ ] Announces "Next slide button"
   - [ ] Announces "Pause/Play button"
   - [ ] Announces slide changes

### **Keyboard Only:**
- [ ] Can navigate entire slider without mouse
- [ ] Can change slides
- [ ] Can play/pause
- [ ] Can see which control is focused

---

## 🎯 EXPECTED BEHAVIORS

### **Animation Sequence:**
```
1. Slide Enter (0.0s - 0.5s)
   - Slide from right/left (spring physics)
   - Fade in
   - Scale from 0.95 to 1.0
   - Background image zooms in slightly

2. Content Stagger (0.3s - 0.9s)
   - Badge appears (0.3s)
   - Subtitle appears (0.4s)
   - Title appears (0.5s)
   - Description appears (0.6s)
   - CTA buttons appear (0.7s)
   - Product image appears (0.7s)

3. Idle State (0.9s - Auto-play duration)
   - All elements visible
   - Waiting for auto-play or interaction

4. Slide Exit (0.0s - 0.5s)
   - Slide to left/right
   - Fade out
   - Scale to 0.95
```

### **Physics:**
- **Spring Stiffness:** 300 (moderately snappy)
- **Spring Damping:** 30 (slightly bouncy)
- **Drag Elastic:** 0.2 (20% stretch)
- **Swipe Threshold:** 10,000 units

---

## 🐛 TROUBLESHOOTING

### **Problem: Animations are choppy**
**Solution:**
- Check if you're running in production mode: `npm run build && npm start`
- Disable browser extensions
- Check CPU usage (close other apps)
- Test in another browser

### **Problem: Drag doesn't work**
**Solution:**
- Make sure you're clicking/dragging on the image area
- Check console for JavaScript errors
- Refresh the page

### **Problem: Auto-play doesn't work**
**Solution:**
- Check if you clicked the pause button
- Make sure there's more than 1 slide
- Check browser console for errors
- Refresh the page

### **Problem: Slides don't load**
**Solution:**
- Check if slides exist in admin panel
- Verify API is running: `http://localhost:3000/api/hero-slides`
- Check browser console
- Check network tab in DevTools

### **Problem: 401 Unauthorized in console**
**Solution:**
- This is expected for admin routes
- Frontend slider uses public API (`/api/hero-slides`)
- If public API fails, check authentication fix in `HERO_SLIDER_AUTH_FIX_v2.md`

---

## 📊 PERFORMANCE BENCHMARKS

### **Expected Metrics:**
- **FPS:** ~60 (smooth)
- **Initial Load:** < 500ms
- **Slide Transition:** 400-800ms
- **Memory:** Stable (no leaks)
- **CPU:** < 30% during animation

### **How to Check:**
1. Open Chrome DevTools
2. Performance tab
3. Record for 10 seconds while changing slides
4. Check FPS (should be green/60fps)
5. Check memory (should be stable)

---

## ✅ SUCCESS CRITERIA

### **All These Should Be TRUE:**

#### **Visual:**
- ✅ Smooth slide transitions
- ✅ Staggered content animations
- ✅ Image zoom effect on entry
- ✅ No flickering or jumps

#### **Interaction:**
- ✅ Drag works in both directions
- ✅ Arrows change slides smoothly
- ✅ Indicators show current slide
- ✅ Play/pause works correctly

#### **Auto-Play:**
- ✅ Advances automatically
- ✅ Pauses on hover
- ✅ Resumes when leaving
- ✅ Respects per-slide duration

#### **Keyboard:**
- ✅ Arrow keys navigate
- ✅ Spacebar toggles play/pause
- ✅ Tab navigation works
- ✅ Focus visible

#### **Mobile:**
- ✅ Touch drag works
- ✅ Swipe changes slides
- ✅ Tap controls work
- ✅ Responsive layout

#### **Performance:**
- ✅ 60 FPS animations
- ✅ No console errors
- ✅ Fast load times
- ✅ No memory leaks

---

## 🎉 COMPLETION

**If all tests pass, your Framer Motion Hero Slider is working perfectly!**

### **Next Steps:**
1. Add more slides via admin panel
2. Customize animation speeds (see docs)
3. Test on real devices
4. Deploy to production

### **Share Feedback:**
- What animations do you like most?
- Any performance issues?
- Mobile experience smooth?
- Accessibility working well?

---

**Happy Testing!** 🚀

---

**Test Duration:** ~5 minutes  
**Difficulty:** Easy  
**Tools Needed:** Browser + DevTools  
**Optional:** Mobile device, Screen reader
