'use client'

import { useEffect } from 'react'

export function Confetti() {
  useEffect(() => {
    const colors = ['#3b82f6', '#0ea5e9', '#06b6d4', '#10b981', '#14b8a6', '#f59e0b']
    const confettiCount = 150
    const confetti: Array<{
      x: number
      y: number
      r: number
      d: number
      color: string
      tilt: number
      tiltAngleIncrement: number
      tiltAngle: number
    }> = []

    const canvas = document.createElement('canvas')
    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '9999'
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * confettiCount + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngleIncrement: Math.random() * 0.07 + 0.05,
        tiltAngle: 0,
      })
    }

    let animationId: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      confetti.forEach((c, i) => {
        ctx.beginPath()
        ctx.lineWidth = c.r / 2
        ctx.strokeStyle = c.color
        ctx.moveTo(c.x + c.tilt + c.r, c.y)
        ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r)
        ctx.stroke()

        c.tiltAngle += c.tiltAngleIncrement
        c.y += (Math.cos(c.d) + 3 + c.r / 2) / 2
        c.tilt = Math.sin(c.tiltAngle - i / 3) * 15

        if (c.y > canvas.height) {
          confetti[i] = {
            x: Math.random() * canvas.width,
            y: -20,
            r: c.r,
            d: c.d,
            color: c.color,
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleIncrement: c.tiltAngleIncrement,
            tiltAngle: 0,
          }
        }
      })

      animationId = requestAnimationFrame(draw)
    }

    draw()

    // Stop after 5 seconds
    const timeout = setTimeout(() => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resizeCanvas)
      document.body.removeChild(canvas)
    }, 5000)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resizeCanvas)
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas)
      }
    }
  }, [])

  return null
}

