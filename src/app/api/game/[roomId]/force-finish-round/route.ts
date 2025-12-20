import { NextRequest, NextResponse } from 'next/server'
import { getGameRoom, calculateScores, voidCurrentRound, updateGameRoom } from '@/lib/gameManager'

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

    if (room.host !== playerId) {
      return NextResponse.json({ error: 'Only the host can finish the round' }, { status: 403 })
    }

    const currentRound = room.rounds[room.currentRound - 1]
    if (!currentRound) {
      return NextResponse.json({ error: 'Round not found' }, { status: 400 })
    }

    if (currentRound.revealed) {
      return NextResponse.json({ success: true, alreadyRevealed: true })
    }

    // Ensure every non-turn-taker has a prediction entry; fill missing with all-unranked (0s)
    const allPlayerIds = Object.keys(room.players)
    for (const pid of allPlayerIds) {
      if (pid === currentRound.currentPlayer) continue
      if (!currentRound.playerRankings[pid]) {
        currentRound.playerRankings[pid] = [0, 0, 0, 0]
      }
    }
    await updateGameRoom(room)

    if (!currentRound.playerRanking) {
      // If turn-taker hasn't submitted, void the round immediately
      const voided = await voidCurrentRound(params.roomId)
      if (!voided) {
        return NextResponse.json({ error: 'Failed to void round' }, { status: 400 })
      }
    } else {
      // Otherwise, reveal and score
      await calculateScores(params.roomId)
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error forcing round finish:', error)
    return NextResponse.json({ error: 'Failed to finish round' }, { status: 500 })
  }
}


