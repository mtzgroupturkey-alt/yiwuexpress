# Three.js Geometry

Built-in shapes, BufferGeometry, custom geometry, instancing.

## Built-in Geometries

```javascript
// Basic shapes
new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
new THREE.SphereGeometry(1, 32, 32);
new THREE.PlaneGeometry(10, 10, 1, 1);
new THREE.CircleGeometry(1, 32);
new THREE.CylinderGeometry(1, 1, 2, 32);
new THREE.ConeGeometry(1, 2, 32);
new THREE.TorusGeometry(1, 0.4, 16, 100);
new THREE.TorusKnotGeometry(1, 0.4, 100, 16, 2, 3);
new THREE.RingGeometry(0.5, 1, 32);
new THREE.CapsuleGeometry(0.5, 1, 4, 8);

// Platonic solids
new THREE.DodecahedronGeometry(1, 0);
new THREE.IcosahedronGeometry(1, 0);
new THREE.OctahedronGeometry(1, 0);
new THREE.TetrahedronGeometry(1, 0);
```

## Path-Based Shapes

```javascript
// Lathe - revolve profile around Y axis
const points = [new THREE.Vector2(0, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0.5, 1)];
new THREE.LatheGeometry(points, 32);

// Extrude - extend 2D shape into 3D
const shape = new THREE.Shape();
shape.moveTo(0, 0);
shape.lineTo(1, 0);
shape.lineTo(1, 1);
shape.lineTo(0, 0);
new THREE.ExtrudeGeometry(shape, { steps: 2, depth: 1, bevelEnabled: true });

// Tube - geometry along a curve
const curve = new THREE.CatmullRomCurve3([...points3D]);
new THREE.TubeGeometry(curve, 64, 0.2, 8, false);
```

## Text Geometry

```javascript
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

const loader = new FontLoader();
loader.load("fonts/helvetiker_regular.typeface.json", (font) => {
  const geometry = new TextGeometry("Hello", {
    font: font, size: 1, depth: 0.2,
    curveSegments: 12, bevelEnabled: true,
    bevelThickness: 0.03, bevelSize: 0.02
  });
  geometry.center();
});
```

## Custom BufferGeometry

```javascript
const geometry = new THREE.BufferGeometry();

// Vertices (x, y, z per vertex)
const vertices = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);
geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

// Indices (for indexed geometry)
const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
geometry.setIndex(new THREE.BufferAttribute(indices, 1));

// Normals (for lighting)
const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));

// UVs (for texturing)
const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

// Recompute normals
geometry.computeVertexNormals();
geometry.computeBoundingBox();
```

## Modifying Geometry

```javascript
const positions = geometry.attributes.position;
positions.setXYZ(index, x, y, z);
positions.needsUpdate = true;
geometry.computeVertexNormals();
```

## Edges & Wireframe

```javascript
// Edge lines (only hard edges)
const edges = new THREE.EdgesGeometry(boxGeometry, 15);
const edgeMesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));

// Wireframe (all triangles)
const wireframe = new THREE.WireframeGeometry(boxGeometry);
const wireMesh = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ color: 0xffffff }));
```

## Points & Lines

```javascript
// Point cloud
const points = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.1, color: 0xffffff }));

// Line
const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xff0000 }));

// Line loop (closed)
const loop = new THREE.LineLoop(geometry, material);
```

## InstancedMesh

Efficiently render many copies.

```javascript
const count = 1000;
const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

const dummy = new THREE.Object3D();
for (let i = 0; i < count; i++) {
  dummy.position.set(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10);
  dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  dummy.scale.setScalar(0.5 + Math.random());
  dummy.updateMatrix();
  instancedMesh.setMatrixAt(i, dummy.matrix);
}
instancedMesh.instanceMatrix.needsUpdate = true;

// Per-instance colors
for (let i = 0; i < count; i++) {
  instancedMesh.setColorAt(i, new THREE.Color(Math.random(), Math.random(), Math.random()));
}
instancedMesh.instanceColor.needsUpdate = true;
```

## Geometry Utilities

```javascript
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Merge geometries
const merged = BufferGeometryUtils.mergeGeometries([geo1, geo2, geo3]);

// Center geometry
geometry.center();

// Scale to fit
geometry.computeBoundingBox();
const size = new THREE.Vector3();
geometry.boundingBox.getSize(size);
const maxDim = Math.max(size.x, size.y, size.z);
geometry.scale(1 / maxDim, 1 / maxDim, 1 / maxDim);
```

## Morph Targets

```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
const morphPositions = geometry.attributes.position.array.slice();

// Modify morph target positions...
geometry.morphAttributes.position = [new THREE.BufferAttribute(new Float32Array(morphPositions), 3)];

const mesh = new THREE.Mesh(geometry, material);
mesh.morphTargetInfluences[0] = 0.5; // 50% blend
```
