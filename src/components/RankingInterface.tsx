'use client'

import { useEffect, useRef, useState } from 'react'

interface RankingInterfaceProps {
  ideas: string[]
  isCurrentPlayer: boolean
  hasCommitted: boolean
  roomId: string
  playerId: string
  roundNumber: number
  durationSeconds: number
  manualTimerEndTime?: number // Timestamp when manual timer expires
  onCountdownChange?: (countdown: number) => void // Callback to notify parent of countdown changes
}

export function RankingInterface({ ideas, isCurrentPlayer, hasCommitted, roomId, playerId, roundNumber, durationSeconds, manualTimerEndTime, onCountdownChange }: RankingInterfaceProps) {
  const [ranking, setRanking] = useState<number[]>([0, 0, 0, 0])
  const [countdown, setCountdown] = useState<number>(durationSeconds)
  const [manualTimerActive, setManualTimerActive] = useState(false)
  const [initialManualTimerDuration, setInitialManualTimerDuration] = useState<number>(20)
  const [submitting, setSubmitting] = useState(false)
  const [clicked, setClicked] = useState(false)
  const rankingRef = useRef<number[]>([0, 0, 0, 0])
  const submittingRef = useRef(false)

  const handleRankingChange = (ideaIndex: number, rank: number) => {
    const newRanking = [...ranking]

    // Clear any existing assignment of this rank
    const existingIndex = newRanking.indexOf(rank)
    if (existingIndex !== -1) {
      newRanking[existingIndex] = 0
    }

    newRanking[ideaIndex] = rank
    setRanking(newRanking)
    rankingRef.current = newRanking
  }

  const buildAutoCompletedRanking = (base: number[]): number[] => {
    const current = [...base]
    const usedRanks = new Set(current.filter((r) => r !== 0))
    const unassignedRanks = [1, 2, 3, 4].filter((r) => !usedRanks.has(r))
    const unselectedIdeaIndexes: number[] = []
    for (let i = 0; i < current.length; i++) {
      if (current[i] === 0) unselectedIdeaIndexes.push(i)
    }

    // Shuffle unassigned ranks
    const shuffledRanks = [...unassignedRanks].sort(() => Math.random() - 0.5)

    // Assign shuffled ranks to remaining idea slots
    for (let i = 0; i < unselectedIdeaIndexes.length; i++) {
      const idx = unselectedIdeaIndexes[i]
      current[idx] = shuffledRanks[i]
    }
    return current
  }

  const submitRanking = async (auto = false, baseOverride?: number[], allowPartial = false) => {
    // Prevent double-clicks before React applies state updates
    if (submittingRef.current) return
    const base = baseOverride ?? ranking
    
    // Validate ranking
    if (!allowPartial) {
      // Manual submission: must be complete (no 0s, contains 1,2,3,4)
      if (base.includes(0) || new Set(base).size !== 4) {
        if (!auto) {
          alert('Please rank all ideas from 1 to 4')
          return
        }
      }
    } else {
      // Partial submission: non-zero values must be valid and unique
      const nonZeroValues = base.filter(r => r !== 0)
      const uniqueNonZero = new Set(nonZeroValues)
      if (nonZeroValues.length !== uniqueNonZero.size) {
        // Duplicate ranks found - shouldn't happen, but handle gracefully
        console.warn('Duplicate ranks in partial submission')
      }
      // Check all non-zero values are 1-4
      if (nonZeroValues.some(r => r < 1 || r > 4)) {
        console.warn('Invalid rank values in partial submission')
      }
    }

    submittingRef.current = true
    if (!auto) setClicked(true)
    setSubmitting(true)
    try {
      // If allowPartial is true (timeout case), submit partial ranking with 0s for unranked
      // Otherwise, auto-complete or use manual submission
      const payloadRanking = allowPartial ? base : (auto ? buildAutoCompletedRanking(base) : base)
      const response = await fetch(`/api/game/${roomId}/submit-ranking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          ranking: payloadRanking
        }),
      })

      if (!response.ok) {
        if (!auto) {
          try {
            const data = await response.json()
            alert(data.error || 'Failed to submit ranking')
          } catch {
            alert('Failed to submit ranking')
          }
          // Allow retry on manual error
          setClicked(false)
          setSubmitting(false)
          submittingRef.current = false
          return
        } else {
          // Suppress UI alerts for auto-submit; log for troubleshooting
          try {
            const text = await response.text()
            console.warn('Auto-submit ranking failed:', text)
          } catch {
            console.warn('Auto-submit ranking failed')
          }
          // Auto case: keep disabled; server will proceed anyway
        }
      }
    } catch (error) {
      console.error('Error submitting ranking:', error)
      if (!auto) {
        alert('Failed to submit ranking')
        // Allow retry on manual error
        setClicked(false)
        setSubmitting(false)
        submittingRef.current = false
        return
      } else {
        console.warn('Auto-submit network error')
      }
    }
    // On success, keep disabled until the server-driven state flips to committed/reveal
  }

  // Reset local state when new round starts (based on roundNumber)
  useEffect(() => {
    setRanking([0, 0, 0, 0])
    rankingRef.current = [0, 0, 0, 0]
    setCountdown(durationSeconds)
    setManualTimerActive(false)
    setInitialManualTimerDuration(20)
  }, [roundNumber, durationSeconds])

  // Check for manual timer and update countdown
  useEffect(() => {
    if (manualTimerEndTime) {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((manualTimerEndTime - now) / 1000))
      if (remaining > 0) {
        setManualTimerActive(true)
        setCountdown(remaining)
        
        // Update denominator logic:
        // - If this is the first time we see a manual timer and there's a round timer, use durationSeconds as base
        // - If remaining time > current denominator, reset denominator to remaining (time was added beyond current max)
        // - Otherwise, keep existing denominator (time was added but doesn't exceed current max, so progress position stays)
        if (initialManualTimerDuration === 20 && durationSeconds > 0) {
          // First time manual timer appears, use round timer duration as base
          setInitialManualTimerDuration(durationSeconds)
        }
        // If remaining time exceeds current denominator, update it
        // This happens when time is added and the new total exceeds the previous max
        if (remaining > initialManualTimerDuration) {
          setInitialManualTimerDuration(remaining)
        }
      } else {
        setManualTimerActive(false)
        setCountdown(0)
      }
    } else {
      setManualTimerActive(false)
      setInitialManualTimerDuration(20) // Reset to default 20 seconds
      // Reset to durationSeconds if no manual timer
      if (durationSeconds > 0 && !hasCommitted) {
        setCountdown(durationSeconds)
      }
    }
  }, [manualTimerEndTime, durationSeconds, hasCommitted, initialManualTimerDuration])

  // Sync manual timer countdown every second
  useEffect(() => {
    if (!manualTimerActive || !manualTimerEndTime || hasCommitted) return

    const syncTimer = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((manualTimerEndTime - now) / 1000))
      setCountdown(remaining)
      
      // Update initial duration if remaining time exceeds it (time was added)
      if (remaining > initialManualTimerDuration) {
        setInitialManualTimerDuration(remaining)
      }
      
      if (remaining <= 0) {
        setManualTimerActive(false)
        // Timer expired - handle timeout
        if (isCurrentPlayer) {
          fetch(`/api/game/${roomId}/void-round`, { method: 'POST' }).catch(() => {
            console.warn('Failed to request void round')
          })
        } else {
          submitRanking(true, rankingRef.current, true)
        }
      }
    }, 1000)

    return () => clearInterval(syncTimer)
  }, [manualTimerActive, manualTimerEndTime, hasCommitted, isCurrentPlayer, roomId, initialManualTimerDuration])

  // Keep rankingRef in sync with state
  useEffect(() => {
    rankingRef.current = ranking
  }, [ranking])

  // Notify parent of countdown changes
  useEffect(() => {
    if (onCountdownChange) {
      onCountdownChange(countdown)
    }
  }, [countdown, onCountdownChange])

  // Countdown timer effect (only when manual timer is NOT active)
  useEffect(() => {
    if (hasCommitted) return
    if (submitting) return
    if (manualTimerActive) return // Skip if manual timer is active

    // Use durationSeconds if available
    if (!durationSeconds || durationSeconds <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Timeout behavior:
          // - If current player (turn-taker) times out, void the round (no points, -1 to them)
          // - Otherwise, submit partial ranking (only what they've selected, 0s for unranked)
          if (isCurrentPlayer) {
            fetch(`/api/game/${roomId}/void-round`, { method: 'POST' }).catch(() => {
              console.warn('Failed to request void round')
            })
          } else {
            submitRanking(true, rankingRef.current, true)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hasCommitted, submitting, roundNumber, durationSeconds, manualTimerActive, isCurrentPlayer, roomId]) // reset when new round (roundNumber) or commit state changes


  // No sound on low-time warning; visual pulse only

  if (hasCommitted) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 text-center">
        <div className="text-emerald-800 font-semibold">✓ Ranking submitted successfully!</div>
        <div className="text-emerald-600 mt-2">Waiting for other players...</div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        {isCurrentPlayer ? 'Your Ranking' : 'Your Prediction'}
      </h3>

      {/* Round timer */}
      {(manualTimerActive || (durationSeconds && durationSeconds > 0)) && (
      <div className={`mb-4 flex items-center justify-center ${countdown <= 10 ? 'animate-pulse' : ''}`}>
        <div className="w-full md:w-2/3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-slate-700">Time remaining</span>
            <span className={`text-sm font-semibold ${countdown <= 10 ? 'text-orange-700' : 'text-blue-700'}`}>
              {Math.floor(countdown / 60)
                .toString()
                .padStart(1, '0')}
              :
              {(countdown % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${countdown <= 10 ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-red-600' : 'bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500'}`}
              style={{ 
                width: `${manualTimerActive 
                  ? (countdown / Math.max(1, initialManualTimerDuration)) * 100 
                  : (countdown / Math.max(1, durationSeconds)) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
      )}

      <div className="space-y-4">
        {ideas.map((idea, index) => (
          <div key={index} className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex-1 font-medium text-slate-800">{idea}</div>
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((rank) => (
                <button
                  key={rank}
                  onClick={() => handleRankingChange(index, rank)}
                  className={`w-10 h-10 rounded-full font-semibold transition-all focus:outline-none ${
                    ranking[index] === rank
                      ? 'bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 text-white shadow-md'
                      : 'bg-white border-2 border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {rank}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => submitRanking(false)}
          disabled={ranking.includes(0) || submitting || clicked}
          className="btn-primary disabled:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting || clicked ? 'Submitting...' : 'Submit Ranking'}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500 text-center">
        Rank from 1 (best) to 4 (worst). Each rank can only be used once.
      </div>
    </div>
  )
}