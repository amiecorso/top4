'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useGameState } from '@/lib/useGameState'
import { PROMPT_CATEGORIES, PromptCategoryKey } from '@/types/game'

export default function Home() {
  const searchParams = useSearchParams()
  const [hostName, setHostName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [maxRounds, setMaxRounds] = useState(5)
  const [selectedCategories, setSelectedCategories] = useState<PromptCategoryKey[]>(['kidFriendly'])
  const [newPromptPercentage, setNewPromptPercentage] = useState(50)
  const [roundDurationSeconds, setRoundDurationSeconds] = useState<number>(60) // 0 = no timer
  const [error, setError] = useState('')
  const router = useRouter()
  const { createGame, joinGame, loading } = useGameState(null, null)

  useEffect(() => {
    const codeParam = searchParams?.get('code')
    if (codeParam) {
      setGameCode(codeParam.toUpperCase())
    }
  }, [searchParams])

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hostName.trim()) {
      setError('Please enter your name')
      return
    }

    const result = await createGame(hostName.trim(), maxRounds, selectedCategories, newPromptPercentage, roundDurationSeconds)
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
      if (result.error === 'duplicate_name' && result.suggestedName) {
        setPlayerName(result.suggestedName)
        setError(`That name is taken. Suggested: ${result.suggestedName}. You can edit and try again.`)
      } else {
        setError(result.error || 'Failed to join game')
      }
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
    <main className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-violet-50 to-sky-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-3">Top Four</h1>
        <p className="text-slate-600 text-lg mb-10">
          A fun party game where you rank ideas and try to predict others' rankings!
        </p>

        {error && (
          <div className="card bg-red-50 border-red-200 text-red-700 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Create Game */}
          <form onSubmit={handleCreateGame} className="card">
            <h2 className="section-title">Create New Game</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                className="input"
                required
              />
              <div>
                <label htmlFor="maxRounds" className="label">
                  Number of Rounds
                </label>
                <input
                  id="maxRounds"
                  type="number"
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(parseInt(e.target.value) || 5)}
                  min="1"
                  max="30"
                  className="input"
                  placeholder="Enter number of rounds (1-30)"
                />
              </div>

              <div>
                <label className="label">
                  Prompt Categories
                </label>
                <div className="space-y-2">
                  {Object.entries(PROMPT_CATEGORIES).map(([key, category]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(key as PromptCategoryKey)}
                        onChange={() => toggleCategory(key as PromptCategoryKey)}
                        className="mr-2 accent-indigo-600"
                      />
                      <span className="text-sm">
                        {category.name} ({category.prompts.length} prompts)
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="newPromptPercentage" className="label">
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
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0% (All existing)</span>
                  <span>100% (All new)</span>
                </div>
              </div>
              <div>
                <label htmlFor="roundDuration" className="label">
                  Round Timer
                </label>
                <select
                  id="roundDuration"
                  className="input"
                  value={roundDurationSeconds}
                  onChange={(e) => setRoundDurationSeconds(parseInt(e.target.value))}
                >
                  <option value={0}>No timer</option>
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                  <option value={90}>90 seconds</option>
                  <option value={120}>120 seconds</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Choose how long each player has to submit rankings. Select “No timer” for unlimited time.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:bg-slate-300"
              >
                {loading ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </form>

          {/* Join Game */}
          <form onSubmit={handleJoinGame} className="card">
            <h2 className="section-title">Join Existing Game</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="input"
                required
              />
              <input
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Enter game code (e.g. ABCD)"
                className="input"
                maxLength={4}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-success disabled:bg-slate-300"
              >
                {loading ? 'Joining...' : 'Join Game'}
              </button>
            </div>
          </form>
        </div>

        {/* How to Play */}
        <div className="mt-12 card text-left">
          <h2 className="section-title text-center">How to Play</h2>
          <ol className="space-y-2 text-slate-700">
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