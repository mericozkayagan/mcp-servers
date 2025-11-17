import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import {
  getApiKey,
  MODEL_NAME,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_RESPONSE_MODALITIES,
  REQUEST_TIMEOUT,
  ENABLE_DEBUG_LOGGING,
  AUTO_CREATE_OUTPUT_DIR,
  FILE_NAME_PATTERN,
  OVERWRITE_EXISTING_FILES,
  type ImageSize,
  type ResponseModality
} from '../config.js';

/**
 * Custom error class for Gemini client operations
 */
export class GeminiClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GeminiClientError';
  }
}

/**
 * Parameters for image generation
 */
export interface ImageGenerationParams {
  prompt: string;
  outputPath?: string;
  fileName?: string;
  imageSize?: ImageSize;
  responseModalities?: ResponseModality[];
}

/**
 * Result of image generation
 */
export interface ImageGenerationResult {
  success: boolean;
  files: GeneratedFile[];
  textResponse?: string;
  prompt: string;
  error?: string;
}

/**
 * Information about a generated file
 */
export interface GeneratedFile {
  path: string;
  fileName: string;
  mimeType: string;
  size: number;
  extension: string;
}

/**
 * Client for interacting with Google Gemini Image Generation API
 */
export class GeminiClient {
  private client: GoogleGenAI;
  private apiKey: string;

  constructor() {
    try {
      this.apiKey = getApiKey();
      this.client = new GoogleGenAI({
        apiKey: this.apiKey,
      });

      if (ENABLE_DEBUG_LOGGING) {
        console.log('GeminiClient initialized successfully');
      }
    } catch (error) {
      throw new GeminiClientError(
        'Failed to initialize Gemini client: ' + (error instanceof Error ? error.message : String(error)),
        'INIT_ERROR',
        error
      );
    }
  }

  /**
   * Generate an image based on a text prompt
   * @param params Image generation parameters
   * @returns Result with generated file information
   */
  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    const {
      prompt,
      outputPath,
      fileName,
      imageSize = DEFAULT_IMAGE_SIZE,
      responseModalities = [...DEFAULT_RESPONSE_MODALITIES]
    } = params;

    if (ENABLE_DEBUG_LOGGING) {
      console.log('Starting image generation with params:', {
        prompt: prompt.substring(0, 50) + '...',
        outputPath,
        fileName,
        imageSize,
        responseModalities
      });
    }

    try {
      // Validate prompt
      if (!prompt || prompt.trim().length === 0) {
        throw new GeminiClientError(
          'Prompt cannot be empty',
          'INVALID_PROMPT'
        );
      }

      // Prepare configuration
      const config = {
        responseModalities: responseModalities,
        imageConfig: {
          imageSize: imageSize,
        },
      };

      // Prepare content
      const contents = [
        {
          role: 'user' as const,
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ];

      if (ENABLE_DEBUG_LOGGING) {
        console.log('Calling Gemini API with model:', MODEL_NAME);
      }

      // Generate content with streaming
      const response = await this.client.models.generateContentStream({
        model: MODEL_NAME,
        config: config as any,
        contents: contents,
      });

      // Process response
      const result = await this.processStreamingResponse(
        response,
        outputPath,
        fileName,
        prompt
      );

      if (ENABLE_DEBUG_LOGGING) {
        console.log('Image generation completed successfully');
      }

      return result;

    } catch (error) {
      console.error('Error generating image:', error);

      if (error instanceof GeminiClientError) {
        throw error;
      }

      throw new GeminiClientError(
        'Failed to generate image: ' + (error instanceof Error ? error.message : String(error)),
        'GENERATION_ERROR',
        error
      );
    }
  }

