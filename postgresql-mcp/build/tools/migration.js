import { DatabaseConnection } from '../utils/connection.js';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
/**
 * Export table data to JSON format
 */
export async function exportTableData(connectionString, tableName, outputPath, options = {}) {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        // Build query with optional WHERE clause and LIMIT
        let query = `SELECT * FROM "${tableName}"`;
        const params = [];
        if (options.where) {
            query += ` WHERE ${options.where}`;
        }
        if (options.limit) {
            query += ` LIMIT ${options.limit}`;
        }
        // Execute query
        const data = await db.query(query, params);
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        await mkdir(dir, { recursive: true });
        // Write data to file
        if (options.format === 'csv') {
            // Simple CSV export (could be enhanced with a proper CSV library)
            if (data.length === 0) {
                await writeFile(outputPath, '');
            }
            else {
                const headers = Object.keys(data[0]).join(',');
                const rows = data.map(row => Object.values(row).map(value => typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value).join(','));
                await writeFile(outputPath, [headers, ...rows].join('\n'));
            }
        }
        else {
            // Default to JSON
            await writeFile(outputPath, JSON.stringify(data, null, 2));
        }
        return {
            success: true,
            message: `Successfully exported ${data.length} rows from ${tableName}`,
            details: {
                tableName,
                rowCount: data.length,
                outputPath
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to export data: ${error instanceof Error ? error.message : String(error)}`,
            details: { tableName }
        };
    }
    finally {
        await db.disconnect();
    }
}
/**
 * Import data from JSON or CSV file into a table
 */
export async function importTableData(connectionString, tableName, inputPath, options = {}) {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        // Read file content
        const fileContent = await readFile(inputPath, 'utf8');
        let data;
        // Parse file based on format
        if (options.format === 'csv') {
            const delimiter = options.delimiter || ',';
            const lines = fileContent.split('\n').filter(line => line.trim());
            if (lines.length === 0) {
                return {
                    success: true,
                    message: 'CSV file is empty, no data to import',
                    details: { tableName, rowCount: 0 }
                };
            }
            const headers = lines[0].split(delimiter).map(h => h.trim());
            data = lines.slice(1).map(line => {
                const values = line.split(delimiter);
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index]?.trim() || null;
                    return obj;
                }, {});
            });
        }
        else {
            // Default to JSON
            data = JSON.parse(fileContent);
        }
        if (!Array.isArray(data)) {
            throw new Error('Input file does not contain an array of records');
        }
        // Truncate table if requested
        if (options.truncateFirst) {
            await db.query(`TRUNCATE TABLE "${tableName}"`);
        }
        // Import data in a transaction
        let importedCount = 0;
        if (data.length > 0) {
            await db.transaction(async (client) => {
                for (const record of data) {
                    const columns = Object.keys(record);
                    const values = Object.values(record);
                    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                    const query = `
            INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')})
            VALUES (${placeholders})
          `;
                    await client.query(query, values);
                    importedCount++;
                }
            });
        }
        return {
            success: true,
            message: `Successfully imported ${importedCount} rows into ${tableName}`,
            details: {
                tableName,
                rowCount: importedCount
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to import data: ${error instanceof Error ? error.message : String(error)}`,
            details: { tableName }
        };
    }
    finally {
        await db.disconnect();
    }
}
/**
 * Copy data between two databases
 */
export async function copyBetweenDatabases(sourceConnectionString, targetConnectionString, tableName, options = {}) {
    const sourceDb = DatabaseConnection.getInstance();
    const targetDb = DatabaseConnection.getInstance();
    try {
        // Connect to source database
        await sourceDb.connect(sourceConnectionString);
        // Build query with optional WHERE clause
        let query = `SELECT * FROM "${tableName}"`;
        if (options.where) {
            query += ` WHERE ${options.where}`;
        }
        // Get data from source
        const data = await sourceDb.query(query);
        if (data.length === 0) {
            return {
                success: true,
                message: 'No data to copy',
                details: { tableName, rowCount: 0 }
            };
        }
        // Disconnect from source
        await sourceDb.disconnect();
        // Connect to target database
        await targetDb.connect(targetConnectionString);
        // Truncate target table if requested
        if (options.truncateTarget) {
            await targetDb.query(`TRUNCATE TABLE "${tableName}"`);
        }
        // Import data in a transaction
        let importedCount = 0;
        await targetDb.transaction(async (client) => {
            for (const record of data) {
                const columns = Object.keys(record);
                const values = Object.values(record);
                const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                const insertQuery = `
          INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')})
          VALUES (${placeholders})
        `;
                await client.query(insertQuery, values);
                importedCount++;
            }
        });
        return {
            success: true,
            message: `Successfully copied ${importedCount} rows from source to target database`,
            details: {
                tableName,
                rowCount: importedCount
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to copy data: ${error instanceof Error ? error.message : String(error)}`,
            details: { tableName }
        };
    }
    finally {
        // Ensure both connections are closed
        await sourceDb.disconnect();
        await targetDb.disconnect();
    }
}
//# sourceMappingURL=migration.js.map