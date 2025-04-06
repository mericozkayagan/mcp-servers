#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from 'axios';

import {
  listWorkflows,
  getWorkflow,
  activateWorkflow,
  deactivateWorkflow,
  executeWorkflow,
  listWorkflowExecutions,
  getExecution
} from './tools/workflows.js';

// Create an MCP server
const server = new McpServer({
  name: "n8n-mcp",
  version: "0.1.0"
});

// Add tools for n8n workflows
server.tool(
  "mcp_list_workflows",
  { random_string: z.string().optional() },
  async () => {
    const result = await listWorkflows();
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool(
  "mcp_get_workflow",
  { id: z.string() },
  async ({ id }) => {
    const result = await getWorkflow({ id });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool(
  "mcp_activate_workflow",
  { id: z.string() },
  async ({ id }) => {
    const result = await activateWorkflow({ id });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool(
  "mcp_deactivate_workflow",
  { id: z.string() },
  async ({ id }) => {
    const result = await deactivateWorkflow({ id });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool(
  "mcp_execute_workflow",
  {
    id: z.string(),
    data: z.record(z.any()).optional()
  },
  async ({ id, data }) => {
    const result = await executeWorkflow({ id, data });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool(
  "mcp_list_workflow_executions",
  { id: z.string() },
  async ({ id }) => {
    const result = await listWorkflowExecutions({ id });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool(
  "mcp_get_execution",
  { id: z.string() },
  async ({ id }) => {
    const result = await getExecution({ id });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

// Run the server
console.log('Starting n8n MCP server...');
console.log(`Using n8n instance: ${process.env.N8N_BASE_URL}`);

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  process.exit(0);
});

// Handle uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

// Start the server
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.log('Server ready');
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});