import { DatabaseConnection } from '../utils/connection.js';

interface QueryResult {
  success: boolean;
  message: string;
  details: unknown;
}

/**
 * Execute a SELECT SQL query against the database
 */
export async function executeQuery(
  connectionString: string,
  query: string,
  params: any[] = []
): Promise<QueryResult> {
  // Security check - only allow SELECT queries
  if (!query.trim().toLowerCase().startsWith('select')) {
    return {
      success: false,
      message: 'Only SELECT queries are allowed for security reasons',
      details: null
    };
  }

  const db = DatabaseConnection.getInstance();

  try {
    await db.connect(connectionString, { ssl: { rejectUnauthorized: false } });

    // Execute the query
    const results = await db.query(query, params);

    return {
      success: true,
      message: `Query executed successfully. Returned ${results.length} rows.`,
      details: results
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to execute query: ${error instanceof Error ? error.message : String(error)}`,
      details: null
    };
  } finally {
    await db.disconnect();
  }
}