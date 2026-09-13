```
src/
├── components/
│   ├── Slider/
│   │   ├── index.ts              # Re-exports
│   │   ├── Slider.tsx            # Main slider container
│   │   ├── Slide.tsx             # Individual slide component
│   │   └── SlideContent.tsx      # Content components
│   └── ui/
│       └── index.ts
├── hooks/
│   ├── index.ts
│   ├── useKeyboard.ts
│   ├── useFullscreen.ts
│   └── useSlideProgress.ts
├── slides/
│   ├── index.ts
│   └── *.tsx                     # Slide files
├── App.tsx
├── main.tsx
├── index.css                     # Tailwind v4 theme
└── vite-env.d.ts
```
