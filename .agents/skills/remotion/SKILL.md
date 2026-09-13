---
name: remotion
description: Create videos programmatically in React using Remotion. Includes best practices for composition, animation, audio, and asset management.
---

# Remotion

Remotion allows you to create videos programmatically using React.

## When to Use This Skill

- Creating videos with React components
- Animating elements using frame-based timing
- Managing audio and video assets in a timeline
- Generating dynamic video content based on data
- Configuring video compositions and rendering

## How to Use

The knowledge in this skill is organized into specific resources:

### Core Concepts

- [Compositions](resources/compositions.md) - Defining compositions, stills, and folder structures
- [Sequencing](resources/sequencing.md) - Managing timeline with delays, trims, and sequences
- [Timing](resources/timing.md) - Interpolation, easing, and spring animations
- [Transitions](resources/transitions.md) - Scene transitions and patterns

### Working with Assets

- [Assets](resources/assets.md) - Importing images, videos, audio, and fonts
- [Audio](resources/audio.md) - Handling audio tracks, volume, and trimming
- [Videos](resources/videos.md) - Embedding and manipulating video files
- [Images](resources/images.md) - Using the `Img` component for images
- [GIFs](resources/gifs.md) - Using GIFs in your timeline
- [Lottie](resources/lottie.md) - Embedding Lottie animations
- [Fonts](resources/fonts.md) - Loading custom and Google fonts

### Animation & visual Effects

- [Animations](resources/animations.md) - Fundamental animation patterns
- [Text Animations](resources/text-animations.md) - Typography effects
- [3D](resources/3d.md) - Using Three.js and React Three Fiber
- [Charts](resources/charts.md) - Data visualization and charts
- [Tailwind](resources/tailwind.md) - Styling with Tailwind CSS

### Captions & Metadata

- [Display Captions](resources/display-captions.md) - Rendering captions on screen
- [Import SRT](resources/import-srt-captions.md) - Using subtitle files
- [Transcribe](resources/transcribe-captions.md) - Transcribing audio to text
- [Metadata](resources/calculate-metadata.md) - Dynamic composition properties

### Utilities

- [Get Video Duration](resources/get-video-duration.md) - Measuring video length
- [Get Audio Duration](resources/get-audio-duration.md) - Measuring audio length
- [Get Video Dimensions](resources/get-video-dimensions.md) - Checking video size
- [Extract Frames](resources/extract-frames.md) - Getting frames from video
- [Can Decode](resources/can-decode.md) - Browser codec support check
- [Measure Text](resources/measuring-text.md) - Calculating text size
- [Measure DOM](resources/measuring-dom-nodes.md) - Measuring elements

## Best Practices

- Use `useCurrentFrame()` and `interpolate()` for smooth seekable animations.
- Prefer `Sequence` for arranging components in time over conditional rendering.
- separate logic from presentation components.
- Use `staticFile()` for referencing assets in the public folder.

## Examples

### Basic composition

```tsx
import {Composition} from 'remotion';
import {MyVideo} from './MyVideo';

export const RemotionVideo: React.FC = () => {
  return (
    <Composition
      id="MyVideo"
      component={MyVideo}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

### Simple Animation

```tsx
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';

const MyComponent = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({
    frame,
    fps,
  });

  return <div style={{transform: \`scale(\${scale})\`}}>Hello Remotion</div>;
};
```
