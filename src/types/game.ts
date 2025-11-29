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
  kidFriendly: {
    name: "Kid-Friendly",
    prompts: [
      "building the tallest pillow fort",
      "first day at a new school",
      "winning a tiny prize at the fair",
      "secret handshake with your best friend",
      "finding a rainbow after the storm",
      "the last slice of birthday cake",
      "teaching a pet a new trick",
      "splashing in puddles with boots",
      "trading snacks at lunch",
      "reading under a blanket with a flashlight",
      "riding the biggest slide at the park",
      "snowman that keeps falling over",
      "catching fireflies in a jar",
      "bikes with streamers on the handles",
      "drawing with sidewalk chalk",
      "hide-and-seek where nobody can find you"
    ]
  },
  workFriendly: {
    name: "Work-Friendly",
    prompts: [
      "perfectly timed coffee break",
      "the meeting that could be an email",
      "pair programming that actually clicks",
      "naming things (the real hard problem)",
      "the calendar invite with no agenda",
      "quiet focus time with noise-cancelling on",
      "merging a PR on the first review",
      "laptop about to die during a call",
      "Slack huddles that never end",
      "the office plant that refuses to die",
      "ending the week with inbox zero",
      "free snacks you pretend not to care about",
      "standing desk that keeps sinking",
      "last-minute production hotfix",
      "Friday deploys (are you brave?)",
      "remembering where you left your headphones"
    ]
  },
  nonsense: {
    name: "Nonsense",
    prompts: [
      "arguing with a goose about rent",
      "left sock forming a union",
      "a sandwich that files taxes",
      "gravity taking a personal day",
      "screaming into a jar of mayonnaise",
      "banana that critiques modern art",
      "the moon asking for a refund",
      "dolphins running a startup",
      "time traveling through a nap",
      "a toaster with stage fright",
      "alphabet soup spelling spoilers",
      "staircase with commitment issues",
      "clouds attending book club",
      "a spoon that longs to be a fork",
      "traffic cone with big dreams",
      "calendar that forgets weekends"
    ]
  },
  abstract: {
    name: "Abstract",
    prompts: [
      "the taste of victory",
      "memories shaped like paper cranes",
      "time as a hallway of open doors",
      "silence that hums like neon",
      "regret folded into an origami star",
      "hope in the pockets of a worn coat",
      "echoes that learn your name",
      "a sunrise that refuses to end",
      "laughter hiding under the floorboards",
      "gravity as a gentle suggestion",
      "a conversation with your future shadow",
      "patience growing like ivy",
      "dreams that leak into Tuesday",
      "a map with no north and many homes",
      "raindrops rehearsing their entrance",
      "footsteps that arrive before you do"
    ]
  },
  adult: {
    name: "Adult",
    prompts: [
      "answering emails you wrote in your head",
      "budgeting with optimistic spreadsheets",
      "cleaning the fridge of mysterious jars",
      "the group chat that never decides",
      "sleep schedule negotiations",
      "meal prep ambition on Sunday night",
      "texts you draft and never send",
      "moving boxes labeled 'misc forever'",
      "remembering to water the new plant",
      "the gym membership you definitely use",
      "weekend that evaporates instantly",
      "decluttering that exposes old versions of you",
      "subscription you forgot you had",
      "choosing the least annoying alarm sound",
      "laundry that multiplies in secret",
      "small talk with your neighbor in pajamas"
    ]
  }
} as const

export type PromptCategoryKey = keyof typeof PROMPT_CATEGORIES

export const DEFAULT_IDEAS = PROMPT_CATEGORIES.kidFriendly.prompts

export type GamePhase = 'lobby' | 'ranking' | 'waiting' | 'reveal' | 'scores' | 'finished'