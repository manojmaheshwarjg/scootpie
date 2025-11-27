import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { GoogleGenAI } from '@google/genai';

export interface PhotoEnhancementResult {
    success: boolean;
    enhancedImageUrl?: string; // base64 data URL
    original: string; // original for comparison
    enhancements: {
        backgroundRemoved: boolean;
        lightingCorrected: boolean;
        qualityUpscaled: boolean;
        imageExtended: boolean;
    };
    warnings?: string[];
    error?: string;
}

export interface EnhancementOptions {
    removeBackground?: boolean; // default: true
    correctLighting?: boolean; // default: true
    upscaleIfNeeded?: boolean; // default: true
    extendIfCropped?: boolean; // default: true
    minResolution?: number; // default: 512px
}

/**
 * Main function to enhance user photos before virtual try-on
 */
export async function enhanceUserPhoto(
    imageUrl: string,
    options: EnhancementOptions = {}
): Promise<PhotoEnhancementResult> {
    const {
        removeBackground: shouldRemoveBackground = true,
        correctLighting: shouldCorrectLighting = true,
        upscaleIfNeeded: shouldUpscale = true,
        extendIfCropped: shouldExtend = true,
        minResolution = 512,
    } = options;

    const enhancements = {
        backgroundRemoved: false,
        lightingCorrected: false,
        qualityUpscaled: false,
        imageExtended: false,
    };
    const warnings: string[] = [];

    try {
        console.log('[PHOTO-ENHANCEMENT] Starting photo enhancement pipeline...');
        console.log('[PHOTO-ENHANCEMENT] Options:', options);

        // Convert image URL to buffer
        let buffer = await urlToBuffer(imageUrl);
        console.log('[PHOTO-ENHANCEMENT] Loaded image, size:', buffer.length, 'bytes');

        // Step 1: Validate and upscale if needed
        if (shouldUpscale) {
            console.log('[PHOTO-ENHANCEMENT] Step 1: Checking resolution...');
            const result = await validateAndUpscale(buffer, minResolution);
            buffer = result.buffer;
            enhancements.qualityUpscaled = result.upscaled;
            if (result.upscaled) {
                console.log('[PHOTO-ENHANCEMENT] ✅ Image upscaled to meet minimum resolution');
            } else {
                console.log('[PHOTO-ENHANCEMENT] ⏭️ Resolution OK, skipping upscale');
            }
        }

        // Step 2: Detect and extend cropped images
        if (shouldExtend) {
            console.log('[PHOTO-ENHANCEMENT] Step 2: Checking for cropped body...');
            try {
                const detectionResult = await detectCroppedImage(buffer);
                if (detectionResult.isCropped) {
                    console.log(`[PHOTO-ENHANCEMENT] ⚠️ Detected cropped image: ${detectionResult.reason}`);
                    console.log('[PHOTO-ENHANCEMENT] 🔄 Extending image...');
                    buffer = await extendImageToFullBody(buffer);
                    enhancements.imageExtended = true;
                    console.log('[PHOTO-ENHANCEMENT] ✅ Image extended to full body successfully');
                } else {
                    console.log('[PHOTO-ENHANCEMENT] ⏭️ Image appears to be full body, skipping extension');
                }
            } catch (extError) {
                console.warn('[PHOTO-ENHANCEMENT] ❌ Image extension failed:', extError);
                warnings.push('Image extension failed, using original image');
            }
        }

        // Step 3: Remove background
        if (shouldRemoveBackground) {
            console.log('[PHOTO-ENHANCEMENT] Step 3: Removing background...');
            try {
                const startSize = buffer.length;
                buffer = await removeBackgroundFromBuffer(buffer);
                console.log(`[PHOTO-ENHANCEMENT] ✅ Background removed. Size change: ${startSize} -> ${buffer.length} bytes`);
                enhancements.backgroundRemoved = true;
            } catch (bgError) {
                console.warn('[PHOTO-ENHANCEMENT] ❌ Background removal failed:', bgError);
                warnings.push('Background removal failed, using original image');
            }
        }

        // Step 4: Correct lighting
        if (shouldCorrectLighting) {
            console.log('[PHOTO-ENHANCEMENT] Step 4: Correcting lighting...');
            try {
                buffer = await correctLightingInBuffer(buffer);
                enhancements.lightingCorrected = true;
                console.log('[PHOTO-ENHANCEMENT] ✅ Lighting corrected successfully');
            } catch (lightError) {
                console.warn('[PHOTO-ENHANCEMENT] ❌ Lighting correction failed:', lightError);
                warnings.push('Lighting correction failed, using current state');
            }
        }

        // Convert final buffer to data URL
        console.log('[PHOTO-ENHANCEMENT] Converting final result to Data URL...');
        const enhancedImageUrl = await bufferToDataUrl(buffer);

        console.log('[PHOTO-ENHANCEMENT] 🎉 Enhancement pipeline complete:', enhancements);

        return {
            success: true,
            enhancedImageUrl,
            original: imageUrl,
            enhancements,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    } catch (error) {
        console.error('[PHOTO-ENHANCEMENT] Fatal error during enhancement:', error);
        return {
            success: false,
            original: imageUrl,
            enhancements,
            error: error instanceof Error ? error.message : 'Unknown error during photo enhancement',
        };
    }
}

/**
 * Detect if image shows only partial/cropped body using Gemini vision
 */
async function detectCroppedImage(buffer: Buffer): Promise<{ isCropped: boolean; reason?: string }> {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('[PHOTO-ENHANCEMENT] GEMINI_API_KEY not set, skipping crop detection');
        return { isCropped: false, reason: 'API key not configured' };
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const metadata = await sharp(buffer).metadata();
        const base64Image = buffer.toString('base64');
        const mimeType = `image/${metadata.format || 'png'}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{
                role: 'user',
                parts: [
                    { inlineData: { mimeType, data: base64Image } },
                    {
                        text: `Analyze this image and determine if it shows only a partial view of a person's body (e.g., upper body only, missing legs).

Answer in JSON format:
{
  "isCropped": true/false,
  "reason": "brief explanation",
  "visibleBodyParts": "what's shown"
}

Return isCropped=true if the image shows only upper body and is missing legs/feet.
Return isCropped=false if full body is visible or if it's just a face/headshot.`,
                    }
                ]
            }],
        } as any);

        const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanedText = textResponse.replace(/```json\n?|\n?```/g, '').trim();
        const result = JSON.parse(cleanedText);

        console.log('[PHOTO-ENHANCEMENT] Gemini detection result:', result);

        return {
            isCropped: result.isCropped || false,
            reason: result.reason,
        };
    } catch (error) {
        console.error('[PHOTO-ENHANCEMENT] Crop detection error:', error);
        return { isCropped: false, reason: 'Detection failed' };
    }
}

