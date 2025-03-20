import type { Pool as PoolType, PoolClient as PoolClientType, QueryResultRow } from 'pg';
interface ConnectionOptions {
    maxConnections?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
    statementTimeout?: number;
    queryTimeout?: number;
    ssl?: boolean | {
        rejectUnauthorized: boolean;
    };
}
export declare class DatabaseConnection {
    private static instance;
    private pool;
    private client;
    private connectionString;
    private lastError;
    private connectionOptions;
    private constructor();
    static getInstance(): DatabaseConnection;
    /**
     * Connect to a PostgreSQL database
     */
    connect(connectionStringOrName: string, options?: ConnectionOptions): Promise<void>;
    /**
     * Disconnect from the database
     */
    disconnect(): Promise<void>;
    /**
     * Execute a SQL query
     */
    query<T extends QueryResultRow = Record<string, unknown>>(text: string, values?: unknown[], options?: {
        timeout?: number;
    }): Promise<T[]>;
    /**
     * Execute a query that returns a single row
     */
    queryOne<T extends QueryResultRow = Record<string, unknown>>(text: string, values?: unknown[], options?: {
        timeout?: number;
    }): Promise<T | null>;
    /**
     * Execute a query that returns a single value
     */
    queryValue<T>(text: string, values?: unknown[], options?: {
        timeout?: number;
    }): Promise<T | null>;
    /**
     * Execute multiple queries in a transaction
     */
    transaction<T>(callback: (client: PoolClientType) => Promise<T>): Promise<T>;
    /**
     * Get the current connection pool
     */
    getPool(): PoolType | null;
    /**
     * Get the current client
     */
    getClient(): PoolClientType | null;
    /**
     * Get the last error that occurred
     */
    getLastError(): Error | null;
    /**
     * Check if connected to database
     */
    isConnected(): boolean;
    /**
     * Get connection string (with password masked)
     */
    getConnectionInfo(): string;
    /**
     * Clean up all connection pools
     * Should be called when the application is shutting down
     */
    static cleanupPools(): Promise<void>;
}
export {};
