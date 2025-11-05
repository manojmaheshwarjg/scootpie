import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export interface TryOnRequest {
  userPhotoUrl: string;
  productImageUrl: string;
  productName: string;
  productDescription?: string;
}

export interface TryOnResult {
  success: boolean;
  imageData?: string;
  error?: string;
}

export async function generateVirtualTryOn(
  request: TryOnRequest
): Promise<TryOnResult> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const userImageResponse = await fetch(request.userPhotoUrl);
    const userImageBuffer = await userImageResponse.arrayBuffer();
    const userImageBase64 = Buffer.from(userImageBuffer).toString('base64');

    const productImageResponse = await fetch(request.productImageUrl);
    const productImageBuffer = await productImageResponse.arrayBuffer();
    const productImageBase64 = Buffer.from(productImageBuffer).toString('base64');

    const prompt = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: productImageBase64,
        },
      },
      {
        inlineData: {
          mimeType: 'image/png',
          data: userImageBase64,
        },
      },
      {
        text: `Create a professional e-commerce fashion photo. Take the ${request.productName} from the first image and let the person from the second image wear it. Generate a realistic, full-body shot of the person wearing the ${request.productName}, with the lighting and shadows adjusted to match the environment. Ensure accurate fit, draping, and proportions.`,
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData) {
        return {
          success: true,
          imageData: part.inlineData.data,
        };
      }
    }

    return {
      success: false,
      error: 'No image generated in response',
    };
  } catch (error) {
    console.error('Virtual try-on generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function batchGenerateTryOns(
  requests: TryOnRequest[]
): Promise<TryOnResult[]> {
  const results = await Promise.all(
    requests.map((request) => generateVirtualTryOn(request))
  );
  return results;
}
