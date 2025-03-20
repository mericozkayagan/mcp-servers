interface FunctionResult {
    success: boolean;
    message: string;
    details: unknown;
}
/**
 * Get information about database functions
 */
export declare function getFunctions(connectionString: string, functionName?: string, schema?: string): Promise<FunctionResult>;
/**
 * Create or replace a database function
 */
export declare function createFunction(connectionString: string, functionName: string, parameters: string, returnType: string, functionBody: string, options?: {
    language?: 'sql' | 'plpgsql' | 'plpython3u';
    volatility?: 'VOLATILE' | 'STABLE' | 'IMMUTABLE';
    schema?: string;
    security?: 'INVOKER' | 'DEFINER';
    replace?: boolean;
}): Promise<FunctionResult>;
/**
 * Drop a database function
 */
export declare function dropFunction(connectionString: string, functionName: string, parameters?: string, options?: {
    schema?: string;
    ifExists?: boolean;
    cascade?: boolean;
}): Promise<FunctionResult>;
/**
 * Enable Row-Level Security (RLS) on a table
 */
export declare function enableRLS(connectionString: string, tableName: string, schema?: string): Promise<FunctionResult>;
/**
 * Disable Row-Level Security (RLS) on a table
 */
export declare function disableRLS(connectionString: string, tableName: string, schema?: string): Promise<FunctionResult>;
/**
 * Create a Row-Level Security policy
 */
export declare function createRLSPolicy(connectionString: string, tableName: string, policyName: string, using: string, check?: string, options?: {
    schema?: string;
    command?: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    role?: string;
    replace?: boolean;
}): Promise<FunctionResult>;
/**
 * Drop a Row-Level Security policy
 */
export declare function dropRLSPolicy(connectionString: string, tableName: string, policyName: string, options?: {
    schema?: string;
    ifExists?: boolean;
}): Promise<FunctionResult>;
/**
 * Get Row-Level Security policies for a table
 */
export declare function getRLSPolicies(connectionString: string, tableName?: string, schema?: string): Promise<FunctionResult>;
export {};
