import { NextRequest, NextResponse } from 'next/server'
import { getGameRoomByCode, joinGameRoom } from '@/lib/gameManager'

export async function POST(request: NextRequest) {
  try {
    const { code, playerName } = await request.json()

    if (!code || !playerName || typeof code !== 'string' || typeof playerName !== 'string') {
      return NextResponse.json({ error: 'Code and player name are required' }, { status: 400 })
    }

    const room = await getGameRoomByCode(code.toUpperCase())
    if (!room) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Game has already started' }, { status: 400 })
    }

    // Duplicate-name check (case-insensitive)
    const baseName = playerName.trim()
    const names = Object.values(room.players).map(p => p.name.toLowerCase())
    if (names.includes(baseName.toLowerCase())) {
      // Suggest a suffix " (n)" where n is the smallest integer not used
      let n = 2
      let suggestion = `${baseName} (${n})`
      const lowerSet = new Set(Object.values(room.players).map(p => p.name.toLowerCase()))
      while (lowerSet.has(suggestion.toLowerCase())) {
        n += 1
        suggestion = `${baseName} (${n})`
      }
      return NextResponse.json(
        { error: 'duplicate_name', suggestedName: suggestion },
        { status: 409 }
      )
    }

    const player = await joinGameRoom(room.id, playerName.trim())
    if (!player) {
      return NextResponse.json({ error: 'Failed to join game' }, { status: 400 })
    }

    return NextResponse.json({
      roomId: room.id,
      playerId: player.id,
      room
    })
  } catch (error) {
    console.error('Error joining game:', error)
    return NextResponse.json({ error: 'Failed to join game' }, { status: 500 })
  }
}