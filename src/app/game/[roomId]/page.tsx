'use client'

import { useSearchParams } from 'next/navigation'
import { useGameState } from '@/lib/useGameState'
import { GameLobby } from '@/components/GameLobby'
import { GamePlay } from '@/components/GamePlay'
import { PromptSubmission } from '@/components/PromptSubmission'

export default function GameRoom({ params }: { params: { roomId: string } }) {
  const searchParams = useSearchParams()
  const playerId = searchParams?.get('playerId')
  const { gameState, loading, error, refreshGameState } = useGameState(params.roomId, playerId)

  if (loading && !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading game...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!gameState || !playerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Game not found</div>
      </div>
    )
  }

  const currentPlayer = Object.values(gameState.players).find(p => p.id === playerId)
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Player not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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