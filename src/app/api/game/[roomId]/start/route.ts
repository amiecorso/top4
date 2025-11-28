import { NextRequest, NextResponse } from 'next/server'
import { startGame } from '@/lib/gameManager'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const success = await startGame(params.roomId)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Failed to start game' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error starting game:', error)
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 })
  }
}