# Three.js Materials

PBR, basic, phong, shader materials, material properties.

## Material Types Overview

| Material | Use Case | Lighting |
|----------|----------|----------|
| MeshBasicMaterial | Unlit, flat colors | No |
| MeshLambertMaterial | Matte surfaces | Yes (diffuse only) |
| MeshPhongMaterial | Shiny surfaces | Yes |
| MeshStandardMaterial | PBR, realistic | Yes (PBR) |
| MeshPhysicalMaterial | Advanced PBR | Yes (PBR+) |
| MeshToonMaterial | Cel-shaded | Yes (toon) |
| ShaderMaterial | Custom GLSL | Custom |

## MeshBasicMaterial

No lighting. Fast, always visible.

```javascript
const material = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
  wireframe: false,
  map: texture,
  envMap: envTexture,
});
```

## MeshStandardMaterial (PBR)

Recommended for realistic results.

```javascript
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.5,       // 0 = mirror, 1 = diffuse
  metalness: 0.0,       // 0 = dielectric, 1 = metal

  map: colorTexture,           // Albedo (sRGB)
  roughnessMap: roughTexture,  // Per-pixel roughness
  metalnessMap: metalTexture,  // Per-pixel metalness
  normalMap: normalTexture,    // Surface detail
  normalScale: new THREE.Vector2(1, 1),
  aoMap: aoTexture,            // Ambient occlusion (uses uv2!)
  aoMapIntensity: 1,
  displacementMap: dispTexture,
  displacementScale: 0.1,

  emissive: 0x000000,
  emissiveIntensity: 1,
  emissiveMap: emissiveTexture,

  envMap: envTexture,
  envMapIntensity: 1,
});

// Note: aoMap requires second UV channel
geometry.setAttribute("uv2", geometry.attributes.uv);
```

## MeshPhysicalMaterial (Advanced PBR)

```javascript
const material = new THREE.MeshPhysicalMaterial({
  // All MeshStandardMaterial properties plus:

  // Clearcoat (car paint)
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,

  // Transmission (glass)
  transmission: 1.0,
  thickness: 0.5,
  ior: 1.5,

  // Sheen (fabric)
  sheen: 1.0,
  sheenRoughness: 0.5,
  sheenColor: new THREE.Color(0xffffff),

  // Iridescence (soap bubbles)
  iridescence: 1.0,
  iridescenceIOR: 1.3,
});

// Glass example
const glass = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, metalness: 0, roughness: 0,
  transmission: 1, thickness: 0.5, ior: 1.5,
});

// Car paint example
const carPaint = new THREE.MeshPhysicalMaterial({
  color: 0xff0000, metalness: 0.9, roughness: 0.5,
  clearcoat: 1, clearcoatRoughness: 0.1,
});
```

## MeshPhongMaterial

Specular highlights for shiny surfaces.

```javascript
const material = new THREE.MeshPhongMaterial({
  color: 0x0000ff,
  specular: 0xffffff,
  shininess: 100,
  normalMap: normalTexture,
});
```

## MeshToonMaterial

Cel-shaded cartoon look.

```javascript
const material = new THREE.MeshToonMaterial({
  color: 0x00ff00,
  gradientMap: gradientTexture,
});
```

## PointsMaterial

For point clouds.

```javascript
const material = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.1,
  sizeAttenuation: true,
  map: pointTexture,
  transparent: true,
  alphaTest: 0.5,
});
```

## LineBasicMaterial

```javascript
const material = new THREE.LineBasicMaterial({ color: 0xffffff });

const dashedMaterial = new THREE.LineDashedMaterial({
  color: 0xffffff, dashSize: 0.5, gapSize: 0.25,
});
line.computeLineDistances(); // Required for dashed
```

## ShaderMaterial

Custom GLSL shaders.

```javascript
const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0xff0000) },
  },
  vertexShader: `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    void main() {
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
});

// Update uniform
material.uniforms.time.value = clock.getElapsedTime();
```

## Common Properties

```javascript
material.visible = true;
material.transparent = false;
material.opacity = 1.0;
material.alphaTest = 0;
material.side = THREE.FrontSide; // FrontSide, BackSide, DoubleSide
material.depthTest = true;
material.depthWrite = true;
material.blending = THREE.NormalBlending;
```

## Multiple Materials

```javascript
const materials = [
  new THREE.MeshBasicMaterial({ color: 0xff0000 }), // right
  new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // left
  new THREE.MeshBasicMaterial({ color: 0x0000ff }), // top
  new THREE.MeshBasicMaterial({ color: 0xffff00 }), // bottom
  new THREE.MeshBasicMaterial({ color: 0xff00ff }), // front
  new THREE.MeshBasicMaterial({ color: 0x00ffff }), // back
];
const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);
```

## Environment Maps

```javascript
const cubeLoader = new THREE.CubeTextureLoader();
const envMap = cubeLoader.load(["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"]);
scene.environment = envMap;
material.envMap = envMap;

// HDR (recommended)
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
new RGBELoader().load("environment.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
});
```

## Performance Tips

1. **Reuse materials**: Same material = batched draw calls
2. **Use alphaTest instead of transparency**: When applicable, faster
3. **Choose simpler materials**: Basic > Lambert > Phong > Standard > Physical
4. **Dispose when done**: `material.dispose()`
