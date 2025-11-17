# Technical Documentation - Gemini Image MCP Server

This document provides technical specifications, architecture details, and implementation information for the Gemini Image MCP Server.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Module Specifications](#module-specifications)
- [API Integration](#api-integration)
- [Data Flow](#data-flow)
- [Error Handling](#error-handling)
- [Security Implementation](#security-implementation)
- [Performance Considerations](#performance-considerations)

## Architecture Overview

The Gemini Image MCP Server follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│           Cursor AI / MCP Client                │
└────────────────────┬────────────────────────────┘
                     │ MCP Protocol (stdio)
                     │
┌────────────────────▼────────────────────────────┐
│           MCP Server (index.ts)                 │
│  ┌──────────────────────────────────────────┐  │
│  │   Tool Registration & Request Handling   │  │
│  └──────────────┬───────────────────────────┘  │
└─────────────────┼──────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────┐
│      Image Generation Tool                      │
│      (tools/imageGeneration.ts)                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Parameter Validation                    │  │
│  │  Input Sanitization                      │  │
│  │  Response Formatting                     │  │
│  └──────────────┬───────────────────────────┘  │
└─────────────────┼──────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────┐
│         Gemini Client                           │
│         (utils/geminiClient.ts)                 │
│  ┌──────────────────────────────────────────┐  │
│  │  API Communication                       │  │
│  │  Stream Processing                       │  │
│  │  File Operations                         │  │
│  └──────────────┬───────────────────────────┘  │
└─────────────────┼──────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────┐
│         Google Gemini API                       │
│         (gemini-2.5-flash-image)                │
└─────────────────────────────────────────────────┘
```

### Key Components

1. **MCP Server Layer** (`index.ts`)
   - Handles MCP protocol communication
   - Registers tools and schemas
   - Routes requests to appropriate handlers
   - Manages server lifecycle

2. **Tool Layer** (`tools/imageGeneration.ts`)
   - Implements business logic
   - Validates and sanitizes inputs
   - Formats responses for MCP protocol
   - Error handling and reporting

3. **Client Layer** (`utils/geminiClient.ts`)
   - Interfaces with Gemini API
   - Handles streaming responses
   - Manages file I/O operations
   - Implements retry logic and error handling

4. **Configuration Layer** (`config.ts`)
   - Centralizes all configurable parameters
   - Environment variable management
   - Validation functions
   - Type definitions

## Technology Stack

### Core Technologies

- **TypeScript 5.3+**: Type-safe development
- **Node.js 18+**: Runtime environment
- **MCP SDK**: Model Context Protocol implementation
- **Google GenAI SDK**: Gemini API client library

### Dependencies

#### Production Dependencies

```json
{
  "@modelcontextprotocol/sdk": "latest",
  "@google/genai": "latest",
  "mime": "^4.0.1",
  "zod": "^3.22.4"
}
```

- **@modelcontextprotocol/sdk**: MCP server implementation
- **@google/genai**: Google's Gemini API client
- **mime**: MIME type detection and handling
- **zod**: Runtime type validation and schema definition

#### Development Dependencies

```json
{
  "@types/node": "^20.10.0",
  "typescript": "^5.3.2"
}
```

## Module Specifications

### config.ts

**Purpose:** Centralized configuration management

**Exports:**
- Configuration constants
- Type definitions
- Validation functions
- Environment helpers

**Key Functions:**

```typescript
validateEnvironment(): void
// Validates required environment variables on startup

getApiKey(): string
// Retrieves and validates API key from environment

isValidImageSize(size: string): boolean
// Type guard for image size validation

isValidModality(modality: string): boolean
// Type guard for response modality validation
```

**Configuration Categories:**
- Image generation settings
- Output configuration
- Model configuration
- API configuration
- Streaming configuration
- File handling configuration
- Logging configuration
- Validation configuration
- Batch generation configuration

### utils/geminiClient.ts

**Purpose:** Google Gemini API client wrapper

**Classes:**

#### GeminiClientError

Custom error class for Gemini operations.

```typescript
class GeminiClientError extends Error {
  constructor(
    message: string,
    code?: string,
    details?: any
  )
}
```

#### GeminiClient

Main client for API interactions.

```typescript
class GeminiClient {
  constructor()

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult>

  async validateConnection(): Promise<boolean>

  private async processStreamingResponse(...)

  private async saveBinaryFile(...)

  private generateFileName(...)

  private generateUniqueFileName(...)
}
```

**Interfaces:**

```typescript
interface ImageGenerationParams {
  prompt: string;
  outputPath?: string;
  fileName?: string;
  imageSize?: ImageSize;
  responseModalities?: ResponseModality[];
}

interface ImageGenerationResult {
  success: boolean;
  files: GeneratedFile[];
  textResponse?: string;
  prompt: string;
  error?: string;
}

interface GeneratedFile {
  path: string;
  fileName: string;
  mimeType: string;
  size: number;
  extension: string;
}
```

### tools/imageGeneration.ts

**Purpose:** MCP tool implementation for image generation

**Functions:**

```typescript
async function generateImage(params: GenerateImageToolParams)
// Main tool function called by MCP server

function validatePrompt(prompt: string): void
// Validates prompt string

function validateOutputPath(path: string): void
// Validates and sanitizes output paths

function validateImageSize(size: string): void
// Validates image size parameter

function validateModalities(modalities: string[]): void
// Validates response modality array

function formatFileSize(bytes: number): string
// Formats byte size to human-readable format

function getToolInfo()
// Returns tool metadata for MCP registration
```

### index.ts

**Purpose:** MCP server entry point

**Responsibilities:**
- Environment validation
- Server initialization
- Tool registration with Zod schemas
- Request routing
- Error handling
- Signal handling (SIGINT, SIGTERM)
- Process cleanup

**Server Configuration:**

```typescript
const server = new McpServer({
  name: "gemini-image-mcp",
  version: "0.1.0"
});
```

**Tool Registration:**

Uses Zod for runtime validation:

```typescript
server.tool(
  'generate_image',
  {
    prompt: z.string(),
    outputPath: z.string().optional(),
    fileName: z.string().optional(),
    imageSize: z.enum(['256', '512', '1K', '2K', '4K']).optional(),
    responseModalities: z.array(z.enum(['IMAGE', 'TEXT'])).optional()
  },
  async (params) => { ... }
);
```

## API Integration

### Google Gemini API

**Endpoint:** Via `@google/genai` SDK

**Authentication:** API Key (Bearer token)

**Model:** `gemini-2.5-flash-image`

### Request Structure

```typescript
{
  model: 'gemini-2.5-flash-image',
  config: {
    responseModalities: ['IMAGE', 'TEXT'],
    imageConfig: {
      imageSize: '1K'
    }
  },
  contents: [
    {
      role: 'user',
      parts: [{ text: 'prompt text here' }]
    }
  ]
}
```

### Response Handling

The API returns a streaming response with chunks containing:

1. **Image Data Chunks:**
```typescript
{
  candidates: [{
    content: {
      parts: [{
        inlineData: {
          mimeType: 'image/png',
          data: 'base64_encoded_data'
        }
      }]
    }
  }]
}
```

2. **Text Response Chunks:**
```typescript
{
  candidates: [{
    content: {
      parts: [{
        text: 'description text'
      }]
    }
  }]
}
```

### Streaming Implementation

```typescript
const response = await client.models.generateContentStream({
  model: MODEL_NAME,
  config: config,
  contents: contents,
});

for await (const chunk of response) {
  // Process each chunk
  if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
    // Handle image data
  } else if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
    // Handle text data
  }
}
```

## Data Flow

### Image Generation Flow

1. **Request Reception**
   - MCP client sends request via stdio
   - Server receives and parses MCP message
   - Extracts tool name and parameters

2. **Validation Phase**
   - Validate prompt (length, content)
   - Validate output path (security checks)
   - Validate image size (enum check)
   - Validate modalities (array validation)

3. **Client Initialization**
   - Create GeminiClient instance
   - Validate API key presence
   - Initialize API client

4. **API Request**
   - Prepare request parameters
   - Configure image generation settings
   - Initiate streaming request to Gemini API

5. **Stream Processing**
   - Iterate through response chunks
   - Extract image data (base64)
   - Extract text responses
   - Accumulate data

6. **File Operations**
   - Ensure output directory exists
   - Generate filename (custom or pattern-based)
   - Check for existing files
   - Decode base64 to binary
   - Write file to disk

7. **Response Formation**
   - Gather file metadata
   - Format success/error messages
   - Include text responses
   - Create MCP response structure

8. **Response Transmission**
   - Format for MCP protocol
   - Send via stdio transport
   - Log results

## Error Handling

### Error Categories

1. **Configuration Errors**
   - Missing API key
   - Invalid configuration values
   - Environment issues

2. **Validation Errors**
   - Invalid prompt
   - Invalid parameters
   - Security violations (path traversal)

3. **API Errors**
   - Authentication failures
   - Rate limiting
   - Network issues
   - Invalid requests

4. **File System Errors**
   - Permission denied
   - Disk full
   - Invalid paths

5. **Processing Errors**
   - Stream processing failures
   - Data corruption
   - Unexpected response format

### Error Handling Strategy

```typescript
try {
  // Operation
} catch (error) {
  // Log error
  console.error('Operation failed:', error);

  // Create user-friendly error message
  const message = error instanceof Error
    ? error.message
    : String(error);

  // Return structured error response
  return {
    success: false,
    error: message,
    details: DEBUG ? { stack: error.stack } : undefined
  };
}
```

### Custom Error Classes

```typescript
class GeminiClientError extends Error {
  name: 'GeminiClientError'
  code?: string       // Error code for categorization
  details?: any       // Additional error context
}
```

## Security Implementation

### API Key Security

- **Environment Variables**: API key stored in environment, never in code
- **Key Validation**: Checked on startup and before requests
- **Key Masking**: Partial key shown in debug logs (first 10 chars)

### Path Validation

```typescript
function validateOutputPath(path: string): void {
  // Prevent directory traversal
  if (path.includes('..')) {
    throw new Error('Directory traversal not allowed');
  }

  // Pattern matching
  if (ALLOWED_OUTPUT_PATH_PATTERNS) {
    const isAllowed = ALLOWED_OUTPUT_PATH_PATTERNS.some(
      pattern => pattern.test(path)
    );
    if (!isAllowed) {
      throw new Error('Path does not match allowed patterns');
    }
  }
}
```

### Input Sanitization

- **Prompt Validation**: Length limits, type checking
- **Parameter Validation**: Type guards and schema validation
- **File Name Sanitization**: Extension validation, special character handling

### File Operations Security

- **Overwrite Protection**: Optional prevention of file overwrites
- **Permission Checks**: Validate write permissions before operations
- **Atomic Writes**: Use proper file writing methods

## Performance Considerations

### Streaming Benefits

- **Memory Efficiency**: Process chunks as they arrive
- **Reduced Latency**: Start processing before complete response
- **Better User Experience**: Faster perceived performance

### Configuration Impact

```typescript
// Smaller images = faster generation
DEFAULT_IMAGE_SIZE = '512'  // Fast
DEFAULT_IMAGE_SIZE = '4K'   // Slower, higher quality

// Request timeout affects user experience
REQUEST_TIMEOUT = 30000     // Faster failure
REQUEST_TIMEOUT = 120000    // More patience for slow requests

// Concurrent requests
MAX_CONCURRENT_REQUESTS = 1  // Sequential (slower, safer)
MAX_CONCURRENT_REQUESTS = 5  // Parallel (faster, more load)
```

### Optimization Strategies

1. **Buffer Size**: Adjust `STREAM_BUFFER_SIZE` for optimal throughput
2. **File I/O**: Use async operations, avoid blocking
3. **Error Fast**: Validate early to avoid unnecessary API calls
4. **Caching**: Consider caching for repeated prompts (not implemented)

### Resource Management

- **Connection Pooling**: SDK handles connection reuse
- **Memory Management**: Streaming prevents large memory allocation
- **Cleanup**: Proper cleanup on server shutdown

## Limitations

1. **API Rate Limits**: Subject to Google Gemini API quotas
2. **Image Size Limits**: Maximum 4K resolution
3. **Prompt Length**: Configurable maximum (default 2000 chars)
4. **Concurrent Requests**: Configurable maximum (default 3)
5. **File Format**: Output format determined by API (typically PNG)
6. **Batch Generation**: Single image per request (configurable for future)

## Extension Points

The architecture supports future enhancements:

1. **Multiple Image Generation**: Batch processing
2. **Image Editing**: Modify existing images
3. **Style Transfer**: Apply styles to images
4. **Caching Layer**: Cache generated images
5. **Database Integration**: Store metadata
6. **Webhook Support**: Async generation notifications
7. **Multi-Model Support**: Support other Gemini models

## Testing Considerations

### Unit Testing

Test individual functions:
- Validation functions
- File name generation
- Path sanitization
- Error handling

### Integration Testing

Test component interactions:
- API client with mock responses
- File operations with temp directories
- Error propagation

### End-to-End Testing

Test complete flow:
- MCP protocol communication
- Full generation pipeline
- Error scenarios

### Testing Tools

- MCP Inspector: `npx @modelcontextprotocol/inspector`
- Manual testing through Cursor AI
- Log file analysis

