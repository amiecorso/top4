import { NextRequest, NextResponse } from 'next/server'
import { advanceToNextRound } from '@/lib/gameManager'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  console.log('🚀 NEXT-ROUND API CALLED with roomId:', params.roomId)
  try {
    console.log('⏳ Calling advanceToNextRound...')
    const success = await advanceToNextRound(params.roomId)
    console.log('✅ advanceToNextRound result:', success)

    const response = { success, hasNextRound: success }
    console.log('📤 Returning response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Error in next-round API:', error)
    return NextResponse.json({ error: 'Failed to advance round' }, { status: 500 })
  }
}