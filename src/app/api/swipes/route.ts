import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, direction, sessionId, cardPosition } = body;

    console.log('Swipe recorded:', { userId, productId, direction, sessionId, cardPosition });

    return NextResponse.json({
      success: true,
      message: 'Swipe recorded successfully',
    });
  } catch (error) {
    console.error('Error recording swipe:', error);
    return NextResponse.json(
      { error: 'Failed to record swipe' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      swipes: [],
      message: 'Swipe history retrieved',
    });
  } catch (error) {
    console.error('Error fetching swipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swipes' },
      { status: 500 }
    );
  }
}
