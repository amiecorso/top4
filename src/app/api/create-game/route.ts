import { NextRequest, NextResponse } from 'next/server'
import { createGameRoom } from '@/lib/gameManager'
import { PromptCategoryKey, PROMPT_CATEGORIES } from '@/types/game'

export async function POST(request: NextRequest) {
  try {
    const {
      hostName,
      maxRounds = 5,
      selectedCategories = ['kidFriendly'],
      newPromptPercentage = 0,
      roundDurationSeconds = 60
    } = await request.json()

    if (!hostName || typeof hostName !== 'string' || hostName.trim().length === 0) {
      return NextResponse.json({ error: 'Host name is required' }, { status: 400 })
    }

    if (!Number.isInteger(maxRounds) || maxRounds < 1 || maxRounds > 30) {
      return NextResponse.json({ error: 'Max rounds must be between 1 and 30' }, { status: 400 })
    }

    // Validate selected categories
    const validCategories = selectedCategories.filter((cat: string): cat is PromptCategoryKey =>
      Object.keys(PROMPT_CATEGORIES).includes(cat)
    )

    // Default to kidFriendly if no valid categories
    const categoriesToUse: PromptCategoryKey[] = validCategories.length > 0 ? validCategories : ['kidFriendly']

    // Validate roundDurationSeconds: 0 (no timer) or between 10 and 600 seconds
    const duration = Number(roundDurationSeconds)
    const validDuration = Number.isFinite(duration) && (duration === 0 || (duration >= 10 && duration <= 600))
      ? duration
      : 60

    // Validate new prompt percentage
    const validPercentage = typeof newPromptPercentage === 'number' && newPromptPercentage >= 0 && newPromptPercentage <= 100
      ? newPromptPercentage
      : 0

    const room = await createGameRoom(hostName.trim(), maxRounds, categoriesToUse, validPercentage, validDuration)
    const hostId = Object.keys(room.players)[0]

    return NextResponse.json({
      roomId: room.id,
      code: room.code,
      playerId: hostId,
      room
    })
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }
}