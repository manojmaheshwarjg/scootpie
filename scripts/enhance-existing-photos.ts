import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function enhanceExistingPhotos() {
    console.log('🔄 Starting backfill for existing photos...');

    // Dynamic imports to ensure env vars are loaded first
    const { db } = await import('../src/lib/db');
    const { photos } = await import('../src/lib/db/schema');
    const { isNull, eq } = await import('drizzle-orm');
    const { enhanceUserPhoto } = await import('../src/services/photo-enhancement');

    try {
        // Find photos without enhanced_url
        const photosToEnhance = await db
            .select()
            .from(photos)
            .where(isNull(photos.enhancedUrl));

        console.log(`📸 Found ${photosToEnhance.length} photos to enhance.`);

        if (photosToEnhance.length === 0) {
            console.log('✅ No photos need enhancement.');
            process.exit(0);
        }

        for (const photo of photosToEnhance) {
            console.log(`🎨 Enhancing photo ${photo.id} (${photo.url.substring(0, 30)}...)...`);

            try {
                const result = await enhanceUserPhoto(photo.url, {
                    removeBackground: true,
                    correctLighting: true,
                    upscaleIfNeeded: true,
                    extendIfCropped: true,
                    minResolution: 512,
                });

                if (result.success && result.enhancedImageUrl) {
                    await db
                        .update(photos)
                        .set({
                            enhancedUrl: result.enhancedImageUrl,
                            metadata: {
                                ...((photo.metadata as object) || {}),
                                enhancements: result.enhancements,
                            },
                        })
                        .where(eq(photos.id, photo.id));

                    console.log(`✅ Successfully enhanced photo ${photo.id}`);
                } else {
                    console.warn(`⚠️ Failed to enhance photo ${photo.id}: ${result.error || 'Unknown error'}`);
                    // Optionally mark as failed or skip
                }

            } catch (err) {
                console.error(`❌ Error processing photo ${photo.id}:`, err);
            }
        }

        console.log('✨ Backfill complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error during backfill:', error);
        process.exit(1);
    }
}

enhanceExistingPhotos();
