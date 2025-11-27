import { GoogleGenAI } from '@google/genai';
import { readFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

// Lazy initialization function - ensures ai is created with proper env vars
function getGeminiAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  return new GoogleGenAI({
    apiKey: apiKey,
  });
}

export interface TryOnRequest {
  userPhotoUrl: string;
  productImageUrl: string;
  productName: string;
  productDescription?: string;
  // Optional flags for future variations (different prompt styles, etc.)
  promptVersion?: number;
}

export interface TryOnResult {
  success: boolean;
  imageData?: string;
  imageUrl?: string;
  error?: string;
}

export interface OutfitItem {
  name: string;
  imageUrl: string; // product thumbnail or full image URL
  productUrl: string;
  price?: number;
  currency?: string;
  brand?: string;
  retailer?: string;
  category?: string;
}

async function resizeIfLarge(buffer: Buffer, targetMax = 1024): Promise<{ mimeType: string; data: string }> {
  try {
    const img = sharp(buffer);
    const meta = await img.metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;
    const needsResize = w > targetMax || h > targetMax;
    const pipeline = needsResize ? img.resize({ width: w > h ? targetMax : undefined, height: h >= w ? targetMax : undefined, fit: 'inside', withoutEnlargement: true }) : img;
    // Always output JPEG to reduce size and avoid transparency artifacts in model inputs
    const out = await pipeline.jpeg({ quality: 85 }).toBuffer();
    return { mimeType: 'image/jpeg', data: out.toString('base64') };
  } catch {
    // If sharp fails, fall back to original buffer (as jpeg best-effort)
    try {
      const out = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
      return { mimeType: 'image/jpeg', data: out.toString('base64') };
    } catch {
      return { mimeType: 'image/jpeg', data: buffer.toString('base64') };
    }
  }
}

