import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, photos } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ photoId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photoId } = await context.params;

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Set all photos to non-primary
    await db.update(photos)
      .set({ isPrimary: false })
      .where(eq(photos.userId, user.id));

    // Set the selected photo as primary
    await db.update(photos)
      .set({ isPrimary: true })
      .where(
        and(
          eq(photos.id, photoId),
          eq(photos.userId, user.id)
        )
      );

    // Update user's primary photo ID
    await db.update(users)
      .set({ primaryPhotoId: photoId })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true, message: 'Primary photo updated successfully' });
  } catch (error) {
    console.error('Error setting primary photo:', error);
    return NextResponse.json({ error: 'Failed to set primary photo' }, { status: 500 });
  }
}
