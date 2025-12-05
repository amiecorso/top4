import { NextRequest, NextResponse } from 'next/server'
import { getGameRoom, updateGameRoom, advanceToNextRound } from '@/lib/gameManager'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { playerId } = await request.json()
    
    if (!playerId) {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 })
    }

    const room = await getGameRoom(params.roomId)
    if (!room || room.status !== 'playing') {
      return NextResponse.json({ error: 'Game not found or not in playing state' }, { status: 404 })
    }

    const currentRound = room.rounds[room.currentRound - 1]
    if (!currentRound || !currentRound.revealed) {
      return NextResponse.json({ error: 'Round not revealed yet' }, { status: 400 })
    }

    if (!room.players[playerId]) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    if (!currentRound.readyForNextRound) {
      currentRound.readyForNextRound = []
    }

    if (!currentRound.readyForNextRound.includes(playerId)) {
      currentRound.readyForNextRound.push(playerId)
    }

    await updateGameRoom(room)

    const totalPlayers = Object.keys(room.players).length
    const allReady = currentRound.readyForNextRound.length === totalPlayers

    if (allReady && room.currentRound < room.maxRounds) {
      await advanceToNextRound(params.roomId)
      return NextResponse.json({ success: true, advanced: true })
    }

    return NextResponse.json({ 
      success: true, 
      advanced: false,
      readyCount: currentRound.readyForNextRound.length,
      totalPlayers 
    })
  } catch (error) {
    console.error('Error in ready-next-round API:', error)
    return NextResponse.json({ error: 'Failed to mark ready' }, { status: 500 })
  }
}