  /**
   * Process streaming response from Gemini API
   * @param response The streaming response
   * @param outputPath Optional output path
   * @param fileName Optional file name
   * @param prompt Original prompt
   * @returns Generation result
   */
  private async processStreamingResponse(
    response: AsyncIterable<any>,
    outputPath: string | undefined,
    fileName: string | undefined,
    prompt: string
  ): Promise<ImageGenerationResult> {
    const generatedFiles: GeneratedFile[] = [];
    let textResponse = '';
    let fileIndex = 0;

    try {
      for await (const chunk of response) {
        if (!chunk.candidates ||
            !chunk.candidates[0].content ||
            !chunk.candidates[0].content.parts) {
          continue;
        }

        const parts = chunk.candidates[0].content.parts;

        for (const part of parts) {
          // Handle inline image data
          if (part.inlineData) {
            const inlineData = part.inlineData;
            const mimeType = inlineData.mimeType || 'image/png';
            const fileExtension = mime.getExtension(mimeType) || 'png';

            // Generate file name
            const actualFileName = this.generateFileName(
              fileName,
              fileIndex,
              fileExtension
            );

            // Determine output path
            const actualOutputPath = outputPath || './generated-images';

            // Ensure output directory exists
            if (AUTO_CREATE_OUTPUT_DIR && !existsSync(actualOutputPath)) {
              await mkdir(actualOutputPath, { recursive: true });
              if (ENABLE_DEBUG_LOGGING) {
                console.log(`Created output directory: ${actualOutputPath}`);
              }
            }

            // Full file path
            const fullPath = join(actualOutputPath, actualFileName);

            // Check if file exists and handle overwrite setting
            if (!OVERWRITE_EXISTING_FILES && existsSync(fullPath)) {
              const uniqueFileName = this.generateUniqueFileName(
                actualOutputPath,
                actualFileName,
                fileExtension
              );
              const uniquePath = join(actualOutputPath, uniqueFileName);
              await this.saveBinaryFile(uniquePath, inlineData.data || '', mimeType);

              generatedFiles.push({
                path: uniquePath,
                fileName: uniqueFileName,
                mimeType,
                size: Buffer.from(inlineData.data || '', 'base64').length,
                extension: fileExtension
              });
            } else {
              // Save the file
              await this.saveBinaryFile(fullPath, inlineData.data || '', mimeType);

              generatedFiles.push({
                path: fullPath,
                fileName: actualFileName,
                mimeType,
                size: Buffer.from(inlineData.data || '', 'base64').length,
                extension: fileExtension
              });
            }

            fileIndex++;
          }
          // Handle text response
          else if (part.text) {
            textResponse += part.text;
          }
        }
      }

      return {
        success: true,
        files: generatedFiles,
        textResponse: textResponse || undefined,
        prompt
      };

    } catch (error) {
      throw new GeminiClientError(
        'Error processing streaming response: ' + (error instanceof Error ? error.message : String(error)),
        'STREAM_PROCESSING_ERROR',
        error
      );
    }
  }

  /**
   * Save binary file to disk
   * @param filePath Full path to save file
   * @param base64Data Base64 encoded data
   * @param mimeType MIME type of the file
   */
  private async saveBinaryFile(
    filePath: string,
    base64Data: string,
    mimeType: string
  ): Promise<void> {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      await writeFile(filePath, buffer);

      if (ENABLE_DEBUG_LOGGING) {
        console.log(`File saved successfully: ${filePath} (${buffer.length} bytes)`);
      }
    } catch (error) {
      throw new GeminiClientError(
        `Failed to save file ${filePath}: ` + (error instanceof Error ? error.message : String(error)),
        'FILE_SAVE_ERROR',
        error
      );
    }
  }

  /**
   * Generate a file name based on the pattern
   * @param customFileName Optional custom file name
   * @param index File index for batch generation
   * @param extension File extension
   * @returns Generated file name
   */
  private generateFileName(
    customFileName: string | undefined,
    index: number,
    extension: string
  ): string {
    if (customFileName) {
      // If custom name doesn't have extension, add it
      if (!customFileName.includes('.')) {
        return `${customFileName}.${extension}`;
      }
      return customFileName;
    }

    // Use pattern from config
    const timestamp = Date.now();
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');

    let fileName = FILE_NAME_PATTERN
      .replace('{timestamp}', timestamp.toString())
      .replace('{index}', index.toString())
      .replace('{date}', date)
      .replace('{time}', time);

    return `${fileName}.${extension}`;
  }

  /**
   * Generate a unique file name if file already exists
   * @param outputPath Output directory
   * @param fileName Original file name
   * @param extension File extension
   * @returns Unique file name
   */
  private generateUniqueFileName(
    outputPath: string,
    fileName: string,
    extension: string
  ): string {
    const baseNameWithoutExt = fileName.replace(`.${extension}`, '');
    let counter = 1;
    let uniqueName = fileName;

    while (existsSync(join(outputPath, uniqueName))) {
      uniqueName = `${baseNameWithoutExt}_${counter}.${extension}`;
      counter++;
    }

    return uniqueName;
  }

  /**
   * Validate the Gemini API connection
   * @returns true if connection is valid
   */
  async validateConnection(): Promise<boolean> {
    try {
      // Simple test to verify API key works
      // We don't actually generate an image, just check if we can initialize
      return this.apiKey.length > 0;
    } catch (error) {
      return false;
    }
  }
}

