interface SchemaResult {
    success: boolean;
    message: string;
    details: unknown;
}
/**
 * Get schema information for a database or specific table
 */
export declare function getSchemaInfo(connectionString: string, tableName?: string): Promise<SchemaResult>;
/**
 * Create a new table in the database
 */
export declare function createTable(connectionString: string, tableName: string, columns: {
    name: string;
    type: string;
    nullable?: boolean;
    default?: string;
}[]): Promise<SchemaResult>;
/**
 * Alter an existing table (add/modify/drop columns)
 */
export declare function alterTable(connectionString: string, tableName: string, operations: {
    type: 'add' | 'alter' | 'drop';
    columnName: string;
    dataType?: string;
    nullable?: boolean;
    default?: string;
}[]): Promise<SchemaResult>;
export {};
