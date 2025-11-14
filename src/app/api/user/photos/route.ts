import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, photos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { photoUrls } = body;

    if (!photoUrls || photoUrls.length === 0) {
      return NextResponse.json({ error: 'No photo URLs provided' }, { status: 400 });
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
      with: { photos: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has 5 photos
    if (user.photos.length >= 5) {
      return NextResponse.json({ error: 'Maximum 5 photos allowed' }, { status: 400 });
    }

    // Add new photos - most recently uploaded photo becomes primary
    const photosToAdd = photoUrls.slice(0, 5 - user.photos.length);
    
    // First, set all existing photos to non-primary
    if (photosToAdd.length > 0) {
      await db.update(photos)
        .set({ isPrimary: false })
        .where(eq(photos.userId, user.id));
    }
    
    // Insert all new photos (none are primary yet)
    const insertedPhotos = [];
    for (const url of photosToAdd) {
      const [inserted] = await db.insert(photos).values({
        userId: user.id,
        url,
        isPrimary: false, // Will set the last one as primary after all inserts
      }).returning();
      insertedPhotos.push(inserted);
    }
    
    // Set the most recently uploaded photo (last in array) as primary
    if (insertedPhotos.length > 0) {
      const lastPhoto = insertedPhotos[insertedPhotos.length - 1];
      await db.update(photos)
        .set({ isPrimary: true })
        .where(eq(photos.id, lastPhoto.id));
      
      // Update user's primaryPhotoId
      await db.update(users)
        .set({ primaryPhotoId: lastPhoto.id })
        .where(eq(users.id, user.id));
    }

    return NextResponse.json({ success: true, message: 'Photos added successfully' });
  } catch (error) {
    console.error('Error adding photos:', error);
    return NextResponse.json({ error: 'Failed to add photos' }, { status: 500 });
  }
}
