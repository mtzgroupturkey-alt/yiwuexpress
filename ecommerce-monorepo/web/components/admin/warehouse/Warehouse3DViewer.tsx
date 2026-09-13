'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three-stdlib'

export interface Warehouse3DItem {
  sku?: string
  name?: string
  category?: string
  location: string
  stock?: string | number
  occupancy?: string
  route?: {
    zone: string
    bay: string
    level: string
  }
}

interface Warehouse3DViewerProps {
  warehouse: any
  items?: Warehouse3DItem[]
  selectedLocation?: string
  onSelectLocation?: (locationCode: string) => void
  onClose?: () => void
  layoutPositions?: Record<
    string,
    { x: number; y: number; w?: number; h?: number; orientation?: 'vertical' | 'horizontal' }
  >
}

export function Warehouse3DViewer({
  warehouse,
  layoutPositions: propLayoutPositions,
}: Warehouse3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Three.js instances and dynamic group containers
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const animFrameIdRef = useRef<number | null>(null)

  const groundRootRef = useRef<THREE.Group | null>(null)
  const rackRootRef = useRef<THREE.Group | null>(null)
  const floorBayRootRef = useRef<THREE.Group | null>(null)
  const bulkLaneRootRef = useRef<THREE.Group | null>(null)
  const labelsGroupRef = useRef<THREE.Group | null>(null)

  // Helper to dispose geometry, materials and remove children cleanly
  const clearGroup = (group: THREE.Group | null) => {
    if (!group) return
    while (group.children.length > 0) {
      const obj = group.children[0]
      group.remove(obj)
      obj.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => {
              if (m.map) m.map.dispose()
              m.dispose()
            })
          } else {
            if (child.material.map) child.material.map.dispose()
            child.material.dispose()
          }
        }
      })
    }
  }

  // 1. Realistic Industrial Concrete Floor Texture Generator
  const createRealisticConcreteTexture = () => {
    const cvs = document.createElement('canvas')
    cvs.width = 1024
    cvs.height = 1024
    const ctx = cvs.getContext('2d')!

    // Base industrial concrete tone (warm mid-dark grey slab)
    ctx.fillStyle = '#272c36'
    ctx.fillRect(0, 0, 1024, 1024)

    // Soft organic cloud-like tonal variation (curing, wear, moisture)
    const clouds = 60
    for (let i = 0; i < clouds; i++) {
      const cx = Math.random() * 1024
      const cy = Math.random() * 1024
      const radius = 60 + Math.random() * 140
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius)
      const isLighter = Math.random() > 0.45
      const shade = isLighter ? 46 + Math.random() * 18 : 30 + Math.random() * 10
      grad.addColorStop(0, `rgba(${shade}, ${shade + 3}, ${shade + 7}, 0.18)`)
      grad.addColorStop(1, 'rgba(39, 44, 54, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // High-density fine aggregate speckle noise
    for (let i = 0; i < 45000; i++) {
      const n = Math.floor(22 + Math.random() * 32)
      ctx.fillStyle = `rgba(${n}, ${n + 2}, ${n + 5}, 0.45)`
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 1.5, 1.5)
    }

    // Expansion joint cut lines (saw-cut slab joints every 256px)
    const step = 256
    // Subtle bevel highlight next to cut
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(75, 85, 102, 0.28)'
    for (let p = step; p < 1024; p += step) {
      // vertical highlight
      ctx.beginPath()
      ctx.moveTo(p + 1, 0)
      ctx.lineTo(p + 1, 1024)
      ctx.stroke()
      // horizontal highlight
      ctx.beginPath()
      ctx.moveTo(0, p + 1)
      ctx.lineTo(1024, p + 1)
      ctx.stroke()
    }

    // Dark seam cut line
    ctx.lineWidth = 2.5
    ctx.strokeStyle = 'rgba(18, 22, 29, 0.85)'
    for (let p = step; p < 1024; p += step) {
      // vertical cut
      ctx.beginPath()
      ctx.moveTo(p, 0)
      ctx.lineTo(p, 1024)
      ctx.stroke()
      // horizontal cut
      ctx.beginPath()
      ctx.moveTo(0, p)
      ctx.lineTo(1024, p)
      ctx.stroke()
    }

    const tex = new THREE.CanvasTexture(cvs)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(5, 3)
    return tex
  }

  // 1b. Realistic Industrial Perimeter Panel Wall Texture Generator
  const createRealisticWallTexture = () => {
    const cvs = document.createElement('canvas')
    cvs.width = 1024
    cvs.height = 512
    const ctx = cvs.getContext('2d')!

    // Top modular insulated metal panel wall finish (matte muted cool grey)
    ctx.fillStyle = '#222731'
    ctx.fillRect(0, 0, 1024, 512)

    // Lower protective wainscot zone (darker industrial baseline, lower 25%)
    const wainscotHeight = 130
    const wainscotTop = 512 - wainscotHeight
    ctx.fillStyle = '#171a22'
    ctx.fillRect(0, wainscotTop, 1024, wainscotHeight)

    // Horizontal dado dividing groove between upper wall and wainscot
    ctx.strokeStyle = '#0e1117'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, wainscotTop)
    ctx.lineTo(1024, wainscotTop)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(65, 75, 92, 0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, wainscotTop - 1.5)
    ctx.lineTo(1024, wainscotTop - 1.5)
    ctx.stroke()

    // Fine aggregate and metal micro-texture
    for (let i = 0; i < 20000; i++) {
      const g = Math.floor(20 + Math.random() * 24)
      ctx.fillStyle = `rgba(${g}, ${g + 2}, ${g + 5}, 0.35)`
      ctx.fillRect(Math.random() * 1024, Math.random() * 512, 1.5, 1.5)
    }

    // Modular vertical panel seams (columns / panels every 128px)
    for (let x = 128; x < 1024; x += 128) {
      // Shadow groove
      ctx.strokeStyle = '#11141c'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 512)
      ctx.stroke()

      // Panel highlight edge
      ctx.strokeStyle = 'rgba(70, 80, 98, 0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x + 1.5, 0)
      ctx.lineTo(x + 1.5, 512)
      ctx.stroke()
    }

    // Heavy rubber/steel baseboard kickplate at bottom edge
    ctx.fillStyle = '#0c0e13'
    ctx.fillRect(0, 498, 1024, 14)
    ctx.strokeStyle = 'rgba(50, 60, 75, 0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 498)
    ctx.lineTo(1024, 498)
    ctx.stroke()

    const tex = new THREE.CanvasTexture(cvs)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    return tex
  }

  // 2. Cardboard box texture with barcode and label (same as reference HTML)
  const createCardboardTexture = () => {
    const cvs = document.createElement('canvas')
    cvs.width = 256
    cvs.height = 256
    const ctx = cvs.getContext('2d')!
    ctx.fillStyle = '#b88a57'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(140, 40, 95, 60)
    ctx.fillStyle = '#111827'
    ctx.fillRect(150, 48, 75, 8)
    for (let b = 150; b < 225; b += 3) {
      ctx.fillRect(b, 62, 2, 28)
    }
    ctx.fillStyle = '#2563eb'
    ctx.fillRect(20, 180, 50, 40)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px monospace'
    ctx.fillText('UP ↑', 28, 205)
    return new THREE.CanvasTexture(cvs)
  }

  // 3. Floating label text sprite (Base code only, e.g. "R1", "FL-01", "BL-01")
  const createTextSprite = (text: string, bgColor: string, textColor: string) => {
    const cvs = document.createElement('canvas')
    cvs.width = 256
    cvs.height = 128
    const ctx = cvs.getContext('2d')!
    ctx.fillStyle = bgColor
    ctx.fillRect(8, 8, 240, 112)
    ctx.strokeStyle = textColor
    ctx.lineWidth = 6
    ctx.strokeRect(8, 8, 240, 112)
    ctx.fillStyle = textColor
    ctx.font = "bold 56px 'Roboto Mono', monospace"
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 128, 64)

    const tex = new THREE.CanvasTexture(cvs)
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
    const sprite = new THREE.Sprite(spriteMat)
    sprite.scale.set(4.8, 2.4, 1)
    return sprite
  }

  // 4. Floor number stencil painted on ground (same as reference HTML)
  const createFloorNumberStencil = (text: string, width = 6, height = 3, bg = '#1e293b', fg = '#facc15') => {
    const cvs = document.createElement('canvas')
    cvs.width = 256
    cvs.height = 128
    const ctx = cvs.getContext('2d')!
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 256, 128)
    ctx.strokeStyle = fg
    ctx.lineWidth = 8
    ctx.strokeRect(4, 4, 248, 120)
    ctx.fillStyle = fg
    ctx.font = "bold 60px 'Roboto Mono', monospace"
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 128, 64)

    const tex = new THREE.CanvasTexture(cvs)
    const planeGeo = new THREE.PlaneGeometry(width, height)
    const planeMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95 })
    const mesh = new THREE.Mesh(planeGeo, planeMat)
    mesh.rotation.x = -Math.PI / 2
    return mesh
  }

  // 5. Realistic wooden pallet generator (from reference HTML)
  const createRealisticPalletGroup = (width = 5.2, depth = 3.2, woodPalletMat: THREE.Material) => {
    const palletGroup = new THREE.Group()
    const plankCount = 5
    const stepZ = (depth * 0.8) / (plankCount - 1)
    const startZ = -(depth * 0.8) / 2

    for (let i = 0; i < plankCount; i++) {
      const pz = startZ + i * stepZ
      const plank = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.08, depth * 0.16), woodPalletMat)
      plank.position.set(0, 0.38, pz)
      plank.castShadow = true
      palletGroup.add(plank)
    }

    ;[-width * 0.42, 0, width * 0.42].forEach((bx) => {
      ;[-depth * 0.38, 0, depth * 0.38].forEach((bz) => {
        const block = new THREE.Mesh(new THREE.BoxGeometry(width * 0.12, 0.3, depth * 0.14), woodPalletMat)
        block.position.set(bx, 0.18, bz)
        block.castShadow = true
        palletGroup.add(block)
      })
      const bottomPlank = new THREE.Mesh(new THREE.BoxGeometry(width * 0.12, 0.06, depth * 0.9), woodPalletMat)
      bottomPlank.position.set(bx, 0.03, 0)
      bottomPlank.castShadow = true
      palletGroup.add(bottomPlank)
    })
    return palletGroup
  }

  // Setup Three.js Scene once on mount
  useEffect(() => {
    const mount = containerRef.current
    if (!mount) return

    const width = mount.clientWidth || 800
    const height = mount.clientHeight || 550

    // 1. Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0e17)
    sceneRef.current = scene

    // 2. Camera - Framing 100x55 aspect ratio matching Tab 2 exactly
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 1000)
    camera.position.set(0, 68, 68)
    cameraRef.current = camera

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.maxPolarAngle = Math.PI / 2.02
    controls.minDistance = 10
    controls.maxDistance = 220
    controls.target.set(0, 0, 0)
    controlsRef.current = controls

    // 5. Lighting (Soft ambient, main directional with shadow, soft fill)
    scene.add(new THREE.HemisphereLight(0xe2e8f0, 0x1e293b, 0.7))

    const mainSun = new THREE.DirectionalLight(0xfff7ed, 0.85)
    mainSun.position.set(45, 85, 45)
    mainSun.castShadow = true
    mainSun.shadow.mapSize.width = 1024
    mainSun.shadow.mapSize.height = 1024
    mainSun.shadow.bias = -0.0004
    const shadowRange = 65
    mainSun.shadow.camera.left = -shadowRange
    mainSun.shadow.camera.right = shadowRange
    mainSun.shadow.camera.top = shadowRange
    mainSun.shadow.camera.bottom = -shadowRange
    mainSun.shadow.camera.near = 10
    mainSun.shadow.camera.far = 180
    scene.add(mainSun)

    const fillSun = new THREE.DirectionalLight(0x93c5fd, 0.35)
    fillSun.position.set(-45, 50, -45)
    scene.add(fillSun)

    // Groups for modular rebuilding
    const groundRoot = new THREE.Group()
    scene.add(groundRoot)
    groundRootRef.current = groundRoot

    const rackRoot = new THREE.Group()
    scene.add(rackRoot)
    rackRootRef.current = rackRoot

    const floorBayRoot = new THREE.Group()
    scene.add(floorBayRoot)
    floorBayRootRef.current = floorBayRoot

    const bulkLaneRoot = new THREE.Group()
    scene.add(bulkLaneRoot)
    bulkLaneRootRef.current = bulkLaneRoot

    const labelsGroup = new THREE.Group()
    scene.add(labelsGroup)
    labelsGroupRef.current = labelsGroup

    // Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    const handleResize = () => {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  // Rebuild 3D Items dynamically when warehouse or layoutPositions changes
  useEffect(() => {
    if (!rackRootRef.current || !floorBayRootRef.current || !bulkLaneRootRef.current || !labelsGroupRef.current) {
      return
    }

    clearGroup(groundRootRef.current)
    clearGroup(rackRootRef.current)
    clearGroup(floorBayRootRef.current)
    clearGroup(bulkLaneRootRef.current)
    clearGroup(labelsGroupRef.current)

    const groundRoot = groundRootRef.current
    const rackRoot = rackRootRef.current
    const floorBayRoot = floorBayRootRef.current
    const bulkLaneRoot = bulkLaneRootRef.current
    const labelsGroup = labelsGroupRef.current

    // Standard Realistic Materials (from reference HTML)
    const rackBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35, metalness: 0.5 })
    const rackOrangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.3, metalness: 0.4 })
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.6 })
    const woodPalletMat = new THREE.MeshStandardMaterial({ color: 0xc49a68, roughness: 0.85, metalness: 0.05 })
    const boxMat = new THREE.MeshStandardMaterial({ map: createCardboardTexture(), roughness: 0.85 })
    const wrapMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.65,
      opacity: 0.35,
      transparent: true,
      roughness: 0.15,
      reflectivity: 0.9,
    })

    // Read custom layout positions if saved in localStorage or passed via prop
    let effectivePositions: Record<
      string,
      { x: number; y: number; w?: number; h?: number; orientation?: 'vertical' | 'horizontal' }
    > = propLayoutPositions || {}
    if (
      (!effectivePositions || Object.keys(effectivePositions).length === 0) &&
      typeof window !== 'undefined' &&
      warehouse?.id
    ) {
      try {
        const saved = localStorage.getItem('warehouse_2d_layout_' + warehouse.id)
        if (saved) effectivePositions = JSON.parse(saved)
      } catch (e) {
        console.error('Error loading 2D layout for 3D viewer', e)
      }
    }

    // Exact 2D to 3D Coordinate Mapping
    // 2D Canvas: x: 0..1000px, y: 0..550px
    // 3D Ground: worldX: -50..+50 (100 units wide), worldZ: -27.5..+27.5 (55 units deep)
    const map2Dto3D = (x2d: number, y2d: number, w2d = 60, h2d = 60) => {
      const centerX2d = x2d + w2d / 2
      const centerY2d = y2d + h2d / 2
      const worldX = (centerX2d / 1000) * 100 - 50
      const worldZ = (centerY2d / 550) * 55 - 27.5
      const worldW = Math.max(2.5, (w2d / 1000) * 100)
      const worldD = Math.max(2.5, (h2d / 550) * 55)
      return { worldX, worldZ, worldW, worldD }
    }

    // Process warehouse data to match Tab 2 EXACTLY:
    interface RackGroupItem {
      zoneId: string
      rackName: string
      bays: any[]
    }
    interface IndividualBayItem {
      zoneId: string
      bay: any
      type: 'FLOOR' | 'LANE'
    }

    const rackItems: RackGroupItem[] = []
    const floorItems: IndividualBayItem[] = []
    const laneItems: IndividualBayItem[] = []

    if (warehouse?.zones) {
      warehouse.zones.forEach((zone: any) => {
        if (zone.type === 'STORAGE') {
          const rackGroups: Record<string, any[]> = {}
          ;(zone.bays || []).forEach((b: any) => {
            const rName = b.rack || b.aisle || b.code.split('-')[1] || 'R1'
            if (!rackGroups[rName]) rackGroups[rName] = []
            rackGroups[rName].push(b)
          })
          const rackKeys = Object.keys(rackGroups)
          if (rackKeys.length === 0) {
            rackItems.push({ zoneId: zone.id, rackName: zone.code, bays: [] })
          } else {
            rackKeys.forEach((rName) => {
              rackItems.push({ zoneId: zone.id, rackName: rName, bays: rackGroups[rName] })
            })
          }
        } else {
          ;(zone.bays || []).forEach((b: any) => {
            if (b.code?.startsWith('FL-') || (zone.type === 'RECEIVING' && !b.code?.startsWith('BL-'))) {
              floorItems.push({ zoneId: zone.id, bay: b, type: 'FLOOR' })
            } else if (b.code?.startsWith('BL-') || (zone.type === 'SHIPPING' && !b.code?.startsWith('FL-'))) {
              laneItems.push({ zoneId: zone.id, bay: b, type: 'LANE' })
            }
          })
        }
      })
    }

    const totalRacks = rackItems.length
    const totalFloors = floorItems.length
    const totalLanes = laneItems.length

    // Same dynamic default dimensions as Tab 2
    const defaultRackW = Math.max(52, Math.min(76, Math.floor(360 / Math.max(1, totalRacks || 1))))
    const defaultRackGap = Math.max(6, Math.min(12, Math.floor(60 / Math.max(1, totalRacks || 1))))

    const floorCols = Math.min(3, Math.max(1, Math.ceil(totalFloors / 2)))
    const defaultFloorW = totalFloors > 6 ? 90 : 105
    const defaultFloorH = totalFloors > 6 ? 62 : 70

    const laneCols = Math.min(3, Math.max(1, Math.ceil(totalLanes / 2)))
    const defaultLaneW = totalLanes > 6 ? 105 : 120
    const defaultLaneH = totalLanes > 6 ? 48 : 54

    // ========================================================
    // DYNAMIC GROUND FLOOR PLANE & PERIMETER BOUNDS CALCULATION
    // Calculated from the actual bounding box of all layout items + small consistent margin
    // ========================================================
    // Tab 2 baseline 2D canvas is 1000px x 550px, mapped to 3D [-50..+50] x [-27.5..+27.5]
    let minX = -50
    let maxX = 50
    let minZ = -27.5
    let maxZ = 27.5

    // Expand bounding box from all registered racks
    rackItems.forEach((rItem, idx) => {
      const rackKey = `rack_${rItem.zoneId}_${rItem.rackName}`
      const customPos = effectivePositions[rackKey]
      const defaultX = 20 + idx * (defaultRackW + defaultRackGap)
      const defaultY = 26
      const x2d = customPos ? customPos.x : defaultX
      const y2d = customPos ? customPos.y : defaultY
      const w2d = customPos?.w || defaultRackW
      const h2d = customPos?.h || 240
      const { worldX, worldZ, worldW, worldD } = map2Dto3D(x2d, y2d, w2d, h2d)
      minX = Math.min(minX, worldX - worldW / 2)
      maxX = Math.max(maxX, worldX + worldW / 2)
      minZ = Math.min(minZ, worldZ - worldD / 2)
      maxZ = Math.max(maxZ, worldZ + worldD / 2)
    })

    // Expand bounding box from all floor bays
    floorItems.forEach((fItem, idx) => {
      const bayKey = `bay_${fItem.bay.id}`
      const customPos = effectivePositions[bayKey]
      const col = idx % Math.max(1, floorCols)
      const row = Math.floor(idx / Math.max(1, floorCols))
      const defaultX = 20 + col * (defaultFloorW + 8)
      const defaultY = 280 + row * (defaultFloorH + 8)
      const x2d = customPos ? customPos.x : defaultX
      const y2d = customPos ? customPos.y : defaultY
      const w2d = customPos?.w || defaultFloorW
      const h2d = customPos?.h || defaultFloorH
      const { worldX, worldZ, worldW, worldD } = map2Dto3D(x2d, y2d, w2d, h2d)
      minX = Math.min(minX, worldX - worldW / 2)
      maxX = Math.max(maxX, worldX + worldW / 2)
      minZ = Math.min(minZ, worldZ - worldD / 2)
      maxZ = Math.max(maxZ, worldZ + worldD / 2)
    })

    // Expand bounding box from all bulk lanes
    laneItems.forEach((lItem, idx) => {
      const bayKey = `bay_${lItem.bay.id}`
      const customPos = effectivePositions[bayKey]
      const col = idx % Math.max(1, laneCols)
      const row = Math.floor(idx / Math.max(1, laneCols))
      const defaultX = 20 + col * (defaultLaneW + 8)
      const defaultY = (totalFloors > 0 ? 365 : 280) + row * (defaultLaneH + 8)
      const x2d = customPos ? customPos.x : defaultX
      const y2d = customPos ? customPos.y : defaultY
      const w2d = customPos?.w || defaultLaneW
      const h2d = customPos?.h || defaultLaneH
      const { worldX, worldZ, worldW, worldD } = map2Dto3D(x2d, y2d, w2d, h2d)
      minX = Math.min(minX, worldX - worldW / 2)
      maxX = Math.max(maxX, worldX + worldW / 2)
      minZ = Math.min(minZ, worldZ - worldD / 2)
      maxZ = Math.max(maxZ, worldZ + worldD / 2)
    })

    // Small, consistent margin on every side (Rule 1 & Rule 2)
    const margin = 2.5
    const floorMinX = minX - margin
    const floorMaxX = maxX + margin
    const floorMinZ = minZ - margin
    const floorMaxZ = maxZ + margin

    const floorWidth = floorMaxX - floorMinX
    const floorDepth = floorMaxZ - floorMinZ
    const floorCenterX = (floorMinX + floorMaxX) / 2
    const floorCenterZ = (floorMinZ + floorMaxZ) / 2

    // 1. Continuous Concrete Floor Slab (Sized and centered to layout footprint)
    const floorGeo = new THREE.PlaneGeometry(floorWidth, floorDepth)
    const floorTex = createRealisticConcreteTexture()
    floorTex.repeat.set(Math.max(2, Math.round(floorWidth / 20)), Math.max(2, Math.round(floorDepth / 20)))
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.78,
      metalness: 0.12,
    })
    const floorMesh = new THREE.Mesh(floorGeo, floorMat)
    floorMesh.rotation.x = -Math.PI / 2
    floorMesh.position.set(floorCenterX, -0.01, floorCenterZ)
    floorMesh.receiveShadow = true
    if (groundRoot) groundRoot.add(floorMesh)

    // 2. Perimeter Modular Industrial Walls (Flush to floor perimeter with zero gap)
    const wallHeight = 20

    // Back Perimeter Wall (North wall along X axis at Z = floorMinZ)
    const backWallTex = createRealisticWallTexture()
    backWallTex.repeat.set(Math.max(2, Math.round(floorWidth / 20)), 1)
    const backWallMat = new THREE.MeshStandardMaterial({
      map: backWallTex,
      roughness: 0.92,
      metalness: 0.05,
    })
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(floorWidth, wallHeight), backWallMat)
    backWall.position.set(floorCenterX, wallHeight / 2, floorMinZ)
    backWall.receiveShadow = true
    if (groundRoot) groundRoot.add(backWall)

    // Left Perimeter Wall (West wall along Z axis at X = floorMinX)
    const leftWallTex = createRealisticWallTexture()
    leftWallTex.repeat.set(Math.max(2, Math.round(floorDepth / 20)), 1)
    const leftWallMat = new THREE.MeshStandardMaterial({
      map: leftWallTex,
      roughness: 0.92,
      metalness: 0.05,
    })
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(floorDepth, wallHeight), leftWallMat)
    leftWall.position.set(floorMinX, wallHeight / 2, floorCenterZ)
    leftWall.rotation.y = Math.PI / 2
    leftWall.receiveShadow = true
    if (groundRoot) groundRoot.add(leftWall)

    // Grounding Skirting / Baseboard Trims along perimeter wall junctions
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x0c0e14, roughness: 0.85, metalness: 0.15 })
    const backTrim = new THREE.Mesh(new THREE.BoxGeometry(floorWidth, 0.45, 0.35), trimMat)
    backTrim.position.set(floorCenterX, 0.225, floorMinZ + 0.175)
    backTrim.receiveShadow = true
    if (groundRoot) groundRoot.add(backTrim)

    const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, floorDepth), trimMat)
    leftTrim.position.set(floorMinX + 0.175, 0.225, floorCenterZ)
    leftTrim.receiveShadow = true
    if (groundRoot) groundRoot.add(leftTrim)

    // ========================================================
    // FIX 2: RACKS (Realistic multi-bay / multi-tier or 1x1 default)
    // ========================================================
    rackItems.forEach((rItem, idx) => {
      const rackKey = `rack_${rItem.zoneId}_${rItem.rackName}`
      const customPos = effectivePositions[rackKey]
      const defaultX = 20 + idx * (defaultRackW + defaultRackGap)
      const defaultY = 26
      const x2d = customPos ? customPos.x : defaultX
      const y2d = customPos ? customPos.y : defaultY
      const w2d = customPos?.w || defaultRackW
      const h2d = customPos?.h || 240
      const orientation = customPos?.orientation || (w2d > h2d ? 'horizontal' : 'vertical')

      const { worldX, worldZ, worldW, worldD } = map2Dto3D(x2d, y2d, w2d, h2d)

      // Bay & Level count (default to at least 1 bay and 1 level)
      const baysCount = Math.max(1, rItem.bays.length)
      const maxLevels = Math.max(1, Math.max(...rItem.bays.map((b: any) => b.level || 1), 1))
      const rackHeight = Math.max(4.0, maxLevels * 2.5 + 0.8)

      // Base Code Floating Label only above rack (e.g. "R1")
      const labelText = rItem.rackName.startsWith('R') ? rItem.rackName : `R${rItem.rackName}`
      const rackSign = createTextSprite(labelText, '#1e3a8a', '#ffffff')
      rackSign.position.set(worldX, rackHeight + 1.8, worldZ)
      labelsGroup.add(rackSign)

      if (orientation === 'horizontal') {
        // Horizontal: rack extends along X, depth along Z
        const bayWidth3D = worldW / baysCount
        const colCount = baysCount + 1

        // Blue upright vertical frame columns at each bay boundary
        for (let c = 0; c < colCount; c++) {
          const fx = worldX - worldW / 2 + c * bayWidth3D
          ;[-worldD / 2, worldD / 2].forEach((fz) => {
            const col = new THREE.Mesh(new THREE.BoxGeometry(0.2, rackHeight, 0.2), rackBlueMat)
            col.position.set(fx, rackHeight / 2, worldZ + fz)
            col.castShadow = true
            rackRoot.add(col)
          })
        }

        // Render bays (at least 1)
        const baysToRender = rItem.bays.length > 0 ? rItem.bays : [{ id: 'b_def', level: 1 }]
        baysToRender.forEach((bay: any, bIdx: number) => {
          const bayCenterX = worldX - worldW / 2 + (bIdx + 0.5) * bayWidth3D
          const bayLevels = Math.max(1, bay.level || 1)

          for (let lvl = 1; lvl <= bayLevels; lvl++) {
            const beamY = 0.7 + (lvl - 1) * 2.5

            // Orange cross-beams
            ;[-worldD / 2, worldD / 2].forEach((bz) => {
              const beam = new THREE.Mesh(new THREE.BoxGeometry(bayWidth3D * 0.96, 0.28, 0.12), rackOrangeMat)
              beam.position.set(bayCenterX, beamY, worldZ + bz)
              beam.castShadow = true
              rackRoot.add(beam)
            })

            // Flat grey deck
            const shelfDeck = new THREE.Mesh(
              new THREE.BoxGeometry(bayWidth3D * 0.94, 0.08, worldD * 0.9),
              deckMat
            )
            shelfDeck.position.set(bayCenterX, beamY + 0.08, worldZ)
            shelfDeck.receiveShadow = true
            rackRoot.add(shelfDeck)

            // Wooden pallet
            const pallet = createRealisticPalletGroup(bayWidth3D * 0.88, worldD * 0.82, woodPalletMat)
            pallet.position.set(bayCenterX, beamY + 0.12, worldZ)
            rackRoot.add(pallet)

            // Stacked cardboard boxes wrapped in plastic
            const boxGroup = new THREE.Group()
            ;[-bayWidth3D * 0.2, bayWidth3D * 0.2].forEach((bx) => {
              ;[-worldD * 0.2, worldD * 0.2].forEach((bz) => {
                const b = new THREE.Mesh(
                  new THREE.BoxGeometry(bayWidth3D * 0.35, 0.9, worldD * 0.35),
                  boxMat
                )
                b.position.set(bx, 0.85, bz)
                b.castShadow = true
                boxGroup.add(b)
              })
            })
            // Top tier box
            const topBox = new THREE.Mesh(
              new THREE.BoxGeometry(bayWidth3D * 0.45, 0.75, worldD * 0.45),
              boxMat
            )
            topBox.position.set(0, 1.7, 0)
            topBox.castShadow = true
            boxGroup.add(topBox)

            // Transparent plastic wrap
            const plasticWrap = new THREE.Mesh(
              new THREE.BoxGeometry(bayWidth3D * 0.82, 1.9, worldD * 0.78),
              wrapMat
            )
            plasticWrap.position.set(0, 1.25, 0)
            boxGroup.add(plasticWrap)

            boxGroup.position.set(bayCenterX, beamY + 0.12, worldZ)
            rackRoot.add(boxGroup)
          }
        })
      } else {
        // Vertical: rack extends along Z, depth along X
        const bayDepth3D = worldD / baysCount
        const colCount = baysCount + 1

        // Blue upright vertical frame columns at each bay boundary
        for (let c = 0; c < colCount; c++) {
          const fz = worldZ - worldD / 2 + c * bayDepth3D
          ;[-worldW / 2, worldW / 2].forEach((fx) => {
            const col = new THREE.Mesh(new THREE.BoxGeometry(0.2, rackHeight, 0.2), rackBlueMat)
            col.position.set(worldX + fx, rackHeight / 2, fz)
            col.castShadow = true
            rackRoot.add(col)
          })
        }

        // Render bays (at least 1)
        const baysToRender = rItem.bays.length > 0 ? rItem.bays : [{ id: 'b_def', level: 1 }]
        baysToRender.forEach((bay: any, bIdx: number) => {
          const bayCenterZ = worldZ - worldD / 2 + (bIdx + 0.5) * bayDepth3D
          const bayLevels = Math.max(1, bay.level || 1)

          for (let lvl = 1; lvl <= bayLevels; lvl++) {
            const beamY = 0.7 + (lvl - 1) * 2.5

            // Orange cross-beams
            ;[-worldW / 2, worldW / 2].forEach((bx) => {
              const beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, bayDepth3D * 0.96), rackOrangeMat)
              beam.position.set(worldX + bx, beamY, bayCenterZ)
              beam.castShadow = true
              rackRoot.add(beam)
            })

            // Flat grey deck
            const shelfDeck = new THREE.Mesh(
              new THREE.BoxGeometry(worldW * 0.9, 0.08, bayDepth3D * 0.94),
              deckMat
            )
            shelfDeck.position.set(worldX, beamY + 0.08, bayCenterZ)
            shelfDeck.receiveShadow = true
            rackRoot.add(shelfDeck)

            // Wooden pallet
            const pallet = createRealisticPalletGroup(worldW * 0.82, bayDepth3D * 0.88, woodPalletMat)
            pallet.position.set(worldX, beamY + 0.12, bayCenterZ)
            rackRoot.add(pallet)

            // Stacked cardboard boxes wrapped in plastic
            const boxGroup = new THREE.Group()
            ;[-worldW * 0.2, worldW * 0.2].forEach((bx) => {
              ;[-bayDepth3D * 0.2, bayDepth3D * 0.2].forEach((bz) => {
                const b = new THREE.Mesh(
                  new THREE.BoxGeometry(worldW * 0.35, 0.9, bayDepth3D * 0.35),
                  boxMat
                )
                b.position.set(bx, 0.85, bz)
                b.castShadow = true
                boxGroup.add(b)
              })
            })
            // Top tier box
            const topBox = new THREE.Mesh(
              new THREE.BoxGeometry(worldW * 0.45, 0.75, bayDepth3D * 0.45),
              boxMat
            )
            topBox.position.set(0, 1.7, 0)
            topBox.castShadow = true
            boxGroup.add(topBox)

            // Transparent plastic wrap
            const plasticWrap = new THREE.Mesh(
              new THREE.BoxGeometry(worldW * 0.78, 1.9, bayDepth3D * 0.82),
              wrapMat
            )
            plasticWrap.position.set(0, 1.25, 0)
            boxGroup.add(plasticWrap)

            boxGroup.position.set(worldX, beamY + 0.12, bayCenterZ)
            rackRoot.add(boxGroup)
          }
        })
      }
    })

    // Fallback if no racks registered in database
    if (rackItems.length === 0 && warehouse) {
      for (let r = 1; r <= 3; r++) {
        const rackZ = -14 + (r - 1) * 11
        const rackSign = createTextSprite(`R${r}`, '#1e3a8a', '#ffffff')
        rackSign.position.set(0, 8.5, rackZ)
        labelsGroup.add(rackSign)

        for (let bay = 1; bay <= 2; bay++) {
          const bayCenterX = -8 + (bay - 1) * 14
          const beamY = 0.7
          const shelfDeck = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.08, 4.0), deckMat)
          shelfDeck.position.set(bayCenterX, beamY + 0.08, rackZ)
          rackRoot.add(shelfDeck)

          const pallet = createRealisticPalletGroup(9.5, 3.4, woodPalletMat)
          pallet.position.set(bayCenterX, beamY + 0.12, rackZ)
          rackRoot.add(pallet)

          const box = new THREE.Mesh(new THREE.BoxGeometry(8.0, 1.8, 2.8), boxMat)
          box.position.set(bayCenterX, beamY + 1.2, rackZ)
          rackRoot.add(box)
        }
      }
    }

    // ========================================================
    // FIX 3: FLOOR BAYS (Pad, yellow border, floor stencil, label, goods)
    // ========================================================
    floorItems.forEach((fItem, idx) => {
      const bayKey = `bay_${fItem.bay.id}`
      const customPos = effectivePositions[bayKey]
      const col = idx % Math.max(1, floorCols)
      const row = Math.floor(idx / Math.max(1, floorCols))
      const defaultX = 20 + col * (defaultFloorW + 8)
      const defaultY = 280 + row * (defaultFloorH + 8)
      const x2d = customPos ? customPos.x : defaultX
      const y2d = customPos ? customPos.y : defaultY
      const w2d = customPos?.w || defaultFloorW
      const h2d = customPos?.h || defaultFloorH

      const { worldX, worldZ, worldW, worldD } = map2Dto3D(x2d, y2d, w2d, h2d)
      const code = fItem.bay.code

      // 1. Flat rectangular pad with subtle blue tint
      const bayPad = new THREE.Mesh(
        new THREE.BoxGeometry(worldW, 0.06, worldD),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, transparent: true, opacity: 0.35, roughness: 0.8 })
      )
      bayPad.position.set(worldX, 0.03, worldZ)
      bayPad.receiveShadow = true
      floorBayRoot.add(bayPad)

      // 2. Thin yellow outline / border around pad (from reference HTML)
      const pOutline = new THREE.Mesh(
        new THREE.PlaneGeometry(worldW * 1.02, worldD * 1.02),
        new THREE.MeshBasicMaterial({ color: 0xeab308, wireframe: true })
      )
      pOutline.rotation.x = -Math.PI / 2
      pOutline.position.set(worldX, 0.04, worldZ)
      floorBayRoot.add(pOutline)

      // 3. Floor number stencil painted on ground
      const bayStencil = createFloorNumberStencil(code, Math.min(4.0, worldW * 0.7), Math.min(1.8, worldD * 0.45), '#172554', '#38bdf8')
      bayStencil.position.set(worldX, 0.045, worldZ - worldD * 0.25)
      floorBayRoot.add(bayStencil)

      // 4. Floating label above the bay with base code
      const baySign = createTextSprite(code, '#0369a1', '#ffffff')
      baySign.position.set(worldX, 3.2, worldZ)
      labelsGroup.add(baySign)

      // 5. Realistic stored goods on top (pallet+boxes wrapped, drums, or steel crate)
      if (idx % 2 === 0) {
        // Wooden pallet + wrapped boxes
        const pallet = createRealisticPalletGroup(worldW * 0.7, worldD * 0.7, woodPalletMat)
        pallet.position.set(worldX, 0.06, worldZ + worldD * 0.1)
        floorBayRoot.add(pallet)

        const box = new THREE.Mesh(new THREE.BoxGeometry(worldW * 0.55, 1.8, worldD * 0.55), boxMat)
        box.position.set(worldX, 1.2, worldZ + worldD * 0.1)
        box.castShadow = true
        floorBayRoot.add(box)

        const wrap = new THREE.Mesh(new THREE.BoxGeometry(worldW * 0.6, 1.9, worldD * 0.6), wrapMat)
        wrap.position.set(worldX, 1.25, worldZ + worldD * 0.1)
        floorBayRoot.add(wrap)
      } else {
        // Heavy industrial drums / steel crate
        ;[-worldW * 0.2, worldW * 0.2].forEach((dx) => {
          ;[-worldD * 0.18, worldD * 0.18].forEach((dz) => {
            const drum = new THREE.Mesh(
              new THREE.CylinderGeometry(0.75, 0.75, 2.2, 18),
              new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 })
            )
            drum.position.set(worldX + dx, 1.15, worldZ + worldD * 0.08 + dz)
            drum.castShadow = true
            floorBayRoot.add(drum)
          })
        })
      }
    })

    // ========================================================
    // FIX 4: BULK LANES (Long pad, amber border, sections, stencils, goods)
    // ========================================================
    laneItems.forEach((lItem, idx) => {
      const bayKey = `bay_${lItem.bay.id}`
      const customPos = effectivePositions[bayKey]
      const col = idx % Math.max(1, laneCols)
      const row = Math.floor(idx / Math.max(1, laneCols))
      const defaultX = 20 + col * (defaultLaneW + 8)
      const defaultY = (totalFloors > 0 ? 365 : 280) + row * (defaultLaneH + 8)
      const x2d = customPos ? customPos.x : defaultX
      const y2d = customPos ? customPos.y : defaultY
      const w2d = customPos?.w || defaultLaneW
      const h2d = customPos?.h || defaultLaneH

      const { worldX, worldZ, worldW, worldD } = map2Dto3D(x2d, y2d, w2d, h2d)
      const code = lItem.bay.code

      // 1. Long flat rectangular pad with amber / orange tint
      const lanePad = new THREE.Mesh(
        new THREE.BoxGeometry(worldW, 0.06, worldD),
        new THREE.MeshStandardMaterial({ color: 0xb45309, transparent: true, opacity: 0.35, roughness: 0.7 })
      )
      lanePad.position.set(worldX, 0.03, worldZ)
      lanePad.receiveShadow = true
      bulkLaneRoot.add(lanePad)

      // 2. Visible darker orange / amber border
      const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(worldW, 0.06, worldD))
      const borderLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 }))
      borderLine.position.set(worldX, 0.03, worldZ)
      bulkLaneRoot.add(borderLine)

      // 3. Lane entrance floor stencil
      const laneStencil = createFloorNumberStencil(code, Math.min(5.0, worldW * 0.8), Math.min(1.8, worldD * 0.2), '#451a03', '#f59e0b')
      laneStencil.position.set(worldX, 0.045, worldZ - worldD * 0.4)
      bulkLaneRoot.add(laneStencil)

      // 4. Floating label above lane with base code
      const laneBanner = createTextSprite(code, '#b45309', '#ffffff')
      laneBanner.position.set(worldX, 3.6, worldZ)
      labelsGroup.add(laneBanner)

      // 5. Divided visually into sections if sections > 1
      const slots = lItem.bay.slots || []
      const sectionsCount = Math.max(1, slots.length)
      const cargoSectionD = (worldD * 0.88) / sectionsCount

      for (let sec = 0; sec < sectionsCount; sec++) {
        const secZ = worldZ - (worldD * 0.88) / 2 + (sec + 0.5) * cargoSectionD

        // Bulk box placeholder on each section
        const bulkCargo = new THREE.Mesh(
          new THREE.BoxGeometry(worldW * 0.74, 1.8, cargoSectionD * 0.82),
          new THREE.MeshStandardMaterial({
            color: sec % 2 === 0 ? 0xb45309 : 0x0284c7,
            metalness: 0.4,
            roughness: 0.5,
          })
        )
        bulkCargo.position.set(worldX, 0.95, secZ)
        bulkCargo.castShadow = true
        bulkLaneRoot.add(bulkCargo)

        // Section dividing line if multi-section
        if (sectionsCount > 1 && sec < sectionsCount - 1) {
          const divLineZ = worldZ - (worldD * 0.88) / 2 + (sec + 1) * cargoSectionD
          const divLineGeo = new THREE.PlaneGeometry(worldW * 0.95, 0.15)
          const divLine = new THREE.Mesh(divLineGeo, new THREE.MeshBasicMaterial({ color: 0xf59e0b }))
          divLine.rotation.x = -Math.PI / 2
          divLine.position.set(worldX, 0.045, divLineZ)
          bulkLaneRoot.add(divLine)
        }
      }
    })
  }, [warehouse, propLayoutPositions])

  return (
    <div className="relative w-full h-full min-h-[580px] bg-[#0a0e17] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Pure 3D Canvas Mounting Area - No extra UI panels, buttons, search, or sidebars */}
      <div ref={containerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  )
}
