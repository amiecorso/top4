import { NextRequest, NextResponse } from 'next/server'
import { submitPlayerPrompt } from '@/lib/gameManager'

export async function POST(request: NextRequest) {
  try {
    const { roomId, playerId, prompt } = await request.json()

    if (!roomId || !playerId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await submitPlayerPrompt(roomId, playerId, prompt)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to submit prompt' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      remaining: result.remaining
    })
  } catch (error) {
    console.error('Error submitting prompt:', error)
    return NextResponse.json(
      { error: 'Failed to submit prompt' },
      { status: 500 }
    )
  }
}
