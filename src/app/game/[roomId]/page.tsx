'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGameState } from '@/lib/useGameState'
import { GameLobby } from '@/components/GameLobby'
import { GamePlay } from '@/components/GamePlay'
import { PromptSubmission } from '@/components/PromptSubmission'
import { RoundTransition } from '@/components/RoundTransition'

export default function GameRoom({ params }: { params: { roomId: string } }) {
  const searchParams = useSearchParams()
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [showFirstRoundTransition, setShowFirstRoundTransition] = useState(false)
  const previousStatusRef = useRef<string | null>(null)
  const hasShownFirstTransitionRef = useRef(false)

  useEffect(() => {
    const pid = searchParams?.get('playerId')
    if (pid) {
      setPlayerId(pid)
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(`top4:playerId:${params.roomId}`, pid)
        }
      } catch (_e) {}
    } else {
      try {
        if (typeof window !== 'undefined') {
          const stored = window.localStorage.getItem(`top4:playerId:${params.roomId}`)
          if (stored) setPlayerId(stored)
        }
      } catch (_e) {}
    }
    setInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.roomId, searchParams])

  const { gameState, loading, error, refreshGameState } = useGameState(params.roomId, playerId)

  // Detect transition to first round
  useEffect(() => {
    if (!gameState) return

    const currentStatus = gameState.status
    const previousStatus = previousStatusRef.current

    // Initialize previousStatusRef on first load
    if (previousStatus === null) {
      previousStatusRef.current = currentStatus
      return
    }

    // Check if we're transitioning from waiting/prompt_submission to playing
    // Only show if:
    // 1. Current status is 'playing'
    // 2. Previous status was NOT 'playing' (transitioning TO playing)
    // 3. We haven't shown it yet
    // 4. It's round 1
    // 5. There's actually a round available (game has started)
    if (
      currentStatus === 'playing' &&
      previousStatus !== 'playing' &&
      !hasShownFirstTransitionRef.current &&
      gameState.currentRound === 1 &&
      gameState.rounds.length > 0
    ) {
      setShowFirstRoundTransition(true)
      hasShownFirstTransitionRef.current = true
    }

    // Update previous status
    previousStatusRef.current = currentStatus
  }, [gameState?.status, gameState?.currentRound, gameState?.rounds.length])

  const handleFirstRoundTransitionComplete = () => {
    setShowFirstRoundTransition(false)
  }

  if (loading && !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading game...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 flex items-center justify-center">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    )
  }

  // While initializing or fetching, show loading instead of an error flash
  if (!initialized || loading || !playerId || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading game...</div>
      </div>
    )
  }

  const currentPlayer = Object.values(gameState.players).find(p => p.id === playerId)
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Player not found</div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${gameState.status === 'finished' ? '' : 'bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50'}`}>
      {showFirstRoundTransition && (
        <RoundTransition
          roundNumber={1}
          onComplete={handleFirstRoundTransitionComplete}
        />
      )}
      {gameState.status === 'waiting' ? (
        <GameLobby
          gameState={gameState}
          currentPlayer={currentPlayer}
          roomId={params.roomId}
        />
      ) : gameState.status === 'prompt_submission' ? (
        <PromptSubmission
          gameState={gameState}
          currentPlayer={currentPlayer}
          roomId={params.roomId}
        />
      ) : (
        <GamePlay
          gameState={gameState}
          currentPlayer={currentPlayer}
          roomId={params.roomId}
          refreshGameState={refreshGameState}
        />
      )}
    </div>
  )
}