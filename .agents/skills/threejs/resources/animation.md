# Three.js Animation

Keyframe animation, skeletal animation, morph targets, animation mixing.

## Animation System

Three.js animation has three main components:
1. **AnimationClip** - Container for keyframe data
2. **AnimationMixer** - Plays animations on a root object
3. **AnimationAction** - Controls playback of a clip

## Quick Start

```javascript
const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  mesh.rotation.y += delta;
  mesh.position.y = Math.sin(elapsed) * 0.5;

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
```

## Loading GLTF Animations

```javascript
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
loader.load("model.glb", (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  const mixer = new THREE.AnimationMixer(model);
  const clips = gltf.animations;

  // Play first animation
  if (clips.length > 0) {
    mixer.clipAction(clips[0]).play();
  }

  // Play by name
  const walkClip = THREE.AnimationClip.findByName(clips, "Walk");
  if (walkClip) mixer.clipAction(walkClip).play();

  // Update in animation loop
  function animate() {
    mixer.update(clock.getDelta());
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
});
```

## AnimationAction

```javascript
const action = mixer.clipAction(clip);

action.play();
action.stop();
action.reset();
action.paused = false;

action.time = 0.5;         // Current time
action.timeScale = 1;      // Speed (negative = reverse)
action.weight = 1;         // Blend weight

action.loop = THREE.LoopRepeat;    // Loop forever
action.loop = THREE.LoopOnce;      // Play once
action.loop = THREE.LoopPingPong;  // Alternate
action.clampWhenFinished = true;   // Hold last frame

// Fade in/out
action.reset().fadeIn(0.5).play();
action.fadeOut(0.5);

// Crossfade
action1.crossFadeTo(action2, 0.5, true);
action2.play();
```

## Skeletal Animation

```javascript
const skinnedMesh = model.getObjectByProperty("type", "SkinnedMesh");
const skeleton = skinnedMesh.skeleton;

// Find bone
const headBone = skeleton.bones.find(b => b.name === "Head");
if (headBone) headBone.rotation.y = Math.PI / 4;

// Skeleton helper
const helper = new THREE.SkeletonHelper(model);
scene.add(helper);

// Attach object to bone
const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
const handBone = skeleton.bones.find(b => b.name === "RightHand");
if (handBone) handBone.add(weapon);
```

## Morph Targets

```javascript
mesh.morphTargetInfluences[0] = 0.5;

const smileIndex = mesh.morphTargetDictionary["smile"];
mesh.morphTargetInfluences[smileIndex] = 1;

// Animate
function animate() {
  const t = clock.getElapsedTime();
  mesh.morphTargetInfluences[0] = (Math.sin(t) + 1) / 2;
}
```

## Animation Blending

```javascript
const idleAction = mixer.clipAction(idleClip);
const walkAction = mixer.clipAction(walkClip);

idleAction.play();
walkAction.play();

function updateAnimations(speed) {
  const t = Math.min(speed / 5, 1);
  idleAction.setEffectiveWeight(1 - t);
  walkAction.setEffectiveWeight(t);
}
```

## Keyframe Animation

```javascript
const times = [0, 1, 2];
const values = [0, 1, 0];
const track = new THREE.NumberKeyframeTrack(".position[y]", times, values);
const clip = new THREE.AnimationClip("bounce", 2, [track]);

// Vector track
new THREE.VectorKeyframeTrack(".position", [0, 1], [0, 0, 0, 1, 2, 0]);

// Quaternion track
new THREE.QuaternionKeyframeTrack(".quaternion", [0, 1], [...q1, ...q2]);

// Color track
new THREE.ColorKeyframeTrack(".material.color", [0, 1], [1, 0, 0, 0, 1, 0]);
```

## Performance Tips

1. **Share clips**: Same clip on multiple mixers
2. **Optimize clips**: `clip.optimize()`
3. **Disable when off-screen**: Pause for invisible objects
4. **LOD for animations**: Simpler rigs for distant characters
