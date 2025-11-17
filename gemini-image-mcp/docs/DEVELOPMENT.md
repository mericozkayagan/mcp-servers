# Development Guide - Gemini Image MCP Server

This guide provides information for developers who want to understand, modify, or contribute to the Gemini Image MCP Server.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Organization](#code-organization)
- [Configuration System](#configuration-system)
- [Adding Features](#adding-features)
- [Testing](#testing)
- [Debugging](#debugging)
- [Code Style](#code-style)
- [Contributing](#contributing)

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- TypeScript knowledge
- Google Gemini API key
- Text editor or IDE (VS Code recommended)

### Initial Setup

1. **Clone and navigate to the project:**

```bash
cd gemini-image-mcp
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment:**

```bash
export GEMINI_API_KEY="your_api_key_here"
```

4. **Build the project:**

```bash
npm run build
```

5. **Verify build:**

```bash
ls -la build/
```

### Development Workflow

1. **Make changes** in `src/` directory
2. **Rebuild** with `npm run build`
3. **Test** using MCP Inspector or Cursor AI
4. **Iterate** based on results

### Quick Rebuild

```bash
npm run build
```

This command:
- Cleans the `build/` directory
- Compiles TypeScript to JavaScript
- Sets executable permissions on `index.js`

## Project Structure

```
gemini-image-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── config.ts             # All configuration parameters
│   ├── tools/
│   │   └── imageGeneration.ts # Image generation tool logic
│   └── utils/
│       └── geminiClient.ts   # Gemini API client wrapper
├── build/                    # Compiled JavaScript (git-ignored)
├── docs/
│   ├── USAGE.md             # User documentation
│   ├── TECHNICAL.md         # Technical specifications
│   └── DEVELOPMENT.md       # This file
├── node_modules/            # Dependencies (git-ignored)
├── package.json             # Project configuration
├── tsconfig.json            # TypeScript configuration
├── .gitignore              # Git ignore rules
└── README.md               # Main documentation
```

### File Responsibilities

**src/index.ts**
- MCP server initialization
- Tool registration
- Request routing
- Error handling
- Process lifecycle management

**src/config.ts**
- All configurable constants
- Environment variable handling
- Validation functions
- Type definitions

**src/tools/imageGeneration.ts**
- Tool implementation
- Parameter validation
- Response formatting
- Business logic

**src/utils/geminiClient.ts**
- Google Gemini API integration
- Streaming response handling
- File I/O operations
- Error handling

## Code Organization

### Separation of Concerns

The codebase follows a layered architecture:

1. **Configuration Layer** (`config.ts`)
   - No dependencies on other modules
   - Pure constants and validation functions
   - Single source of truth for settings

2. **Utility Layer** (`utils/`)
   - Depends only on config
   - Reusable components
   - No business logic

3. **Tool Layer** (`tools/`)
   - Depends on utils and config
   - Business logic implementation
   - MCP tool interface

4. **Server Layer** (`index.ts`)
   - Depends on tools
   - MCP protocol handling
   - Server lifecycle

### Import Patterns

Always use `.js` extension for imports (TypeScript requirement for ES modules):

```typescript
import { config } from './config.js';
import { GeminiClient } from './utils/geminiClient.js';
```

### Type Safety

The project uses TypeScript for type safety:

```typescript
// Define interfaces for parameters
interface ImageGenerationParams {
  prompt: string;
  outputPath?: string;
  // ...
}

// Use type guards
function isValidImageSize(size: string): size is ImageSize {
  return AVAILABLE_IMAGE_SIZES.includes(size as ImageSize);
}

// Leverage Zod for runtime validation
const schema = z.object({
  prompt: z.string(),
  imageSize: z.enum(['256', '512', '1K', '2K', '4K']).optional()
});
```

## Configuration System

### Understanding config.ts

All configuration is centralized in `src/config.ts`. This file contains:

1. **Constants**: Fixed values used throughout the application
2. **Configuration Objects**: Grouped settings
3. **Type Definitions**: TypeScript types for configuration
4. **Validation Functions**: Runtime validation helpers

### Adding a New Configuration Parameter

1. **Add the constant:**

```typescript
// In src/config.ts

/**
 * Maximum number of retries for failed API requests
 */
export const MAX_API_RETRIES = 3;
```

2. **Add to DEFAULT_CONFIG object:**

```typescript
export const DEFAULT_CONFIG = {
  // ... existing config
  maxApiRetries: MAX_API_RETRIES,
} as const;
```

3. **Use in code:**

```typescript
// In any module
import { MAX_API_RETRIES } from '../config.js';

let retries = 0;
while (retries < MAX_API_RETRIES) {
  // ... retry logic
}
```

4. **Document it:**

Add comments explaining:
- What it controls
- Valid values
- Default value
- Impact of changing it

### Configuration Categories

Organize related settings:

```typescript
// ===== CATEGORY NAME =====

export const SETTING_1 = value1;
export const SETTING_2 = value2;

// ===== NEXT CATEGORY =====
```

## Adding Features

### Adding a New Tool

1. **Create tool file:**

```typescript
// src/tools/newTool.ts

export async function newTool(params: NewToolParams) {
  // Validate inputs
  // Call utilities
  // Process results
  // Return formatted response
}

export function getNewToolInfo() {
  return {
    name: 'new_tool',
    description: '...',
    inputSchema: { ... }
  };
}
```

2. **Register in index.ts:**

```typescript
import { newTool, getNewToolInfo } from './tools/newTool.js';

const toolInfo = getNewToolInfo();
server.tool(
  toolInfo.name,
  { /* Zod schema */ },
  async (params) => {
    const result = await newTool(params);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  }
);
```

### Adding a New Configuration Category

1. **Add to config.ts:**

```typescript
// ===== NEW FEATURE CONFIGURATION =====

export const FEATURE_ENABLED = true;
export const FEATURE_OPTION_1 = 'default';
export const FEATURE_OPTION_2 = 100;
```

2. **Add to DEFAULT_CONFIG:**

```typescript
export const DEFAULT_CONFIG = {
  // ... existing
  featureEnabled: FEATURE_ENABLED,
  featureOption1: FEATURE_OPTION_1,
  featureOption2: FEATURE_OPTION_2,
} as const;
```

### Adding API Endpoints

To support additional Gemini models or features:

1. **Add model configuration:**

```typescript
// In config.ts
export const AVAILABLE_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-2.5-pro-image'  // New model
] as const;
```

2. **Update client:**

```typescript
// In geminiClient.ts
async generateWithModel(model: string, params: GenerationParams) {
  const response = await this.client.models.generateContentStream({
    model: model,  // Use specified model
    config: config,
    contents: contents,
  });
}
```

3. **Update tool:**

```typescript
// In imageGeneration.ts
export interface GenerateImageToolParams {
  prompt: string;
  model?: string;  // New parameter
  // ... existing params
}
```

## Testing

### Manual Testing with MCP Inspector

1. **Start the inspector:**

```bash
npx @modelcontextprotocol/inspector node /path/to/build/index.js
```

2. **Set environment variable:**

```bash
export GEMINI_API_KEY="your_key"
```

3. **Test the tool:**

In the inspector UI:
- Select `generate_image` tool
- Enter test parameters
- Execute and verify results

### Testing with Cursor AI

1. **Update `~/.cursor/mcp.json`:**

```json
{
  "mcpServers": {
    "gemini-image-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_key"
      }
    }
  }
}
```

2. **Restart Cursor**

3. **Test with prompts:**

```
Generate an image of a test pattern
```

### Test Cases to Consider

1. **Valid inputs:**
   - Simple prompt
   - All optional parameters
   - Different image sizes
   - Custom paths and filenames

2. **Edge cases:**
   - Very long prompts
   - Special characters in prompts
   - Non-existent output directories
   - Existing filenames

3. **Error cases:**
   - Missing API key
   - Invalid image size
   - Invalid path (with ..)
   - Network failures

### Automated Testing

Consider adding:

```typescript
// tests/validation.test.ts

import { validatePrompt } from '../src/tools/imageGeneration.js';

describe('validatePrompt', () => {
  it('should accept valid prompts', () => {
    expect(() => validatePrompt('Valid prompt')).not.toThrow();
  });

  it('should reject empty prompts', () => {
    expect(() => validatePrompt('')).toThrow();
  });

  it('should reject too long prompts', () => {
    const longPrompt = 'a'.repeat(3000);
    expect(() => validatePrompt(longPrompt)).toThrow();
  });
});
```

## Debugging

### Enable Debug Logging

```typescript
// In src/config.ts
export const ENABLE_DEBUG_LOGGING = true;
```

Rebuild and run. Debug logs will show:
- Function entry/exit
- Parameter values
- API calls
- File operations

### Log Files

When running through Cursor:

```bash
tail -f ~/Library/Logs/Cursor/mcp-server-gemini-image-mcp.log
```

### Common Issues

**Issue: "Cannot find module"**

```bash
# Rebuild the project
npm run build

# Check imports use .js extension
grep -r "from '.*.js'" src/
```

**Issue: TypeScript errors**

```bash
# Check TypeScript version
npx tsc --version

# Run type checker
npx tsc --noEmit
```

**Issue: Runtime errors**

```typescript
// Add try-catch and detailed logging
try {
  console.log('Before operation, params:', params);
  const result = await operation(params);
  console.log('After operation, result:', result);
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
  throw error;
}
```

### Debugging Tools

1. **Node.js Inspector:**

```bash
node --inspect build/index.js
```

2. **VS Code Debugging:**

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug MCP Server",
      "program": "${workspaceFolder}/build/index.js",
      "env": {
        "GEMINI_API_KEY": "your_key"
      }
    }
  ]
}
```

3. **Console Logging:**

Use strategic console.log statements:

```typescript
console.log('[DEBUG] Function called with:', params);
console.log('[DEBUG] API response:', response);
console.log('[DEBUG] File saved to:', filePath);
```

## Code Style

### TypeScript Conventions

- Use `interface` for object types
- Use `type` for unions and complex types
- Prefer `const` over `let`
- Use arrow functions for callbacks
- Use async/await over promises

### Naming Conventions

- **Files**: camelCase (e.g., `geminiClient.ts`)
- **Classes**: PascalCase (e.g., `GeminiClient`)
- **Functions**: camelCase (e.g., `generateImage`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_PROMPT_LENGTH`)
- **Interfaces**: PascalCase (e.g., `ImageGenerationParams`)
- **Types**: PascalCase (e.g., `ResponseModality`)

### Comments

Use JSDoc for functions:

```typescript
/**
 * Generate an image from a text prompt
 * @param params Image generation parameters
 * @returns Generation result with file information
 * @throws {GeminiClientError} If generation fails
 */
async function generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  // Implementation
}
```

Use inline comments for complex logic:

```typescript
// Check if file exists and handle overwrite setting
if (!OVERWRITE_EXISTING_FILES && existsSync(fullPath)) {
  // Generate unique name by appending counter
  const uniqueName = generateUniqueFileName(outputPath, fileName, extension);
  // ...
}
```

### Error Handling Pattern

```typescript
try {
  // Operation
} catch (error) {
  // Log with context
  console.error('Context about what failed:', error);

  // Re-throw or wrap in custom error
  throw new CustomError(
    'User-friendly message',
    'ERROR_CODE',
    error
  );
}
```

### Import Organization

Group imports:

```typescript
// External dependencies
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Internal modules
import { generateImage } from './tools/imageGeneration.js';
import { validateEnvironment } from './config.js';
```

## Contributing

### Before Contributing

1. Understand the architecture
2. Read existing code
3. Check for similar features
4. Test your changes thoroughly

### Making Changes

1. **Modify code** following style guide
2. **Update configuration** if needed
3. **Add/update tests**
4. **Update documentation**
5. **Build and test**

### Documentation Updates

When making changes, update:

- **README.md**: User-facing features
- **USAGE.md**: Usage examples
- **TECHNICAL.md**: Implementation details
- **DEVELOPMENT.md**: Development impacts
- **Code comments**: Inline documentation

### Pull Request Checklist

- [ ] Code follows style guide
- [ ] Configuration changes documented
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Build succeeds without errors
- [ ] Tested manually
- [ ] No console.log left in production code (unless intentional)
- [ ] Error handling implemented
- [ ] Security considerations addressed

## Best Practices

1. **Configuration First**: Add configuration for customizable behavior
2. **Validate Early**: Check inputs before processing
3. **Error Messages**: Provide clear, actionable error messages
4. **Type Safety**: Use TypeScript types everywhere
5. **Documentation**: Comment complex logic
6. **Logging**: Use appropriate log levels
7. **Security**: Validate and sanitize all inputs
8. **Testing**: Test happy path and error cases
9. **Performance**: Consider impact of changes
10. **Consistency**: Follow existing patterns

## Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)

## Getting Help

- Review error messages and stack traces
- Check log files for detailed information
- Use debugger to step through code
- Test individual functions in isolation
- Review similar implementations in codebase

