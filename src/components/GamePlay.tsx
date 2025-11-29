'use client'

import { useState } from 'react'
import { GameRoom, Player } from '@/types/game'
import { RankingInterface } from './RankingInterface'
import { ScoreDisplay } from './ScoreDisplay'

interface GamePlayProps {
  gameState: GameRoom
  currentPlayer: Player
  roomId: string
  refreshGameState?: () => void
}

export function GamePlay({ gameState, currentPlayer, roomId, refreshGameState }: GamePlayProps) {
  const currentRound = gameState.rounds[gameState.currentRound - 1]
  const isCurrentPlayer = currentPlayer.id === currentRound?.currentPlayer
  const hasCommitted = currentRound?.committed.includes(currentPlayer.id) || false
  const allCommitted = currentRound && currentRound.committed.length === Object.keys(gameState.players).length
  const isRevealed = currentRound?.revealed || false

  if (gameState.status === 'finished') {
    return <GameFinished gameState={gameState} />
  }

  if (!currentRound) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading round...</div>
      </div>
    )
  }

  if (isRevealed) {
    return (
      <ScoreDisplay
        gameState={gameState}
        currentPlayer={currentPlayer}
        roomId={roomId}
        refreshGameState={refreshGameState}
      />
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Round {gameState.currentRound} of {gameState.maxRounds}</h1>
            <div className="text-lg text-gray-600 mt-2">
              {isCurrentPlayer ? "It's your turn!" : `${gameState.players[currentRound.currentPlayer]?.name || 'Unknown'}'s turn`}
            </div>
          </div>

          {/* Current Ideas */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Ideas to Rank</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentRound.ideas.map((idea, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="font-medium text-gray-800">{idea}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-blue-800">
              {isCurrentPlayer
                ? "Rank these ideas from 1 (best) to 4 (worst) according to your personal preference."
                : `Try to predict how ${gameState.players[currentRound.currentPlayer]?.name} will rank these ideas.`
              }
            </p>
          </div>

          {/* Ranking Interface */}
          <RankingInterface
            ideas={currentRound.ideas}
            isCurrentPlayer={isCurrentPlayer}
            hasCommitted={hasCommitted}
            roomId={roomId}
            playerId={currentPlayer.id}
          />

          {/* Status */}
          <div className="mt-6 text-center">
            {hasCommitted ? (
              <div className="text-green-600 font-medium">
                ✓ Your ranking submitted! Waiting for others...
              </div>
            ) : null}

            <div className="mt-4 text-sm text-gray-600">
              {currentRound.committed.length} of {Object.keys(gameState.players).length} players have submitted their rankings
            </div>

            {allCommitted && (
              <div className="mt-4 text-lg font-semibold text-blue-600">
                All players ready! Revealing results...
              </div>
            )}
          </div>

          {/* Player scores sidebar */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Current Scores</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.values(gameState.players)
                .sort((a, b) => b.score - a.score)
                .map((player) => (
                  <div key={player.id} className="text-center">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-2xl font-bold text-blue-600">{player.score}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GameFinished({ gameState }: { gameState: GameRoom }) {
  const sortedPlayers = Object.values(gameState.players).sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]

  const downloadPromptsCsv = () => {
    const rows: Array<[string, string]> = []
    const playerPrompts = gameState.playerPrompts || {}
    for (const [playerId, prompts] of Object.entries(playerPrompts)) {
      const playerName = gameState.players[playerId]?.name || ''
      for (const prompt of prompts) {
        rows.push([playerName, prompt])
      }
    }

    const header = ['player_name', 'prompt']
    const csv = [header, ...rows]
      .map(cols =>
        cols
          .map(val => {
            const s = String(val ?? '')
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
          })
          .join(',')
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `top4-prompts-${gameState.code}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Game Over!</h1>

          <div className="mb-8">
            <div className="text-2xl font-semibold text-blue-600 mb-2">🏆 {winner.name} Wins!</div>
            <div className="text-xl text-gray-600">{winner.score} points</div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Final Scores</h2>
            <div className="space-y-2">
              {sortedPlayers.map((player, index) => (
                <div key={player.id} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded">
                  <span>#{index + 1} {player.name}</span>
                  <span className="font-bold">{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg"
          >
            Return to Lobby
          </button>
          <button
            onClick={downloadPromptsCsv}
            className="ml-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg"
          >
            Download Prompts (CSV)
          </button>
        </div>
      </div>
    </div>
  )
}