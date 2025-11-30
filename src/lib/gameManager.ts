import { GameRoom, Player, GameRound, DEFAULT_IDEAS, PROMPT_CATEGORIES, PromptCategoryKey } from '@/types/game'
import { v4 as uuidv4 } from 'uuid'
import { promises as fs } from 'fs'
import { join } from 'path'
let kvClient: any = null
try {
  // Dynamically require to avoid local dev errors if KV not installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@vercel/kv')
  kvClient = mod.kv
} catch (_e) {
  kvClient = null
}

// File-based storage for persistence across serverless functions
const STORAGE_DIR = join(process.cwd(), '.game-data')
const GAMES_FILE = join(STORAGE_DIR, 'games.json')

async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

async function loadGames(): Promise<Map<string, GameRoom>> {
  // Prefer KV if available
  if (kvClient && process.env.KV_REST_API_URL) {
    try {
      const raw = await kvClient.hgetall('game:rooms')
      const map = new Map<string, GameRoom>()
      if (raw) {
        for (const [roomId, value] of Object.entries(raw)) {
          try {
            const room: GameRoom = typeof value === 'string' ? JSON.parse(value) : (value as any)
            map.set(roomId, room)
          } catch (_e) {
            // skip corrupted entry
          }
        }
      }
      return map
    } catch (_e) {
      // Fallback to file if KV fails
    }
  }
  try {
    await ensureStorageDir()
    const data = await fs.readFile(GAMES_FILE, 'utf-8')
    const gamesObject = JSON.parse(data)
    return new Map(Object.entries(gamesObject))
  } catch (_error) {
    return new Map()
  }
}

async function saveGames(games: Map<string, GameRoom>) {
  // Prefer KV if available
  if (kvClient && process.env.KV_REST_API_URL) {
    try {
      const obj: Record<string, string> = {}
      for (const [roomId, room] of Array.from(games.entries())) {
        obj[roomId] = JSON.stringify(room)
      }
      if (Object.keys(obj).length > 0) {
        await kvClient.hset('game:rooms', obj)
      }
      return
    } catch (error) {
      console.error('Failed to save games to KV:', error)
      // Fall through to file
    }
  }
  try {
    await ensureStorageDir()
    const gamesObject = Object.fromEntries(games.entries())
    await fs.writeFile(GAMES_FILE, JSON.stringify(gamesObject, null, 2))
  } catch (error) {
    console.error('Failed to save games:', error)
  }
}

export function generateGameCode(): string {
  // Generate a 4-letter uppercase code
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)]
  }
  return code
}

// --- Concurrency helpers (per-room mutex) ---
const inProcessLocks = new Map<string, Promise<unknown>>()

async function acquireKvLock(lockKey: string, token: string, ttlMs: number): Promise<boolean> {
  try {
    // Upstash/Redis: SET key value NX PX ttl
    const res = await kvClient.set(lockKey, token, { nx: true, px: ttlMs })
    return res === 'OK' || res === true
  } catch {
    return false
  }
}

async function releaseKvLock(lockKey: string, token: string): Promise<void> {
  try {
    const val = await kvClient.get(lockKey)
    if (val === token) {
      await kvClient.del(lockKey)
    }
  } catch {
    // best-effort
  }
}

async function withRoomLock<T>(roomId: string, fn: () => Promise<T>, ttlMs: number = 3000): Promise<T> {
  // Use KV-based lock if available
  if (kvClient && process.env.KV_REST_API_URL) {
    const lockKey = `lock:room:${roomId}`
    const token = uuidv4()
    const start = Date.now()
    // Spin with backoff until acquired or timeout (~2s)
    while (Date.now() - start < 2000) {
      const ok = await acquireKvLock(lockKey, token, ttlMs)
      if (ok) {
        try {
          return await fn()
        } finally {
          await releaseKvLock(lockKey, token)
        }
      }
      await new Promise(r => setTimeout(r, 50 + Math.random() * 25))
    }
    // As a fallback, run without lock to avoid total failure
    return await fn()
  }

  // Local in-process chaining lock (dev)
  const prev = inProcessLocks.get(roomId) || Promise.resolve()
  let result: T
  const next = prev.then(async () => {
    result = await fn()
  }).catch(() => {
    // swallow to keep chain alive
  })
  inProcessLocks.set(roomId, next)
  await next
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!
}

