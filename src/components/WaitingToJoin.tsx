'use client'

import { GameRoom } from '@/types/game'

interface WaitingToJoinProps {
  gameState: GameRoom
  currentPlayer: { id: string; name: string; score: number; isConnected: boolean }
}

export function WaitingToJoin({ gameState, currentPlayer }: WaitingToJoinProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="card text-center">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 bg-clip-text text-transparent">
            Welcome, {currentPlayer.name}!
          </h1>
          
          <div className="mb-6">
            <div className="text-2xl font-semibold text-slate-700 mb-4">
              Game Code: <span className="font-mono text-3xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg inline-block">{gameState.code}</span>
            </div>
          </div>

          <div className="bg-blue-100 border-2 border-blue-300 rounded-xl p-6 mb-6">
            <div className="text-xl font-semibold text-blue-900 mb-3">
              ⏳ Waiting for Next Round
            </div>
            <p className="text-blue-800 text-lg">
              The current round is in progress. You'll be able to join at the beginning of the next round!
            </p>
            <p className="text-blue-700 mt-3 text-sm">
              Round {gameState.currentRound} of {gameState.maxRounds}
            </p>
          </div>

          <div className="text-slate-600">
            <p className="mb-2">Players in game:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.values(gameState.players).map((player) => (
                <div
                  key={player.id}
                  className="px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg border border-blue-200"
                >
                  <span className="font-medium text-slate-700">{player.name}</span>
                  {player.id === gameState.host && (
                    <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Host</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

