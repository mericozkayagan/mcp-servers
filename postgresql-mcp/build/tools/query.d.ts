interface QueryResult {
    success: boolean;
    message: string;
    details: unknown;
}
/**
 * Execute a SELECT SQL query against the database
 */
export declare function executeQuery(connectionString: string, query: string, params?: any[]): Promise<QueryResult>;
export {};
