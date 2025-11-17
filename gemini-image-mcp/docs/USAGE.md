# Usage Guide - Gemini Image MCP Server

This guide provides detailed information on using the Gemini Image MCP Server for image generation.

## Table of Contents

- [Quick Start](#quick-start)
- [Tool Reference](#tool-reference)
- [Configuration Options](#configuration-options)
- [Use Case Examples](#use-case-examples)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Basic Image Generation

The simplest way to generate an image:

```
Generate an image of a sunset over the ocean
```

This will:
- Create a `./generated-images/` directory (if it doesn't exist)
- Generate a 1K resolution image
- Save it with an auto-generated filename
- Return both the image and an AI description

### Specifying Image Size

```
Generate a 4K image of a mountain landscape
```

Available sizes:
- `256` - 256x256 pixels
- `512` - 512x512 pixels
- `1K` - ~1024px (default)
- `2K` - ~2048px
- `4K` - ~4096px

### Custom Output Location

```
Generate an image of a cat, save it to ./my-images/
```

### Custom Filename

```
Generate an image of a robot, name it robot_design.png
```

## Tool Reference

### generate_image

#### Full Parameter List

```typescript
{
  prompt: string,              // Required
  outputPath?: string,         // Optional
  fileName?: string,           // Optional
  imageSize?: '256' | '512' | '1K' | '2K' | '4K',  // Optional
  responseModalities?: ('IMAGE' | 'TEXT')[]  // Optional
}
```

#### Parameter Details

##### prompt (required)

The text description of the image you want to generate.

**Guidelines:**
- Be descriptive and specific
- Include style, mood, and details
- Length: 1-2000 characters (configurable in `config.ts`)

**Examples:**

Good prompts:
```
"A serene Japanese garden with cherry blossoms, koi pond, and traditional wooden bridge, in the style of impressionist painting"

"Futuristic cityscape at night with neon lights, flying vehicles, and holographic advertisements, cyberpunk aesthetic"

"Cute cartoon character of a friendly dragon with large eyes, colorful scales, suitable for children's book illustration"
```

Less effective prompts:
```
"A picture"
"Something cool"
"Image"
```

##### outputPath (optional)

Directory where the generated image will be saved.

**Default:** `./generated-images`

**Format:** Relative or absolute path

**Examples:**
```
"./my-images"
"./projects/artwork"
"./output"
```

**Security:** Paths are validated to prevent directory traversal. Paths containing `..` are rejected by default.

##### fileName (optional)

Custom name for the generated file.

**Default:** Auto-generated using pattern from config (e.g., `gemini_image_1699123456789_0.png`)

**Format:** Filename with or without extension

**Examples:**
```
"sunset.png"
"my_artwork"
"design_v2.jpg"
```

**Note:** If you omit the extension, it will be added automatically based on the image format.

##### imageSize (optional)

Size/resolution of the generated image.

**Default:** `'1K'`

**Options:**
- `'256'` - Small, fast generation
- `'512'` - Medium quality
- `'1K'` - Standard quality (default)
- `'2K'` - High quality
- `'4K'` - Maximum quality (slower)

**Usage:**
```
imageSize: '4K'
```

##### responseModalities (optional)

What types of content to receive in response.

**Default:** `['IMAGE', 'TEXT']`

**Options:**
- `['IMAGE']` - Only the generated image
- `['TEXT']` - Only text description (no image)
- `['IMAGE', 'TEXT']` - Both image and description

**Usage:**
```
responseModalities: ['IMAGE']  // Image only, no text description
```

## Configuration Options

All configuration is centralized in `src/config.ts`. Here are the key parameters you can customize:

### Image Generation

```typescript
// Available sizes
export const AVAILABLE_IMAGE_SIZES = ['256', '512', '1K', '2K', '4K'];

// Default size
export const DEFAULT_IMAGE_SIZE: ImageSize = '1K';
```

### Output Settings

```typescript
// Default output directory
export const DEFAULT_OUTPUT_DIR = './generated-images';

// File naming pattern
// Placeholders: {timestamp}, {index}, {date}, {time}
export const FILE_NAME_PATTERN = 'gemini_image_{timestamp}_{index}';

// Auto-create output directory
export const AUTO_CREATE_OUTPUT_DIR = true;

// Prevent overwriting existing files
export const OVERWRITE_EXISTING_FILES = false;
```

### Model Settings

```typescript
// Gemini model name
export const MODEL_NAME = 'gemini-2.5-flash-image';

// Default response types
export const DEFAULT_RESPONSE_MODALITIES = ['IMAGE', 'TEXT'];
```

### API Settings

```typescript
// Request timeout (milliseconds)
export const REQUEST_TIMEOUT = 60000; // 60 seconds

// Max concurrent requests
export const MAX_CONCURRENT_REQUESTS = 3;
```

### Validation

```typescript
// Prompt length limits
export const MAX_PROMPT_LENGTH = 2000;
export const MIN_PROMPT_LENGTH = 1;

// Path validation
export const VALIDATE_OUTPUT_PATH = true;
```

### Logging

```typescript
// Enable detailed logging
export const ENABLE_DEBUG_LOGGING = false;

// Log successful generations
export const LOG_SUCCESSFUL_GENERATIONS = true;
```

## Use Case Examples

### 1. Creating Concept Art

```
Generate a 2K image of a fantasy castle on a floating island with waterfalls cascading into clouds below, magical atmosphere with glowing crystals, golden hour lighting
```

**Parameters:**
- Size: 2K for good detail
- Default output location
- AI description helps understand the artistic choices

### 2. Product Design Visualization

```
Generate a 4K image of a modern minimalist coffee maker with brushed steel finish, touch controls, and LED display, studio lighting, product photography style
```

**Parameters:**
- Size: 4K for maximum detail
- Custom filename: `coffee_maker_design.png`
- Detailed prompt for specific design features

### 3. Illustration for Documentation

```
Generate a 512 image of a simple flowchart showing user authentication process with icons, clean design, suitable for technical documentation
```

**Parameters:**
- Size: 512 for smaller file size
- Output to docs folder: `./docs/images/`
- Image only (no text description needed)

### 4. Social Media Content

```
Generate a 1K image of an inspiring quote "Dream Big" with abstract colorful background, modern typography, Instagram-ready format
```

**Parameters:**
- Size: 1K (optimal for social media)
- Custom filename with branding
- Square format

### 5. Game Asset Creation

```
Generate a 2K image of a fantasy sword with ornate engravings, glowing runes, transparent background, game asset style, isometric view
```

**Parameters:**
- Size: 2K for game quality
- Organized output: `./game-assets/weapons/`
- Descriptive filename for asset library

## Advanced Usage

### Batch Generation with Different Styles

Generate multiple variations by changing style descriptors:

```
1. Generate a 1K image of a robot, anime style
2. Generate a 1K image of a robot, realistic 3D render
3. Generate a 1K image of a robot, retro cartoon style
```

### Iterative Refinement

Start broad, then refine:

```
1. Generate an image of a spaceship
   (Review output)

2. Generate a 2K image of a sleek spaceship with blue ion engines, cockpit with glass canopy, metallic hull with panel details, orbiting Earth

3. Generate a 4K image of a sleek spaceship with blue ion engines, cockpit with glass canopy, metallic hull with panel details, orbiting Earth, cinematic lighting from the sun
```

### Organizing Projects

Use consistent output paths:

```
./project-alpha/concepts/
./project-alpha/finals/
./project-alpha/variations/
```

### Custom Configuration for Projects

Edit `src/config.ts` for project-specific settings:

```typescript
// For a project needing large images
export const DEFAULT_IMAGE_SIZE = '4K';
export const DEFAULT_OUTPUT_DIR = './project-renders';

// For a project with strict naming
export const FILE_NAME_PATTERN = 'render_{date}_{time}';
export const OVERWRITE_EXISTING_FILES = true;
```

Remember to rebuild after config changes: `npm run build`

## Troubleshooting

### Issue: Images Not Generating

**Symptoms:** No image files created, error messages

**Possible Causes:**
1. Invalid API key
2. Insufficient API quota
3. Network issues
4. Invalid prompt

**Solutions:**
- Check `GEMINI_API_KEY` is set correctly
- Verify API key has image generation permissions
- Check network connectivity
- Try a simpler prompt

### Issue: Output Directory Errors

**Symptoms:** "Cannot create directory" or "Permission denied"

**Solutions:**
- Ensure you have write permissions
- Use relative paths like `./output`
- Enable `AUTO_CREATE_OUTPUT_DIR` in config
- Check disk space

### Issue: Image Quality Not as Expected

**Symptoms:** Images are too small or low quality

**Solutions:**
- Use a larger size: `2K` or `4K`
- Be more specific in your prompt
- Include style descriptors
- Mention "high quality", "detailed", "professional"

### Issue: Prompt Too Long

**Symptoms:** "Prompt must not exceed X characters"

**Solutions:**
- Shorten your prompt
- Increase `MAX_PROMPT_LENGTH` in `config.ts`
- Focus on key descriptive elements

### Issue: Path Validation Errors

**Symptoms:** "Output path does not match allowed patterns"

**Solutions:**
- Use simple relative paths: `./my-folder`
- Avoid `..` in paths
- Modify `ALLOWED_OUTPUT_PATH_PATTERNS` in config if needed

### Viewing Detailed Logs

Enable debug logging in `src/config.ts`:

```typescript
export const ENABLE_DEBUG_LOGGING = true;
```

Rebuild and check logs:
```
~/Library/Logs/Cursor/mcp-server-gemini-image-mcp.log
```

## Best Practices

1. **Be Specific:** Detailed prompts yield better results
2. **Iterate:** Start simple, refine based on results
3. **Organize Output:** Use consistent directory structure
4. **Name Files:** Use descriptive custom filenames for important images
5. **Choose Appropriate Size:** Balance quality vs generation time
6. **Review Settings:** Adjust `config.ts` for your workflow
7. **Monitor Logs:** Check for errors and performance issues

## Getting Help

- Review error messages carefully
- Check log files for detailed information
- Ensure all prerequisites are met
- Verify configuration settings
- Test with simple prompts first