async function imageToBase64(url: string): Promise<{ mimeType: string; data: string }> {
  try {
    // Handle data URLs (base64 encoded images) directly
    if (url.startsWith('data:')) {
      const matches = url.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid data URL format');
      }
      const mimeType = matches[1];
      const base64Data = matches[2];

      // Validate it's an image MIME type
      if (!mimeType.startsWith('image/')) {
        throw new Error(`Invalid data URL MIME type: ${mimeType}. Expected image/*`);
      }

      // Downscale if large
      const buffer = Buffer.from(base64Data, 'base64');
      const resized = await resizeIfLarge(buffer);
      return resized;
    }

    // Handle local file paths (from Next.js public folder)
    if (url.startsWith('/')) {
      // Remove leading slash(s) and construct path to public folder
      const relPath = url.replace(/^\/+/, '');
      const filePath = join(process.cwd(), 'public', relPath);

      // Read the file
      const fileBuffer = await readFile(filePath);

      // Downscale if large and normalize to jpeg
      const resized = await resizeIfLarge(Buffer.from(fileBuffer));
      return resized;

      // Determine MIME type from file extension
      const ext = url.toLowerCase().split('.').pop();
      let mimeType = 'image/jpeg'; // default

      switch (ext) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
        default:
          // Try to detect from magic bytes
          if (fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8) {
            mimeType = 'image/jpeg';
          } else if (fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50) {
            mimeType = 'image/png';
          } else if (fileBuffer[0] === 0x47 && fileBuffer[1] === 0x49) {
            mimeType = 'image/gif';
          } else if (fileBuffer[8] === 0x57 && fileBuffer[9] === 0x45) {
            mimeType = 'image/webp';
          }
      }

      return {
        mimeType,
        data: fileBuffer.toString('base64'),
      };
    }

    // Handle HTTP/HTTPS URLs - fetch the image
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error(`Invalid URL format: ${url}`);
    }

    // Special handling for Unsplash URLs
    let fetchUrl = url;
    const headers: HeadersInit = {
      'Accept': 'image/*',
    };

    // If it's an Unsplash URL, add proper parameters
    if (url.includes('images.unsplash.com')) {
      // Add quality and format parameters if not present
      const urlObj = new URL(url);
      if (!urlObj.searchParams.has('fm')) {
        urlObj.searchParams.set('fm', 'jpg'); // Force JPEG format
      }
      if (!urlObj.searchParams.has('q')) {
        urlObj.searchParams.set('q', '80'); // Quality 80
      }
      // Ensure width is reasonable
      if (!urlObj.searchParams.has('w') && !urlObj.searchParams.has('h')) {
        urlObj.searchParams.set('w', '800');
      }
      fetchUrl = urlObj.toString();
    }

    const response = await fetch(fetchUrl, { headers });

    // Check if response is OK
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Read the response buffer once
    const buffer = await response.arrayBuffer();

    // Additional check: ensure we actually got data
    if (buffer.byteLength === 0) {
      throw new Error('Received empty image data');
    }

    // Downscale if large and normalize
    const resized = await resizeIfLarge(Buffer.from(buffer));

    // Validate content type is actually an image
    const contentType = response.headers.get('content-type') || '';
    const validImageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const normalizedContentType = contentType.toLowerCase().split(';')[0].trim();

    // Validate it's actually an image by checking magic bytes (more reliable than content-type)
    const firstBytes = new Uint8Array(buffer.slice(0, 12));
    const isJPEG = firstBytes[0] === 0xFF && firstBytes[1] === 0xD8;
    const isPNG = firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47;
    const isGIF = firstBytes[0] === 0x47 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46 && firstBytes[3] === 0x38;
    const isWebP = buffer.byteLength >= 12 &&
      firstBytes[0] === 0x52 && firstBytes[1] === 0x49 &&
      firstBytes[2] === 0x46 && firstBytes[3] === 0x46 &&
      firstBytes[8] === 0x57 && firstBytes[9] === 0x45 &&
      firstBytes[10] === 0x42 && firstBytes[11] === 0x50;

    // Check if it's HTML (common HTML tags or DOCTYPE)
    if (!isJPEG && !isPNG && !isGIF && !isWebP) {
      const textDecoder = new TextDecoder();
      const preview = textDecoder.decode(buffer.slice(0, Math.min(200, buffer.byteLength)));

      if (preview.trimStart().startsWith('<') || preview.includes('<!DOCTYPE') || preview.includes('<html') || preview.includes('<body')) {
        throw new Error(`URL returned HTML content instead of image (likely 404 page): ${url}`);
      }

      // If content-type says it's an image but magic bytes don't match, still reject it
      if (normalizedContentType.startsWith('image/')) {
        throw new Error(`Content-Type claims image (${contentType}) but file format doesn't match (magic bytes invalid)`);
      }

      throw new Error(`Invalid image format. Expected JPEG, PNG, GIF, or WebP. Content-Type: ${contentType || 'unknown'}`);
    }

    // If magic bytes are valid but content-type is wrong, use the detected type
    let finalMimeType = normalizedContentType;
    if (!validImageMimeTypes.includes(normalizedContentType)) {
      if (isJPEG) finalMimeType = 'image/jpeg';
      else if (isPNG) finalMimeType = 'image/png';
      else if (isGIF) finalMimeType = 'image/gif';
      else if (isWebP) finalMimeType = 'image/webp';
    }

    const base64 = Buffer.from(buffer).toString('base64');

    return {
      mimeType: finalMimeType,
      data: base64,
    };
  } catch (error) {
    console.error(`Error converting image to base64 (${url.substring(0, 50)}...):`, error);
    throw error;
  }
}

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateVirtualTryOn(
  request: TryOnRequest
): Promise<TryOnResult> {
  const MAX_RETRIES = 3;
  let lastError: string | undefined;

  // Initialize Gemini AI client (lazy initialization)
  let ai: GoogleGenAI;
  try {
    ai = getGeminiAI();
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to initialize AI' };
  }

  // Convert images to base64 once
  let productImage, userImage;
  try {
    productImage = await imageToBase64(request.productImageUrl);
    userImage = await imageToBase64(request.userPhotoUrl);

    // Validate images before sending to Gemini
    if (!productImage.data || productImage.data.length === 0) throw new Error('Product image data is empty');
    if (!userImage.data || userImage.data.length === 0) throw new Error('User photo data is empty');
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Image processing failed' };
  }

  // Retry loop
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[TRYON] Attempt ${attempt}/${MAX_RETRIES} for ${request.productName}`);

      // Strategy 1: Standard Professional Prompt
      let promptText = `You are a professional virtual try-on system. The first image contains a clothing item (${request.productName}${request.productDescription ? `: ${request.productDescription}` : ''}). The second image contains a person (model/user). 

Task: Generate a realistic virtual try-on image where the person from the second image is wearing the clothing item from the first image.

Requirements:
- Extract the person's face and body from the second image
- Apply the clothing item from the first image onto the person
- Maintain the person's facial features, body proportions, and pose
- Adjust lighting and shadows to match naturally
- Ensure the clothing fits realistically with proper draping and fit
- Generate a high-quality, professional e-commerce style photo
- The output should be a full-body or appropriate crop showing the person wearing the item

Generate the virtual try-on image now.`;

      // Strategy 2: Stricter Prompt (Retry 1)
      if (attempt === 2) {
        promptText = `STRICT OUTPUT REQUIREMENT: You must generate an IMAGE. Do not return text.
        
Task: Virtual Try-On.
Input 1: Clothing Item (${request.productName}).
Input 2: Person.

Action: Put the clothing item from Input 1 onto the person in Input 2.
Keep the person's face and identity EXACTLY the same.
Make it look photorealistic.

RETURN ONLY THE IMAGE.`;
      }

      // Strategy 3: Simplified/Direct Prompt (Retry 2)
      if (attempt === 3) {
        promptText = `Generate an image of the person from the second image wearing the ${request.productName} from the first image. Photorealistic, high quality.`;
      }

      const prompt = [
        { inlineData: { mimeType: productImage.mimeType, data: productImage.data } },
        { inlineData: { mimeType: userImage.mimeType, data: userImage.data } },
        { text: promptText },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Gemini image generation model
        contents: [{ role: 'user', parts: prompt }],
      } as any);

      // Parse response
      if (!response.candidates || response.candidates.length === 0) throw new Error('No candidates received');

      const candidate = response.candidates[0];
      const parts = candidate.content?.parts || [];
      if (parts.length === 0) throw new Error('Empty parts in response');

      // Find image data
      for (const part of parts) {
        // Check for inlineData
        if ('inlineData' in part && (part as any).inlineData) {
          const inlineData = (part as any).inlineData;
          return {
            success: true,
            imageData: inlineData.data,
            imageUrl: `data:${inlineData.mimeType || 'image/png'};base64,${inlineData.data}`,
          };
        }
        // Check for raw data
        if ('data' in part && (part as any).data) {
          const base64 = (part as any).data;
          return {
            success: true,
            imageData: base64,
            imageUrl: `data:${(part as any).mimeType || 'image/png'};base64,${base64}`,
          };
        }
      }

      // If we got here, we only got text
      const textPart = parts.find(p => 'text' in p && (p as any).text);
      if (textPart) {
        console.warn(`[TRYON] Attempt ${attempt} returned text: ${(textPart as any).text.slice(0, 100)}...`);
        throw new Error('Model returned text instead of image');
      }

      throw new Error('No image data found in response');

    } catch (error) {
      console.error(`[TRYON] Attempt ${attempt} failed:`, error);
      lastError = error instanceof Error ? error.message : 'Unknown error';

      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      if (attempt < MAX_RETRIES) {
        const waitTime = 1000 * Math.pow(2, attempt - 1);
        console.log(`[TRYON] Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
      }
    }
  }

  return {
    success: false,
    error: `Failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`,
  };
}

