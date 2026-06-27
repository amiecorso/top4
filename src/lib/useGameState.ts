import { useEffect, useRef, useState } from 'react'
import { GameRoom } from '@/types/game'

export function useGameState(roomId: string | null, playerId: string | null) {
  const [gameState, setGameState] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Count consecutive 404s so a freshly created game that briefly 404s due to
  // datastore replica lag doesn't flash "Game not found" before it loads.
  const notFoundCountRef = useRef(0)

  const fetchGameState = async () => {
    if (!roomId) return

    try {
      const response = await fetch(`/api/game/${roomId}`, { cache: 'no-store' })
      const data = await response.json()

      if (response.ok) {
        notFoundCountRef.current = 0
        setGameState(data.room)
        setError(null)
      } else if (response.status === 404) {
        // Tolerate a couple of transient 404s right after creation (replica
        // lag). Polling is every 2s, so this surfaces a real "not found"
        // after ~4s while hiding the brief race on redirect.
        notFoundCountRef.current += 1
        if (notFoundCountRef.current >= 3) {
          setError(data.error || 'Game not found')
        }
      } else {
        setError(data.error || 'Failed to fetch game state')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  useEffect(() => {
    if (!roomId) return

    fetchGameState()

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchGameState, 2000)

    return () => clearInterval(interval)
  }, [roomId])

  const createGame = async (
    hostName: string,
    maxRounds: number = 5,
    selectedCategories: string[] = ['kidFriendly'],
    newPromptPercentage: number = 0,
    roundDurationSeconds: number = 60,
    categoryWeights?: Record<string, number>
  ) => {
    setLoading(true)
    try {
      const response = await fetch('/api/create-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hostName, maxRounds, selectedCategories, newPromptPercentage, roundDurationSeconds, categoryWeights }),
      })

      const data = await response.json()

      if (response.ok) {
        try {
          if (typeof window !== 'undefined' && data.roomId && data.playerId) {
            window.localStorage.setItem(`top4:playerId:${data.roomId}`, data.playerId)
          }
        } catch (_e) {}
        return {
          success: true,
          roomId: data.roomId,
          code: data.code,
          playerId: data.playerId,
          room: data.room
        }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      return { success: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  const joinGame = async (code: string, playerName: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/join-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, playerName }),
      })

      const data = await response.json()

      if (response.ok) {
        try {
          if (typeof window !== 'undefined' && data.roomId && data.playerId) {
            window.localStorage.setItem(`top4:playerId:${data.roomId}`, data.playerId)
          }
        } catch (_e) {}
        return {
          success: true,
          roomId: data.roomId,
          playerId: data.playerId,
          room: data.room
        }
      } else {
        return { success: false, error: data.error, suggestedName: data.suggestedName }
      }
    } catch (err) {
      return { success: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  return {
    gameState,
    loading,
    error,
    createGame,
    joinGame,
    refreshGameState: fetchGameState
  }
}