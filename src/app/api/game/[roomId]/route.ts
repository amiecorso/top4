import { NextRequest, NextResponse } from 'next/server'
import { getGameRoom } from '@/lib/gameManager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const room = await getGameRoom(params.roomId)

    if (!room) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const response = {
      room
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })
  } catch (error) {
    console.error('Error fetching game:', error)
    return NextResponse.json({ error: 'Failed to fetch game' }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })
  }
}