/**
 * Calculate prompt distribution for a game
 * @param numPlayers Number of players in the game
 * @param numRounds Number of rounds in the game
 * @param minNewPromptPercentage Minimum percentage of new prompts (0-100)
 * @returns Object with calculated values
 */
export function calculatePromptDistribution(
  numPlayers: number,
  numRounds: number,
  minNewPromptPercentage: number
) {
  // Total prompts needed: rounds × 4 (each round needs 4 prompts)
  const totalPromptsNeeded = numRounds * 4

  // Calculate minimum new prompts based on percentage
  const minNewPromptsFloat = (totalPromptsNeeded * minNewPromptPercentage) / 100

  // Round up to nearest integer divisible by number of players
  let newPromptsRequired = Math.ceil(minNewPromptsFloat)
  const remainder = newPromptsRequired % numPlayers
  if (remainder !== 0) {
    newPromptsRequired += numPlayers - remainder
  }

  // Can't exceed total prompts needed
  if (newPromptsRequired > totalPromptsNeeded) {
    newPromptsRequired = totalPromptsNeeded
  }

  // Calculate existing prompts needed
  const existingPromptsNeeded = totalPromptsNeeded - newPromptsRequired

  // Calculate prompts per player
  const promptsPerPlayer = newPromptsRequired / numPlayers

  return {
    totalPromptsNeeded,
    newPromptsRequired,
    existingPromptsNeeded,
    promptsPerPlayer
  }
}

export async function createGameRoom(
  hostName: string,
  maxRounds: number = 5,
  selectedCategories: PromptCategoryKey[] = ['kidFriendly'],
  newPromptPercentage: number = 0,
  roundDurationSeconds: number = 60
): Promise<GameRoom> {
  const roomId = uuidv4()
  const games = await loadGames()

  // Generate a unique 4-letter code across existing rooms
  let code = generateGameCode()
  const existingCodes = new Set(Array.from(games.values()).map(r => r.code))
  while (existingCodes.has(code)) {
    code = generateGameCode()
  }
  const hostId = uuidv4()

  // Build ideas pool from selected categories
  const ideas: string[] = []
  selectedCategories.forEach(categoryKey => {
    if (PROMPT_CATEGORIES[categoryKey]) {
      ideas.push(...PROMPT_CATEGORIES[categoryKey].prompts)
    }
  })

  // Fallback to kidFriendly if no valid categories or no ideas
  if (ideas.length === 0) {
    ideas.push(...PROMPT_CATEGORIES.kidFriendly.prompts)
  }

  const room: GameRoom = {
    id: roomId,
    code,
    players: {
      [hostId]: {
        id: hostId,
        name: hostName,
        score: 0,
        isConnected: true
      }
    },
    host: hostId,
    status: 'waiting',
    currentRound: 0,
    maxRounds,
    rounds: [],
    ideas,
    usedIdeas: [],
    selectedCategories,
    newPromptPercentage,
    requiredPromptsPerPlayer: 0,
    playerPrompts: {},
    roundDurationSeconds,
    createdAt: new Date()
  }

  games.set(roomId, room)
  await saveGames(games)
  console.log('Created game room:', roomId, 'Total rooms:', games.size)
  return room
}

export async function getGameRoom(roomId: string): Promise<GameRoom | null> {
  console.log('getGameRoom called with roomId:', roomId)
  const games = await loadGames()
  console.log('Available game rooms:', Array.from(games.keys()))
  const room = games.get(roomId)
  console.log('Found room:', room ? 'YES' : 'NO')
  return room || null
}

export async function getGameRoomByCode(code: string): Promise<GameRoom | null> {
  const games = await loadGames()
  const roomsArray = Array.from(games.values())
  for (const room of roomsArray) {
    if (room.code === code) {
      return room
    }
  }
  return null
}

export async function joinGameRoom(roomId: string, playerName: string): Promise<Player | null> {
  return await withRoomLock(roomId, async () => {
    const games = await loadGames()
    const room = games.get(roomId)
    if (!room || room.status !== 'waiting') {
      return null
    }

    const playerId = uuidv4()
    const player: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      isConnected: true
    }

    room.players[playerId] = player
    games.set(roomId, room)
    await saveGames(games)
    return player
  })
}

