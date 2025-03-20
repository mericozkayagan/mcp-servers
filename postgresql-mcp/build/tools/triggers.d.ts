interface TriggerResult {
    success: boolean;
    message: string;
    details: unknown;
}
/**
 * Get information about database triggers
 */
export declare function getTriggers(connectionString: string, tableName?: string, schema?: string): Promise<TriggerResult>;
/**
 * Create a trigger
 */
export declare function createTrigger(connectionString: string, triggerName: string, tableName: string, functionName: string, options?: {
    schema?: string;
    timing?: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
    events?: ('INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE')[];
    when?: string;
    forEach?: 'ROW' | 'STATEMENT';
    replace?: boolean;
}): Promise<TriggerResult>;
/**
 * Drop a trigger
 */
export declare function dropTrigger(connectionString: string, triggerName: string, tableName: string, options?: {
    schema?: string;
    ifExists?: boolean;
    cascade?: boolean;
}): Promise<TriggerResult>;
/**
 * Enable or disable a trigger
 */
export declare function setTriggerState(connectionString: string, triggerName: string, tableName: string, enable: boolean, options?: {
    schema?: string;
}): Promise<TriggerResult>;
export {};
