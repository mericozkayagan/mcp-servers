/**
 * Centralized Configuration for Gemini Image MCP Server
 *
 * All configurable parameters are defined here for easy customization.
 * Modify these values to adjust the behavior of the image generation system.
 */

// ===== IMAGE GENERATION CONFIGURATION =====

/**
 * Available image sizes for generation
 * Supported values: '256', '512', '1K', '2K', '4K'
 */
export const AVAILABLE_IMAGE_SIZES = ['256', '512', '1K', '2K', '4K'] as const;
export type ImageSize = typeof AVAILABLE_IMAGE_SIZES[number];

/**
 * Default image size when not specified in request
 * Must be one of the AVAILABLE_IMAGE_SIZES
 */
export const DEFAULT_IMAGE_SIZE: ImageSize = '1K';

// ===== OUTPUT CONFIGURATION =====

/**
 * Default directory for saving generated images
 * Can be overridden per request
 */
export const DEFAULT_OUTPUT_DIR = './generated-images';

/**
 * File naming pattern for generated images
 * Available placeholders:
 * - {timestamp}: Unix timestamp
 * - {index}: Sequential index for batch generation
 * - {date}: ISO date string (YYYY-MM-DD)
 * - {time}: Time string (HH-MM-SS)
 */
export const FILE_NAME_PATTERN = 'gemini_image_{timestamp}_{index}';

/**
 * Whether to create output directory if it doesn't exist
 */
export const AUTO_CREATE_OUTPUT_DIR = true;

// ===== MODEL CONFIGURATION =====

/**
 * Google Gemini model name for image generation
 * Change this if Google releases new image generation models
 */
export const MODEL_NAME = 'gemini-2.5-flash-image';

/**
 * Default response modalities
 * Options: 'IMAGE', 'TEXT'
 * - IMAGE: Returns generated images
 * - TEXT: Returns text description/explanation from the AI
 */
export const DEFAULT_RESPONSE_MODALITIES = ['IMAGE', 'TEXT'] as const;

/**
 * Available response modalities
 */
export const AVAILABLE_MODALITIES = ['IMAGE', 'TEXT'] as const;
export type ResponseModality = typeof AVAILABLE_MODALITIES[number];

// ===== API CONFIGURATION =====

/**
 * Environment variable name for Gemini API key
 */
export const API_KEY_ENV_VAR = 'GEMINI_API_KEY';

/**
 * Request timeout in milliseconds
 * Set to 0 for no timeout
 */
export const REQUEST_TIMEOUT = 60000; // 60 seconds

/**
 * Maximum number of concurrent image generation requests
 * Set to 0 for unlimited
 */
export const MAX_CONCURRENT_REQUESTS = 3;

// ===== STREAMING CONFIGURATION =====

/**
 * Enable streaming for image generation
 * When true, processes chunks as they arrive
 */
export const ENABLE_STREAMING = true;

/**
 * Buffer size for streaming (in bytes)
 * Larger buffer = better performance but more memory usage
 */
export const STREAM_BUFFER_SIZE = 64 * 1024; // 64KB

// ===== FILE HANDLING CONFIGURATION =====

/**
 * Supported MIME types for image output
 */
export const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp'
] as const;

/**
 * Default file encoding for saving images
 */
export const FILE_ENCODING = 'binary' as const;

/**
 * Whether to overwrite existing files with the same name
 * If false, will append a suffix to avoid overwriting
 */
export const OVERWRITE_EXISTING_FILES = false;

// ===== LOGGING CONFIGURATION =====

/**
 * Enable detailed logging
 */
export const ENABLE_DEBUG_LOGGING = false;

/**
 * Log successful image generations
 */
export const LOG_SUCCESSFUL_GENERATIONS = true;

/**
 * Log errors with full stack trace
 */
export const LOG_ERROR_STACK_TRACES = true;

// ===== VALIDATION CONFIGURATION =====

/**
 * Maximum prompt length in characters
 * Set to 0 for no limit
 */
export const MAX_PROMPT_LENGTH = 2000;

/**
 * Minimum prompt length in characters
 */
export const MIN_PROMPT_LENGTH = 1;

/**
 * Validate output path to prevent directory traversal attacks
 */