export async function startGame(roomId: string): Promise<boolean> {
  let shouldStartFirstRound = false
  const ok = await withRoomLock(roomId, async () => {
    const games = await loadGames()
    const room = games.get(roomId)
    if (!room || room.status !== 'waiting' || Object.keys(room.players).length < 2) {
      return false
    }

    const numPlayers = Object.keys(room.players).length

    const distribution = calculatePromptDistribution(
      numPlayers,
      room.maxRounds,
      room.newPromptPercentage
    )

    if (distribution.newPromptsRequired > 0) {
      room.status = 'prompt_submission'
      room.requiredPromptsPerPlayer = distribution.promptsPerPlayer
      Object.keys(room.players).forEach(playerId => {
        room.playerPrompts[playerId] = []
      })
      games.set(roomId, room)
      await saveGames(games)
      return true
    }

    room.status = 'playing'
    room.currentRound = 1
    games.set(roomId, room)
    await saveGames(games)

    // Defer startNewRound until after lock release to avoid re-entrancy deadlock
    shouldStartFirstRound = true
    return true
  })
  if (ok && shouldStartFirstRound) {
    await startNewRound(roomId)
  }
  return ok
}

/**
 * Submit a prompt from a player during prompt_submission phase
 */
export async function submitPlayerPrompt(
  roomId: string,
  playerId: string,
  prompt: string
): Promise<{ success: boolean; remaining: number }> {
  return await withRoomLock(roomId, async () => {
    const games = await loadGames()
    const room = games.get(roomId)

    if (!room || room.status !== 'prompt_submission') {
      return { success: false, remaining: 0 }
    }

    if (!room.players[playerId]) {
      return { success: false, remaining: 0 }
    }

    if (!room.playerPrompts[playerId]) {
      room.playerPrompts[playerId] = []
    }

    const playerPrompts = room.playerPrompts[playerId]
    const required = room.requiredPromptsPerPlayer

    if (playerPrompts.length >= required) {
      return { success: false, remaining: 0 }
    }

    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt.length === 0) {
      return { success: false, remaining: required - playerPrompts.length }
    }

    playerPrompts.push(trimmedPrompt)

    games.set(roomId, room)
    await saveGames(games)

    const remaining = required - playerPrompts.length

    const allPlayersComplete = Object.keys(room.players).every(
      pid => room.playerPrompts[pid]?.length >= required
    )

    if (allPlayersComplete) {
      await buildFinalPromptPoolAndStartGame(roomId)
    }

    return { success: true, remaining }
  })
}

/**
 * Build final prompt pool from player submissions and existing prompts, then start the game
 */
async function buildFinalPromptPoolAndStartGame(roomId: string): Promise<void> {
  let shouldStart = false
  await withRoomLock(roomId, async () => {
    const games = await loadGames()
    const room = games.get(roomId)

    if (!room || room.status !== 'prompt_submission') {
      return
    }

    const numPlayers = Object.keys(room.players).length
    const distribution = calculatePromptDistribution(
      numPlayers,
      room.maxRounds,
      room.newPromptPercentage
    )

    const newPrompts: string[] = []
    Object.values(room.playerPrompts).forEach(prompts => {
      newPrompts.push(...prompts)
    })

    const existingPrompts: string[] = []
    if (distribution.existingPromptsNeeded > 0) {
      const categoryPrompts: string[] = []
      room.selectedCategories.forEach(categoryKey => {
        if (PROMPT_CATEGORIES[categoryKey]) {
          categoryPrompts.push(...PROMPT_CATEGORIES[categoryKey].prompts)
        }
      })

      const promptsPerCategory = Math.ceil(
        distribution.existingPromptsNeeded / room.selectedCategories.length
      )

      const shuffledCategoryPrompts = [...categoryPrompts].sort(() => Math.random() - 0.5)
      existingPrompts.push(...shuffledCategoryPrompts.slice(0, distribution.existingPromptsNeeded))
    }

    const finalPromptPool = [...newPrompts, ...existingPrompts]

    room.ideas = finalPromptPool
    room.usedIdeas = []
    room.status = 'playing'
    room.currentRound = 1

    games.set(roomId, room)
    await saveGames(games)

    // Defer starting the round until after lock release
    shouldStart = true
  })
  if (shouldStart) {
    await startNewRound(roomId)
  }
}

