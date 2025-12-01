'use client'

import { GameRoom, Player } from '@/types/game'
import { useState } from 'react'

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
  const isVoided = !!currentRound?.voided
  const rounds = gameState.rounds

  function computeTieBreakStats() {
    const perfectCounts: Record<string, number> = {}
    const twoCounts: Record<string, number> = {}
    const voidedAsTurnTaker: Record<string, number> = {}
    const players = Object.keys(gameState.players)
    players.forEach(pid => {
      perfectCounts[pid] = 0
      twoCounts[pid] = 0
      voidedAsTurnTaker[pid] = 0
    })

    const cumulative: Record<string, number> = {}
    players.forEach(pid => (cumulative[pid] = 0))

    rounds.forEach((round, idx) => {
      if (round.voided) {
        // penalty already applied to current player via score
        if (round.currentPlayer in voidedAsTurnTaker) {
          voidedAsTurnTaker[round.currentPlayer] += 1
        }
        return
      }
      const correctRankingLocal = round.playerRanking
      if (!correctRankingLocal) return

      // Update cumulative from round.scores
      Object.entries(round.scores || {}).forEach(([pid, pts]) => {
        cumulative[pid] = (cumulative[pid] || 0) + (pts || 0)
      })

      // Count perfect and two-correct (exactly 2)
      Object.entries(round.playerRankings || {}).forEach(([pid, prediction]) => {
        if (pid === round.currentPlayer) return
        let correct = 0
        for (let i = 0; i < 4; i++) {
          if (prediction[i] === correctRankingLocal[i]) correct++
        }
        if (correct === 4) perfectCounts[pid] += 1
        if (correct === 2) twoCounts[pid] += 1
      })
    })

    return { perfectCounts, twoCounts, voidedAsTurnTaker }
  }

  function sortPlayersWithTieBreak() {
    const { perfectCounts, twoCounts, voidedAsTurnTaker } = computeTieBreakStats()
    return Object.values(gameState.players).sort((a, b) => {
      const scoreDiff = (b.score || 0) - (a.score || 0)
      if (scoreDiff !== 0) return scoreDiff
      const perfectDiff = (perfectCounts[b.id] || 0) - (perfectCounts[a.id] || 0)
      if (perfectDiff !== 0) return perfectDiff
      const twoDiff = (twoCounts[b.id] || 0) - (twoCounts[a.id] || 0)
      if (twoDiff !== 0) return twoDiff
      const voidedDiff = (voidedAsTurnTaker[a.id] || 0) - (voidedAsTurnTaker[b.id] || 0) // fewer is better
      if (voidedDiff !== 0) return voidedDiff
      return a.name.localeCompare(b.name)
    })
  }
  const rankBadgeBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-emerald-600'
      case 2:
        return 'bg-lime-600'
      case 3:
        return 'bg-amber-500'
      case 4:
      default:
        return 'bg-orange-600'
    }
  }

  const rankTextColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-emerald-700'
      case 2:
        return 'text-lime-700'
      case 3:
        return 'text-amber-700'
      case 4:
      default:
        return 'text-orange-700'
    }
  }

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

  const [continuing, setContinuing] = useState(false)
  const handleContinue = async () => {
    if (continuing) return
    setContinuing(true)
    try {
      const response = await fetch(`/api/game/${roomId}/next-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) {
        if (refreshGameState) refreshGameState()
      } else {
        setContinuing(false)
      }
    } catch {
      setContinuing(false)
    }
  }

  if (!currentRound) return null

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="card-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              Round {gameState.currentRound} {isVoided ? 'Results — Voided' : 'Results'}
            </h1>
            <div className="text-lg text-slate-600 mt-2">{currentPlayerName}'s Ranking</div>
          </div>

          {isVoided && (
            <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-center">
              <div className="text-rose-700 font-semibold">This round was voided due to a timeout.</div>
              <div className="text-sm text-rose-700/80 mt-1">Penalty: -1 point applied to {currentPlayerName}.</div>
            </div>
          )}

          {/* Correct Ranking */}
          <div className="mb-8">
            <h2 className="section-title">{isVoided ? 'Prompts' : 'Correct Ranking'}</h2>
            <div className="space-y-2">
              {isVoided ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentRound.ideas.map((idea, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800">
                      {idea}
                    </div>
                  ))}
                </div>
              ) : (
                correctRanking.map((rank, index) => {
                  const ideaIndex = correctRanking.indexOf(index + 1)
                  const idea = currentRound.ideas[ideaIndex]
                  return (
                    <div key={index} className="flex items-center bg-violet-50 border border-violet-100 p-4 rounded-xl">
                      <div className={`w-8 h-8 ${rankBadgeBg(index + 1)} text-white rounded-full flex items-center justify-center font-bold mr-4`}>
                        {index + 1}
                      </div>
                      <div className="font-medium text-slate-800">{idea}</div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Player Predictions and Scores */}
          <div className="mb-8">
            <h2 className="section-title">Player Predictions & Scores</h2>
            {isVoided ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-slate-700">
                Round voided — no predictions scored.
              </div>
            ) : (
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
                              <div className="text-lg font-bold">
                                <span className={isCorrect ? 'text-emerald-800' : 'text-rose-600'}>#{predictedRank}</span>
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
            )}
          </div>

          {/* Updated Leaderboard */}
          <div className="mb-8">
            <h2 className="section-title">Leaderboard</h2>
            <div className="space-y-2">
              {sortPlayersWithTieBreak().map((player, index) => (
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
                  className="btn-primary"
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
                disabled={continuing}
                className="btn-success disabled:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {continuing ? 'Continuing…' : `Continue to Round ${gameState.currentRound + 1}`}
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