import { NextRequest, NextResponse } from 'next/server'
import { getGameRoom, updateGameRoom } from '@/lib/gameManager'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { playerId, action, currentRemainingSeconds } = await request.json()
    
    if (!playerId || !action) {
      return NextResponse.json({ error: 'playerId and action are required' }, { status: 400 })
    }

    if (action !== 'start' && action !== 'add') {
      return NextResponse.json({ error: 'action must be "start" or "add"' }, { status: 400 })
    }

    const room = await getGameRoom(params.roomId)
    if (!room || room.status !== 'playing') {
      return NextResponse.json({ error: 'Game not found or not in playing state' }, { status: 404 })
    }

    if (room.host !== playerId) {
      return NextResponse.json({ error: 'Only the host can control the timer' }, { status: 403 })
    }

    const currentRound = room.rounds[room.currentRound - 1]
    if (!currentRound || currentRound.revealed) {
      return NextResponse.json({ error: 'Round not found or already revealed' }, { status: 400 })
    }

    const now = Date.now()
    const twentySeconds = 20 * 1000

    if (action === 'start') {
      // Start a 20 second timer
      currentRound.manualTimerEndTime = now + twentySeconds
    } else if (action === 'add') {
      // Add 20 seconds to existing timer
      if (currentRound.manualTimerEndTime) {
        // Extend existing manual timer
        currentRound.manualTimerEndTime = Math.max(now, currentRound.manualTimerEndTime) + twentySeconds
      } else if (room.roundDurationSeconds > 0 && currentRemainingSeconds !== undefined) {
        // There's a round timer but no manual timer yet
        // Use the current remaining time from the client + 20 seconds
        const currentRemainingMs = Math.max(0, currentRemainingSeconds) * 1000
        currentRound.manualTimerEndTime = now + currentRemainingMs + twentySeconds
      } else if (room.roundDurationSeconds > 0) {
        // Fallback: use full duration if client didn't provide current remaining
        currentRound.manualTimerEndTime = now + (room.roundDurationSeconds * 1000) + twentySeconds
      } else {
        // No timer at all, start a new 20 second timer
        currentRound.manualTimerEndTime = now + twentySeconds
      }
    }

    await updateGameRoom(room)

    const remainingSeconds = Math.max(0, Math.ceil((currentRound.manualTimerEndTime! - now) / 1000))

    return NextResponse.json({ 
      success: true,
      timerEndTime: currentRound.manualTimerEndTime,
      remainingSeconds
    })
  } catch (error) {
    console.error('Error in manual-timer API:', error)
    return NextResponse.json({ error: 'Failed to update timer' }, { status: 500 })
  }
}

