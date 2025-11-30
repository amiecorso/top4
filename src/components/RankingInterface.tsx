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
}

export function RankingInterface({ ideas, isCurrentPlayer, hasCommitted, roomId, playerId, roundNumber, durationSeconds }: RankingInterfaceProps) {
  const [ranking, setRanking] = useState<number[]>([0, 0, 0, 0])
  const [countdown, setCountdown] = useState<number>(durationSeconds)
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

  const submitRanking = async (auto = false, baseOverride?: number[]) => {
    // Prevent double-clicks before React applies state updates
    if (submittingRef.current) return
    const base = baseOverride ?? ranking
    if (base.includes(0) || new Set(base).size !== 4) {
      if (!auto) {
        alert('Please rank all ideas from 1 to 4')
        return
      }
    }

    submittingRef.current = true
    if (!auto) setClicked(true)
    setSubmitting(true)
    try {
      const payloadRanking = auto ? buildAutoCompletedRanking(base) : base
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
  }, [roundNumber])

  // Keep rankingRef in sync with state
  useEffect(() => {
    rankingRef.current = ranking
  }, [ranking])

  // Countdown timer effect
  useEffect(() => {
    if (!durationSeconds || durationSeconds <= 0) return // no timer mode
    if (hasCommitted) return
    if (submitting) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Timeout behavior:
          // - If current player (turn-taker) times out, void the round (no points, -1 to them)
          // - Otherwise, auto-submit a completed ranking
          if (isCurrentPlayer) {
            fetch(`/api/game/${roomId}/void-round`, { method: 'POST' }).catch(() => {
              console.warn('Failed to request void round')
            })
          } else {
            submitRanking(true, rankingRef.current)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hasCommitted, submitting, roundNumber, durationSeconds]) // reset when new round (roundNumber) or commit state changes

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
      {!!durationSeconds && durationSeconds > 0 && (
      <div className={`mb-4 flex items-center justify-center ${countdown <= 10 ? 'animate-pulse' : ''}`}>
        <div className="w-full md:w-2/3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-slate-700">Time remaining</span>
            <span className={`text-sm font-semibold ${countdown <= 10 ? 'text-rose-700' : 'text-violet-700'}`}>
              {Math.floor(countdown / 60)
                .toString()
                .padStart(1, '0')}
              :
              {(countdown % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${countdown <= 10 ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600' : 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500'}`}
              style={{ width: `${(countdown / Math.max(1, durationSeconds)) * 100}%` }}
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
                      ? 'bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white shadow-md'
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
          className="btn-primary disabled:bg-slate-300 disabled:cursor-not-allowed"
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