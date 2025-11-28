import { NextRequest, NextResponse } from 'next/server'
import { createGameRoom } from '@/lib/gameManager'

export async function POST(request: NextRequest) {
  try {
    const { hostName, maxRounds = 5 } = await request.json()

    if (!hostName || typeof hostName !== 'string' || hostName.trim().length === 0) {
      return NextResponse.json({ error: 'Host name is required' }, { status: 400 })
    }

    if (!Number.isInteger(maxRounds) || maxRounds < 1 || maxRounds > 30) {
      return NextResponse.json({ error: 'Max rounds must be between 1 and 30' }, { status: 400 })
    }

    const room = await createGameRoom(hostName.trim(), maxRounds)
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