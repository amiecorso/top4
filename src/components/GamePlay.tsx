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
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [showTransition, setShowTransition] = useState(false)
  const [transitionRound, setTransitionRound] = useState<number | null>(null)
  const previousRoundRef = useRef<number>(gameState.currentRound)
  const hasInitializedRef = useRef(false)
  const [currentCountdown, setCurrentCountdown] = useState<number | null>(null)
  const [finishingRound, setFinishingRound] = useState(false)

  // Calculate these before any early returns
  const currentRound = gameState.rounds[gameState.currentRound - 1]
  const isCurrentPlayer = currentPlayer.id === currentRound?.currentPlayer
  const hasCommitted = currentRound?.committed.includes(currentPlayer.id) || false
  // Only count players who were present when the round started
  const playersAtRoundStart = currentRound?.playersAtStart || Object.keys(gameState.players) // Fallback for backwards compatibility
  const allCommitted = currentRound && currentRound.committed.length === playersAtRoundStart.length
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

  // Keep a countdown visible for hosts who have already submitted while waiting for others
  useEffect(() => {
    const computeRemaining = (): number | null => {
      // Manual timer takes precedence
      if (currentRound?.manualTimerEndTime) {
        const remaining = Math.ceil((currentRound.manualTimerEndTime - Date.now()) / 1000)
        return Math.max(0, remaining)
      }
      // Fallback to configured round duration with roundStartTime
      if (gameState.roundDurationSeconds > 0 && currentRound?.roundStartTime) {
        const elapsed = Math.floor((Date.now() - currentRound.roundStartTime) / 1000)
        return Math.max(0, gameState.roundDurationSeconds - elapsed)
      }
      return null
    }
    // Only track while waiting (not revealed) and after the player has committed
    if (!isRevealed && hasCommitted) {
      const initial = computeRemaining()
      if (initial !== null) {
        setCurrentCountdown(initial)
      }
      const id = setInterval(() => {
        const calculated = computeRemaining()
        if (calculated !== null) {
          setCurrentCountdown(calculated)
        } else {
          // If we don't have authoritative timer data, continue decrementing locally
          setCurrentCountdown(prev => {
            if (prev === null) return prev
            return Math.max(0, prev - 1)
          })
        }
      }, 1000)
      return () => clearInterval(id)
    }
    return
  }, [
    hasCommitted,
    isRevealed,
    gameState.roundDurationSeconds,
    currentRound?.manualTimerEndTime,
    currentRound?.roundStartTime
  ])

  // Reset finishing state when round changes or reveal completes
  useEffect(() => {
    setFinishingRound(false)
  }, [gameState.currentRound, isRevealed])

  // NOW we can do conditional returns after all hooks are called
  // Check for finished status first, before accessing currentRound
  // When the game is finished, keep users on the round scoring screen
  // so they can see the final round's details and leaderboard.

  // If we've reached or exceeded the max rounds, the game should be finished
  // This is a safety check in case status hasn't updated yet
  // but we still render the ScoreDisplay to show the final round results.

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
          {!hasCommitted && (
            <div className="p-4 rounded-xl mb-6 bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 border border-blue-100">
              <p className="text-blue-800">
                {isCurrentPlayer
                  ? "Rank these ideas from 1 (best) to 4 (worst) according to your personal preference."
                  : `Try to predict how ${gameState.players[currentRound.currentPlayer]?.name} will rank these ideas.`
                }
              </p>
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
            roundStartTime={currentRound.roundStartTime}
            onCountdownChange={setCurrentCountdown}
          />

          {/* Status */}
          <div className="mt-6 text-center">
            {hasCommitted ? (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                <div className="text-emerald-800 font-semibold">
                  ✓ Your ranking submitted! Waiting for others...
                </div>
                {currentCountdown !== null && (
                  <div className="mt-2 text-sm">
                    <span className="text-slate-700 font-medium">Time remaining:</span>{' '}
                    <span className={`${currentCountdown <= 10 ? 'text-orange-700 font-semibold' : 'text-blue-700 font-semibold'}`}>
                      {Math.floor(currentCountdown / 60)
                        .toString()
                        .padStart(1, '0')}
                      :
                      {(currentCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-4 text-sm text-slate-600">
              {currentRound.committed.length} of {playersAtRoundStart.length} players have submitted their rankings
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
                  <h3 className="text-lg font-semibold text-amber-900">Host Controls</h3>
                </div>
                <div className="flex flex-col gap-3">
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
                  <div className="border-t border-amber-300 pt-3 mt-3">
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/game/${roomId}/add-round`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ playerId: currentPlayer.id }),
                          })
                          if (response.ok) {
                            if (refreshGameState) refreshGameState()
                          } else {
                            const data = await response.json()
                            console.error('Failed to add round:', data.error)
                          }
                        } catch (error) {
                          console.error('Failed to add round:', error)
                        }
                      }}
                      className="btn-success w-full"
                    >
                      Add Round (+4 prompts)
                    </button>
                    <p className="text-xs text-amber-700 mt-2 text-center">
                      Round {gameState.currentRound} of {gameState.maxRounds}
                    </p>
                  </div>
                  {hasCommitted && (
                    <div className="border-t border-amber-300 pt-3 mt-3">
                      <button
                        onClick={async () => {
                          if (finishingRound) return
                          const confirmed = window.confirm(
                            'Finish the round now for everyone? Players who haven’t submitted will be scored as no guess. This cannot be undone.'
                          )
                          if (!confirmed) return
                          setFinishingRound(true)
                          try {
                            const response = await fetch(`/api/game/${roomId}/force-finish-round`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ playerId: currentPlayer.id }),
                            })
                            if (response.ok && refreshGameState) {
                              refreshGameState()
                              setTimeout(() => {
                                if (refreshGameState) refreshGameState()
                              }, 400)
                            }
                            setFinishingRound(false)
                          } catch {
                            setFinishingRound(false)
                          }
                        }}
                        className="btn-danger w-full disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={finishingRound}
                      >
                        {finishingRound ? 'Finishing…' : 'Finish Round Now'}
                      </button>
                      <p className="text-xs text-red-700 mt-2 text-center">
                        Ends the round immediately for all players.
                      </p>
                    </div>
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

 