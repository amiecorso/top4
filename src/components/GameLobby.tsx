'use client'

import { GameRoom, Player } from '@/types/game'

interface GameLobbyProps {
  gameState: GameRoom
  currentPlayer: Player
  roomId: string
}

export function GameLobby({ gameState, currentPlayer, roomId }: GameLobbyProps) {
  const isHost = currentPlayer.id === gameState.host
  const players = Object.values(gameState.players)

  const handleStartGame = async () => {
    try {
      await fetch(`/api/game/${roomId}/start`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error starting game:', error)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Top Four</h1>

          <div className="text-center mb-8">
            <div className="text-2xl font-mono bg-gray-100 px-4 py-2 rounded-lg inline-block">
              Game Code: <span className="font-bold text-blue-600">{gameState.code}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Share this code with friends to join!</p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Players ({players.length})</h2>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg"
                >
                  <span className="font-medium">{player.name}</span>
                  <div className="flex items-center space-x-2">
                    {player.id === gameState.host && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Host</span>
                    )}
                    <div className={`w-3 h-3 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">How to Play</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. On your turn, 4 random ideas will be shown</li>
              <li>2. Rank them from 1 (best) to 4 (worst) according to your preference</li>
              <li>3. Other players try to predict your ranking</li>
              <li>4. Players get points for guessing positions correctly</li>
              <li>5. After {gameState.maxRounds} rounds, highest score wins!</li>
            </ol>
          </div>

          {isHost ? (
            <div className="text-center">
              <button
                onClick={handleStartGame}
                disabled={players.length < 2}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                {players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}