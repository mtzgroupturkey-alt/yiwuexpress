"use client"

import { GlobeInteractive } from "@/components/ui/cobe-globe-interactive"

export default function GlobeInteractiveDemo() {
  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 overflow-hidden">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Interactive Globe</h1>
          <p className="text-gray-400">Drag to rotate • Click markers to see details</p>
        </div>
        <GlobeInteractive />
      </div>
    </div>
  )
}
