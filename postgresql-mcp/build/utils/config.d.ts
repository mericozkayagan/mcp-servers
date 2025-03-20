/**
 * Database configuration utility for PostgreSQL MCP
 * Loads database connections from environment variables
 */
interface DatabaseConfig {
    connections: Record<string, string>;
    default: string | null;
}
/**
 * Load database configuration from environment variables
 */
export declare function loadConfig(): DatabaseConfig;
/**
 * Get a connection string by its name
 * @param {string} name - The name of the connection or the connection string
 * @returns {string|null} - The connection string or null if not found
 */
export declare function getConnectionString(name: string): string | null;
/**
 * List all available database connections
 */
export declare function listConnections(): DatabaseConfig;
export {};
