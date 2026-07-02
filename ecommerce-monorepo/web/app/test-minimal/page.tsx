'use client'

import { useState, useEffect } from 'react'

export default function MinimalTypingTest() {
  const [text, setText] = useState('')
  const [index, setIndex] = useState(0)
  const fullText = "HELLO WORLD - THIS IS TYPING"

  useEffect(() => {
    if (index < fullText.length) {
      const timeout = setTimeout(() => {
        setText(prev => prev + fullText[index])
        setIndex(prev => prev + 1)
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [index])

  console.log('Typing test:', { text, index })

  return (
    <div className="min-h-screen bg-[#1a3a5c] flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-white text-4xl mb-8">Minimal Typing Test</h1>
        <div className="bg-white/10 p-8 rounded-lg">
          <div className="text-white text-2xl font-mono">
            {text}<span className="animate-pulse">|</span>
          </div>
        </div>
        <p className="text-white/60 mt-4 text-sm">
          Check console for logs. If you see text typing above, React is working fine.
        </p>
        <p className="text-white/60 mt-2 text-sm">
          Current character count: {text.length}
        </p>
      </div>
    </div>
  )
}
