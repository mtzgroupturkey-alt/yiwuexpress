# Three.js Post-Processing

EffectComposer, bloom, DOF, screen effects.

## Quick Start

```javascript
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, 0.4, 0.85  // strength, radius, threshold
));

function animate() {
  requestAnimationFrame(animate);
  composer.render(); // NOT renderer.render()
}
```

## Common Effects

### Bloom

```javascript
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, 0.4, 0.85
);
composer.addPass(bloomPass);

bloomPass.strength = 2.0;
bloomPass.threshold = 0.5;
bloomPass.radius = 0.8;
```

### Anti-Aliasing (FXAA/SMAA)

```javascript
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";

// FXAA
const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms["resolution"].value.set(1 / width, 1 / height);
composer.addPass(fxaaPass);

// SMAA (better quality)
const smaaPass = new SMAAPass(width * pixelRatio, height * pixelRatio);
composer.addPass(smaaPass);
```

### SSAO (Ambient Occlusion)

```javascript
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";

const ssaoPass = new SSAOPass(scene, camera, width, height);
ssaoPass.kernelRadius = 16;
ssaoPass.minDistance = 0.005;
ssaoPass.maxDistance = 0.1;
composer.addPass(ssaoPass);
```

### Depth of Field

```javascript
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";

const bokehPass = new BokehPass(scene, camera, {
  focus: 10.0, aperture: 0.025, maxblur: 0.01,
});
composer.addPass(bokehPass);

bokehPass.uniforms["focus"].value = distanceToTarget;
```

### Film Grain

```javascript
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";

const filmPass = new FilmPass(0.35, 0.5, 648, false);
composer.addPass(filmPass);
```

### Vignette

```javascript
import { VignetteShader } from "three/addons/shaders/VignetteShader.js";

const vignettePass = new ShaderPass(VignetteShader);
vignettePass.uniforms["offset"].value = 1.0;
vignettePass.uniforms["darkness"].value = 1.0;
composer.addPass(vignettePass);
```

### Outline

```javascript
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";

const outlinePass = new OutlinePass(
  new THREE.Vector2(width, height), scene, camera
);
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 0;
outlinePass.edgeThickness = 1;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.selectedObjects = [mesh1, mesh2];
composer.addPass(outlinePass);
```

### Glitch

```javascript
import { GlitchPass } from "three/addons/postprocessing/GlitchPass.js";

const glitchPass = new GlitchPass();
glitchPass.goWild = false;
composer.addPass(glitchPass);
```

## Custom ShaderPass

```javascript
const CustomShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      uv.x += sin(uv.y * 10.0 + time) * 0.01;
      gl_FragColor = texture2D(tDiffuse, uv);
    }
  `,
};

const customPass = new ShaderPass(CustomShader);
composer.addPass(customPass);
customPass.uniforms.time.value = clock.getElapsedTime();
```

## Combining Effects

```javascript
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloomPass);
composer.addPass(vignettePass);
composer.addPass(new ShaderPass(GammaCorrectionShader));
composer.addPass(fxaaPass); // Anti-aliasing last
```

## Handle Resize

```javascript
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = renderer.getPixelRatio();

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  composer.setSize(width, height);

  if (fxaaPass) {
    fxaaPass.material.uniforms["resolution"].value.set(
      1 / (width * pixelRatio), 1 / (height * pixelRatio)
    );
  }
}
```

## Performance Tips

1. **Limit passes**: Each adds a full-screen render
2. **Lower resolution**: Smaller render targets for blur
3. **Disable unused effects**: `pass.enabled = false`
4. **Use FXAA over MSAA**: Less expensive
