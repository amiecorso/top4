'use client'

import { useEffect, useState } from 'react'
import { GameRoom, Player } from '@/types/game'

interface PromptSubmissionProps {
  gameState: GameRoom
  currentPlayer: Player
  roomId: string
}

export function PromptSubmission({ gameState, currentPlayer, roomId }: PromptSubmissionProps) {
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [optimisticAdds, setOptimisticAdds] = useState(0)

  const playerPrompts = gameState.playerPrompts[currentPlayer.id] || []
  const required = gameState.requiredPromptsPerPlayer
  const submitted = playerPrompts.length + optimisticAdds
  const remaining = required - submitted
  const isComplete = submitted >= required

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPrompt.trim() || submitting) return

    setSubmitting(true)
    setError('')
    setOptimisticAdds(prev => prev + 1)
    const promptToSend = currentPrompt.trim()
    setCurrentPrompt('')

    try {
      const response = await fetch('/api/submit-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          playerId: currentPlayer.id,
          prompt: promptToSend,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // ok; optimistic add will be reconciled by polling
      } else {
        setError(data.error || 'Failed to submit prompt')
        setOptimisticAdds(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      setError('Network error')
      setOptimisticAdds(prev => Math.max(0, prev - 1))
    } finally {
      setSubmitting(false)
    }
  }

  // Reconcile optimistic adds when server state catches up
  useEffect(() => {
    setOptimisticAdds(0)
  }, [gameState.playerPrompts[currentPlayer.id]?.length])

  const allPlayersComplete = Object.keys(gameState.players).every(
    pid => (gameState.playerPrompts[pid]?.length || 0) >= required
  )
  const isHost = currentPlayer.id === gameState.host

  const [starting, setStarting] = useState(false)

  const startGameFromPrompts = async () => {
    if (!isHost || !allPlayersComplete || starting) return
    setStarting(true)
    try {
      const res = await fetch(`/api/game/${roomId}/finalize-prompts`, {
        method: 'POST'
      })
      if (!res.ok) {
        // show lightweight inline error
        setError('Failed to start game. Please try again.')
        setStarting(false)
      }
    } catch {
      setError('Network error')
      setStarting(false)
    }
  }

  if (isComplete) {
    // Show waiting screen
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full card-lg">
          <h1 className="text-3xl font-bold text-center text-slate-900 mb-6">
            Great job, <span className="font-bold text-lg">{currentPlayer.name}</span>!
          </h1>
          <p className="text-center text-slate-600 mb-8">
            You've submitted all {required} prompts. Waiting for other players...
          </p>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Player Progress:</h2>
            {Object.entries(gameState.players).map(([playerId, player]) => {
              const playerSubmitted = gameState.playerPrompts[playerId]?.length || 0
              const playerRemaining = required - playerSubmitted
              const isDone = playerSubmitted >= required

              return (
                <div
                  key={playerId}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="text-lg font-bold text-slate-900">{player.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">
                      {playerSubmitted} / {required}
                    </span>
                    {isDone ? (
                      <span className="text-emerald-700 font-bold">✓</span>
                    ) : (
                      <span className="text-orange-600 text-sm">
                        {playerRemaining} remaining
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8">
            {isHost ? (
              <button
                onClick={startGameFromPrompts}
                disabled={!allPlayersComplete || starting}
                className="w-full btn-primary disabled:bg-slate-300"
              >
                {starting ? 'Starting…' : 'Start Game'}
              </button>
            ) : (
              <div className="text-center text-sm text-slate-500">
                Waiting for the host to start the game…
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show prompt submission form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full card-lg">
        <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">
          Submit Your Ideas
        </h1>
        <p className="text-center text-slate-600 mb-6">
          Help create the game by submitting {required} unique ideas!
        </p>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold text-slate-800">Your Progress:</span>
            <span className="text-2xl font-bold text-violet-600">
              {submitted} / {required}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500"
              style={{ width: `${(submitted / required) * 100}%` }}
            />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {remaining} {remaining === 1 ? 'idea' : 'ideas'} remaining
          </p>
        </div>

        {error && (
          <div className="card bg-red-50 border-red-200 text-red-700 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="label">
              Enter an idea:
            </label>
            <input
              id="prompt"
              type="text"
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder="e.g., rainy days, pizza night, surprise parties..."
              className="input text-lg"
              maxLength={100}
              disabled={submitting}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Keep it short and simple (max 100 characters)
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || !currentPrompt.trim()}
            className="w-full btn-primary disabled:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 text-lg"
          >
            {submitting ? 'Submitting...' : 'Submit Idea'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Tips:</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Think of things people have opinions about</li>
            <li>• Keep them appropriate for your group</li>
            <li>• Make them fun and interesting to rank!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
