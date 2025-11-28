import { NextRequest, NextResponse } from 'next/server'
import { submitRanking, canRevealRound, calculateScores } from '@/lib/gameManager'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { playerId, ranking } = await request.json()

    if (!playerId || !ranking || !Array.isArray(ranking) || ranking.length !== 4) {
      return NextResponse.json({ error: 'Invalid ranking data' }, { status: 400 })
    }

    // Validate ranking contains exactly 1,2,3,4
    const sortedRanking = [...ranking].sort()
    if (JSON.stringify(sortedRanking) !== JSON.stringify([1, 2, 3, 4])) {
      return NextResponse.json({ error: 'Ranking must contain exactly 1, 2, 3, 4' }, { status: 400 })
    }

    const success = await submitRanking(params.roomId, playerId, ranking)

    if (!success) {
      return NextResponse.json({ error: 'Failed to submit ranking' }, { status: 400 })
    }

    // Check if all players have committed and trigger reveal/scoring
    if (await canRevealRound(params.roomId)) {
      await calculateScores(params.roomId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting ranking:', error)
    return NextResponse.json({ error: 'Failed to submit ranking' }, { status: 500 })
  }
}