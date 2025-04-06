import axios, { AxiosInstance } from 'axios';

/**
 * Custom error class for n8n client
 */
export class N8nClientError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'N8nClientError';
  }
}

/**
 * Client for interacting with n8n API
 */
export class N8nClient {
  private client: AxiosInstance;
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.N8N_BASE_URL || '';
    this.apiKey = process.env.N8N_API_KEY || '';

    if (!this.baseURL || !this.apiKey) {
      throw new N8nClientError(
        'Missing n8n configuration. Please set N8N_BASE_URL and N8N_API_KEY environment variables.'
      );
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': this.apiKey
      }
    });
  }

  /**
   * List all workflows
   */
  async listWorkflows() {
    try {
      const response = await this.client.get('/api/v1/workflows');
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Failed to list workflows');
    }
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(id: string) {
    try {
      const response = await this.client.get(`/api/v1/workflows/${id}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error, `Failed to get workflow with ID: ${id}`);
    }
  }

  /**
   * Activate a workflow by ID
   */
  async activateWorkflow(id: string) {
    try {
      const response = await this.client.post(`/api/v1/workflows/${id}/activate`);
      return response.data;
    } catch (error) {
      this.handleApiError(error, `Failed to activate workflow with ID: ${id}`);
    }
  }

  /**
   * Deactivate a workflow by ID
   */
  async deactivateWorkflow(id: string) {
    try {
      const response = await this.client.post(`/api/v1/workflows/${id}/deactivate`);
      return response.data;
    } catch (error) {
      this.handleApiError(error, `Failed to deactivate workflow with ID: ${id}`);
    }
  }

  /**
   * Execute a workflow by ID with optional data
   */
  async executeWorkflow(id: string, data: any = {}) {
    try {
      const response = await this.client.post(`/api/v1/workflows/${id}/execute`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error, `Failed to execute workflow with ID: ${id}`);
    }
  }

  /**
   * List executions for a specific workflow
   */
  async listWorkflowExecutions(id: string) {
    try {
      const response = await this.client.get(`/api/v1/workflows/${id}/executions`);
      return response.data;
    } catch (error) {
      this.handleApiError(error, `Failed to list executions for workflow with ID: ${id}`);
    }
  }

  /**
   * Get a specific execution by ID
   */
  async getExecution(id: string) {
    try {
      const response = await this.client.get(`/api/v1/executions/${id}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error, `Failed to get execution with ID: ${id}`);
    }
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: any, message: string): never {
    console.error('API Error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const responseData = error.response?.data || {};

      if (status === 401 || status === 403) {
        throw new N8nClientError(
          'Authentication failed. Please check your API key.',
          status
        );
      } else if (status === 404) {
        throw new N8nClientError(
          'Resource not found. Please check the ID.',
          status
        );
      } else {
        throw new N8nClientError(
          `${message}: ${responseData.message || error.message}`,
          status
        );
      }
    }

    throw new N8nClientError(
      `${message}: ${error.message || 'Unknown error'}`
    );
  }
}