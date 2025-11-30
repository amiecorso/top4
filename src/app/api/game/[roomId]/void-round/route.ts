import { NextRequest, NextResponse } from 'next/server'
import { voidCurrentRound } from '@/lib/gameManager'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const success = await voidCurrentRound(params.roomId)
    if (!success) {
      return NextResponse.json({ error: 'Failed to void round' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error voiding round:', error)
    return NextResponse.json({ error: 'Failed to void round' }, { status: 500 })
  }
}

