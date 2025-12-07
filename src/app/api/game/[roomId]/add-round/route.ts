import { NextRequest, NextResponse } from 'next/server'
import { getGameRoom, addRound } from '@/lib/gameManager'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { playerId } = await request.json()

    if (!playerId || typeof playerId !== 'string') {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
    }

    const room = await getGameRoom(params.roomId)
    if (!room) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Verify player is the host
    if (room.host !== playerId) {
      return NextResponse.json({ error: 'Only the host can add rounds' }, { status: 403 })
    }

    const success = await addRound(params.roomId, playerId)
    if (!success) {
      return NextResponse.json({ error: 'Failed to add round' }, { status: 400 })
    }

    // Return updated room
    const updatedRoom = await getGameRoom(params.roomId)
    return NextResponse.json({ room: updatedRoom })
  } catch (error) {
    console.error('Error adding round:', error)
    return NextResponse.json({ error: 'Failed to add round' }, { status: 500 })
  }
}

