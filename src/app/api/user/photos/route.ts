import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, photos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { enhanceUserPhoto } from '@/services/photo-enhancement';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { photoUrls } = body;

    console.log(`📸 [PHOTOS API] Request received from user ${userId}`);
    console.log(`📸 [PHOTOS API] Payload photoUrls count: ${photoUrls?.length}`);

    if (!photoUrls || photoUrls.length === 0) {
      console.error('❌ [PHOTOS API] No photo URLs provided');
      return NextResponse.json({ error: 'No photo URLs provided' }, { status: 400 });
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
      with: { photos: true },
    });

    if (!user) {
      console.error(`❌ [PHOTOS API] User not found for clerkId ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`📸 [PHOTOS API] User found: ${user.id}, existing photos: ${user.photos.length}`);

    // Check if user already has 5 photos
    if (user.photos.length >= 5) {
      console.warn(`⚠️ [PHOTOS API] User already has ${user.photos.length} photos (max 5)`);
      return NextResponse.json({ error: 'Maximum 5 photos allowed' }, { status: 400 });
    }

    // Add new photos - most recently uploaded photo becomes primary
    const photosToAdd = photoUrls.slice(0, 5 - user.photos.length);
    console.log(`📸 [PHOTOS API] Processing ${photosToAdd.length} new photos`);

    console.log(`[PHOTOS] Auto-enhancing ${photosToAdd.length} photos...`);

    // Enhance all photos
    const enhancedPhotos = [];
    for (const url of photosToAdd) {
      console.log('[PHOTOS] Enhancing photo:', url.substring(0, 50));

      try {
        const enhancement = await enhanceUserPhoto(url, {
          removeBackground: true,
          correctLighting: true,
          upscaleIfNeeded: true,
          extendIfCropped: true,
          minResolution: 512,
        });

        enhancedPhotos.push({
          original: url,
          enhanced: enhancement.success ? enhancement.enhancedImageUrl : url,
          metadata: enhancement.success ? { enhancements: enhancement.enhancements } : undefined,
        });

        console.log('[PHOTOS] Enhancement result:', enhancement.success ? 'Success' : 'Failed');
      } catch (error) {
        console.error('[PHOTOS] Enhancement error:', error);
        // Fallback to original if enhancement fails
        enhancedPhotos.push({
          original: url,
          enhanced: url,
          metadata: undefined,
        });
      }
    }

    // First, set all existing photos to non-primary
    if (enhancedPhotos.length > 0) {
      await db.update(photos)
        .set({ isPrimary: false })
        .where(eq(photos.userId, user.id));
    }

    // Insert all new photos with enhanced URLs
    const insertedPhotos = [];
    for (const photo of enhancedPhotos) {
      const [inserted] = await db.insert(photos).values({
        userId: user.id,
        url: photo.original,
        enhancedUrl: photo.enhanced,
        isPrimary: false, // Will set the last one as primary after all inserts
        metadata: photo.metadata,
      }).returning();
      insertedPhotos.push(inserted);

      console.log('[PHOTOS] Saved photo with enhanced version');
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

    console.log(`[PHOTOS] Successfully added ${insertedPhotos.length} enhanced photos`);

    return NextResponse.json({ success: true, message: 'Photos added and enhanced successfully' });
  } catch (error) {
    console.error('Error adding photos:', error);
    return NextResponse.json({ error: 'Failed to add photos' }, { status: 500 });
  }
}
