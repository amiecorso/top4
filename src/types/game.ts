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
  status: 'waiting' | 'prompt_submission' | 'playing' | 'finished'
  currentRound: number
  maxRounds: number
  rounds: GameRound[]
  ideas: string[]
  usedIdeas: string[]
  selectedCategories: PromptCategoryKey[]
  newPromptPercentage: number
  requiredPromptsPerPlayer: number
  playerPrompts: Record<string, string[]> // playerId -> submitted prompts
  createdAt: Date
}

export interface RankingSubmission {
  playerId: string
  ranking: number[]
}

export const PROMPT_CATEGORIES = {
  base: {
    name: "Base Account",
    prompts: [
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
      "early morning workouts"
    ]
  },
  kidFriendly: {
    name: "Kid-Friendly",
    prompts: [
      "ice cream for breakfast",
      "finding a lost toy",
      "riding a bike for the first time",
      "staying up past bedtime",
      "snow days from school",
      "birthday parties",
      "going to the zoo",
      "building sandcastles",
      "losing a tooth",
      "getting a new pet",
      "camping in the backyard",
      "learning to swim",
      "picking strawberries",
      "playing hide and seek"
    ]
  },
  workFriendly: {
    name: "Work-Friendly",
    prompts: [
      "Monday morning meetings",
      "finding the perfect work-life balance",
      "remote work pajama days",
      "office coffee quality",
      "surprise deadline changes",
      "team building exercises",
      "elevator small talk",
      "working from a coffee shop",
      "video calls with pets interrupting",
      "achieving inbox zero",
      "lunch break food trucks",
      "open office distractions"
    ]
  },
  rRated: {
    name: "R-Rated",
    prompts: [
      "awkward dating app conversations",
      "running into your ex",
      "hangovers on important days",
      "late night questionable decisions",
      "embarrassing drunk texts",
      "walk of shame experiences",
      "terrible pickup lines",
      "regrettable karaoke song choices",
      "bathroom humor",
      "adult responsibilities you avoid",
      "things you pretend to understand",
      "guilty pleasure TV shows"
    ]
  }
} as const

export type PromptCategoryKey = keyof typeof PROMPT_CATEGORIES

export const DEFAULT_IDEAS = PROMPT_CATEGORIES.base.prompts

export type GamePhase = 'lobby' | 'ranking' | 'waiting' | 'reveal' | 'scores' | 'finished'