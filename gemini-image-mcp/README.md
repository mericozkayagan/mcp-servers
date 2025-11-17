# Gemini Image MCP Server

A Model Context Protocol (MCP) server that provides image generation capabilities using Google's Gemini 2.5 Flash Image generation model. This server enables AI assistants like Claude in Cursor AI to generate images directly from text prompts.

## Features

- **Text-to-Image Generation**: Generate high-quality images from text descriptions
- **Multiple Image Sizes**: Support for various image sizes (256px, 512px, 1K, 2K, 4K)
- **Flexible Output Options**: Customize output directory and file naming
- **Dual Response Modes**: Get both generated images and AI text descriptions
- **Streaming Support**: Efficient processing of API responses
- **Highly Configurable**: All parameters configurable at the top of `src/config.ts`
- **Secure**: Built-in path validation and security measures
- **Error Handling**: Comprehensive error handling and validation

## Prerequisites

- Node.js 18 or higher
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## Installation

1. Navigate to the Gemini Image MCP directory:

```bash
cd gemini-image-mcp
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

The compiled server will be available in the `build/` directory.

## Configuration

### Environment Variables

Set your Gemini API key as an environment variable:

```bash
export GEMINI_API_KEY="your_api_key_here"
```

Or add it to your `~/.cursor/mcp.json` configuration (see below).

### Customizing Parameters

All configuration parameters are defined in `src/config.ts`. Open this file to customize:

- **Image sizes**: Available sizes and default size
- **Output directory**: Where images are saved by default
- **File naming pattern**: How generated files are named
- **Model name**: Gemini model to use
- **Response modalities**: IMAGE, TEXT, or both
- **Request timeout**: API timeout duration
- **Logging**: Debug and success logging options
- **Validation rules**: Prompt length, path validation
- **And more**: See `src/config.ts` for all options

After modifying `src/config.ts`, rebuild the project:

```bash
npm run build
```

## Usage with Cursor AI

### Add to Cursor Configuration

Edit your Cursor MCP configuration file at `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "gemini-image-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/gemini-image-mcp/build/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_gemini_api_key_here"
      }
    }
  }
}
```

Replace:
- `/absolute/path/to/mcp-servers/` with the actual path to your repository
- `your_gemini_api_key_here` with your Google Gemini API key

### Example Prompts in Cursor AI

Once configured, you can use these commands in Cursor AI:

**Basic image generation:**
```
Generate an image of a futuristic city with flying cars
```

**With specific size:**
```
Generate a 4K image of a sunset over mountains
```

**With custom output location:**
```
Generate an image of a cute robot, save it to ./my-images/
```

**With custom filename:**
```
Generate an image of a dragon, name it dragon_art.png
```

## Tool Parameters

### `generate_image`

Generates an image using Google Gemini 2.5 Flash Image model.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Text description of the image to generate |
| `outputPath` | string | No | Directory path where the image should be saved (default: `./generated-images`) |
| `fileName` | string | No | Custom file name for the generated image (auto-generated if not provided) |
| `imageSize` | enum | No | Size of the generated image: `'256'`, `'512'`, `'1K'`, `'2K'`, `'4K'` (default: `'1K'`) |
| `responseModalities` | array | No | Response types: `['IMAGE']`, `['TEXT']`, or `['IMAGE', 'TEXT']` (default: both) |

#### Example Response

```
✓ Image Generation Successful

Prompt: "A futuristic city with flying cars"

Generated Files:
  1. gemini_image_1699123456789_0.png
     Path: ./generated-images/gemini_image_1699123456789_0.png
     Type: image/png
     Size: 1.24 MB

AI Description:
A vibrant futuristic cityscape with sleek flying vehicles navigating between towering skyscrapers...
```

## Security Considerations

- **API Key Protection**: Never commit your API key to version control. Use environment variables.
- **Path Validation**: The server validates output paths to prevent directory traversal attacks.
- **Input Sanitization**: Prompts are validated for length and content.
- **File Overwrite Protection**: Configurable option to prevent accidentally overwriting existing files.

## Debugging

### Log Files

When running through Cursor, logs are available at:

```
~/Library/Logs/Cursor/mcp-server-gemini-image-mcp.log
```

### Enable Debug Logging

Edit `src/config.ts`:

```typescript
export const ENABLE_DEBUG_LOGGING = true;
```

Then rebuild the project.

### Using MCP Inspector

For testing and debugging without Cursor:

```bash
npx @modelcontextprotocol/inspector node /path/to/gemini-image-mcp/build/index.js
```

Set the `GEMINI_API_KEY` environment variable before running the inspector.

## Common Issues

### "Missing required environment variable: GEMINI_API_KEY"

**Solution**: Make sure your Gemini API key is set in the environment or in your `~/.cursor/mcp.json` configuration.

### "Output path does not match allowed patterns"

**Solution**: Use relative paths like `./my-folder` or simple paths without `..`. Modify `ALLOWED_OUTPUT_PATH_PATTERNS` in `src/config.ts` if you need custom path patterns.

### "Failed to generate image: Request timeout"

**Solution**: Increase `REQUEST_TIMEOUT` in `src/config.ts` (default is 60 seconds).

## Project Structure

```
gemini-image-mcp/
├── src/
│   ├── index.ts              # Main MCP server entry point
│   ├── config.ts             # Centralized configuration
│   ├── tools/
│   │   └── imageGeneration.ts # Image generation tool
│   └── utils/
│       └── geminiClient.ts   # Gemini API client
├── build/                    # Compiled JavaScript
├── docs/                     # Documentation
├── package.json
└── README.md
```

## Documentation

- [USAGE.md](docs/USAGE.md) - Detailed usage guide with examples
- [TECHNICAL.md](docs/TECHNICAL.md) - Technical specifications and architecture
- [DEVELOPMENT.md](docs/DEVELOPMENT.md) - Development guidelines

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions, please refer to the main repository documentation.

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Uses Google's [Gemini API](https://ai.google.dev/)

