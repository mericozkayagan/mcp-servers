#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { generateImage, getToolInfo } from './tools/imageGeneration.js';
import { validateEnvironment, ENABLE_DEBUG_LOGGING } from './config.js';

/**
 * Gemini Image MCP Server
 *
 * Provides image generation capabilities using Google Gemini 2.5 Flash Image model
 * through the Model Context Protocol.
 */

// Validate environment on startup
try {
  validateEnvironment();
  console.log('Environment validation successful');
} catch (error) {
  console.error('Environment validation failed:', error instanceof Error ? error.message : String(error));
  console.error('Please ensure GEMINI_API_KEY environment variable is set');
  process.exit(1);
}

// Create MCP server instance
const server = new McpServer({
  name: "gemini-image-mcp",
  version: "0.1.0"
});

// Get tool information
const toolInfo = getToolInfo();

// Register the generate_image tool
server.tool(
  toolInfo.name,
  {
    prompt: z.string().describe(toolInfo.inputSchema.properties.prompt.description),
    outputPath: z.string().optional().describe(toolInfo.inputSchema.properties.outputPath.description),
    fileName: z.string().optional().describe(toolInfo.inputSchema.properties.fileName.description),
    imageSize: z.enum(['256', '512', '1K', '2K', '4K']).optional().describe(toolInfo.inputSchema.properties.imageSize.description),
    responseModalities: z.array(z.enum(['IMAGE', 'TEXT'])).optional().describe(toolInfo.inputSchema.properties.responseModalities.description)
  },
  async ({ prompt, outputPath, fileName, imageSize, responseModalities }) => {
    if (ENABLE_DEBUG_LOGGING) {
      console.log('Tool invoked:', toolInfo.name);
      console.log('Parameters:', {
        prompt: prompt.substring(0, 50) + '...',
        outputPath,
        fileName,
        imageSize,
        responseModalities
      });
    }

    try {
      // Call the image generation tool
      const result = await generateImage({
        prompt,
        outputPath,
        fileName,
        imageSize,
        responseModalities
      });

      // Format response for MCP
      const responseText = [
        result.success ? '✓ Image Generation Successful' : '✗ Image Generation Failed',
        '',
        `Prompt: "${result.prompt || prompt}"`,
        ''
      ];

      if (result.success && result.files && result.files.length > 0) {
        responseText.push('Generated Files:');
        result.files.forEach((file, index) => {
          responseText.push(`  ${index + 1}. ${file.fileName}`);
          responseText.push(`     Path: ${file.path}`);
          responseText.push(`     Type: ${file.mimeType}`);
          responseText.push(`     Size: ${file.sizeFormatted}`);
          responseText.push('');
        });
      }

      if (result.textResponse) {
        responseText.push('AI Description:');
        responseText.push(result.textResponse);
        responseText.push('');
      }

      if (result.error) {
        responseText.push('Error:');
        responseText.push(result.error);
        responseText.push('');
      }

      if (result.details && ENABLE_DEBUG_LOGGING) {
        responseText.push('Debug Details:');
        responseText.push(JSON.stringify(result.details, null, 2));
      }

      return {
        content: [{
          type: "text",
          text: responseText.join('\n')
        }]
      };

    } catch (error) {
      console.error('Error in tool handler:', error);

      return {
        content: [{
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Log startup information
console.log('Starting Gemini Image MCP server...');
console.log('Server name: gemini-image-mcp');
console.log('Version: 0.1.0');

if (ENABLE_DEBUG_LOGGING) {
  console.log('Debug logging enabled');
}

// Handle termination signals
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Start the server
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.log('Gemini Image MCP server ready');
  console.log('Waiting for requests...');
}).catch(error => {
  console.error('Failed to start server:', error);
  console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace available');
  process.exit(1);
});

