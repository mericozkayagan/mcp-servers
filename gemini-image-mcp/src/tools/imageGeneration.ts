import { GeminiClient, type ImageGenerationParams } from '../utils/geminiClient.js';
import {
  MAX_PROMPT_LENGTH,
  MIN_PROMPT_LENGTH,
  VALIDATE_OUTPUT_PATH,
  ALLOWED_OUTPUT_PATH_PATTERNS,
  isValidImageSize,
  isValidModality,
  ENABLE_DEBUG_LOGGING,
  LOG_SUCCESSFUL_GENERATIONS,
  type ImageSize,
  type ResponseModality
} from '../config.js';

/**
 * Validates a prompt string
 * @param prompt The prompt to validate
 * @throws Error if prompt is invalid
 */
function validatePrompt(prompt: string): void {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt must be a non-empty string');
  }

  const trimmedPrompt = prompt.trim();

  if (trimmedPrompt.length < MIN_PROMPT_LENGTH) {
    throw new Error(`Prompt must be at least ${MIN_PROMPT_LENGTH} characters long`);
  }

  if (MAX_PROMPT_LENGTH > 0 && trimmedPrompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt must not exceed ${MAX_PROMPT_LENGTH} characters`);
  }
}

/**
 * Validates an output path
 * @param path The path to validate
 * @throws Error if path is invalid or potentially dangerous
 */
function validateOutputPath(path: string): void {
  if (!VALIDATE_OUTPUT_PATH) {
    return;
  }

  // Check for directory traversal attempts
  if (path.includes('..')) {
    throw new Error('Output path cannot contain ".." (directory traversal not allowed)');
  }

  // Check against allowed patterns if configured
  if (ALLOWED_OUTPUT_PATH_PATTERNS && ALLOWED_OUTPUT_PATH_PATTERNS.length > 0) {
    const isAllowed = ALLOWED_OUTPUT_PATH_PATTERNS.some(pattern => pattern.test(path));

    if (!isAllowed) {
      throw new Error(
        'Output path does not match allowed patterns. ' +
        'Use relative paths like "./my-folder" or simple paths without ".."'
      );
    }
  }
}

/**
 * Validates an image size
 * @param size The size to validate
 * @throws Error if size is invalid
 */
function validateImageSize(size: string): asserts size is ImageSize {
  if (!isValidImageSize(size)) {
    throw new Error(
      `Invalid image size: ${size}. Must be one of: 256, 512, 1K, 2K, 4K`
    );
  }
}

/**
 * Validates response modalities
 * @param modalities The modalities to validate
 * @throws Error if any modality is invalid
 */
function validateModalities(modalities: string[]): asserts modalities is ResponseModality[] {
  if (!Array.isArray(modalities)) {
    throw new Error('Response modalities must be an array');
  }

  if (modalities.length === 0) {
    throw new Error('At least one response modality must be specified');
  }

  for (const modality of modalities) {
    if (!isValidModality(modality)) {
      throw new Error(
        `Invalid response modality: ${modality}. Must be one of: IMAGE, TEXT`
      );
    }
  }
}

/**
 * Parameters for the generate image tool
 */
export interface GenerateImageToolParams {
  prompt: string;
  outputPath?: string;
  fileName?: string;
  imageSize?: string;
  responseModalities?: string[];
}

/**
 * Generate an image based on a text prompt
 *
 * This is the main tool function that will be exposed through the MCP server.
 * It validates inputs, calls the Gemini client, and returns formatted results.
 *
 * @param params Image generation parameters
 * @returns Generation result with file information
 */
export async function generateImage(params: GenerateImageToolParams) {
  const {
    prompt,
    outputPath,
    fileName,
    imageSize,
    responseModalities
  } = params;

  if (ENABLE_DEBUG_LOGGING) {
    console.log('generateImage tool called with params:', {
      prompt: prompt?.substring(0, 50) + '...',
      outputPath,
      fileName,
      imageSize,
      responseModalities
    });
  }

  try {
    // Validate prompt
    validatePrompt(prompt);

    // Validate output path if provided
    if (outputPath) {
      validateOutputPath(outputPath);
    }

    // Validate image size if provided
    if (imageSize) {
      validateImageSize(imageSize);
    }

    // Validate response modalities if provided
    if (responseModalities) {
      validateModalities(responseModalities);
    }

    // Create Gemini client
    const client = new GeminiClient();

    // Prepare parameters
    const generationParams: ImageGenerationParams = {
      prompt,
      outputPath,
      fileName,
      imageSize: imageSize as ImageSize | undefined,
      responseModalities: responseModalities as ResponseModality[] | undefined
    };

    // Generate image
    const result = await client.generateImage(generationParams);

    if (LOG_SUCCESSFUL_GENERATIONS) {
      console.log(`Successfully generated ${result.files.length} image(s) for prompt: "${prompt.substring(0, 50)}..."`);
    }

    // Format result for MCP response
    return {
      success: result.success,
      message: `Successfully generated ${result.files.length} image(s)`,
      files: result.files.map(file => ({
        path: file.path,
        fileName: file.fileName,
        mimeType: file.mimeType,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        extension: file.extension
      })),
      textResponse: result.textResponse,
      prompt: result.prompt
    };

  } catch (error) {
    console.error('Error in generateImage tool:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Failed to generate image',
      details: ENABLE_DEBUG_LOGGING ? {
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error
      } : undefined
    };
  }
}

/**
 * Format file size in human-readable format
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Get tool information for MCP server registration
 * This provides metadata about the tool for the MCP protocol
 */
export function getToolInfo() {
  return {
    name: 'generate_image',
    description: 'Generate an image using Google Gemini 2.5 Flash Image generation model. ' +
                 'Provide a text prompt describing the image you want to create, and optionally ' +
                 'specify output location, file name, image size, and response modalities.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Text description of the image to generate (required)',
        },
        outputPath: {
          type: 'string',
          description: 'Directory path where the image should be saved (optional, defaults to ./generated-images)',
        },
        fileName: {
          type: 'string',
          description: 'Custom file name for the generated image (optional, auto-generated if not provided)',
        },
        imageSize: {
          type: 'string',
          enum: ['256', '512', '1K', '2K', '4K'],
          description: 'Size of the generated image (optional, defaults to 1K)',
        },
        responseModalities: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['IMAGE', 'TEXT']
          },
          description: 'Response modalities - IMAGE returns the generated image, TEXT returns AI explanation (optional, defaults to both)',
        }
      },
      required: ['prompt']
    }
  };
}

