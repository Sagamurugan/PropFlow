import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Schema } from '@google/generative-ai';

@Injectable()
export class GeminiProvider {
  private defaultModel: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      console.warn('⚠️ WARNING: GEMINI_API_KEY is not configured or using default placeholder.');
    }
    this.defaultModel = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';
  }

  /**
   * Generates structured JSON output using Gemini structured schemas.
   */
  async generateJson(
    systemInstruction: string,
    prompt: string,
    responseSchema?: Schema,
    apiKeyOverride?: string,
  ): Promise<any> {
    const activeKey = apiKeyOverride || this.configService.get<string>('GEMINI_API_KEY');
    if (!activeKey || activeKey === 'your_gemini_api_key' || activeKey.trim() === '') {
      throw new InternalServerErrorException(
        'Gemini API key is not configured. Please supply it in Settings or your root .env file.',
      );
    }

    const selectedModel = this.defaultModel;
    try {
      return await this.executeJsonGeneration(selectedModel, activeKey, systemInstruction, prompt, responseSchema);
    } catch (err: any) {
      const errStr = err.message || '';
      if ((errStr.includes('429') || errStr.toLowerCase().includes('quota') || errStr.toLowerCase().includes('limit')) && selectedModel !== 'gemini-2.5-flash') {
        console.warn(`⚠️ Quota exceeded on model ${selectedModel}. Attempting automatic resilient fallback to gemini-2.5-flash...`);
        try {
          return await this.executeJsonGeneration('gemini-2.5-flash', activeKey, systemInstruction, prompt, responseSchema);
        } catch (fallbackErr: any) {
          console.error('Gemini fallback JSON generation failed:', fallbackErr);
          throw new InternalServerErrorException(fallbackErr.message || 'AI structured generation failed');
        }
      }
      console.error('Prisma/Gemini JSON generation failed:', err);
      throw new InternalServerErrorException(err.message || 'AI structured generation failed');
    }
  }

  private async executeJsonGeneration(
    modelName: string,
    apiKey: string,
    systemInstruction: string,
    prompt: string,
    responseSchema?: Schema,
  ): Promise<any> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
    });

    const generationConfig: any = {
      responseMimeType: 'application/json',
    };

    if (responseSchema) {
      generationConfig.responseSchema = responseSchema;
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const text = result.response.text();
    return JSON.parse(text);
  }

  /**
   * Generates standard natural language text response.
   */
  async generateText(
    systemInstruction: string,
    prompt: string,
    apiKeyOverride?: string,
  ): Promise<string> {
    const activeKey = apiKeyOverride || this.configService.get<string>('GEMINI_API_KEY');
    if (!activeKey || activeKey === 'your_gemini_api_key' || activeKey.trim() === '') {
      throw new InternalServerErrorException(
        'Gemini API key is not configured. Please supply it in Settings or your root .env file.',
      );
    }

    const selectedModel = this.defaultModel;
    try {
      return await this.executeTextGeneration(selectedModel, activeKey, systemInstruction, prompt);
    } catch (err: any) {
      const errStr = err.message || '';
      if ((errStr.includes('429') || errStr.toLowerCase().includes('quota') || errStr.toLowerCase().includes('limit')) && selectedModel !== 'gemini-2.5-flash') {
        console.warn(`⚠️ Quota exceeded on model ${selectedModel}. Attempting automatic resilient fallback to gemini-2.5-flash...`);
        try {
          return await this.executeTextGeneration('gemini-2.5-flash', activeKey, systemInstruction, prompt);
        } catch (fallbackErr: any) {
          console.error('Gemini fallback Text generation failed:', fallbackErr);
          throw new InternalServerErrorException(fallbackErr.message || 'AI completions failed');
        }
      }
      console.error('Gemini Text generation failed:', err);
      throw new InternalServerErrorException(err.message || 'AI completions failed');
    }
  }

  private async executeTextGeneration(
    modelName: string,
    apiKey: string,
    systemInstruction: string,
    prompt: string,
  ): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return result.response.text();
  }
}
