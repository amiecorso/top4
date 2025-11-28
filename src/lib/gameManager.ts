import { GameRoom, Player, GameRound, DEFAULT_IDEAS } from '@/types/game'
import { v4 as uuidv4 } from 'uuid'
import { promises as fs } from 'fs'
import { join } from 'path'

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
  try {
    await ensureStorageDir()
    const data = await fs.readFile(GAMES_FILE, 'utf-8')
    const gamesObject = JSON.parse(data)
    return new Map(Object.entries(gamesObject))
  } catch (error) {
    // File doesn't exist or is corrupted, return empty map
    return new Map()
  }
}

async function saveGames(games: Map<string, GameRoom>) {
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

export async function createGameRoom(hostName: string, maxRounds: number = 5): Promise<GameRoom> {
  const roomId = uuidv4()
  const code = generateGameCode()
  const hostId = uuidv4()

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
    ideas: [...DEFAULT_IDEAS],
    usedIdeas: [],
    createdAt: new Date()
  }

  const games = await loadGames()
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
  for (const room of games.values()) {
    if (room.code === code) {
      return room
    }
  }
  return null
}

export async function joinGameRoom(roomId: string, playerName: string): Promise<Player | null> {
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
}

export async function startGame(roomId: string): Promise<boolean> {
  const games = await loadGames()
  const room = games.get(roomId)
  if (!room || room.status !== 'waiting' || Object.keys(room.players).length < 2) {
    return false
  }

  room.status = 'playing'
  room.currentRound = 1

  // Save the game state first with the updated status and currentRound
  games.set(roomId, room)
  await saveGames(games)

  // Then start the new round
  await startNewRound(roomId)
  return true
}

export async function startNewRound(roomId: string): Promise<GameRound | null> {
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

  // Select 4 random ideas from unused ideas
  const availableIdeas = room.ideas.filter(idea => !room.usedIdeas.includes(idea))
  console.log('Available ideas:', availableIdeas.length, 'Used ideas:', room.usedIdeas.length)

  if (availableIdeas.length < 4) {
    console.log('Not enough unused ideas, resetting used ideas list')
    room.usedIdeas = [] // Reset if we run out of ideas
  }

  const ideasToUse = availableIdeas.length >= 4 ? availableIdeas : room.ideas
  const shuffled = [...ideasToUse].sort(() => Math.random() - 0.5)
  const selectedIdeas = shuffled.slice(0, 4)

  // Add selected ideas to used ideas
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
}

export async function submitRanking(roomId: string, playerId: string, ranking: number[]): Promise<boolean> {
  const games = await loadGames()
  const room = games.get(roomId)
  if (!room || room.status !== 'playing') return false

  const currentRound = room.rounds[room.currentRound - 1]
  if (!currentRound || currentRound.committed.includes(playerId)) return false

  currentRound.playerRankings[playerId] = ranking
  currentRound.committed.push(playerId)

  // If it's the current player's ranking, store separately
  if (playerId === currentRound.currentPlayer) {
    currentRound.playerRanking = ranking
  }

  games.set(roomId, room)
  await saveGames(games)
  return true
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
  const games = await loadGames()
  const room = games.get(roomId)
  if (!room) return {}

  const currentRound = room.rounds[room.currentRound - 1]
  if (!currentRound || !currentRound.playerRanking) return {}

  const correctRanking = currentRound.playerRanking
  const scores: Record<string, number> = {}

  // Calculate points for each player's prediction
  for (const [playerId, prediction] of Object.entries(currentRound.playerRankings)) {
    if (playerId === currentRound.currentPlayer) continue // Skip the current player

    let points = 0
    for (let i = 0; i < 4; i++) {
      if (prediction[i] === correctRanking[i]) {
        points += 1 // 1 point for each correct position
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
    for (const [id, gameRoom] of games.entries()) {
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
  const games = await loadGames()
  games.set(room.id, room)
  await saveGames(games)
}