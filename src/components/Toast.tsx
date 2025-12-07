'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, onDismiss, duration = 10000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, duration)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]) // Only depend on duration, not onDismiss to avoid resetting timer

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white border-2 border-blue-300 rounded-lg shadow-lg px-6 py-4 flex items-center gap-4 min-w-[300px] max-w-md animate-[slideIn_0.3s_ease-out]">
        <div className="flex-1">
          <p className="text-slate-800 font-medium">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Dismiss"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

