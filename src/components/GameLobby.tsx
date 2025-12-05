'use client'

import { useEffect, useState } from 'react'
import { GameRoom, Player } from '@/types/game'

interface GameLobbyProps {
  gameState: GameRoom
  currentPlayer: Player
  roomId: string
}

export function GameLobby({ gameState, currentPlayer, roomId }: GameLobbyProps) {
  const isHost = currentPlayer.id === gameState.host
  const players = Object.values(gameState.players)
  const [toast, setToast] = useState<string | null>(null)
  const [isCopying, setIsCopying] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1500)
  }

  const handleStartGame = async () => {
    try {
      await fetch(`/api/game/${roomId}/start`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error starting game:', error)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="card-lg">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">Top Four</h1>

          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-3">
              <div className="code-box inline-block">
                Code: <span className="font-bold text-fuchsia-300">{gameState.code}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : ''
                    const url = `${origin}/?code=${gameState.code}`
                    try {
                      setIsCopying(true)
                      await navigator.clipboard.writeText(url)
                      showToast('Share link copied')
                    } finally {
                      setIsCopying(false)
                    }
                  }}
                  className="btn-secondary"
                >
                  Share
                </button>
                <button
                  onClick={async () => {
                    try {
                      setIsCopying(true)
                      await navigator.clipboard.writeText(gameState.code)
                      showToast('Game code copied')
                    } finally {
                      setIsCopying(false)
                    }
                  }}
                  className="btn-muted"
                >
                  Copy Code
                </button>
              </div>
              <p className="text-sm text-slate-500">Share this code with friends to join!</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="section-title">Players ({players.length})</h2>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-lg">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-lg font-bold text-slate-900">{player.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {player.id === gameState.host && (
                      <span className="badge">Host</span>
                    )}
                    <div className={`w-3 h-3 rounded-full ${player.isConnected ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 text-slate-800">How to Play</h3>
            <ol className="text-sm text-slate-600 space-y-1">
              <li>1. On your turn, 4 random ideas will be shown</li>
              <li>2. Rank them from 1 (best) to 4 (worst) according to your preference</li>
              <li>3. Other players try to predict your ranking</li>
              <li>4. Players get points for guessing positions correctly</li>
              <li>5. After {gameState.maxRounds} rounds, highest score wins!</li>
            </ol>
          </div>

          {isHost ? (
            <div className="text-center">
              <button
                onClick={handleStartGame}
                disabled={players.length < 2}
                className="btn-success disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
              </button>
            </div>
          ) : (
            <div className="text-center text-slate-500">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}