# n8n MCP Server

A Model Context Protocol server for interacting with n8n workflows via the n8n API.

## Features

- List all workflows
- Get details of a specific workflow
- Activate/deactivate workflows
- Execute workflows with optional input data
- List workflow executions
- Get details of specific executions

## Prerequisites

- Node.js 18 or higher
- n8n instance with API access

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/n8n-mcp.git
cd n8n-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Set the following environment variables:

- `N8N_BASE_URL`: The base URL of your n8n instance (e.g., `http://localhost:5678`)
- `N8N_API_KEY`: Your n8n API key

You can set these variables in a `.env` file in the project root:

```
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your-api-key
```

Alternatively, configure them in your `~/.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "node",
      "args": ["/path/to/n8n-mcp/build/index.js"],
      "env": {
        "N8N_BASE_URL": "https://your-n8n-instance.example.com",
        "N8N_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Implementation Details

This server is built using:

- The Model Context Protocol (MCP) SDK
- Axios for API communication with n8n
- Zod for schema validation

The MCP server follows standard conventions for tool implementation, exposing n8n operations via a clean and standardized interface.

## Usage

Start the server:

```bash
node build/index.js
```

The server follows the Model Context Protocol, reading JSON-RPC requests from stdin and writing responses to stdout. It can be used with any MCP client, such as the Claude AI assistant with MCP support.

### Available Tools

The server provides the following tools:

1. `mcp_list_workflows`: List all workflows in the n8n instance
2. `mcp_get_workflow`: Get details of a specific workflow by ID
3. `mcp_activate_workflow`: Activate a specific workflow by ID
4. `mcp_deactivate_workflow`: Deactivate a specific workflow by ID
5. `mcp_execute_workflow`: Execute a specific workflow with optional input data
6. `mcp_list_workflow_executions`: List all executions for a specific workflow
7. `mcp_get_execution`: Get details of a specific execution by ID

## Development

### Dependencies

- `@modelcontextprotocol/sdk`: The MCP SDK for JSON-RPC communication
- `axios`: HTTP client for n8n API calls
- `zod`: TypeScript-first schema validation

### Building

To build the project after making changes:

```bash
npm run build
```

### Testing

You can test the server by using the MCP Inspector tool:

```bash
npx @modelcontextprotocol/inspector node path/to/build/index.js
```

## License

MIT
