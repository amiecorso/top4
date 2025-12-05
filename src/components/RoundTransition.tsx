'use client'

import { useEffect, useState, useRef } from 'react'

interface RoundTransitionProps {
  roundNumber: number
  onComplete: () => void
}

export function RoundTransition({ roundNumber, onComplete }: RoundTransitionProps) {
  const [countdown, setCountdown] = useState(2)
  const onCompleteRef = useRef(onComplete)

  // Keep onComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (countdown <= 0) {
      const timer = setTimeout(() => {
        onCompleteRef.current()
      }, 100)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 via-sky-900 to-cyan-900">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => {
          const size = Math.random() * 150 + 50
          const left = Math.random() * 100
          const top = Math.random() * 100
          const delay = Math.random() * 2
          const duration = Math.random() * 3 + 2
          
          return (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 animate-pulse"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          )
        })}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        <div className="text-6xl md:text-8xl font-bold text-white mb-8 animate-bounce">
          Round {roundNumber}
        </div>
        
        <div 
          key={countdown}
          className="text-9xl md:text-[12rem] font-black text-white mb-8 animate-pulse"
          style={{
            animation: 'pulse 0.5s ease-in-out',
          }}
        >
          {countdown}
        </div>

        <div className="text-2xl md:text-3xl text-white/90 font-semibold animate-pulse">
          Get ready!
        </div>
      </div>

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
    </div>
  )
}

