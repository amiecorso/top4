'use client'

import { useState, useEffect, useRef } from 'react'
import { GameRoom, Player, GameRound } from '@/types/game'
import { RankingInterface } from './RankingInterface'
import { ScoreDisplay } from './ScoreDisplay'
import { RoundTransition } from './RoundTransition'

function AddTimeButton({ 
  roomId, 
  playerId, 
  currentRound, 
  roundDurationSeconds, 
  currentCountdown,
  refreshGameState 
}: { 
  roomId: string
  playerId: string
  currentRound: GameRound
  roundDurationSeconds: number
  currentCountdown: number | null
  refreshGameState?: () => void
}) {
  // Calculate current remaining time
  const getCurrentRemaining = (): number | null => {
    if (currentRound.manualTimerEndTime) {
      const now = Date.now()
      return Math.max(0, Math.ceil((currentRound.manualTimerEndTime - now) / 1000))
    } else if (roundDurationSeconds > 0 && currentCountdown !== null) {
      // Use the countdown from RankingInterface
      return currentCountdown
    }
    return null
  }

  return (
    <button
      onClick={async () => {
        try {
          const remaining = getCurrentRemaining()
          await fetch(`/api/game/${roomId}/manual-timer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              playerId, 
              action: 'add',
              currentRemainingSeconds: remaining
            }),
          })
          if (refreshGameState) refreshGameState()
        } catch (error) {
          console.error('Failed to add time:', error)
        }
      }}
      className="btn-success"
    >
      Add 20 Seconds
    </button>
  )
}

interface GamePlayProps {
  gameState: GameRoom
  currentPlayer: Player
  roomId: string
  refreshGameState?: () => void
}

export function GamePlay({ gameState, currentPlayer, roomId, refreshGameState }: GamePlayProps) {
  const [showTransition, setShowTransition] = useState(false)
  const [transitionRound, setTransitionRound] = useState<number | null>(null)
  const previousRoundRef = useRef<number>(gameState.currentRound)
  const hasInitializedRef = useRef(false)
  const [currentCountdown, setCurrentCountdown] = useState<number | null>(null)

  const currentRound = gameState.rounds[gameState.currentRound - 1]
  const isCurrentPlayer = currentPlayer.id === currentRound?.currentPlayer
  const hasCommitted = currentRound?.committed.includes(currentPlayer.id) || false
  const allCommitted = currentRound && currentRound.committed.length === Object.keys(gameState.players).length
  const isRevealed = currentRound?.revealed || false

  // Detect round changes and show transition
  useEffect(() => {
    // Skip on initial load
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      previousRoundRef.current = gameState.currentRound
      return
    }

    // Only show transition if round increased and we're not on the score screen
    if (gameState.currentRound > previousRoundRef.current && !isRevealed) {
      setTransitionRound(gameState.currentRound)
      setShowTransition(true)
    }

    previousRoundRef.current = gameState.currentRound
  }, [gameState.currentRound, isRevealed])

  const handleTransitionComplete = () => {
    setShowTransition(false)
    setTransitionRound(null)
  }

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
      <>
        {showTransition && transitionRound && (
          <RoundTransition
            roundNumber={transitionRound}
            onComplete={handleTransitionComplete}
          />
        )}
        <ScoreDisplay
          gameState={gameState}
          currentPlayer={currentPlayer}
          roomId={roomId}
          refreshGameState={refreshGameState}
        />
      </>
    )
  }

  return (
    <>
      {showTransition && transitionRound && (
        <RoundTransition
          roundNumber={transitionRound}
          onComplete={handleTransitionComplete}
        />
      )}
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="card-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Round {gameState.currentRound} of {gameState.maxRounds}</h1>
            <div className="mt-4">
              {isCurrentPlayer ? (
                <div className="inline-block px-8 py-4 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-white">It's Your Turn!</div>
                </div>
              ) : (
                <div className="inline-block px-8 py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-2xl shadow-lg">
                  <div className="text-3xl font-bold text-white">
                    {gameState.players[currentRound.currentPlayer]?.name || 'Unknown'}'s Turn
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Ideas */}
          <div className="mb-8">
            <h2 className="section-title">Ideas to Rank</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentRound.ideas.map((idea, index) => (
                <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <div className="font-medium text-slate-800">{idea}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-xl mb-6 bg-gradient-to-r from-fuchsia-50 via-violet-50 to-indigo-50 border border-violet-100">
            <p className="text-violet-800">
              {isCurrentPlayer
                ? "Rank these ideas from 1 (best) to 4 (worst) according to your personal preference."
                : `Try to predict how ${gameState.players[currentRound.currentPlayer]?.name} will rank these ideas.`
              }
            </p>
          </div>

          {/* Host Timer Controls */}
          {currentPlayer.id === gameState.host && !isRevealed && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="text-center mb-3">
                <h3 className="text-lg font-semibold text-amber-900">Host Timer Controls</h3>
              </div>
              <div className="flex gap-3 justify-center">
                {gameState.roundDurationSeconds === 0 && !currentRound.manualTimerEndTime && (
                  <button
                    onClick={async () => {
                      try {
                        await fetch(`/api/game/${roomId}/manual-timer`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ playerId: currentPlayer.id, action: 'start' }),
                        })
                        if (refreshGameState) refreshGameState()
                      } catch (error) {
                        console.error('Failed to start timer:', error)
                      }
                    }}
                    className="btn-primary"
                  >
                    Start 20 Second Countdown
                  </button>
                )}
                {(gameState.roundDurationSeconds > 0 || currentRound.manualTimerEndTime) && (
                  <AddTimeButton
                    roomId={roomId}
                    playerId={currentPlayer.id}
                    currentRound={currentRound}
                    roundDurationSeconds={gameState.roundDurationSeconds}
                    currentCountdown={currentCountdown}
                    refreshGameState={refreshGameState}
                  />
                )}
              </div>
            </div>
          )}

          {/* Ranking Interface */}
          <RankingInterface
            ideas={currentRound.ideas}
            isCurrentPlayer={isCurrentPlayer}
            hasCommitted={hasCommitted}
            roomId={roomId}
            playerId={currentPlayer.id}
            roundNumber={gameState.currentRound}
            durationSeconds={gameState.roundDurationSeconds}
            manualTimerEndTime={currentRound.manualTimerEndTime}
            onCountdownChange={setCurrentCountdown}
          />

          {/* Status */}
          <div className="mt-6 text-center">
            {hasCommitted ? (
              <div className="text-emerald-700 font-medium">
                ✓ Your ranking submitted! Waiting for others...
              </div>
            ) : null}

            <div className="mt-4 text-sm text-slate-600">
              {currentRound.committed.length} of {Object.keys(gameState.players).length} players have submitted their rankings
            </div>

            {allCommitted && (
              <div className="mt-4 text-lg font-semibold text-violet-700">
                All players ready! Revealing results...
              </div>
            )}
          </div>

          {/* Player scores sidebar */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Current Scores</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.values(gameState.players)
                .sort((a, b) => b.score - a.score)
                .map((player) => (
                  <div key={player.id} className="text-center">
                    <div className="text-lg font-bold text-slate-900">{player.name}</div>
                    <div className="text-2xl font-bold text-violet-600">{player.score}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

function GameFinished({ gameState }: { gameState: GameRoom }) {
  const sortedPlayers = getSortedPlayers(gameState)
  const winner = sortedPlayers[0]

  function getSortedPlayers(gs: GameRoom) {
    const players = Object.values(gs.players)
    const rounds = gs.rounds
    const perfectCounts: Record<string, number> = {}
    const twoCounts: Record<string, number> = {}
    const voidedAsTurnTaker: Record<string, number> = {}
    players.forEach(p => {
      perfectCounts[p.id] = 0
      twoCounts[p.id] = 0
      voidedAsTurnTaker[p.id] = 0
    })
    const cumulative: Record<string, number> = {}
    players.forEach(p => (cumulative[p.id] = 0))
    rounds.forEach((round, idx) => {
      if (round.voided) {
        voidedAsTurnTaker[round.currentPlayer] = (voidedAsTurnTaker[round.currentPlayer] || 0) + 1
        return
      }
      if (!round.playerRanking) return
      Object.entries(round.scores || {}).forEach(([pid, pts]) => {
        cumulative[pid] = (cumulative[pid] || 0) + (pts || 0)
      })
      Object.entries(round.playerRankings || {}).forEach(([pid, pred]) => {
        if (pid === round.currentPlayer) return
        let correct = 0
        for (let i = 0; i < 4; i++) if (pred[i] === round.playerRanking![i]) correct++
        if (correct === 4) perfectCounts[pid] += 1
        if (correct === 2) twoCounts[pid] += 1
      })
    })
    return players.sort((a, b) => {
      const scoreDiff = (b.score || 0) - (a.score || 0)
      if (scoreDiff !== 0) return scoreDiff
      const perfDiff = (perfectCounts[b.id] || 0) - (perfectCounts[a.id] || 0)
      if (perfDiff !== 0) return perfDiff
      const twoDiff = (twoCounts[b.id] || 0) - (twoCounts[a.id] || 0)
      if (twoDiff !== 0) return twoDiff
      const voidDiff = (voidedAsTurnTaker[a.id] || 0) - (voidedAsTurnTaker[b.id] || 0)
      if (voidDiff !== 0) return voidDiff
      return a.name.localeCompare(b.name)
    })
  }

  const downloadPromptsCsv = () => {
    const rows: Array<string> = []
    const playerPrompts = gameState.playerPrompts || {}
    for (const [playerId, prompts] of Object.entries(playerPrompts)) {
      for (const prompt of prompts) {
        rows.push(prompt)
      }
    }

    const header = ['prompt']
    const csv = [header, ...rows.map(prompt => [prompt])]
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
        <div className="card-lg">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Game Over!</h1>

          <div className="mb-8">
            <div className="text-3xl font-bold text-violet-600 mb-2">🏆 {winner.name} Wins!</div>
            <div className="text-xl text-slate-600">{winner.score} points</div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Final Scores</h2>
            <div className="space-y-2">
              {sortedPlayers.map((player, index) => (
                <div key={player.id} className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                  <span className="text-lg font-bold">#{index + 1} {player.name}</span>
                  <span className="font-bold">{player.score}</span>
                </div>
              ))}
            </div>
          </div>

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
      </div>
    </div>
  )
}