export async function startNewRound(roomId: string): Promise<GameRound | null> {
  return await withRoomLock(roomId, async () => {
    console.log('startNewRound called for roomId:', roomId)
    const games = await loadGames()
    const room = games.get(roomId)
    if (!room) {
      console.log('No room found for startNewRound')
      return null
    }

    console.log('Starting round', room.currentRound, 'for room', roomId)
    const playerIds = Object.keys(room.players)
    const currentPlayerIndex = (room.currentRound - 1) % playerIds.length
    const currentPlayer = playerIds[currentPlayerIndex]

    console.log('Current player:', currentPlayer, 'playerIds:', playerIds)

    const availableIdeas = room.ideas.filter(idea => !room.usedIdeas.includes(idea))
    console.log('Available ideas:', availableIdeas.length, 'Used ideas:', room.usedIdeas.length)

    if (availableIdeas.length < 4) {
      console.log('Not enough unused ideas, resetting used ideas list')
      room.usedIdeas = []
    }

    const ideasToUse = availableIdeas.length >= 4 ? availableIdeas : room.ideas
    const shuffled = [...ideasToUse].sort(() => Math.random() - 0.5)
    const selectedIdeas = shuffled.slice(0, 4)

    room.usedIdeas.push(...selectedIdeas)
    console.log('Selected ideas:', selectedIdeas)
    console.log('Updated used ideas count:', room.usedIdeas.length)

    const round: GameRound = {
      currentPlayer,
      ideas: selectedIdeas,
      playerRankings: {},
      committed: [],
      revealed: false,
      scores: {}
    }

    console.log('Created round with ideas:', selectedIdeas)
    room.rounds.push(round)
    games.set(roomId, room)
    await saveGames(games)
    console.log('Round saved successfully')
    return round
  })
}

export async function submitRanking(roomId: string, playerId: string, ranking: number[]): Promise<boolean> {
  return await withRoomLock(roomId, async () => {
    const games = await loadGames()
    const room = games.get(roomId)
    if (!room || room.status !== 'playing') return false

    const currentRound = room.rounds[room.currentRound - 1]
    if (!currentRound || currentRound.committed.includes(playerId)) return false

    currentRound.playerRankings[playerId] = ranking
    currentRound.committed.push(playerId)

    if (playerId === currentRound.currentPlayer) {
      currentRound.playerRanking = ranking
    }

    games.set(roomId, room)
    await saveGames(games)
    return true
  })
}

export async function canRevealRound(roomId: string): Promise<boolean> {
  const games = await loadGames()
  const room = games.get(roomId)
  if (!room || room.status !== 'playing') return false

  const currentRound = room.rounds[room.currentRound - 1]
  if (!currentRound) return false

  const totalPlayers = Object.keys(room.players).length
  return currentRound.committed.length === totalPlayers
}

export async function calculateScores(roomId: string): Promise<Record<string, number>> {
  return await withRoomLock(roomId, async () => {
    const games = await loadGames()
    const room = games.get(roomId)
    if (!room) return {}

    const currentRound = room.rounds[room.currentRound - 1]
    if (!currentRound || !currentRound.playerRanking) return {}

    const correctRanking = currentRound.playerRanking
    const scores: Record<string, number> = {}

    for (const [playerId, prediction] of Object.entries(currentRound.playerRankings)) {
      if (playerId === currentRound.currentPlayer) continue
      let points = 0
      for (let i = 0; i < 4; i++) {
        if (prediction[i] === correctRanking[i]) {
          points += 1
        }
      }
      scores[playerId] = points
      room.players[playerId].score += points
    }

    currentRound.scores = scores
    currentRound.revealed = true

    games.set(roomId, room)
    await saveGames(games)
    return scores
  })
}