export async function batchGenerateTryOns(
  requests: TryOnRequest[]
): Promise<TryOnResult[]> {
  const results = await Promise.all(
    requests.map((request) => generateVirtualTryOn(request))
  );
  return results;
}

// Generate layered outfit by sequentially applying items to a base user photo
export async function generateOutfitTryOn(
  userPhotoUrl: string,
  items: OutfitItem[]
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    console.log('[TRYON] ===== Starting outfit generation =====');
    console.log('[TRYON] Total items to apply:', items.length);
    items.forEach((it, idx) => console.log(`[TRYON] Item ${idx + 1}/${items.length}:`, {
      name: it.name,
      category: it.category,
      brand: it.brand || it.retailer,
      hasImage: !!it.imageUrl,
      imagePreview: it.imageUrl?.slice(0, 60)
    }));

    let base = userPhotoUrl;
    if (!items || items.length === 0) {
      console.log('[TRYON] No items to apply, returning original user photo');
      return { success: true, imageUrl: base };
    }

    // Apply each item sequentially, layering them
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`[TRYON] Applying item ${i + 1}/${items.length}: ${item.name}`);
      console.log(`[TRYON] Using base image:`, base.slice(0, 60));

      try {
        const res = await generateVirtualTryOn({
          userPhotoUrl: base,
          productImageUrl: item.imageUrl,
          productName: item.name,
          productDescription: `${item.brand || ''} ${item.category || ''}`.trim() || undefined,
        });

        if (!res.success || !res.imageUrl) {
          console.error(`[TRYON] Failed at item ${i + 1}/${items.length}:`, res.error);
          console.warn(`[TRYON] Skipping item ${item.name} and continuing with previous base`);
          // Continue to next item with SAME base
          continue;
        }

        console.log(`[TRYON] Successfully applied item ${i + 1}/${items.length}`);
        console.log(`[TRYON] Result image preview:`, res.imageUrl.slice(0, 60));
        base = res.imageUrl; // Use this result as the base for the next item
      } catch (itemError) {
        console.error(`[TRYON] Exception applying item ${item.name}:`, itemError);
        // Continue to next item
        continue;
      }
    }

    console.log('[TRYON] ===== Outfit generation complete =====');
    console.log('[TRYON] Final result image:', base.slice(0, 60));
    return { success: true, imageUrl: base };
  } catch (err) {
    console.error('[TRYON] Outfit generation error:', err);
    // Even if the main loop crashes (unlikely with inner try/catch), return what we have
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
