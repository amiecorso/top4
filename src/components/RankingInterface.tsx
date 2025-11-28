'use client'

import { useState } from 'react'

interface RankingInterfaceProps {
  ideas: string[]
  isCurrentPlayer: boolean
  hasCommitted: boolean
  roomId: string
  playerId: string
}

export function RankingInterface({ ideas, isCurrentPlayer, hasCommitted, roomId, playerId }: RankingInterfaceProps) {
  const [ranking, setRanking] = useState<number[]>([0, 0, 0, 0])
  const [submitting, setSubmitting] = useState(false)

  const handleRankingChange = (ideaIndex: number, rank: number) => {
    const newRanking = [...ranking]

    // Clear any existing assignment of this rank
    const existingIndex = newRanking.indexOf(rank)
    if (existingIndex !== -1) {
      newRanking[existingIndex] = 0
    }

    newRanking[ideaIndex] = rank
    setRanking(newRanking)
  }

  const submitRanking = async () => {
    if (ranking.includes(0) || new Set(ranking).size !== 4) {
      alert('Please rank all ideas from 1 to 4')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/game/${roomId}/submit-ranking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          ranking
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Failed to submit ranking')
      }
    } catch (error) {
      console.error('Error submitting ranking:', error)
      alert('Failed to submit ranking')
    } finally {
      setSubmitting(false)
    }
  }

  if (hasCommitted) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-800 font-semibold">✓ Ranking submitted successfully!</div>
        <div className="text-green-600 mt-2">Waiting for other players...</div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        {isCurrentPlayer ? 'Your Ranking' : 'Your Prediction'}
      </h3>

      <div className="space-y-4">
        {ideas.map((idea, index) => (
          <div key={index} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex-1 font-medium">{idea}</div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4].map((rank) => (
                <button
                  key={rank}
                  onClick={() => handleRankingChange(index, rank)}
                  className={`w-10 h-10 rounded-full font-semibold transition-colors ${
                    ranking[index] === rank
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border-2 border-gray-300 text-gray-600 hover:bg-gray-100'
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
          onClick={submitRanking}
          disabled={ranking.includes(0) || submitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Ranking'}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500 text-center">
        Rank from 1 (best) to 4 (worst). Each rank can only be used once.
      </div>
    </div>
  )
}