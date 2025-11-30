import { NextRequest, NextResponse } from 'next/server'
import { buildFinalPromptPoolAndStartGame } from '@/lib/gameManager'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    await buildFinalPromptPoolAndStartGame(params.roomId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error finalizing prompts:', error)
    return NextResponse.json({ error: 'Failed to finalize prompts' }, { status: 500 })
  }
}