/**
 * Extend cropped image to full body using Gemini outpainting
 */
async function extendImageToFullBody(buffer: Buffer): Promise<Buffer> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not set');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const metadata = await sharp(buffer).metadata();
    const currentWidth = metadata.width || 512;
    const currentHeight = metadata.height || 512;

    // Calculate target dimensions (3:4 aspect ratio for full body portrait)
    const targetHeight = Math.max(currentHeight * 2, 1024);
    const targetWidth = Math.round(targetHeight * 0.75);

    const base64Image = buffer.toString('base64');
    const mimeType = `image/${metadata.format || 'png'}`;

    console.log(`[PHOTO-ENHANCEMENT] Extending image from ${currentWidth}x${currentHeight} to ${targetWidth}x${targetHeight}`);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{
            role: 'user',
            parts: [
                { inlineData: { mimeType, data: base64Image } },
                {
                    text: `CRITICAL INSTRUCTION: Generate a COMPLETE FULL-BODY image of the person.
The input image is cropped. You MUST extend it downward to show the entire body, including legs and feet.
1. The person MUST be standing.
2. You MUST generate realistic legs, shoes/feet, and lower body clothing that matches the upper body style.
3. The final image MUST be a full-length portrait showing the person from head to toe.
4. Maintain consistent lighting, background, and style.
5. Blend seamlessly.
Target dimensions: ${targetWidth}x${targetHeight}px.`,
                }
            ]
        }],
    } as any);

    // Extract image from response
    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error('No response from Gemini image generation');

    const parts = candidate.content?.parts || [];
    for (const part of parts) {
        if ('inlineData' in part && (part as any).inlineData) {
            const imageData = (part as any).inlineData.data;
            return Buffer.from(imageData, 'base64');
        }
    }

    throw new Error('No image data in Gemini response');
}

/**
 * Remove background from image buffer
 */
async function removeBackgroundFromBuffer(buffer: Buffer): Promise<Buffer> {
    try {
        const blob = await removeBackground(buffer);
        const arrayBuffer = await blob.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error('[PHOTO-ENHANCEMENT] Background removal failed:', error);
        throw error;
    }
}

/**
 * Auto-correct lighting and colors
 */
async function correctLightingInBuffer(buffer: Buffer): Promise<Buffer> {
    console.log('[PHOTO-ENHANCEMENT] Correcting lighting...');

    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Apply auto-enhancement pipeline
    return await image
        .normalize() // Auto-adjust levels for better contrast
        .modulate({
            brightness: 1.05, // Slight brightness boost
            saturation: 1.1,  // Slight color enhancement
        })
        .sharpen() // Subtle sharpening
        .toBuffer();
}

/**
 * Validate resolution and upscale if needed
 */
async function validateAndUpscale(
    buffer: Buffer,
    minResolution: number
): Promise<{ buffer: Buffer; upscaled: boolean }> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const minDimension = Math.min(width, height);

    if (minDimension < minResolution) {
        console.log(`[PHOTO-ENHANCEMENT] Upscaling from ${width}x${height} to meet minimum ${minResolution}px`);

        const scaleFactor = minResolution / minDimension;
        const newWidth = Math.round(width * scaleFactor);
        const newHeight = Math.round(height * scaleFactor);

        const upscaledBuffer = await image
            .resize(newWidth, newHeight, {
                kernel: 'lanczos3', // High-quality resize
                fit: 'fill',
            })
            .toBuffer();

        return { buffer: upscaledBuffer, upscaled: true };
    }

    return { buffer, upscaled: false };
}

/**
 * Convert image URL to buffer
 */
async function urlToBuffer(url: string): Promise<Buffer> {
    // Handle data URLs
    if (url.startsWith('data:')) {
        const matches = url.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
            throw new Error('Invalid data URL format');
        }
        return Buffer.from(matches[2], 'base64');
    }

    // Handle HTTP/HTTPS URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    // Handle local file paths
    throw new Error('Local file paths not supported in photo enhancement');
}

/**
 * Convert buffer to data URL
 */
async function bufferToDataUrl(buffer: Buffer): Promise<string> {
    // Detect format and convert to PNG for consistency
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Always output as PNG to preserve transparency from background removal
    const pngBuffer = await image.png().toBuffer();
    const base64 = pngBuffer.toString('base64');

    return `data:image/png;base64,${base64}`;
}
