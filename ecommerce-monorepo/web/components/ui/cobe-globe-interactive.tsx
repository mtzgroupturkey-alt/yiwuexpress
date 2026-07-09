"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import createGlobe from "cobe"

interface InteractiveMarker {
  id: string
  location: number[]
  name: string
  users: number
}

interface GlobeInteractiveProps {
  markers?: InteractiveMarker[]
  className?: string
  speed?: number
}

const defaultMarkers: InteractiveMarker[] = [
  { id: "hq", location: [37.78, -122.44], name: "HQ", users: 1420 },
  { id: "eu", location: [52.52, 13.41], name: "EU", users: 892 },
  { id: "asia", location: [35.68, 139.65], name: "Asia", users: 2103 },
  { id: "latam", location: [-23.55, -46.63], name: "LATAM", users: 567 },
  { id: "mena", location: [25.2, 55.27], name: "MENA", users: 734 },
  { id: "oceania", location: [-33.87, 151.21], name: "APAC", users: 445 },
]

export function GlobeInteractive({
  markers = defaultMarkers,
  className = "",
  speed = 0.003,
}: GlobeInteractiveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        }
      }
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId = 0
    let phi = 0
    let webglError = false
    let destroyed = false
    let resizeObserver: ResizeObserver | null = null

    // Suppress WebGL console errors during rendering
    const originalConsoleError = console.error
    const webglErrorFilter = (msg: any, ...args: any[]) => {
      const msgStr = String(msg)
      // Suppress WebGL-related errors
      if (msgStr.includes('WebGL') || 
          msgStr.includes('INVALID_OPERATION') || 
          msgStr.includes('drawArrays') ||
          msgStr.includes('no buffer is bound')) {
        return
      }
      originalConsoleError.call(console, msg, ...args)
    }
    console.error = webglErrorFilter

    const destroyGlobe = () => {
      if (animationId) cancelAnimationFrame(animationId)
      animationId = 0
      if (globe) {
        try { globe.destroy() } catch {}
        globe = null
      }
    }

    // WebGL context loss handling
    const handleWebGLContextLost = (e: Event) => {
      e.preventDefault()
      webglError = true
      destroyGlobe()
      canvas.style.display = 'none'
    }

    const handleWebGLContextRestored = () => {
      webglError = false
      canvas.style.display = 'block'
      init()
    }

    canvas.addEventListener('webglcontextlost', handleWebGLContextLost)
    canvas.addEventListener('webcontextrestored', handleWebGLContextRestored)

    function init() {
      if (destroyed) return
      const width = canvas.offsetWidth
      if (width === 0) return
      if (globe) return // already initialized (guards StrictMode double-invoke)
      if (webglError) return

      canvas.width = width
      canvas.height = width

      try {
        // Test for WebGL support with proper context detection
        const gl = canvas.getContext('webgl', { 
          premultipliedAlpha: false,
          preserveDrawingBuffer: true,
          antialias: true
        }) || canvas.getContext('experimental-webgl', {
          premultipliedAlpha: false,
          preserveDrawingBuffer: true,
          antialias: true
        })
        
        if (!gl) {
          console.warn('[Globe] WebGL not supported, hiding globe')
          webglError = true
          canvas.style.display = 'none'
          return
        }

        // Verify WebGL context is working
        if (gl.isContextLost()) {
          console.warn('[Globe] WebGL context lost before initialization')
          webglError = true
          canvas.style.display = 'none'
          return
        }

        globe = createGlobe(canvas, {
          devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
          width,
          height: width,
          phi: 0,
          theta: 0.2,
          dark: 0,
          diffuse: 1.5,
          mapSamples: 16000,
          mapBrightness: 10,
          baseColor: [1, 1, 1],
          markerColor: [0.1, 0.2, 0.45],
          glowColor: [0.94, 0.93, 0.91],
          markerElevation: 0,
          markers: markers.map((m) => ({ location: m.location, size: 0.025, id: m.id })),
          arcs: [],
          arcColor: [0.15, 0.3, 0.55],
          arcWidth: 0.5,
          arcHeight: 0.25,
          opacity: 0.7,
        })

        function animate() {
          if (webglError || !globe || destroyed) return
          try {
            if (!isPausedRef.current) phi += speed
            globe.update({
              phi: phi + phiOffsetRef.current + dragOffset.current.phi,
              theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
            })
            animationId = requestAnimationFrame(animate)
          } catch (err) {
            console.warn('[Globe] Animation error, stopping globe')
            webglError = true
            if (canvas) canvas.style.display = 'none'
            destroyGlobe()
          }
        }

        animate()
        if (canvas) canvas.style.opacity = "1"
      } catch (err) {
        console.warn('[Globe] Failed to initialize:', err instanceof Error ? err.message : 'Unknown error')
        webglError = true
        canvas.style.display = 'none'
      }
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          resizeObserver?.disconnect()
          resizeObserver = null
          init()
        }
      })
      resizeObserver.observe(canvas)
    }

    return () => {
      destroyed = true
      console.error = originalConsoleError
      canvas.removeEventListener('webglcontextlost', handleWebGLContextLost)
      canvas.removeEventListener('webcontextrestored', handleWebGLContextRestored)
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
      destroyGlobe()
    }
  }, [markers, speed])

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <style>{`
        @keyframes fade-slide-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 0.8; transform: translateY(0); }
        }
      `}</style>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
      {markers.map((m) => (
        <div
          key={m.id}
          onClick={() => setExpanded(expanded === m.id ? null : m.id)}
          style={{
            position: "absolute",
            // @ts-expect-error CSS Anchor Positioning
            positionAnchor: `--cobe-${m.id}`,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% 0",
            marginBottom: 6,
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            padding: expanded === m.id ? "0.4rem 0.6rem" : "0.3rem 0.5rem",
            background: "#1a1a2e",
            color: "#fff",
            borderRadius: 3,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            opacity: `var(--cobe-visible-${m.id}, 0)`,
            filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 8px))`,
            transition: "opacity 0.4s, filter 0.4s, transform 0.2s, padding 0.2s",
            zoom: expanded === m.id ? 1.05 : 1,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
            }}
          >
            {m.name}
          </span>
          {expanded === m.id && (
            <span
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: "0.55rem",
                opacity: 0.8,
                marginTop: "0.15rem",
                animation: "fade-slide-in 0.2s ease-out",
              }}
            >
              {m.users.toLocaleString()} users
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
