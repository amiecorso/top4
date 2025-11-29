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
      if (error instanceof Error) {
        console.error('🔍 Error details:', error.message)
        console.error('📍 Error stack:', error.stack)
      }
    }
  }

  if (!currentRound) return null

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="card-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Round {gameState.currentRound} Results</h1>
            <div className="text-lg text-slate-600 mt-2">{currentPlayerName}'s Ranking</div>
          </div>

          {/* Correct Ranking */}
          <div className="mb-8">
            <h2 className="section-title">Correct Ranking</h2>
            <div className="space-y-2">
              {correctRanking.map((rank, index) => {
                const ideaIndex = correctRanking.indexOf(index + 1)
                const idea = currentRound.ideas[ideaIndex]
                return (
                  <div key={index} className="flex items-center bg-violet-50 border border-violet-100 p-4 rounded-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                      {index + 1}
                    </div>
                    <div className="font-medium text-slate-800">{idea}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Player Predictions and Scores */}
          <div className="mb-8">
            <h2 className="section-title">Player Predictions & Scores</h2>
            <div className="space-y-4">
              {Object.entries(currentRound.playerRankings).map(([playerId, prediction]) => {
                if (playerId === currentRound.currentPlayer) return null

                const player = gameState.players[playerId]
                const roundScore = currentRound.scores?.[playerId] || 0

                return (
                  <div key={playerId} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg text-slate-800">{player?.name}</h3>
                      <div className="text-xl font-bold text-violet-600">+{roundScore} points</div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {prediction.map((predictedRank, ideaIndex) => {
                        const correctRank = correctRanking[ideaIndex]
                        const isCorrect = predictedRank === correctRank

                        return (
                          <div
                            key={ideaIndex}
                            className={`p-3 rounded text-center border ${
                              isCorrect ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="text-sm font-medium mb-1 text-slate-800">{currentRound.ideas[ideaIndex]}</div>
                            <div className={`text-lg font-bold ${isCorrect ? 'text-emerald-700' : 'text-slate-600'}`}>
                              #{predictedRank}
                              {isCorrect && ' ✓'}
                            </div>
                            {!isCorrect && (
                              <div className="text-xs text-slate-500">
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
            <h2 className="section-title">Leaderboard</h2>
            <div className="space-y-2">
              {Object.values(gameState.players)
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div key={player.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center text-slate-800">
                      <span className="text-lg font-bold text-slate-600 mr-3">#{index + 1}</span>
                      <span className="font-medium ">{player.name}</span>
                    </div>
                    <span className="text-xl font-bold text-violet-600">{player.score}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Continue Button - Only for Host */}
          <div className="text-center">
            {gameState.currentRound >= gameState.maxRounds ? (
              <div>
                <div className="text-lg text-slate-600 mb-4">Game Over! Final scores above.</div>
                <button
                  onClick={() => window.location.href = '/'}
                  className="btn-secondary"
                >
                  Return to Lobby
                </button>
                <button
                  onClick={downloadPromptsCsv}
                  className="ml-3 btn-muted"
                >
                  Download Prompts (CSV)
                </button>
              </div>
            ) : currentPlayer.id === gameState.host ? (
              <button
                onClick={handleContinue}
                className="btn-success"
              >
                Continue to Round {gameState.currentRound + 1}
              </button>
            ) : (
              <div className="text-lg text-slate-600">Waiting for host to continue...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}