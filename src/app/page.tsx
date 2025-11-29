'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameState } from '@/lib/useGameState'
import { PROMPT_CATEGORIES, PromptCategoryKey } from '@/types/game'

export default function Home() {
  const [hostName, setHostName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [maxRounds, setMaxRounds] = useState(5)
  const [selectedCategories, setSelectedCategories] = useState<PromptCategoryKey[]>(['base'])
  const [newPromptPercentage, setNewPromptPercentage] = useState(50)
  const [error, setError] = useState('')
  const router = useRouter()
  const { createGame, joinGame, loading } = useGameState(null, null)

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hostName.trim()) {
      setError('Please enter your name')
      return
    }

    const result = await createGame(hostName.trim(), maxRounds, selectedCategories, newPromptPercentage)
    if (result.success) {
      router.push(`/game/${result.roomId}?playerId=${result.playerId}`)
    } else {
      setError(result.error || 'Failed to create game')
    }
  }

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerName.trim() || !gameCode.trim()) {
      setError('Please enter your name and game code')
      return
    }

    const result = await joinGame(gameCode.toUpperCase(), playerName.trim())
    if (result.success) {
      router.push(`/game/${result.roomId}?playerId=${result.playerId}`)
    } else {
      setError(result.error || 'Failed to join game')
    }
  }

  const toggleCategory = (categoryKey: PromptCategoryKey) => {
    setSelectedCategories(prev =>
      prev.includes(categoryKey)
        ? prev.filter(key => key !== categoryKey)
        : [...prev, categoryKey]
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Top Four</h1>
        <p className="text-lg text-gray-600 mb-8">
          A fun party game where you rank ideas and try to predict others' rankings!
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Create Game */}
          <form onSubmit={handleCreateGame} className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Create New Game</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div>
                <label htmlFor="maxRounds" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Rounds
                </label>
                <input
                  id="maxRounds"
                  type="number"
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(parseInt(e.target.value) || 5)}
                  min="1"
                  max="30"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter number of rounds (1-30)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Categories
                </label>
                <div className="space-y-2">
                  {Object.entries(PROMPT_CATEGORIES).map(([key, category]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(key as PromptCategoryKey)}
                        onChange={() => toggleCategory(key as PromptCategoryKey)}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {category.name} ({category.prompts.length} prompts)
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="newPromptPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum New Prompts: {newPromptPercentage}%
                </label>
                <input
                  id="newPromptPercentage"
                  type="range"
                  value={newPromptPercentage}
                  onChange={(e) => setNewPromptPercentage(parseInt(e.target.value))}
                  min="0"
                  max="100"
                  step="10"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0% (All existing)</span>
                  <span>100% (All new)</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </form>

          <div className="text-gray-500 font-medium">or</div>

          {/* Join Game */}
          <form onSubmit={handleJoinGame} className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Join Existing Game</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Enter game code (e.g. ABCD)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                maxLength={4}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                {loading ? 'Joining...' : 'Join Game'}
              </button>
            </div>
          </form>
        </div>

        {/* How to Play */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-lg text-left">
          <h2 className="text-xl font-semibold mb-4 text-center">How to Play</h2>
          <ol className="space-y-2 text-gray-700">
            <li><strong>1. Create or join a game</strong> - Share the game code with friends</li>
            <li><strong>2. Take turns</strong> - On your turn, 4 random ideas are shown</li>
            <li><strong>3. Rank secretly</strong> - Order them 1-4 based on your preference</li>
            <li><strong>4. Others predict</strong> - Other players try to guess your ranking</li>
            <li><strong>5. Score points</strong> - Get 1 point for each correct position guess</li>
            <li><strong>6. Win the game</strong> - Highest score after all rounds wins!</li>
          </ol>
        </div>
      </div>
    </main>
  )
}