import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { photos, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all user photos
    const userPhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.userId, user.id));

    console.log('[CLEANUP] Found', userPhotos.length, 'photos');

    // Find duplicates using image similarity (compare first 1000 chars of data URLs)
    const seen = new Map<string, string>(); // signature -> photo ID
    const toDelete: string[] = [];

    for (const photo of userPhotos) {
      const signature = photo.url.startsWith('data:') 
        ? photo.url.substring(0, 1000) 
        : photo.url;
      
      if (seen.has(signature)) {
        // Duplicate found - mark for deletion (keep the first one)
        toDelete.push(photo.id);
        console.log('[CLEANUP] Found duplicate photo:', photo.id);
      } else {
        seen.set(signature, photo.id);
      }
    }

    // Delete duplicates
    if (toDelete.length > 0) {
      for (const photoId of toDelete) {
        await db.delete(photos).where(eq(photos.id, photoId));
        console.log('[CLEANUP] Deleted duplicate:', photoId);
      }
    }

    // Get remaining photos
    const remainingPhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.userId, user.id));

    console.log('[CLEANUP] Remaining photos:', remainingPhotos.length);

    // Ensure only one photo is marked as primary
    const primaryPhotos = remainingPhotos.filter(p => p.isPrimary);
    
    if (primaryPhotos.length !== 1) {
      console.log('[CLEANUP] Found', primaryPhotos.length, 'primary photos. Fixing...');
      
      // Set all to non-primary first
      await db.update(photos)
        .set({ isPrimary: false })
        .where(eq(photos.userId, user.id));
      
      // Set the most recent photo as primary
      const primaryPhoto = remainingPhotos[remainingPhotos.length - 1] || remainingPhotos[0];
      if (primaryPhoto) {
        await db.update(photos)
          .set({ isPrimary: true })
          .where(eq(photos.id, primaryPhoto.id));
        
        await db.update(users)
          .set({ primaryPhotoId: primaryPhoto.id })
          .where(eq(users.id, user.id));
        
        console.log('[CLEANUP] Set', primaryPhoto.id, 'as primary');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Photos cleaned up successfully',
      deleted: toDelete.length,
      remaining: remainingPhotos.length,
    });
  } catch (error) {
    console.error('Error cleaning up photos:', error);
    return NextResponse.json({ error: 'Failed to cleanup photos' }, { status: 500 });
  }
}
