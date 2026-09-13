# Three.js Interaction

Raycasting, controls, mouse/touch input, object selection.

## Quick Start

```javascript
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    console.log("Clicked:", intersects[0].object);
  }
}

window.addEventListener("click", onClick);
```

## Raycaster

```javascript
const raycaster = new THREE.Raycaster();

// From camera
raycaster.setFromCamera(mousePosition, camera);

// From any origin and direction
raycaster.set(origin, direction);

// Get intersections
const intersects = raycaster.intersectObjects(objects, recursive);

// Intersection result:
// { distance, point, face, faceIndex, object, uv, normal, instanceId }
```

### Mouse Position

```javascript
const mouse = new THREE.Vector2();

function updateMouse(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// For specific canvas
function updateMouseCanvas(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}
```

### Touch Support

```javascript
function onTouchStart(event) {
  event.preventDefault();
  if (event.touches.length === 1) {
    const touch = event.touches[0];
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    // ... handle intersection
  }
}
```

## Camera Controls

### OrbitControls

```javascript
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 50;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.autoRotate = true;
controls.target.set(0, 1, 0);

function animate() {
  controls.update(); // Required for damping
}
```

### PointerLockControls (FPS)

```javascript
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const controls = new PointerLockControls(camera, document.body);

document.addEventListener("click", () => controls.lock());

controls.addEventListener("lock", () => console.log("Pointer locked"));
controls.addEventListener("unlock", () => console.log("Pointer unlocked"));
```

### MapControls

```javascript
import { MapControls } from "three/addons/controls/MapControls.js";

const controls = new MapControls(camera, renderer.domElement);
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;
```

## TransformControls

```javascript
import { TransformControls } from "three/addons/controls/TransformControls.js";

const transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls);

transformControls.attach(selectedMesh);
transformControls.setMode("translate"); // 'translate', 'rotate', 'scale'
transformControls.setSpace("local"); // 'local', 'world'

transformControls.addEventListener("dragging-changed", (event) => {
  orbitControls.enabled = !event.value;
});
```

## DragControls

```javascript
import { DragControls } from "three/addons/controls/DragControls.js";

const dragControls = new DragControls(draggableObjects, camera, renderer.domElement);

dragControls.addEventListener("dragstart", (event) => {
  orbitControls.enabled = false;
});

dragControls.addEventListener("dragend", (event) => {
  orbitControls.enabled = true;
});
```

## Selection & Hover

```javascript
let selectedObject = null;
let hoveredObject = null;

function onClick(event) {
  updateMouse(event);
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(selectableObjects);

  if (selectedObject) {
    selectedObject.material.emissive.set(0x000000);
  }

  if (intersects.length > 0) {
    selectedObject = intersects[0].object;
    selectedObject.material.emissive.set(0x444444);
  } else {
    selectedObject = null;
  }
}

function onMouseMove(event) {
  updateMouse(event);
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(hoverableObjects);

  if (hoveredObject) {
    hoveredObject.material.color.set(hoveredObject.userData.originalColor);
    document.body.style.cursor = "default";
  }

  if (intersects.length > 0) {
    hoveredObject = intersects[0].object;
    if (!hoveredObject.userData.originalColor) {
      hoveredObject.userData.originalColor = hoveredObject.material.color.getHex();
    }
    hoveredObject.material.color.set(0xff6600);
    document.body.style.cursor = "pointer";
  }
}
```

## Keyboard Input

```javascript
const keys = {};

document.addEventListener("keydown", (e) => keys[e.code] = true);
document.addEventListener("keyup", (e) => keys[e.code] = false);

function update() {
  const speed = 0.1;
  if (keys["KeyW"]) player.position.z -= speed;
  if (keys["KeyS"]) player.position.z += speed;
  if (keys["KeyA"]) player.position.x -= speed;
  if (keys["KeyD"]) player.position.x += speed;
}
```

## Coordinate Conversion

```javascript
// World to Screen
function worldToScreen(position, camera) {
  const vector = position.clone().project(camera);
  return {
    x: ((vector.x + 1) / 2) * window.innerWidth,
    y: (-(vector.y - 1) / 2) * window.innerHeight,
  };
}

// Screen to World (on plane)
function screenToWorld(screenX, screenY, camera, targetZ = 0) {
  const vector = new THREE.Vector3(
    (screenX / window.innerWidth) * 2 - 1,
    -(screenY / window.innerHeight) * 2 + 1,
    0.5
  ).unproject(camera);

  const dir = vector.sub(camera.position).normalize();
  const distance = (targetZ - camera.position.z) / dir.z;
  return camera.position.clone().add(dir.multiplyScalar(distance));
}
```

## Performance Tips

1. **Limit raycasts**: Throttle mousemove handlers
2. **Use layers**: Filter raycast targets
3. **Simple collision meshes**: Use invisible simpler geometry
4. **Disable controls when not needed**: `controls.enabled = false`
