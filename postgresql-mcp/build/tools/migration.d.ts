interface MigrationResult {
    success: boolean;
    message: string;
    details: Record<string, unknown>;
}
/**
 * Export table data to JSON format
 */
export declare function exportTableData(connectionString: string, tableName: string, outputPath: string, options?: {
    where?: string;
    limit?: number;
    format?: 'json' | 'csv';
}): Promise<MigrationResult>;
/**
 * Import data from JSON or CSV file into a table
 */
export declare function importTableData(connectionString: string, tableName: string, inputPath: string, options?: {
    truncateFirst?: boolean;
    format?: 'json' | 'csv';
    delimiter?: string;
}): Promise<MigrationResult>;
/**
 * Copy data between two databases
 */
export declare function copyBetweenDatabases(sourceConnectionString: string, targetConnectionString: string, tableName: string, options?: {
    where?: string;
    truncateTarget?: boolean;
}): Promise<MigrationResult>;
export {};
