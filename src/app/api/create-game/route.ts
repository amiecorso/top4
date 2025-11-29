import { NextRequest, NextResponse } from 'next/server'
import { createGameRoom } from '@/lib/gameManager'
import { PromptCategoryKey, PROMPT_CATEGORIES } from '@/types/game'

export async function POST(request: NextRequest) {
  try {
    const { hostName, maxRounds = 5, selectedCategories = ['base'], newPromptPercentage = 0 } = await request.json()

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

    // Default to base if no valid categories
    const categoriesToUse: PromptCategoryKey[] = validCategories.length > 0 ? validCategories : ['base']

    // Validate new prompt percentage
    const validPercentage = typeof newPromptPercentage === 'number' && newPromptPercentage >= 0 && newPromptPercentage <= 100
      ? newPromptPercentage
      : 0

    const room = await createGameRoom(hostName.trim(), maxRounds, categoriesToUse, validPercentage)
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