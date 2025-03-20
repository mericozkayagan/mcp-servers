import { DatabaseConnection } from '../utils/connection.js';

interface TriggerResult {
  success: boolean;
  message: string;
  details: unknown;
}

interface TriggerInfo {
  name: string;
  tableName: string;
  tableSchema: string;
  event: string;
  timing: string;
  definition: string;
  function: string;
  enabled: boolean;
}

/**
 * Get information about database triggers
 */
export async function getTriggers(
  connectionString: string,
  tableName?: string,
  schema: string = 'public'
): Promise<TriggerResult> {
  const db = DatabaseConnection.getInstance();
  
  try {
    await db.connect(connectionString);
    
    let query = `
      SELECT 
        t.tgname AS name,
        c.relname AS "tableName",
        n.nspname AS "tableSchema",
        CASE
          WHEN t.tgtype & (1<<0) THEN 'ROW'
          ELSE 'STATEMENT'
        END AS level,
        CASE
          WHEN t.tgtype & (1<<1) THEN 'BEFORE'
          WHEN t.tgtype & (1<<6) THEN 'INSTEAD OF'
          ELSE 'AFTER'
        END AS timing,
        CASE
          WHEN t.tgtype & (1<<2) THEN 'INSERT'
          WHEN t.tgtype & (1<<3) THEN 'DELETE'
          WHEN t.tgtype & (1<<4) THEN 'UPDATE'
          WHEN t.tgtype & (1<<5) THEN 'TRUNCATE'
          ELSE 'UNKNOWN'
        END AS event,
        p.proname AS function,
        pg_get_triggerdef(t.oid) AS definition,
        NOT t.tgdisabled AS enabled
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE NOT t.tgisinternal
    `;
    
    const params: string[] = [];
    
    if (schema) {
      query += ` AND n.nspname = $${params.length + 1}`;
      params.push(schema);
    }
    
    if (tableName) {
      query += ` AND c.relname = $${params.length + 1}`;
      params.push(tableName);
    }
    
    query += ' ORDER BY c.relname, t.tgname';
    
    const triggers = await db.query<TriggerInfo>(query, params);
    
    return {
      success: true,
      message: tableName 
        ? `Triggers for table ${schema}.${tableName}` 
        : `Found ${triggers.length} triggers in schema ${schema}`,
      details: triggers
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to get trigger information: ${error instanceof Error ? error.message : String(error)}`,
      details: null
    };
  } finally {
    await db.disconnect();
  }
}

/**
 * Create a trigger
 */
export async function createTrigger(
  connectionString: string,
  triggerName: string,
  tableName: string,
  functionName: string,
  options: {
    schema?: string;
    timing?: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
    events?: ('INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE')[];
    when?: string;
    forEach?: 'ROW' | 'STATEMENT';
    replace?: boolean;
  } = {}
): Promise<TriggerResult> {
  const db = DatabaseConnection.getInstance();
  
  try {
    await db.connect(connectionString);
    
    const schema = options.schema || 'public';
    const timing = options.timing || 'AFTER';
    const events = options.events || ['INSERT'];
    const forEach = options.forEach || 'ROW';
    const createOrReplace = options.replace ? 'CREATE OR REPLACE' : 'CREATE';
    
    // Build trigger creation SQL
    let sql = `
      ${createOrReplace} TRIGGER ${triggerName}
      ${timing} ${events.join(' OR ')}
      ON ${schema}.${tableName}
    `;
    
    // Add FOR EACH clause
    if (forEach) {
      sql += ` FOR EACH ${forEach}`;
    }
    
    // Add WHEN clause if provided
    if (options.when) {
      sql += ` WHEN (${options.when})`;
    }
    
    // Add EXECUTE PROCEDURE clause
    sql += ` EXECUTE FUNCTION ${functionName}()`;
    
    await db.query(sql);
    
    return {
      success: true,
      message: `Trigger ${triggerName} created successfully on ${schema}.${tableName}`,
      details: {
        name: triggerName,
        table: tableName,
        schema,
        timing,
        events,
        function: functionName
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create trigger: ${error instanceof Error ? error.message : String(error)}`,
      details: null
    };
  } finally {
    await db.disconnect();
  }
}

/**
 * Drop a trigger
 */
export async function dropTrigger(
  connectionString: string,
  triggerName: string,
  tableName: string,
  options: {
    schema?: string;
    ifExists?: boolean;
    cascade?: boolean;
  } = {}
): Promise<TriggerResult> {
  const db = DatabaseConnection.getInstance();
  
  try {
    await db.connect(connectionString);
    
    const schema = options.schema || 'public';
    const ifExists = options.ifExists ? 'IF EXISTS' : '';
    const cascade = options.cascade ? 'CASCADE' : '';
    
    // Build trigger drop SQL
    let sql = `DROP TRIGGER ${ifExists} ${triggerName} ON ${schema}.${tableName}`;
    
    // Add cascade if specified
    if (cascade) {
      sql += ` ${cascade}`;
    }
    
    await db.query(sql);
    
    return {
      success: true,
      message: `Trigger ${triggerName} dropped successfully from ${schema}.${tableName}`,
      details: {
        name: triggerName,
        table: tableName,
        schema
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to drop trigger: ${error instanceof Error ? error.message : String(error)}`,
      details: null
    };
  } finally {
    await db.disconnect();
  }
}

/**
 * Enable or disable a trigger
 */
export async function setTriggerState(
  connectionString: string,
  triggerName: string,
  tableName: string,
  enable: boolean,
  options: {
    schema?: string;
  } = {}
): Promise<TriggerResult> {
  const db = DatabaseConnection.getInstance();
  
  try {
    await db.connect(connectionString);
    
    const schema = options.schema || 'public';
    const action = enable ? 'ENABLE' : 'DISABLE';
    
    // Build trigger alter SQL
    const sql = `ALTER TABLE ${schema}.${tableName} ${action} TRIGGER ${triggerName}`;
    
    await db.query(sql);
    
    return {
      success: true,
      message: `Trigger ${triggerName} ${enable ? 'enabled' : 'disabled'} on ${schema}.${tableName}`,
      details: {
        name: triggerName,
        table: tableName,
        schema,
        enabled: enable
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to ${enable ? 'enable' : 'disable'} trigger: ${error instanceof Error ? error.message : String(error)}`,
      details: null
    };
  } finally {
    await db.disconnect();
  }
} 