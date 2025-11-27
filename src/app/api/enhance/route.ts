import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { enhanceUserPhoto } from '@/services/photo-enhancement';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { imageUrl } = body;

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Missing imageUrl' },
                { status: 400 }
            );
        }

        console.log('[ENHANCE] Enhancing image for user:', userId);

        // Call the enhancement service
        const result = await enhanceUserPhoto(imageUrl, {
            removeBackground: true,
            correctLighting: true,
            upscaleIfNeeded: true,
            extendIfCropped: true,
            minResolution: 512,
        });

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Enhancement failed',
                    warnings: result.warnings,
                },
                { status: 200 }
            );
        }

        return NextResponse.json({
            success: true,
            enhancedImageUrl: result.enhancedImageUrl,
            enhancements: result.enhancements,
            warnings: result.warnings,
        });
    } catch (error) {
        console.error('[ENHANCE] Error:', error);
        return NextResponse.json(
            { error: 'Failed to enhance image' },
            { status: 500 }
        );
    }
}
