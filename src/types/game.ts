export interface Player {
  id: string
  name: string
  score: number
  isConnected: boolean
}

export interface GameRound {
  currentPlayer: string
  ideas: string[]
  playerRanking?: number[] // Player's own ranking (1-4)
  playerRankings: Record<string, number[]> // All players' rankings/predictions
  committed: string[] // Players who have committed their ranking
  revealed: boolean
  scores: Record<string, number> // Points scored this round
}

export interface GameRoom {
  id: string
  code: string
  players: Record<string, Player>
  host: string
  status: 'waiting' | 'playing' | 'finished'
  currentRound: number
  maxRounds: number
  rounds: GameRound[]
  ideas: string[]
  usedIdeas: string[]
  createdAt: Date
}

export interface RankingSubmission {
  playerId: string
  ranking: number[]
}

export const DEFAULT_IDEAS = [
  "morning coffee",
  "puppy licking your face",
  "getting a bad grade",
  "naps",
  "pizza night",
  "rainy days",
  "surprise parties",
  "long car rides",
  "spicy food",
  "cold showers",
  "group projects",
  "karaoke nights",
  "cleaning the house",
  "movie marathons",
  "early morning workouts",
  "surprise snow days",
  "cooking experiments",
  "video game sessions",
  "awkward small talk",
  "finding money in old clothes"
]

export type GamePhase = 'lobby' | 'ranking' | 'waiting' | 'reveal' | 'scores' | 'finished'