export const VALIDATE_OUTPUT_PATH = true;

/**
 * Allowed output path patterns (regex)
 * Only paths matching these patterns will be allowed
 * Set to null to disable pattern matching
 */
export const ALLOWED_OUTPUT_PATH_PATTERNS: RegExp[] | null = [
  /^\.\/[\w\-\/]+$/,  // Relative paths starting with ./
  /^[\w\-\/]+$/,       // Simple paths without ../
];

// ===== BATCH GENERATION CONFIGURATION =====

/**
 * Maximum number of images that can be generated in a single batch
 * Set to 1 to disable batch generation
 */
export const MAX_BATCH_SIZE = 1;

/**
 * Delay between batch requests in milliseconds
 * Helps prevent rate limiting
 */
export const BATCH_REQUEST_DELAY = 1000;

// ===== DEFAULT CONFIGURATION OBJECT =====

/**
 * Complete default configuration
 * This object aggregates all configuration values for easy export
 */
export const DEFAULT_CONFIG = {
  // Image generation
  imageSizes: AVAILABLE_IMAGE_SIZES,
  defaultImageSize: DEFAULT_IMAGE_SIZE,

  // Output
  defaultOutputDir: DEFAULT_OUTPUT_DIR,
  fileNamePattern: FILE_NAME_PATTERN,
  autoCreateOutputDir: AUTO_CREATE_OUTPUT_DIR,
  overwriteExistingFiles: OVERWRITE_EXISTING_FILES,

  // Model
  modelName: MODEL_NAME,
  defaultModalities: DEFAULT_RESPONSE_MODALITIES,
  availableModalities: AVAILABLE_MODALITIES,

  // API
  apiKeyEnvVar: API_KEY_ENV_VAR,
  requestTimeout: REQUEST_TIMEOUT,
  maxConcurrentRequests: MAX_CONCURRENT_REQUESTS,

  // Streaming
  enableStreaming: ENABLE_STREAMING,
  streamBufferSize: STREAM_BUFFER_SIZE,

  // File handling
  supportedMimeTypes: SUPPORTED_MIME_TYPES,
  fileEncoding: FILE_ENCODING,

  // Logging
  enableDebugLogging: ENABLE_DEBUG_LOGGING,
  logSuccessfulGenerations: LOG_SUCCESSFUL_GENERATIONS,
  logErrorStackTraces: LOG_ERROR_STACK_TRACES,

  // Validation
  maxPromptLength: MAX_PROMPT_LENGTH,
  minPromptLength: MIN_PROMPT_LENGTH,
  validateOutputPath: VALIDATE_OUTPUT_PATH,
  allowedOutputPathPatterns: ALLOWED_OUTPUT_PATH_PATTERNS,

  // Batch
  maxBatchSize: MAX_BATCH_SIZE,
  batchRequestDelay: BATCH_REQUEST_DELAY,
} as const;

// ===== ENVIRONMENT VALIDATION =====

/**
 * Validates that required environment variables are set
 * @throws Error if validation fails
 */
export function validateEnvironment(): void {
  const apiKey = process.env[API_KEY_ENV_VAR];

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${API_KEY_ENV_VAR}. ` +
      'Please set your Google Gemini API key in the environment.'
    );
  }

  if (ENABLE_DEBUG_LOGGING) {
    console.log('Environment validation passed');
    console.log(`API Key found: ${apiKey.substring(0, 10)}...`);
  }
}

/**
 * Gets the API key from environment
 * @returns The API key
 * @throws Error if API key is not set
 */
export function getApiKey(): string {
  const apiKey = process.env[API_KEY_ENV_VAR];

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${API_KEY_ENV_VAR}`
    );
  }

  return apiKey;
}

/**
 * Validates an image size value
 * @param size The size to validate
 * @returns true if valid
 */
export function isValidImageSize(size: string): size is ImageSize {
  return AVAILABLE_IMAGE_SIZES.includes(size as ImageSize);
}

/**
 * Validates a response modality
 * @param modality The modality to validate
 * @returns true if valid
 */
export function isValidModality(modality: string): modality is ResponseModality {
  return AVAILABLE_MODALITIES.includes(modality as ResponseModality);
}

