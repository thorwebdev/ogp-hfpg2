
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates a watercolour painting from a place name or description.
 */
export async function generateWatercolourPainting(placeName: string): Promise<string> {
  const prompt = `A breathtaking, high-quality traditional watercolor painting of ${placeName}. 
    The style should feature artistic brushstrokes, gentle color bleeds, and visible paper texture. 
    Focus on capturing the iconic essence and atmosphere of the location. 
    Add a subtle, elegant artist signature that says "Gemini" in the bottom right corner.
    Ensure the composition is balanced and the colors are vibrant yet natural.`;
  
  return callGeminiImageApi([ { text: prompt } ]);
}

/**
 * Refines/Edits an existing watercolour painting based on a new prompt.
 * @param base64ImageDataUrl The current image data URL.
 * @param editPrompt The user's instruction for editing.
 * @param originalPlace The original place name to maintain context.
 */
export async function editWatercolourPainting(base64ImageDataUrl: string, editPrompt: string, originalPlace: string): Promise<string> {
  // Extract the pure base64 data from the data URL
  const base64Data = base64ImageDataUrl.split(',')[1];
  const mimeType = base64ImageDataUrl.split(';')[0].split(':')[1];

  const prompt = `Modify this watercolor painting of ${originalPlace}. 
    Your instruction is: "${editPrompt}". 
    Maintain the existing artistic watercolor style, brushstrokes, and paper texture. 
    Keep the core composition of ${originalPlace} but apply the changes requested.
    Ensure the result remains a beautiful, cohesive watercolor masterpiece.
    Ensure the signature "Gemini" remains in the bottom right corner.`;

  return callGeminiImageApi([
    {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    },
    { text: prompt }
  ]);
}

/**
 * Internal helper to call the Gemini Image API with retries.
 */
async function callGeminiImageApi(parts: any[]): Promise<string> {
  const maxRetries = 3;
  const initialDelay = 1500;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });
      
      const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

      if (imagePart?.inlineData) {
        const { mimeType, data } = imagePart.inlineData;
        return `data:${mimeType};base64,${data}`;
      }

      throw new Error("The AI model responded without an image.");

    } catch (error) {
      console.error(`Gemini Image API Error (Attempt ${attempt}):`, error);
      
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      const isRetryable = errorMessage.includes('429') || errorMessage.includes('500') || errorMessage.includes('INTERNAL');

      if (isRetryable && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(error instanceof Error ? error.message : "Failed to generate image.");
    }
  }

  throw new Error("Maximum retries exceeded.");
}
