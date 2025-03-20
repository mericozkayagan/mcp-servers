import { DatabaseConnection } from '../utils/connection.js';
/**
 * Get schema information for a database or specific table
 */
export async function getSchemaInfo(connectionString, tableName) {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        if (tableName) {
            // Get schema for specific table
            const tableInfo = await getTableInfo(db, tableName);
            return {
                success: true,
                message: `Schema information for table ${tableName}`,
                details: tableInfo
            };
        }
        else {
            // Get list of all tables
            const tables = await db.query(`SELECT table_name 
         FROM information_schema.tables 
         WHERE table_schema = 'public'
         ORDER BY table_name`);
            return {
                success: true,
                message: 'List of tables in database',
                details: tables.map(t => t.table_name)
            };
        }
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to get schema information: ${error instanceof Error ? error.message : String(error)}`,
            details: null
        };
    }
    finally {
        await db.disconnect();
    }
}
/**
 * Create a new table in the database
 */
export async function createTable(connectionString, tableName, columns) {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        // Build CREATE TABLE statement
        const columnDefs = columns.map(col => {
            let def = `"${col.name}" ${col.type}`;
            if (col.nullable === false)
                def += ' NOT NULL';
            if (col.default !== undefined)
                def += ` DEFAULT ${col.default}`;
            return def;
        }).join(', ');
        const createTableSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnDefs})`;
        await db.query(createTableSQL);
        return {
            success: true,
            message: `Table ${tableName} created successfully`,
            details: { tableName, columns }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to create table: ${error instanceof Error ? error.message : String(error)}`,
            details: null
        };
    }
    finally {
        await db.disconnect();
    }
}
/**
 * Alter an existing table (add/modify/drop columns)
 */
export async function alterTable(connectionString, tableName, operations) {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        // Execute each operation in a transaction
        await db.transaction(async (client) => {
            for (const op of operations) {
                let sql = '';
                switch (op.type) {
                    case 'add':
                        if (!op.dataType)
                            throw new Error('Data type is required for add operation');
                        sql = `ALTER TABLE "${tableName}" ADD COLUMN "${op.columnName}" ${op.dataType}`;
                        if (op.nullable === false)
                            sql += ' NOT NULL';
                        if (op.default !== undefined)
                            sql += ` DEFAULT ${op.default}`;
                        break;
                    case 'alter':
                        sql = `ALTER TABLE "${tableName}" ALTER COLUMN "${op.columnName}"`;
                        if (op.dataType)
                            sql += ` TYPE ${op.dataType}`;
                        if (op.nullable !== undefined) {
                            sql += op.nullable ? ' DROP NOT NULL' : ' SET NOT NULL';
                        }
                        if (op.default !== undefined) {
                            sql += op.default === null
                                ? ' DROP DEFAULT'
                                : ` SET DEFAULT ${op.default}`;
                        }
                        break;
                    case 'drop':
                        sql = `ALTER TABLE "${tableName}" DROP COLUMN "${op.columnName}"`;
                        break;
                }
                await client.query(sql);
            }
        });
        return {
            success: true,
            message: `Table ${tableName} altered successfully`,
            details: { tableName, operations }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to alter table: ${error instanceof Error ? error.message : String(error)}`,
            details: null
        };
    }
    finally {
        await db.disconnect();
    }
}
/**
 * Get detailed information about a specific table
 */
async function getTableInfo(db, tableName) {
    // Get column information
    const columns = await db.query(`SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`, [tableName]);
    // Get constraint information
    const constraints = await db.query(`SELECT
       c.conname as constraint_name,
       CASE
         WHEN c.contype = 'p' THEN 'PRIMARY KEY'
         WHEN c.contype = 'f' THEN 'FOREIGN KEY'
         WHEN c.contype = 'u' THEN 'UNIQUE'
         WHEN c.contype = 'c' THEN 'CHECK'
         ELSE c.contype::text
       END as constraint_type,
       pg_get_constraintdef(c.oid) as definition
     FROM pg_constraint c
     JOIN pg_namespace n ON n.oid = c.connamespace
     JOIN pg_class cl ON cl.oid = c.conrelid
     WHERE n.nspname = 'public' AND cl.relname = $1`, [tableName]);
    // Get index information
    const indexes = await db.query(`SELECT
       i.relname as indexname,
       pg_get_indexdef(i.oid) as indexdef
     FROM pg_index x
     JOIN pg_class c ON c.oid = x.indrelid
     JOIN pg_class i ON i.oid = x.indexrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r' AND n.nspname = 'public' AND c.relname = $1`, [tableName]);
    return {
        tableName,
        columns: columns.map(col => ({
            name: col.column_name,
            dataType: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default
        })),
        constraints: constraints.map(con => ({
            name: con.constraint_name,
            type: con.constraint_type,
            definition: con.definition
        })),
        indexes: indexes.map(idx => ({
            name: idx.indexname,
            definition: idx.indexdef
        }))
    };
}
//# sourceMappingURL=schema.js.map