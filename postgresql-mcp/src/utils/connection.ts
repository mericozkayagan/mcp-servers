import pkg from 'pg';
import type { Pool as PoolType, PoolClient as PoolClientType, PoolConfig, QueryResultRow } from 'pg';
import monitor from 'pg-monitor';
import { getConnectionString } from './config.js';
const { Pool } = pkg;

// Enable pg-monitor for better debugging in development
if (process.env.NODE_ENV !== 'production') {
  monitor.attach({
    query: true,
    error: true,
    notice: true,
    connect: true,
    disconnect: true
  });
  monitor.setTheme('matrix');
}

// Connection pool cache to reuse connections
const poolCache = new Map<string, PoolType>();

interface ConnectionOptions {
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  statementTimeout?: number;
  queryTimeout?: number;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

// Extended query config with additional options
interface ExtendedQueryConfig {
  text: string;
  values?: unknown[];
  timeout?: number;
  rowMode?: string;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: PoolType | null = null;
  private client: PoolClientType | null = null;
  private connectionString: string = '';
  private lastError: Error | null = null;
  private connectionOptions: ConnectionOptions = {};

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Connect to a PostgreSQL database
   */
  public async connect(connectionStringOrName: string, options: ConnectionOptions = {}): Promise<void> {
    try {
      // Check if this is a named connection in our config
      const actualConnectionString = getConnectionString(connectionStringOrName);

      if (!actualConnectionString) {
        throw new Error(`Connection "${connectionStringOrName}" not found and no default connection available`);
      }

      // If already connected to this database, reuse the connection
      if (this.pool && this.connectionString === actualConnectionString) {
        return;
      }

      // If connected to a different database, disconnect first
      if (this.pool) {
        await this.disconnect();
      }

      this.connectionString = actualConnectionString;
      this.connectionOptions = options;

      // Check if we have a cached pool for this connection string
      if (poolCache.has(actualConnectionString)) {
        this.pool = poolCache.get(actualConnectionString)!;
      } else {
        // Create a new pool
        const config: PoolConfig = {
          connectionString: actualConnectionString,
          max: options.maxConnections || 20,
          idleTimeoutMillis: options.idleTimeoutMillis || 30000,
          connectionTimeoutMillis: options.connectionTimeoutMillis || 2000,
          allowExitOnIdle: true,
          ssl: options.ssl === undefined ? { rejectUnauthorized: false } : options.ssl
        };

        this.pool = new Pool(config);

        // Set up error handler for the pool
        this.pool.on('error', (err: Error) => {
          console.error('Unexpected error on idle client', err);
          this.lastError = err;
        });

        // Cache the pool for future use
        poolCache.set(actualConnectionString, this.pool);
      }

      // Test connection
      this.client = await this.pool.connect();

      // Set statement timeout if specified
      if (options.statementTimeout) {
        await this.client.query(`SET statement_timeout = ${options.statementTimeout}`);
      }

      // Test the connection
      await this.client.query('SELECT 1');

    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));

      if (this.client) {
        this.client.release();
        this.client = null;
      }

      if (this.pool) {
        // Remove from cache if connection failed
        poolCache.delete(this.connectionString);
        await this.pool.end();
        this.pool = null;
      }

      throw new Error(`Failed to connect to database: ${this.lastError.message}`);
    }
  }

  /**
   * Disconnect from the database
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      this.client.release();
      this.client = null;
    }

    // Note: We don't end the pool here to allow connection reuse
    // The pool will be cleaned up when the application exits

    this.connectionString = '';
  }

  /**
   * Execute a SQL query
   */
  public async query<T extends QueryResultRow = Record<string, unknown>>(
    text: string,
    values: unknown[] = [],
    options: { timeout?: number } = {}
  ): Promise<T[]> {
    if (!this.client || !this.pool) {
      throw new Error('Not connected to database');
    }

    try {
      const queryConfig = {
        text,
        values
      };

      // Set query timeout if specified
      if (options.timeout || this.connectionOptions.queryTimeout) {
        // We need to use a type assertion here because the pg types don't include timeout
        // but the library actually supports it
        (queryConfig as ExtendedQueryConfig).timeout = options.timeout || this.connectionOptions.queryTimeout;
      }

      // Use type assertion only for the query call
      const result = await this.client.query<T>(queryConfig);
      return result.rows;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));
      throw new Error(`Query failed: ${this.lastError.message}`);
    }
  }

  /**
   * Execute a query that returns a single row
   */
  public async queryOne<T extends QueryResultRow = Record<string, unknown>>(
    text: string,
    values: unknown[] = [],
    options: { timeout?: number } = {}
  ): Promise<T | null> {
    const rows = await this.query<T>(text, values, options);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Execute a query that returns a single value
   */
  public async queryValue<T>(
    text: string,
    values: unknown[] = [],
    options: { timeout?: number } = {}
  ): Promise<T | null> {
    const rows = await this.query<Record<string, unknown>>(text, values, options);
    if (rows.length > 0) {
      const firstRow = rows[0];
      const firstValue = Object.values(firstRow)[0];
      return firstValue as T;
    }
    return null;
  }

  /**
   * Execute multiple queries in a transaction
   */
  public async transaction<T>(callback: (client: PoolClientType) => Promise<T>): Promise<T> {
    if (!this.client || !this.pool) {
      throw new Error('Not connected to database');
    }

    try {
      await this.client.query('BEGIN');
      const result = await callback(this.client);
      await this.client.query('COMMIT');
      return result;
    } catch (error) {
      await this.client.query('ROLLBACK');
      this.lastError = error instanceof Error ? error : new Error(String(error));
      throw new Error(`Transaction failed: ${this.lastError.message}`);
    }
  }

  /**
   * Get the current connection pool
   */
  public getPool(): PoolType | null {
    return this.pool;
  }

  /**
   * Get the current client
   */
  public getClient(): PoolClientType | null {
    return this.client;
  }

  /**
   * Get the last error that occurred
   */
  public getLastError(): Error | null {
    return this.lastError;
  }

  /**
   * Check if connected to database
   */
  public isConnected(): boolean {
    return this.pool !== null && this.client !== null;
  }

  /**
   * Get connection string (with password masked)
   */
  public getConnectionInfo(): string {
    if (!this.connectionString) {
      return 'Not connected';
    }

    // Mask password in connection string
    return this.connectionString.replace(/password=([^&]*)/, 'password=*****');
  }

  /**
   * Clean up all connection pools
   * Should be called when the application is shutting down
   */
  public static async cleanupPools(): Promise<void> {
    for (const [connectionString, pool] of poolCache.entries()) {
      try {
        await pool.end();
        poolCache.delete(connectionString);
      } catch (error) {
        console.error(`Error closing pool for ${connectionString}:`, error);
      }
    }
  }
}