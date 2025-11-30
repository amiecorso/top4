'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGameState } from '@/lib/useGameState'
import { GameLobby } from '@/components/GameLobby'
import { GamePlay } from '@/components/GamePlay'
import { PromptSubmission } from '@/components/PromptSubmission'

export default function GameRoom({ params }: { params: { roomId: string } }) {
  const searchParams = useSearchParams()
  const [playerId, setPlayerId] = useState<string | null>(null)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.roomId, searchParams])

  const { gameState, loading, error, refreshGameState } = useGameState(params.roomId, playerId)

  if (loading && !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-violet-50 to-sky-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading game...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-violet-50 to-sky-50 flex items-center justify-center">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!gameState || !playerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-violet-50 to-sky-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Game not found</div>
      </div>
    )
  }

  const currentPlayer = Object.values(gameState.players).find(p => p.id === playerId)
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-violet-50 to-sky-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Player not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-violet-50 to-sky-50">
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