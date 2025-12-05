'use client'

import { useState, useEffect, useRef } from 'react'
import { GameRoom, Player, GameRound } from '@/types/game'
import { RankingInterface } from './RankingInterface'
import { ScoreDisplay } from './ScoreDisplay'
import { RoundTransition } from './RoundTransition'
import { Confetti } from './Confetti'

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
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [showTransition, setShowTransition] = useState(false)
  const [transitionRound, setTransitionRound] = useState<number | null>(null)
  const previousRoundRef = useRef<number>(gameState.currentRound)
  const hasInitializedRef = useRef(false)
  const [currentCountdown, setCurrentCountdown] = useState<number | null>(null)

  // Calculate these before any early returns
  const currentRound = gameState.rounds[gameState.currentRound - 1]
  const isCurrentPlayer = currentPlayer.id === currentRound?.currentPlayer
  const hasCommitted = currentRound?.committed.includes(currentPlayer.id) || false
  const allCommitted = currentRound && currentRound.committed.length === Object.keys(gameState.players).length
  const isRevealed = currentRound?.revealed || false

  // Force refresh when status changes to finished
  useEffect(() => {
    if (gameState.status === 'finished' && refreshGameState) {
      refreshGameState()
    }
  }, [gameState.status, refreshGameState])

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

  // NOW we can do conditional returns after all hooks are called
  // Check for finished status first, before accessing currentRound
  if (gameState.status === 'finished') {
    console.log('🎮 Game status is finished, showing GameFinished')
    return <GameFinished gameState={gameState} />
  }

  // If we've reached or exceeded the max rounds, the game should be finished
  // This is a safety check in case status hasn't updated yet
  if (gameState.currentRound >= gameState.maxRounds) {
    // Check if we're on the last round's score screen - if so, game is finished
    const lastRound = gameState.rounds[gameState.maxRounds - 1]
    if (lastRound?.revealed) {
      console.log('🎮 Last round revealed and currentRound >= maxRounds, showing GameFinished')
      return <GameFinished gameState={gameState} />
    }
  }

  const handleTransitionComplete = () => {
    setShowTransition(false)
    setTransitionRound(null)
  }


  // If no current round but game isn't finished, show loading
  if (!currentRound) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading round...</div>
      </div>
    )
  }

  if (isRevealed) {
    // Double-check finished status here in case it changed while ScoreDisplay was rendering
    if (gameState.status === 'finished') {
      console.log('🎮 ScoreDisplay: status is finished, showing GameFinished')
      return <GameFinished gameState={gameState} />
    }
    
    // Also check if we're on the last round and it's revealed
    if (gameState.currentRound >= gameState.maxRounds && currentRound?.revealed) {
      console.log('🎮 ScoreDisplay: last round revealed, showing GameFinished')
      return <GameFinished gameState={gameState} />
    }
    
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
                <div className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
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

          {/* Instructions */}
          <div className="p-4 rounded-xl mb-6 bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 border border-blue-100">
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
              <div className="mt-4 text-lg font-semibold text-blue-700">
                All players ready! Revealing results...
              </div>
            )}
          </div>

          {/* Host Timer Controls */}
          {currentPlayer.id === gameState.host && !isRevealed && (
            <div className="mt-8 border-t pt-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
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
            </div>
          )}

          {/* Player scores sidebar */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Current Scores</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.values(gameState.players)
                .sort((a, b) => b.score - a.score)
                .map((player) => (
                  <div key={player.id} className="text-center">
                    <div className="text-lg font-bold text-slate-900">{player.name}</div>
                    <div className="text-2xl font-bold text-blue-600">{player.score}</div>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-sky-900 to-cyan-900 relative overflow-hidden">
      <Confetti />
      
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => {
          const size = Math.random() * 200 + 100
          const left = Math.random() * 100
          const top = Math.random() * 100
          const delay = Math.random() * 3
          const duration = Math.random() * 4 + 3
          
          return (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 animate-pulse"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          )
        })}
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10 p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-8">Game Over!</h1>

          <div className="mb-10">
            <div className="inline-block px-8 py-6 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-2xl shadow-lg mb-4">
              <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">🏆 {winner.name} Wins!</div>
              <div className="text-2xl md:text-3xl font-semibold text-slate-800">{winner.score} points</div>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-800">Final Rankings</h2>
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`flex justify-between items-center px-6 py-4 rounded-xl border-2 ${
                    index === 0 
                      ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 shadow-md' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-bold ${index === 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                      #{index + 1}
                    </span>
                    <span className={`text-xl md:text-2xl font-bold ${index === 0 ? 'text-slate-900' : 'text-slate-800'}`}>
                      {player.name}
                    </span>
                  </div>
                  <span className={`text-2xl md:text-3xl font-bold ${index === 0 ? 'text-amber-600' : 'text-blue-600'}`}>
                    {player.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/'}
              className="btn-primary text-lg px-8 py-4"
            >
              Return to Lobby
            </button>
            <button
              onClick={downloadPromptsCsv}
              className="btn-muted text-lg px-8 py-4"
            >
              Download Prompts (CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}