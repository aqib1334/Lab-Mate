import { useState, useEffect } from 'react'

const SCRAMBLE_CHARS = '#$%&*@!^~'

export function useScrambleText(text, duration = 500) {
  const [displayText, setDisplayText] = useState(text)
  const [isScrambling, setIsScrambling] = useState(false)

  useEffect(() => {
    if (!text) return

    setIsScrambling(true)
    const startTime = Date.now()
    const frames = Math.ceil(duration / 16) // ~60fps

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      if (progress === 1) {
        setDisplayText(text)
        setIsScrambling(false)
        clearInterval(interval)
        return
      }

      // Scramble characters based on progress
      const scrambled = text
        .split('')
        .map((char, idx) => {
          const charProgress = Math.max(0, progress - (idx * 0.05))
          if (charProgress < 0.3) {
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
          }
          return char
        })
        .join('')

      setDisplayText(scrambled)
    }, 16)

    return () => clearInterval(interval)
  }, [text, duration])

  return { displayText, isScrambling }
}
