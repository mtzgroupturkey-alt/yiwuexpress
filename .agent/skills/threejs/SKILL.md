---
name: threejs
description: Complete Three.js development guide - scene setup, geometry, materials, lighting, textures, animation, loaders, shaders, post-processing, and interaction. Use when building 3D web applications, creating WebGL scenes, loading 3D models, adding visual effects, or implementing user interaction.
---

# Three.js Complete Guide

Comprehensive skill for Three.js 3D development covering all essential aspects from scene setup to advanced effects.

## When to Use This Skill

- Setting up 3D scenes with cameras and renderers
- Creating and manipulating 3D geometry
- Applying materials and textures
- Adding lighting and shadows
- Loading 3D models (GLTF, FBX, OBJ)
- Creating animations (keyframe, skeletal, morph targets)
- Writing custom shaders (GLSL)
- Adding post-processing effects (bloom, DOF, SSAO)
- Implementing user interaction (raycasting, controls)

## Quick Start

```javascript
import * as THREE from "three";

// Create scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Add a mesh
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add light
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

camera.position.z = 5;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();

// Handle resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

## Skill Components

This skill is organized into specialized areas. Each resource file contains detailed API references, code examples, and best practices:

### Core Components

| Component | Description | Resource |
|-----------|-------------|----------|
| **Fundamentals** | Scene, cameras, renderer, Object3D, math utilities | [fundamentals.md](./resources/fundamentals.md) |
| **Geometry** | Built-in shapes, BufferGeometry, instancing | [geometry.md](./resources/geometry.md) |
| **Materials** | PBR, basic, phong, shader materials | [materials.md](./resources/materials.md) |
| **Lighting** | Light types, shadows, environment lighting | [lighting.md](./resources/lighting.md) |
| **Textures** | Texture types, UV mapping, environment maps | [textures.md](./resources/textures.md) |

### Advanced Features

| Component | Description | Resource |
|-----------|-------------|----------|
| **Animation** | Keyframe, skeletal, morph targets, blending | [animation.md](./resources/animation.md) |
| **Loaders** | GLTF, textures, HDR, async patterns | [loaders.md](./resources/loaders.md) |
| **Shaders** | GLSL, ShaderMaterial, custom effects | [shaders.md](./resources/shaders.md) |
| **Post-Processing** | Bloom, DOF, SSAO, screen effects | [postprocessing.md](./resources/postprocessing.md) |
| **Interaction** | Raycasting, controls, mouse/touch input | [interaction.md](./resources/interaction.md) |

## Common Patterns

### Loading a GLTF Model

```javascript
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
loader.load("model.glb", (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  // Enable shadows
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Play animations
  if (gltf.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
  }
});
```

### Adding Orbit Controls

```javascript
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Required for damping
  renderer.render(scene, camera);
}
```

### Raycasting for Click Detection

```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    console.log("Clicked:", intersects[0].object);
  }
}

window.addEventListener("click", onClick);
```

### PBR Material Setup

```javascript
const material = new THREE.MeshStandardMaterial({
  map: colorTexture,           // Albedo (sRGB)
  normalMap: normalTexture,    // Surface detail
  roughnessMap: roughTexture,  // Roughness
  metalnessMap: metalTexture,  // Metalness
  aoMap: aoTexture,            // Ambient occlusion (requires uv2)
  envMap: envTexture,          // Reflections
});

// Required for aoMap
geometry.setAttribute("uv2", geometry.attributes.uv);
```

### Post-Processing with Bloom

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
  composer.render(); // Use composer instead of renderer
}
```

## Performance Best Practices

| Practice | Description |
|----------|-------------|
| **Merge geometries** | Reduce draw calls for static objects |
| **Use InstancedMesh** | For many identical objects |
| **Limit lights** | Each light adds shader complexity |
| **Optimize shadows** | Smaller maps, tight frustums |
| **Dispose resources** | Call `.dispose()` on unused geometry/materials/textures |
| **Frustum culling** | Enabled by default, ensure bounding boxes are correct |
| **LOD (Level of Detail)** | Use `THREE.LOD` for distance-based mesh switching |

```javascript
// Proper cleanup
function dispose() {
  mesh.geometry.dispose();
  mesh.material.dispose();
  texture.dispose();
  scene.remove(mesh);
  renderer.dispose();
}
```

## Import Paths

Three.js r150+ uses modern import paths:

```javascript
// Core
import * as THREE from "three";

// Addons (loaders, controls, effects)
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
```

## Decision Tree

```
What do you need?
├── Basic 3D scene → See fundamentals.md
├── Create shapes
│   ├── Built-in (box, sphere, etc.) → See geometry.md
│   └── Custom vertices → See geometry.md (BufferGeometry)
├── Style objects
│   ├── Simple colors → MeshBasicMaterial
│   ├── Realistic rendering → MeshStandardMaterial (see materials.md)
│   └── Custom effects → ShaderMaterial (see shaders.md)
├── Add lighting
│   ├── Basic → AmbientLight + DirectionalLight
│   ├── Realistic → HDR environment (see lighting.md)
│   └── Shadows → See lighting.md (shadow setup)
├── Load assets
│   ├── 3D models → GLTFLoader (see loaders.md)
│   ├── Textures → TextureLoader (see textures.md)
│   └── HDR environments → RGBELoader (see loaders.md)
├── Animate
│   ├── Simple rotation/movement → requestAnimationFrame + Clock
│   ├── Keyframe animations → AnimationMixer (see animation.md)
│   └── Character animation → Skeletal (see animation.md)
├── User interaction
│   ├── Camera controls → OrbitControls (see interaction.md)
│   ├── Click detection → Raycaster (see interaction.md)
│   └── Object manipulation → TransformControls (see interaction.md)
└── Visual effects
    ├── Bloom/glow → UnrealBloomPass (see postprocessing.md)
    ├── Depth of field → BokehPass (see postprocessing.md)
    └── Custom shaders → ShaderMaterial (see shaders.md)
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Black screen | Check camera position, add lights, verify renderer.render() is called |
| Model too small/large | Scale with `model.scale.setScalar(value)` |
| Textures look washed out | Set `texture.colorSpace = THREE.SRGBColorSpace` |
| Shadow acne | Adjust `light.shadow.bias` and `normalBias` |
| Memory leaks | Call `.dispose()` on removed resources |
| Low FPS | Reduce geometry complexity, limit shadows, use instancing |
