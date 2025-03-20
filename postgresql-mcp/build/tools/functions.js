import { DatabaseConnection } from '../utils/connection.js';
/**
 * Get information about database functions
 */
export async function getFunctions(connectionString, functionName, schema = 'public') {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        let query = `
      SELECT 
        p.proname AS name,
        l.lanname AS language,
        pg_get_function_result(p.oid) AS "returnType",
        pg_get_function_arguments(p.oid) AS "arguments",
        CASE
          WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
          WHEN p.provolatile = 's' THEN 'STABLE'
          WHEN p.provolatile = 'v' THEN 'VOLATILE'
        END AS volatility,
        pg_get_functiondef(p.oid) AS definition,
        a.rolname AS owner
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      JOIN pg_authid a ON p.proowner = a.oid
      WHERE n.nspname = $1
    `;
        const params = [schema];
        if (functionName) {
            query += ' AND p.proname = $2';
            params.push(functionName);
        }
        query += ' ORDER BY p.proname';
        const functions = await db.query(query, params);
        return {
            success: true,
            message: functionName
                ? `Function information for ${functionName}`
                : `Found ${functions.length} functions in schema ${schema}`,
            details: functions
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to get function information: ${error instanceof Error ? error.message : String(error)}`,
            details: null
        };
    }
    finally {
        await db.disconnect();
    }
}
/**
 * Create or replace a database function
 */
export async function createFunction(connectionString, functionName, parameters, returnType, functionBody, options = {}) {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        const language = options.language || 'plpgsql';
        const volatility = options.volatility || 'VOLATILE';
        const schema = options.schema || 'public';
        const security = options.security || 'INVOKER';
        const createOrReplace = options.replace ? 'CREATE OR REPLACE' : 'CREATE';
        // Build function creation SQL
        const sql = `
      ${createOrReplace} FUNCTION ${schema}.${functionName}(${parameters})
      RETURNS ${returnType}
      LANGUAGE ${language}
      ${volatility}
      SECURITY ${security}
      AS $function$
      ${functionBody}
      $function$;
    `;
        await db.query(sql);
        return {
            success: true,
            message: `Function ${functionName} created successfully`,
            details: {
                name: functionName,
                schema,
                returnType,
                language,
                volatility,
                security
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to create function: ${error instanceof Error ? error.message : String(error)}`,
            details: null
        };
    }
    finally {
        await db.disconnect();
    }
}
/**
 * Drop a database function
 */
export async function dropFunction(connectionString, functionName, parameters, options = {}) {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        const schema = options.schema || 'public';
        const ifExists = options.ifExists ? 'IF EXISTS' : '';
        const cascade = options.cascade ? 'CASCADE' : '';
        // Build function drop SQL
        let sql = `DROP FUNCTION ${ifExists} ${schema}.${functionName}`;
        // Add parameters if provided
        if (parameters) {
            sql += `(${parameters})`;
        }
        // Add cascade if specified
        if (cascade) {
            sql += ` ${cascade}`;
        }
        await db.query(sql);
        return {
            success: true,
            message: `Function ${functionName} dropped successfully`,
            details: {
                name: functionName,
                schema
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to drop function: ${error instanceof Error ? error.message : String(error)}`,
            details: null
        };
    }
    finally {
        await db.disconnect();
    }
}
/**
 * Enable Row-Level Security (RLS) on a table
 */
export async function enableRLS(connectionString, tableName, schema = 'public') {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        await db.query(`ALTER TABLE ${schema}.${tableName} ENABLE ROW LEVEL SECURITY`);
        return {
            success: true,
            message: `Row-Level Security enabled on ${schema}.${tableName}`,
            details: {
                table: tableName,
                schema
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to enable RLS: ${error instanceof Error ? error.message : String(error)}`,
            details: null
        };
    }
    finally {
        await db.disconnect();
    }
}
/**
 * Disable Row-Level Security (RLS) on a table
 */
export async function disableRLS(connectionString, tableName, schema = 'public') {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        await db.query(`ALTER TABLE ${schema}.${tableName} DISABLE ROW LEVEL SECURITY`);
        return {
            success: true,
            message: `Row-Level Security disabled on ${schema}.${tableName}`,
            details: {
                table: tableName,
                schema
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to disable RLS: ${error instanceof Error ? error.message : String(error)}`,
            details: null
        };
    }
    finally {
        await db.disconnect();
    }
}
/**
 * Create a Row-Level Security policy
 */
export async function createRLSPolicy(connectionString, tableName, policyName, using, check, options = {}) {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        const schema = options.schema || 'public';
        const command = options.command || 'ALL';
        const createOrReplace = options.replace ? 'CREATE OR REPLACE' : 'CREATE';
        // Build policy creation SQL
        let sql = `
      ${createOrReplace} POLICY ${policyName}
      ON ${schema}.${tableName}
      FOR ${command}
    `;
        // Add role if specified
        if (options.role) {
            sql += ` TO ${options.role}`;
        }
        // Add USING expression
        sql += ` USING (${using})`;
        // Add WITH CHECK expression if provided
        if (check) {
            sql += ` WITH CHECK (${check})`;
        }
        await db.query(sql);
        return {
            success: true,
            message: `Policy ${policyName} created successfully on ${schema}.${tableName}`,
            details: {
                table: tableName,
                schema,
                policy: policyName,
                command
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to create policy: ${error instanceof Error ? error.message : String(error)}`,
            details: null
        };
    }
    finally {
        await db.disconnect();
    }
}
/**
 * Drop a Row-Level Security policy
 */
export async function dropRLSPolicy(connectionString, tableName, policyName, options = {}) {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        const schema = options.schema || 'public';
        const ifExists = options.ifExists ? 'IF EXISTS' : '';
        await db.query(`DROP POLICY ${ifExists} ${policyName} ON ${schema}.${tableName}`);
        return {
            success: true,
            message: `Policy ${policyName} dropped successfully from ${schema}.${tableName}`,
            details: {
                table: tableName,
                schema,
                policy: policyName
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to drop policy: ${error instanceof Error ? error.message : String(error)}`,
            details: null
        };
    }
    finally {
        await db.disconnect();
    }
}
/**
 * Get Row-Level Security policies for a table
 */
export async function getRLSPolicies(connectionString, tableName, schema = 'public') {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        let query = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        roles,
        cmd,
        qual as "using",
        with_check as "check"
      FROM pg_policies
      WHERE schemaname = $1
    `;
        const params = [schema];
        if (tableName) {
            query += ' AND tablename = $2';
            params.push(tableName);
        }
        query += ' ORDER BY tablename, policyname';
        const policies = await db.query(query, params);
        return {
            success: true,
            message: tableName
                ? `Policies for table ${schema}.${tableName}`
                : `All policies in schema ${schema}`,
            details: policies
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to get policies: ${error instanceof Error ? error.message : String(error)}`,
            details: null
        };
    }
    finally {
        await db.disconnect();
    }
}
//# sourceMappingURL=functions.js.map