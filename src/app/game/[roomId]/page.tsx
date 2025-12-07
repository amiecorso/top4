'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGameState } from '@/lib/useGameState'
import { GameLobby } from '@/components/GameLobby'
import { GamePlay } from '@/components/GamePlay'
import { PromptSubmission } from '@/components/PromptSubmission'
import { RoundTransition } from '@/components/RoundTransition'
import { WaitingToJoin } from '@/components/WaitingToJoin'
import { Toast } from '@/components/Toast'

export default function GameRoom({ params }: { params: { roomId: string } }) {
  const searchParams = useSearchParams()
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [showFirstRoundTransition, setShowFirstRoundTransition] = useState(false)
  const previousStatusRef = useRef<string | null>(null)
  const hasShownFirstTransitionRef = useRef(false)
  const previousPlayerIdsRef = useRef<Set<string>>(new Set())
  const [toastMessage, setToastMessage] = useState<string | null>(null)

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

  // Detect new players joining mid-game
  useEffect(() => {
    if (!gameState) return

    const currentPlayerIds = new Set(Object.keys(gameState.players))
    
    // Initialize previousPlayerIdsRef on first load (don't show toast for initial players)
    if (previousPlayerIdsRef.current.size === 0) {
      previousPlayerIdsRef.current = currentPlayerIds
      return
    }

    // Only show toasts when game is active (not in waiting phase)
    if (gameState.status === 'waiting') {
      // Reset player tracking when in waiting phase
      previousPlayerIdsRef.current = currentPlayerIds
      return
    }

    const previousPlayerIds = previousPlayerIdsRef.current

    // Find new players (in current but not in previous)
    const newPlayerIds = Array.from(currentPlayerIds).filter(id => !previousPlayerIds.has(id))

    if (newPlayerIds.length > 0 && playerId) {
      // Filter out the current player - they know they joined, no need to show toast to them
      const otherNewPlayerIds = newPlayerIds.filter(id => id !== playerId)
      
      if (otherNewPlayerIds.length > 0) {
        // Get names of new players (excluding current player)
        const newPlayerNames = otherNewPlayerIds
          .map(id => gameState.players[id]?.name)
          .filter(Boolean) as string[]

        if (newPlayerNames.length > 0) {
          const message = newPlayerNames.length === 1
            ? `${newPlayerNames[0]} joined the game`
            : `${newPlayerNames.join(', ')} joined the game`
          setToastMessage(message)
        }
      }
      // If current player is the only new player, don't show toast
    }

    // Update previous player IDs
    previousPlayerIdsRef.current = currentPlayerIds
  }, [gameState, playerId])

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

  // Check if player joined mid-round and should wait
  // If player wasn't present when round started, they wait until round is revealed
  const currentRound = gameState.rounds[gameState.currentRound - 1]
  const wasPlayerPresentAtRoundStart = currentRound?.playersAtStart?.includes(playerId) ?? true // Default to true for backwards compatibility
  const isWaitingToJoin = 
    gameState.status === 'playing' &&
    currentRound &&
    !currentRound.revealed &&
    !wasPlayerPresentAtRoundStart // Player joined after round started

  return (
    <div className={`min-h-screen ${gameState.status === 'finished' ? '' : 'bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50'}`}>
      {toastMessage && (
        <Toast
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
      {showFirstRoundTransition && (
        <RoundTransition
          roundNumber={1}
          onComplete={handleFirstRoundTransitionComplete}
        />
      )}
      {isWaitingToJoin ? (
        <WaitingToJoin
          gameState={gameState}
          currentPlayer={currentPlayer}
        />
      ) : gameState.status === 'waiting' ? (
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