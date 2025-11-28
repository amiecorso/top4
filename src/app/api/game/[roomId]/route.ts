import { NextRequest, NextResponse } from 'next/server'
import { getGameRoom } from '@/lib/gameManager'

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  console.log('🎮 === GAME API GET CALLED ===')
  console.log('🎯 Room ID requested:', params.roomId)
  console.log('🔍 Room ID type:', typeof params.roomId)
  console.log('🔍 Room ID length:', params.roomId?.length)

  try {
    console.log('📞 Calling getGameRoom...')
    const room = await getGameRoom(params.roomId)

    if (!room) {
      console.log('❌ No room found for ID:', params.roomId)
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    console.log('✅ Room found successfully!')
    console.log('📊 Room details:')
    console.log('📊 - Room ID:', room.id)
    console.log('📊 - Current Round:', room.currentRound)
    console.log('📊 - Status:', room.status)
    console.log('📊 - Players:', Object.keys(room.players))
    console.log('📊 - Rounds length:', room.rounds.length)
    console.log('📊 - Max Rounds:', room.maxRounds)

    const response = {
      room
    }

    console.log('📤 Sending response with currentRound:', room.currentRound)
    console.log('🎮 === GAME API GET END ===')

    return NextResponse.json(response)
  } catch (error) {
    console.error('🚨 Error fetching game:', error)
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}