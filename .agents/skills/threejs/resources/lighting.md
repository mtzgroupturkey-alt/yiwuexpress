# Three.js Lighting

Light types, shadows, environment lighting.

## Light Types Overview

| Light | Description | Shadow | Cost |
|-------|-------------|--------|------|
| AmbientLight | Uniform everywhere | No | Very Low |
| HemisphereLight | Sky/ground gradient | No | Very Low |
| DirectionalLight | Parallel rays (sun) | Yes | Low |
| PointLight | Omnidirectional (bulb) | Yes | Medium |
| SpotLight | Cone-shaped | Yes | Medium |
| RectAreaLight | Area light (window) | No* | High |

## AmbientLight

```javascript
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);
```

## HemisphereLight

```javascript
const hemi = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.6);
hemi.position.set(0, 50, 0);
scene.add(hemi);
```

## DirectionalLight

```javascript
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
dirLight.target.position.set(0, 0, 0);
scene.add(dirLight.target);
scene.add(dirLight);

// Shadows
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
dirLight.shadow.bias = -0.0001;
dirLight.shadow.normalBias = 0.02;
```

## PointLight

```javascript
const pointLight = new THREE.PointLight(0xffffff, 1, 100, 2);
pointLight.position.set(0, 5, 0);
scene.add(pointLight);

pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
```

## SpotLight

```javascript
const spotLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 6, 0.5, 2);
spotLight.position.set(0, 10, 0);
spotLight.target.position.set(0, 0, 0);
scene.add(spotLight.target);
scene.add(spotLight);

spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
```

## RectAreaLight

```javascript
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

RectAreaLightUniformsLib.init();

const rectLight = new THREE.RectAreaLight(0xffffff, 5, 4, 2);
rectLight.position.set(0, 5, 0);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);
```

## Shadow Setup

```javascript
// 1. Enable on renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 2. Enable on light
light.castShadow = true;

// 3. Enable on objects
mesh.castShadow = true;
mesh.receiveShadow = true;
floor.receiveShadow = true;
```

## Environment Lighting (IBL)

```javascript
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader().load("environment.hdr", (texture) => {
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  scene.environment = envMap;
  scene.background = envMap;
  scene.backgroundBlurriness = 0; // 0-1
  texture.dispose();
  pmremGenerator.dispose();
});
```

## Light Helpers

```javascript
const dirHelper = new THREE.DirectionalLightHelper(dirLight, 5);
const pointHelper = new THREE.PointLightHelper(pointLight, 1);
const spotHelper = new THREE.SpotLightHelper(spotLight);
scene.add(dirHelper, pointHelper, spotHelper);
```

## Common Lighting Setups

### Three-Point Lighting

```javascript
const keyLight = new THREE.DirectionalLight(0xffffff, 1);
keyLight.position.set(5, 5, 5);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-5, 3, 5);

const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
backLight.position.set(0, 5, -5);

const ambient = new THREE.AmbientLight(0x404040, 0.3);

scene.add(keyLight, fillLight, backLight, ambient);
```

### Outdoor Daylight

```javascript
const sun = new THREE.DirectionalLight(0xffffcc, 1.5);
sun.position.set(50, 100, 50);
sun.castShadow = true;

const hemi = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.6);

scene.add(sun, hemi);
```

## Performance Tips

1. **Limit light count**: Each light adds shader complexity
2. **Smaller shadow maps**: 512-1024 often sufficient
3. **Tight shadow frustums**: Only cover needed area
4. **Use light layers**: Exclude objects from certain lights