export async function advanceToNextRound(roomId: string): Promise<boolean> {
  console.log('🚀 === ADVANCE TO NEXT ROUND START ===')
  console.log('🎯 Room ID received:', roomId)
  console.log('🔍 Room ID type:', typeof roomId)
  console.log('🔍 Room ID length:', roomId ? roomId.length : 'N/A')

  const games = await loadGames()
  console.log('📚 Loaded games map, total rooms:', games.size)
  console.log('📚 Available room IDs:', Array.from(games.keys()))

  const room = games.get(roomId)
  if (!room) {
    console.log('❌ No room found in advanceToNextRound for ID:', roomId)
    console.log('🔍 Checking if room exists with different casing...')
    const entriesArray = Array.from(games.entries())
    for (const [id, gameRoom] of entriesArray) {
      console.log(`🔍 Comparing "${roomId}" vs "${id}": ${roomId === id}`)
    }
    return false
  }

  console.log('✅ Room found successfully!')
  console.log('📊 BEFORE ADVANCE - Game State:')
  console.log('📊 - Room ID:', room.id)
  console.log('📊 - Current Round:', room.currentRound)
  console.log('📊 - Max Rounds:', room.maxRounds)
  console.log('📊 - Status:', room.status)
  console.log('📊 - Players:', Object.keys(room.players))
  console.log('📊 - Total Rounds Array Length:', room.rounds.length)

  if (room.currentRound >= room.maxRounds) {
    console.log('🏁 Game finished, setting status to finished')
    room.status = 'finished'
    games.set(roomId, room)
    await saveGames(games)
    console.log('💾 Saved finished game state')
    return false
  }

  console.log('⏫ Advancing to next round...')
  const oldRound = room.currentRound
  room.currentRound += 1
  console.log(`📈 Round advanced from ${oldRound} to ${room.currentRound}`)

  // Save the updated round number BEFORE calling startNewRound
  console.log('💾 Saving updated currentRound to disk...')
  games.set(roomId, room)
  await saveGames(games)
  console.log('✅ Updated currentRound saved to disk')

  // Verify the save worked by reloading
  console.log('🔄 Verifying save by reloading from disk...')
  const reloadedGames = await loadGames()
  const reloadedRoom = reloadedGames.get(roomId)
  if (reloadedRoom) {
    console.log('✅ Verification: reloaded currentRound is:', reloadedRoom.currentRound)
  } else {
    console.log('❌ Verification failed: could not reload room!')
  }

  console.log('🆕 Starting new round...')
  const newRound = await startNewRound(roomId)
  if (newRound) {
    console.log('✅ New round created successfully')
    console.log('🆕 New round details:', {
      currentPlayer: newRound.currentPlayer,
      ideas: newRound.ideas.length,
      committed: newRound.committed.length
    })
  } else {
    console.log('❌ Failed to create new round')
  }

  // Final verification
  console.log('🔄 Final verification - loading game state...')
  const finalGames = await loadGames()
  const finalRoom = finalGames.get(roomId)
  if (finalRoom) {
    console.log('📊 AFTER ADVANCE - Final Game State:')
    console.log('📊 - Current Round:', finalRoom.currentRound)
    console.log('📊 - Total Rounds Array Length:', finalRoom.rounds.length)
    console.log('📊 - Status:', finalRoom.status)
    console.log('📊 - Latest round current player:', finalRoom.rounds[finalRoom.rounds.length - 1]?.currentPlayer)
  } else {
    console.log('❌ Final verification failed: could not reload room!')
  }

  console.log('✅ Successfully advanced to next round')
  console.log('🚀 === ADVANCE TO NEXT ROUND END ===')
  return true
}

export async function updateGameRoom(room: GameRoom): Promise<void> {
  await withRoomLock(room.id, async () => {
    const games = await loadGames()
    games.set(room.id, room)
    await saveGames(games)
  })
}

/**
 * Void the current round due to a timeout by the turn-taker.
 * Applies a -1 penalty to the current player and advances to the next round without scoring.
 */
export async function voidCurrentRound(roomId: string): Promise<boolean> {
  return await withRoomLock(roomId, async () => {
    const games = await loadGames()
    const room = games.get(roomId)
    if (!room) return false

    const currentRound = room.rounds[room.currentRound - 1]
    if (!currentRound) return false

    const currentPlayerId = currentRound.currentPlayer
    if (room.players[currentPlayerId]) {
      room.players[currentPlayerId].score -= 1
    }

    currentRound.revealed = true
    currentRound.scores = currentRound.scores || {}
    currentRound.voided = true

    games.set(roomId, room)
    await saveGames(games)
    return true
  })
}