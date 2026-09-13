# Three.js Textures

Texture types, UV mapping, environment maps, texture settings.

## Basic Loading

```javascript
const loader = new THREE.TextureLoader();
const texture = loader.load("texture.jpg");
material.map = texture;

// With callbacks
loader.load("texture.jpg",
  (texture) => console.log("Loaded"),
  (progress) => console.log("Progress"),
  (error) => console.error("Error")
);
```

## Texture Configuration

```javascript
// Color space (critical for color accuracy)
colorTexture.colorSpace = THREE.SRGBColorSpace;  // For color/albedo
// Leave default for data textures (normal, roughness, metalness)

// Wrapping
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
// ClampToEdgeWrapping, RepeatWrapping, MirroredRepeatWrapping

// Repeat, offset, rotation
texture.repeat.set(4, 4);
texture.offset.set(0.5, 0.5);
texture.rotation = Math.PI / 4;
texture.center.set(0.5, 0.5);

// Filtering
texture.minFilter = THREE.LinearMipmapLinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
```

## Texture Types

### DataTexture

```javascript
const size = 256;
const data = new Uint8Array(size * size * 4);
for (let i = 0; i < size * size * 4; i += 4) {
  data[i] = 255;     // R
  data[i + 1] = 0;   // G
  data[i + 2] = 0;   // B
  data[i + 3] = 255; // A
}
const texture = new THREE.DataTexture(data, size, size);
texture.needsUpdate = true;
```

### CanvasTexture

```javascript
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "red";
ctx.fillRect(0, 0, 256, 256);
const texture = new THREE.CanvasTexture(canvas);
```

### VideoTexture

```javascript
const video = document.createElement("video");
video.src = "video.mp4";
video.loop = true;
video.muted = true;
video.play();
const texture = new THREE.VideoTexture(video);
texture.colorSpace = THREE.SRGBColorSpace;
```

## Cube Textures

```javascript
const loader = new THREE.CubeTextureLoader();
const cubeTexture = loader.load([
  "px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"
]);
scene.background = cubeTexture;
scene.environment = cubeTexture;
```

## HDR Textures

```javascript
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

new RGBELoader().load("environment.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = texture;
});

// With PMREMGenerator for better reflections
const pmremGenerator = new THREE.PMREMGenerator(renderer);
new RGBELoader().load("environment.hdr", (texture) => {
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  scene.environment = envMap;
  texture.dispose();
  pmremGenerator.dispose();
});
```

## Render Targets

```javascript
const renderTarget = new THREE.WebGLRenderTarget(512, 512, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
});

renderer.setRenderTarget(renderTarget);
renderer.render(scene, camera);
renderer.setRenderTarget(null);

material.map = renderTarget.texture;
```

## UV Mapping

```javascript
// Access UVs
const uvs = geometry.attributes.uv;
uvs.setXY(vertexIndex, newU, newV);
uvs.needsUpdate = true;

// Second UV channel (for aoMap)
geometry.setAttribute("uv2", geometry.attributes.uv);
```

## PBR Texture Set

```javascript
const material = new THREE.MeshStandardMaterial({
  map: colorTexture,            // Albedo (sRGB)
  normalMap: normalTexture,     // Surface detail
  roughnessMap: roughTexture,   // Roughness
  metalnessMap: metalTexture,   // Metalness
  aoMap: aoTexture,             // Ambient occlusion (uses uv2)
  emissiveMap: emissiveTexture, // Self-illumination
  displacementMap: dispTexture, // Vertex displacement
  alphaMap: alphaTexture,       // Transparency
});
geometry.setAttribute("uv2", geometry.attributes.uv);
```

## Memory Management

```javascript
texture.dispose();

function disposeMaterial(material) {
  const maps = ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap"];
  maps.forEach(mapName => {
    if (material[mapName]) material[mapName].dispose();
  });
  material.dispose();
}
```

## Performance Tips

1. **Use power-of-2 dimensions**: 256, 512, 1024, 2048
2. **Compress textures**: KTX2/Basis for web
3. **Use texture atlases**: Reduce texture switches
4. **Enable mipmaps**: For distant objects
5. **Limit texture size**: 2048 usually sufficient
