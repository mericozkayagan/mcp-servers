interface ConnectionResult {
    success: boolean;
    message: string;
    details: unknown;
}
/**
 * List all available database connections
 */
export declare function listDatabaseConnections(): Promise<ConnectionResult>;
/**
 * Add a new database connection
 */
export declare function addDatabaseConnection(name: string, connectionString: string): Promise<ConnectionResult>;
/**
 * Remove a database connection
 */
export declare function removeDatabaseConnection(name: string): Promise<ConnectionResult>;
/**
 * Set the default database connection
 */
export declare function setDefaultConnection(name: string): Promise<ConnectionResult>;
export {};
