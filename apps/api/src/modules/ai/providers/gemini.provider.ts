import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Schema } from '@google/generative-ai';

@Injectable()
export class GeminiProvider {
  private defaultModel: string;
  private groqModel: string;

  constructor(private configService: ConfigService) {
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    const groqApiKey = this.configService.get<string>('GROQ_API_KEY');
    if ((!geminiApiKey || geminiApiKey === 'your_gemini_api_key') && !groqApiKey) {
      console.warn('⚠️ WARNING: No AI provider key is configured. Set GEMINI_API_KEY or GROQ_API_KEY in the root .env file.');
    }
    this.defaultModel = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';
    this.groqModel = this.configService.get<string>('GROQ_MODEL') || 'llama-3.1-8b-instant';
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
    const activeKey = this.resolveApiKey(apiKeyOverride);
    if (!activeKey) {
      throw new InternalServerErrorException(
        'AI provider key is not configured. Please supply a Gemini or Groq API key in Settings or your root .env file.',
      );
    }

    if (this.isGroqKey(activeKey)) {
      return this.executeGroqJsonGeneration(activeKey, systemInstruction, prompt);
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
    const activeKey = this.resolveApiKey(apiKeyOverride);
    if (!activeKey) {
      throw new InternalServerErrorException(
        'AI provider key is not configured. Please supply a Gemini or Groq API key in Settings or your root .env file.',
      );
    }

    if (this.isGroqKey(activeKey)) {
      return this.executeGroqTextGeneration(activeKey, systemInstruction, prompt);
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

  private resolveApiKey(apiKeyOverride?: string): string | null {
    const candidate =
      apiKeyOverride ||
      this.configService.get<string>('GROQ_API_KEY') ||
      this.configService.get<string>('GEMINI_API_KEY') ||
      '';

    if (!candidate || candidate.trim() === '' || candidate === 'your_gemini_api_key') {
      return null;
    }

    return candidate.trim();
  }

  private isGroqKey(apiKey: string): boolean {
    return apiKey.startsWith('gsk_');
  }

  private async executeGroqJsonGeneration(
    apiKey: string,
    systemInstruction: string,
    prompt: string,
  ): Promise<any> {
    const text = await this.executeGroqRequest(apiKey, systemInstruction, prompt, true);

    try {
      return JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new InternalServerErrorException('Groq did not return valid JSON for the structured assistant step.');
      }
      return JSON.parse(jsonMatch[0]);
    }
  }

  private async executeGroqTextGeneration(
    apiKey: string,
    systemInstruction: string,
    prompt: string,
  ): Promise<string> {
    return this.executeGroqRequest(apiKey, systemInstruction, prompt, false);
  }

  private async executeGroqRequest(
    apiKey: string,
    systemInstruction: string,
    prompt: string,
    requireJson: boolean,
  ): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.groqModel,
        temperature: 0.2,
        response_format: requireJson ? { type: 'json_object' } : undefined,
        messages: [
          { role: 'system', content: systemInstruction },
          {
            role: 'user',
            content: requireJson
              ? `${prompt}\n\nReturn valid JSON only with no markdown fences.`
              : prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(`Groq request failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new InternalServerErrorException('Groq returned an empty response.');
    }

    return content;
  }
}
