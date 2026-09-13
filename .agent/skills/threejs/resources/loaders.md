# Three.js Loaders

GLTF, textures, images, models, async patterns.

## LoadingManager

```javascript
const manager = new THREE.LoadingManager();

manager.onStart = (url, loaded, total) => console.log(`Started: ${url}`);
manager.onLoad = () => console.log("All assets loaded!");
manager.onProgress = (url, loaded, total) => {
  console.log(`Loading: ${(loaded / total * 100).toFixed(1)}%`);
};
manager.onError = (url) => console.error(`Error: ${url}`);

const textureLoader = new THREE.TextureLoader(manager);
const gltfLoader = new GLTFLoader(manager);
```

## Texture Loading

```javascript
const loader = new THREE.TextureLoader();
const texture = loader.load("texture.jpg");

// With configuration
loader.load("texture.jpg", (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
});

// CubeTexture
const cubeLoader = new THREE.CubeTextureLoader();
const cubeTexture = cubeLoader.load([
  "px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"
]);
scene.background = cubeTexture;
scene.environment = cubeTexture;
```

## HDR/EXR Loading

```javascript
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";

// HDR
new RGBELoader().load("environment.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = texture;
});

// With PMREMGenerator (better reflections)
const pmremGenerator = new THREE.PMREMGenerator(renderer);
new RGBELoader().load("environment.hdr", (texture) => {
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  scene.environment = envMap;
  texture.dispose();
  pmremGenerator.dispose();
});
```

## GLTF/GLB Loading

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

  // Animations
  if (gltf.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach(clip => mixer.clipAction(clip).play());
  }

  // Center and scale
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
});
```

## GLTF with Draco Compression

```javascript
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
dracoLoader.preload();

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.load("compressed-model.glb", (gltf) => scene.add(gltf.scene));
```

## Other Model Formats

```javascript
// FBX
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
new FBXLoader().load("model.fbx", (object) => {
  object.scale.setScalar(0.01);
  scene.add(object);
});

// OBJ + MTL
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
new MTLLoader().load("model.mtl", (materials) => {
  materials.preload();
  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.load("model.obj", (object) => scene.add(object));
});

// STL
import { STLLoader } from "three/addons/loaders/STLLoader.js";
new STLLoader().load("model.stl", (geometry) => {
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
});
```

## Async/Promise Pattern

```javascript
function loadModel(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

async function init() {
  const [modelGltf, envTexture, colorTexture] = await Promise.all([
    loadGLTF("model.glb"),
    loadRGBE("environment.hdr"),
    loadTexture("color.jpg"),
  ]);
  scene.add(modelGltf.scene);
  scene.environment = envTexture;
}
```

## Caching

```javascript
THREE.Cache.enabled = true;
THREE.Cache.clear();
```

## Custom Paths

```javascript
loader.setPath("assets/models/");
loader.load("model.glb"); // Loads from assets/models/model.glb

loader.setResourcePath("assets/textures/");
```

## Error Handling

```javascript
async function loadWithFallback(primaryUrl, fallbackUrl) {
  try {
    return await loadModel(primaryUrl);
  } catch (error) {
    return await loadModel(fallbackUrl);
  }
}
```

## Performance Tips

1. **Use compressed formats**: DRACO for geometry, KTX2 for textures
2. **Load progressively**: Show placeholders while loading
3. **Lazy load**: Only load what's needed
4. **Enable cache**: `THREE.Cache.enabled = true`
