import { N8nClient } from '../utils/n8nClient.js';

/**
 * List all workflows in the n8n instance
 */
export async function listWorkflows() {
  const client = new N8nClient();
  return await client.listWorkflows();
}

/**
 * Get details of a specific workflow by ID
 */
export async function getWorkflow(params: { id: string }) {
  const { id } = params;
  const client = new N8nClient();
  return await client.getWorkflow(id);
}

/**
 * Activate a specific workflow by ID
 */
export async function activateWorkflow(params: { id: string }) {
  const { id } = params;
  const client = new N8nClient();
  return await client.activateWorkflow(id);
}

/**
 * Deactivate a specific workflow by ID
 */
export async function deactivateWorkflow(params: { id: string }) {
  const { id } = params;
  const client = new N8nClient();
  return await client.deactivateWorkflow(id);
}

/**
 * Execute a specific workflow with optional input data
 */
export async function executeWorkflow(params: { id: string, data?: any }) {
  const { id, data = {} } = params;
  const client = new N8nClient();
  return await client.executeWorkflow(id, data);
}

/**
 * List all executions for a specific workflow
 */
export async function listWorkflowExecutions(params: { id: string }) {
  const { id } = params;
  const client = new N8nClient();
  return await client.listWorkflowExecutions(id);
}

/**
 * Get details of a specific execution by ID
 */
export async function getExecution(params: { id: string }) {
  const { id } = params;
  const client = new N8nClient();
  return await client.getExecution(id);
}