
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MedicineAnalysis, PharmacyLocation, InteractionResult } from "../types";
import { SYSTEM_INSTRUCTION, INTERACTION_SYSTEM_INSTRUCTION } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const isTransient = error?.message?.includes('500') || 
                          error?.message?.includes('503') || 
                          error?.message?.includes('quota') ||
                          error?.message?.includes('NetworkError');
      
      if (retries > 0 && isTransient) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  async analyzeImage(base64Image: string, languageName: string): Promise<MedicineAnalysis> {
    return this.withRetry(async () => {
      try {
        const response = await this.ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image,
                },
              },
              { text: `Analyze this medicine image and provide information in ${languageName}. If the image is too blurry to read, or doesn't contain a medicine, please say so in the 'name' field and provide advice in 'translatedText'.` },
            ],
          },
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                dosage: { type: Type.STRING },
                frequency: { type: Type.STRING },
                instructions: { type: Type.STRING },
                purpose: { type: Type.STRING },
                sideEffects: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                translatedText: { type: Type.STRING },
              },
              required: ["name", "dosage", "frequency", "instructions", "purpose", "sideEffects", "translatedText"],
            },
          },
        });

        const text = response.text;
        if (!text) throw new Error("EMPTY_RESPONSE");

        const result = JSON.parse(text) as MedicineAnalysis;
        if (result.name.toLowerCase().includes("blurry") || 
            result.name.toLowerCase().includes("unable") || 
            result.name.toLowerCase().includes("not a medicine")) {
          throw new Error("IMAGE_UNREADABLE");
        }

        return result;
      } catch (error: any) {
        if (error instanceof SyntaxError) throw new Error("INVALID_JSON_RESPONSE");
        throw error;
      }
    });
  }

  async checkInteractions(newMedicine: string, existingMedicines: string[], languageName: string): Promise<InteractionResult> {
    if (existingMedicines.length === 0) {
      return { hasConflict: false, severity: 'none', explanation: '', recommendation: '' };
    }

    return this.withRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `New Medicine: ${newMedicine}. 
                   Current Medications: ${existingMedicines.join(', ')}. 
                   Language: ${languageName}. 
                   Check for interactions.`,
        config: {
          systemInstruction: INTERACTION_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hasConflict: { type: Type.BOOLEAN },
              severity: { type: Type.STRING, enum: ['high', 'moderate', 'none'] },
              explanation: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            },
            required: ["hasConflict", "severity", "explanation", "recommendation"]
          }
        }
      });

      return JSON.parse(response.text || '{}') as InteractionResult;
    });
  }

  async findNearbyPharmacies(lat: number, lng: number): Promise<PharmacyLocation[]> {
    return this.withRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "List the 5 best nearby pharmacies and medical stores with their addresses.",
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: lat,
                longitude: lng
              }
            }
          }
        },
      });

      const locations: PharmacyLocation[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.maps) {
            locations.push({
              name: chunk.maps.title || "Pharmacy",
              address: "", 
              uri: chunk.maps.uri
            });
          }
        });
      }
      return locations;
    });
  }

  async generateSpeech(text: string, voiceName: string): Promise<string> {
    return this.withRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("SPEECH_GENERATION_FAILED");
      return base64Audio;
    });
  }
}

export async function playPcmAudio(base64Audio: string) {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

  const dataInt16 = new Int16Array(bytes.buffer);
  const numChannels = 1;
  const sampleRate = 24000;
  const frameCount = dataInt16.length / numChannels;
  const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
  return source;
}
