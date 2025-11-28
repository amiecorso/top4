'use client'

import { GameRoom, Player } from '@/types/game'

interface ScoreDisplayProps {
  gameState: GameRoom
  currentPlayer: Player
  roomId: string
  refreshGameState?: () => void
}

export function ScoreDisplay({ gameState, currentPlayer, roomId, refreshGameState }: ScoreDisplayProps) {
  const currentRound = gameState.rounds[gameState.currentRound - 1]
  const correctRanking = currentRound?.playerRanking || []
  const currentPlayerName = gameState.players[currentRound?.currentPlayer || '']?.name || 'Unknown'

  const handleContinue = async () => {
    console.log('🎮 CONTINUE BUTTON CLICKED!')
    console.log('🎯 Room ID:', roomId)
    console.log('👤 Current Player:', currentPlayer.name, currentPlayer.id)
    console.log('🎲 Current Round:', gameState.currentRound)
    console.log('🔗 Making request to:', `/api/game/${roomId}/next-round`)

    try {
      console.log('📡 Sending POST request...')
      const response = await fetch(`/api/game/${roomId}/next-round`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('📥 Response received:', response.status, response.statusText)
      console.log('✅ Response OK:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('📊 Response data:', data)
        console.log('🎉 Successfully advanced to next round!')

        // Immediately refresh the game state to show the new round
        if (refreshGameState) {
          console.log('🔄 Calling refreshGameState...')
          refreshGameState()
          console.log('✨ refreshGameState called successfully')
        } else {
          console.warn('⚠️ refreshGameState function not available!')
        }
      } else {
        console.error('❌ Failed to advance to next round:', response.status, response.statusText)
        const errorData = await response.text()
        console.error('💥 Error response:', errorData)
      }
    } catch (error) {
      console.error('🚨 Network error advancing to next round:', error)
      console.error('🔍 Error details:', error.message)
      console.error('📍 Error stack:', error.stack)
    }
  }

  if (!currentRound) return null

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Round {gameState.currentRound} Results</h1>
            <div className="text-lg text-gray-600 mt-2">{currentPlayerName}'s Ranking</div>
          </div>

          {/* Correct Ranking */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Correct Ranking</h2>
            <div className="space-y-2">
              {correctRanking.map((rank, index) => {
                const ideaIndex = correctRanking.indexOf(index + 1)
                const idea = currentRound.ideas[ideaIndex]
                return (
                  <div key={index} className="flex items-center bg-blue-50 p-4 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                      {index + 1}
                    </div>
                    <div className="font-medium">{idea}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Player Predictions and Scores */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Player Predictions & Scores</h2>
            <div className="space-y-4">
              {Object.entries(currentRound.playerRankings).map(([playerId, prediction]) => {
                if (playerId === currentRound.currentPlayer) return null

                const player = gameState.players[playerId]
                const roundScore = currentRound.scores?.[playerId] || 0

                return (
                  <div key={playerId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">{player?.name}</h3>
                      <div className="text-xl font-bold text-blue-600">+{roundScore} points</div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {prediction.map((predictedRank, ideaIndex) => {
                        const correctRank = correctRanking[ideaIndex]
                        const isCorrect = predictedRank === correctRank

                        return (
                          <div
                            key={ideaIndex}
                            className={`p-3 rounded text-center ${
                              isCorrect ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'
                            }`}
                          >
                            <div className="text-sm font-medium mb-1">{currentRound.ideas[ideaIndex]}</div>
                            <div className={`text-lg font-bold ${isCorrect ? 'text-green-700' : 'text-gray-600'}`}>
                              #{predictedRank}
                              {isCorrect && ' ✓'}
                            </div>
                            {!isCorrect && (
                              <div className="text-xs text-gray-500">
                                (was #{correctRank})
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Updated Leaderboard */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
            <div className="space-y-2">
              {Object.values(gameState.players)
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div key={player.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-600 mr-3">#{index + 1}</span>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{player.score}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Continue Button - Only for Host */}
          <div className="text-center">
            {gameState.currentRound >= gameState.maxRounds ? (
              <div>
                <div className="text-lg text-gray-600 mb-4">Game Over! Final scores above.</div>
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg"
                >
                  Return to Lobby
                </button>
              </div>
            ) : currentPlayer.id === gameState.host ? (
              <button
                onClick={handleContinue}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Continue to Round {gameState.currentRound + 1}
              </button>
            ) : (
              <div className="text-lg text-gray-600">Waiting for host to continue...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}