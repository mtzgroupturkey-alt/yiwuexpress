# Three.js Shaders

GLSL, ShaderMaterial, uniforms, custom effects.

## Quick Start

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
});

material.uniforms.time.value = clock.getElapsedTime();
```

## ShaderMaterial vs RawShaderMaterial

**ShaderMaterial** - Three.js provides built-in uniforms:
- `modelMatrix`, `modelViewMatrix`, `projectionMatrix`, `viewMatrix`
- `normalMatrix`, `cameraPosition`
- Attributes: `position`, `normal`, `uv`

**RawShaderMaterial** - Full control, you define everything.

## Uniforms

```javascript
uniforms: {
  floatValue: { value: 1.5 },
  vec2Value: { value: new THREE.Vector2(1, 2) },
  vec3Value: { value: new THREE.Vector3(1, 2, 3) },
  colorValue: { value: new THREE.Color(0xff0000) },
  textureValue: { value: texture },
  floatArray: { value: [1.0, 2.0, 3.0] },
}

// Update
material.uniforms.time.value = clock.getElapsedTime();
```

## Varyings

```javascript
vertexShader: `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
fragmentShader: `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);
  }
`,
```

## Common Patterns

### Texture Sampling

```glsl
uniform sampler2D map;
varying vec2 vUv;

void main() {
  vec4 texColor = texture2D(map, vUv);
  gl_FragColor = texColor;
}
```

### Vertex Displacement

```glsl
uniform float time;

void main() {
  vec3 pos = position;
  pos.z += sin(pos.x * 5.0 + time) * 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

### Fresnel Effect

```glsl
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
  vec3 color = mix(vec3(0.0, 0.0, 0.5), vec3(0.5, 0.8, 1.0), fresnel);
  gl_FragColor = vec4(color, 1.0);
}
```

### Noise

```glsl
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
}
```

### Gradient

```glsl
vec3 color = mix(colorA, colorB, vUv.y);
```

## Extending Built-in Materials

```javascript
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

material.onBeforeCompile = (shader) => {
  shader.uniforms.time = { value: 0 };
  material.userData.shader = shader;

  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `
    #include <begin_vertex>
    transformed.y += sin(position.x * 10.0 + time) * 0.1;
    `
  );
  shader.vertexShader = "uniform float time;\n" + shader.vertexShader;
};

// Update
if (material.userData.shader) {
  material.userData.shader.uniforms.time.value = clock.getElapsedTime();
}
```

## GLSL Functions

```glsl
// Math
abs(x), sign(x), floor(x), ceil(x), fract(x)
mod(x, y), min(x, y), max(x, y), clamp(x, min, max)
mix(a, b, t), step(edge, x), smoothstep(edge0, edge1, x)
sin(x), cos(x), pow(x, y), sqrt(x)

// Vector
length(v), distance(p0, p1), dot(x, y), cross(x, y), normalize(v)
reflect(I, N), refract(I, N, eta)
```

## Material Properties

```javascript
const material = new THREE.ShaderMaterial({
  transparent: true,
  side: THREE.DoubleSide,
  depthTest: true,
  depthWrite: true,
  blending: THREE.NormalBlending,
  extensions: {
    derivatives: true,  // For fwidth, dFdx, dFdy
  },
});
```

## Performance Tips

1. **Minimize uniforms**: Group values into vectors
2. **Avoid conditionals**: Use mix/step instead of if/else
3. **Precalculate**: Move calculations to JS when possible
4. **Use textures**: For complex functions, use lookup tables

```glsl
// Instead of if/else:
color = mix(colorB, colorA, step(0.5, value));
```
