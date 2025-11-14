import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateVirtualTryOn } from '@/services/tryon';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has gender preference (required for virtual try-on)
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userGender = (user.preferences as any)?.gender;
    if (!userGender || userGender === 'prefer-not-to-say') {
      return NextResponse.json(
        { 
          error: 'Gender preference is required for virtual try-on',
          code: 'GENDER_REQUIRED',
          redirectTo: '/profile'
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { userPhotoUrl, productImageUrl, productName, productDescription } = body;

    if (!userPhotoUrl || !productImageUrl || !productName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await generateVirtualTryOn({
      userPhotoUrl,
      productImageUrl,
      productName,
      productDescription,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Try-on generation failed' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      imageData: result.imageData,
    });
  } catch (error) {
    console.error('Error generating try-on:', error);
    return NextResponse.json(
      { error: 'Failed to generate try-on' },
      { status: 500 }
    );
  }
}
