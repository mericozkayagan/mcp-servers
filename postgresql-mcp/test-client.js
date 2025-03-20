#!/usr/bin/env node

/**
 * Simple test client for the PostgreSQL MCP server
 *
 * Usage:
 *   node test-client.js <tool-name> <arguments-json>
 *
 * Example:
 *   node test-client.js get_schema_info '{"connectionString":"postgresql://user:password@localhost:5432/dbname"}'
 */

import { spawn } from 'child_process';
import { resolve } from 'path';

// Parse command line arguments
const toolName = process.argv[2];
const argsJson = process.argv[3] || '{}';

if (!toolName) {
  console.error('Error: Tool name is required');
  console.error('Usage: node test-client.js <tool-name> <arguments-json>');
  process.exit(1);
}

let args;
try {
  args = JSON.parse(argsJson);
} catch (error) {
  console.error('Error parsing JSON arguments:', error.message);
  process.exit(1);
}

// Path to the MCP server
const serverPath = resolve('./build/index.js');

// Start the MCP server process
const serverProcess = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', process.stderr]
});

// Handle server process errors
serverProcess.on('error', (error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});

// Create a request to the MCP server
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'callTool',
  params: {
    name: toolName,
    arguments: args
  }
};

// Send the request to the server
serverProcess.stdin.write(JSON.stringify(request) + '\n');

// Collect response data
let responseData = '';
serverProcess.stdout.on('data', (data) => {
  responseData += data.toString();

  try {
    // Try to parse the response
    const response = JSON.parse(responseData);

    // Format and print the response
    if (response.error) {
      console.error('Error:', response.error.message);
    } else if (response.result && response.result.content) {
      // Extract and parse the content
      const content = response.result.content[0].text;
      try {
        // Try to parse as JSON for pretty printing
        const parsedContent = JSON.parse(content);
        console.log(JSON.stringify(parsedContent, null, 2));
      } catch {
        // If not JSON, print as is
        console.log(content);
      }
    } else {
      console.log('Unexpected response format:', response);
    }

    // Exit after processing the response
    serverProcess.kill();
    process.exit(0);
  } catch (error) {
    // Not a complete JSON response yet, continue collecting data
  }
});

// Handle server process exit
serverProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`MCP server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle CTRL+C to gracefully terminate the server
process.on('SIGINT', () => {
  serverProcess.kill();
  process.exit(0);
});