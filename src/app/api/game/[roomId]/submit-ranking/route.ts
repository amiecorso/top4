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

    // Validate ranking: either complete (1,2,3,4) or partial (can contain 0s for unranked)
    const nonZeroRanks = ranking.filter(r => r !== 0)
    const uniqueNonZero = new Set(nonZeroRanks)
    
    // Check for duplicates in non-zero values
    if (nonZeroRanks.length !== uniqueNonZero.size) {
      return NextResponse.json({ error: 'Ranking contains duplicate values' }, { status: 400 })
    }
    
    // Check all non-zero values are valid (1-4)
    if (nonZeroRanks.some(r => r < 1 || r > 4)) {
      return NextResponse.json({ error: 'Ranking contains invalid values' }, { status: 400 })
    }
    
    // For complete rankings, must have all 1,2,3,4
    if (nonZeroRanks.length === 4) {
      const sortedRanking = [...nonZeroRanks].sort()
      if (JSON.stringify(sortedRanking) !== JSON.stringify([1, 2, 3, 4])) {
        return NextResponse.json({ error: 'Complete ranking must contain exactly 1, 2, 3, 4' }, { status: 400 })
      }
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