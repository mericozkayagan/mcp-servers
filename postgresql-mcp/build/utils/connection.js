import pkg from 'pg';
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
const poolCache = new Map();
export class DatabaseConnection {
    static instance;
    pool = null;
    client = null;
    connectionString = '';
    lastError = null;
    connectionOptions = {};
    constructor() { }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    /**
     * Connect to a PostgreSQL database
     */
    async connect(connectionStringOrName, options = {}) {
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
                this.pool = poolCache.get(actualConnectionString);
            }
            else {
                // Create a new pool
                const config = {
                    connectionString: actualConnectionString,
                    max: options.maxConnections || 20,
                    idleTimeoutMillis: options.idleTimeoutMillis || 30000,
                    connectionTimeoutMillis: options.connectionTimeoutMillis || 2000,
                    allowExitOnIdle: true,
                    ssl: options.ssl === undefined ? { rejectUnauthorized: false } : options.ssl
                };
                this.pool = new Pool(config);
                // Set up error handler for the pool
                this.pool.on('error', (err) => {
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
        }
        catch (error) {
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
    async disconnect() {
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
    async query(text, values = [], options = {}) {
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
                queryConfig.timeout = options.timeout || this.connectionOptions.queryTimeout;
            }
            // Use type assertion only for the query call
            const result = await this.client.query(queryConfig);
            return result.rows;
        }
        catch (error) {
            this.lastError = error instanceof Error ? error : new Error(String(error));
            throw new Error(`Query failed: ${this.lastError.message}`);
        }
    }
    /**
     * Execute a query that returns a single row
     */
    async queryOne(text, values = [], options = {}) {
        const rows = await this.query(text, values, options);
        return rows.length > 0 ? rows[0] : null;
    }
    /**
     * Execute a query that returns a single value
     */
    async queryValue(text, values = [], options = {}) {
        const rows = await this.query(text, values, options);
        if (rows.length > 0) {
            const firstRow = rows[0];
            const firstValue = Object.values(firstRow)[0];
            return firstValue;
        }
        return null;
    }
    /**
     * Execute multiple queries in a transaction
     */
    async transaction(callback) {
        if (!this.client || !this.pool) {
            throw new Error('Not connected to database');
        }
        try {
            await this.client.query('BEGIN');
            const result = await callback(this.client);
            await this.client.query('COMMIT');
            return result;
        }
        catch (error) {
            await this.client.query('ROLLBACK');
            this.lastError = error instanceof Error ? error : new Error(String(error));
            throw new Error(`Transaction failed: ${this.lastError.message}`);
        }
    }
    /**
     * Get the current connection pool
     */
    getPool() {
        return this.pool;
    }
    /**
     * Get the current client
     */
    getClient() {
        return this.client;
    }
    /**
     * Get the last error that occurred
     */
    getLastError() {
        return this.lastError;
    }
    /**
     * Check if connected to database
     */
    isConnected() {
        return this.pool !== null && this.client !== null;
    }
    /**
     * Get connection string (with password masked)
     */
    getConnectionInfo() {
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
    static async cleanupPools() {
        for (const [connectionString, pool] of poolCache.entries()) {
            try {
                await pool.end();
                poolCache.delete(connectionString);
            }
            catch (error) {
                console.error(`Error closing pool for ${connectionString}:`, error);
            }
        }
    }
}
//# sourceMappingURL=connection.js.map