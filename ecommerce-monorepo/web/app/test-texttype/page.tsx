'use client'

import TextType from '@/components/ui/TextType'

export default function TestTextTypePage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">TextType Component Test</h1>
        
        {/* Test 1: Basic Typing */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl text-white mb-4">Test 1: Basic Typing</h2>
          <TextType
            text={["Hello World!", "This is a test", "It should be typing!"]}
            typingSpeed={75}
            deletingSpeed={30}
            pauseDuration={2600}
            showCursor={true}
            cursorCharacter="|"
            className="text-white text-2xl"
          />
        </div>

        {/* Test 2: Uppercase Welcome Message (like TopBar) */}
        <div className="bg-gradient-to-r from-[#1a3a5c] via-[#2a4a6c] to-[#1a3a5c] p-6 rounded-lg">
          <h2 className="text-xl text-white mb-4">Test 2: TopBar Style (Uppercase)</h2>
          <div className="flex items-center space-x-4">
            <span className="text-[#c9a84c] text-sm">✦</span>
            <TextType
              text={[
                "WELCOME TO YIWU EXPRESS - PREMIUM KITCHENWARE FROM YIWU, CHINA",
                "GLOBAL TRADE SOLUTIONS - QUALITY YOU CAN TRUST",
                "WHOLESALE & RETAIL - BEST PRICES GUARANTEED"
              ]}
              as="span"
              typingSpeed={75}
              deletingSpeed={30}
              pauseDuration={2600}
              showCursor={true}
              cursorCharacter="|"
              cursorBlinkDuration={0.6}
              className="text-white/70 text-sm tracking-wider font-medium uppercase"
              loop={true}
            />
          </div>
        </div>

        {/* Test 3: Variable Speed */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl text-white mb-4">Test 3: Variable Speed (Human-like)</h2>
          <TextType
            text={["Variable speed typing feels more natural and human-like"]}
            variableSpeedEnabled={true}
            variableSpeedMin={50}
            variableSpeedMax={150}
            showCursor={true}
            cursorCharacter="_"
            className="text-green-400 text-xl font-mono"
            loop={false}
          />
        </div>

        {/* Test 4: No Cursor */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl text-white mb-4">Test 4: No Cursor</h2>
          <TextType
            text={["This text types without a cursor", "Clean and simple"]}
            typingSpeed={50}
            showCursor={false}
            className="text-blue-400 text-xl"
          />
        </div>

        {/* Test 5: Different Colors */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl text-white mb-4">Test 5: Colored Text</h2>
          <TextType
            text={["First sentence in red", "Second in green", "Third in blue"]}
            textColors={["#ef4444", "#22c55e", "#3b82f6"]}
            typingSpeed={60}
            pauseDuration={2000}
            className="text-2xl font-bold"
          />
        </div>
      </div>
    </div>
  )
}
