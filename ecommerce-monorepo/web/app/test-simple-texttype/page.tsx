'use client'

import TextType from '@/components/ui/TextType'

export default function SimpleTestPage() {
  console.log('SimpleTestPage rendering')
  
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-white text-3xl mb-8">Simple TextType Test</h1>
      
      {/* Test 1: Minimal props */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-white mb-4">Test 1: Minimal</h2>
        <TextType
          text={["HELLO WORLD", "THIS IS A TEST"]}
          className="text-white text-2xl"
        />
      </div>

      {/* Test 2: Like MainHeader */}
      <div className="bg-[#1a3a5c] p-6 rounded-lg">
        <h2 className="text-white mb-4">Test 2: Like MainHeader</h2>
        <div className="flex items-center space-x-2">
          <span className="text-[#c9a84c] text-sm">✦</span>
          <TextType
            text={[
              "WELCOME TO DROMKOK — PREMIUM SOURCING",
              "GLOBAL TRADE SOLUTIONS — QUALITY YOU CAN TRUST",
              "WHOLESALE & RETAIL — BEST PRICES GUARANTEED"
            ]}
            as="div"
            typingSpeed={75}
            deletingSpeed={30}
            pauseDuration={2600}
            showCursor={true}
            cursorCharacter="|"
            cursorBlinkDuration={0.6}
            className="text-white/60 text-[10px] tracking-wider font-medium inline-block"
            loop={true}
            variableSpeedEnabled={true}
            variableSpeedMin={110}
            variableSpeedMax={175}
          />
        </div>
      </div>

      {/* Test 3: Static text to compare */}
      <div className="bg-[#1a3a5c] p-6 rounded-lg mt-8">
        <h2 className="text-white mb-4">Test 3: Static (no animation)</h2>
        <div className="flex items-center space-x-2">
          <span className="text-[#c9a84c] text-sm">✦</span>
          <span className="text-white/60 text-[10px] tracking-wider font-medium">
            WELCOME TO DROMKOK — PREMIUM SOURCING
          </span>
        </div>
      </div>
    </div>
  )
}
