import { useEffect, useState } from 'react'
import { GameRoom } from '@/types/game'

export function useGameState(roomId: string | null, playerId: string | null) {
  const [gameState, setGameState] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGameState = async () => {
    if (!roomId) return
    console.log('🔄 === FETCH GAME STATE START ===')
    console.log('🎯 fetchGameState called for roomId:', roomId)
    console.log('🔍 roomId type:', typeof roomId)
    console.log('🔗 Full URL:', `/api/game/${roomId}`)

    try {
      const response = await fetch(`/api/game/${roomId}`, { cache: 'no-store' })
      const data = await response.json()
      console.log('📥 fetchGameState response status:', response.status)
      console.log('📊 fetchGameState response data:', JSON.stringify(data, null, 2))

      if (response.ok) {
        console.log('✅ Response OK, updating game state...')
        console.log('📊 BEFORE setState - current gameState.currentRound:', gameState?.currentRound)
        console.log('📊 NEW data - currentRound:', data.room?.currentRound)
        console.log('📊 NEW data - status:', data.room?.status)
        console.log('📊 NEW data - rounds length:', data.room?.rounds?.length)

        setGameState(data.room)
        setError(null)

        console.log('✅ Game state updated successfully')
        console.log('🔄 === FETCH GAME STATE END ===')
      } else {
        console.error('❌ fetchGameState error:', data.error)
        setError(data.error || 'Failed to fetch game state')
      }
    } catch (err) {
      setError('Network error')
      console.error('🚨 fetchGameState network error:', err)
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
    roundDurationSeconds: number = 60
  ) => {
    setLoading(true)
    try {
      console.log('[useGameState] createGame start', { hostName, maxRounds, selectedCategories, newPromptPercentage, roundDurationSeconds })
      const response = await fetch('/api/create-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hostName, maxRounds, selectedCategories, newPromptPercentage, roundDurationSeconds }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('[useGameState] createGame ok', { roomId: data.roomId })
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
        console.log('[useGameState] createGame error', data)
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.log('[useGameState] createGame network error', err)
      return { success: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  const joinGame = async (code: string, playerName: string) => {
    setLoading(true)
    try {
      console.log('[useGameState] joinGame start', { code, playerName })
      const response = await fetch('/api/join-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, playerName }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('[useGameState] joinGame ok', { roomId: data.roomId })
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
        console.log('[useGameState] joinGame error', data)
        return { success: false, error: data.error, suggestedName: data.suggestedName }
      }
    } catch (err) {
      console.log('[useGameState] joinGame network error', err)
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