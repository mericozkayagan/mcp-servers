// Define a strongly-typed interface for database configuration
interface DbConfig {
  connections: Record<string, string>;
  default: string | null;
}

// Define a strongly-typed interface for connection result
interface ConnectionResult {
  success: boolean;
  message: string;
  details: unknown;
}

/**
 * Get the path to the database configuration file
 */
function getConfigPath(): string {
  return process.env.PGCONFIG_PATH || path.join(os.homedir(), 'db-config.json');
}

/**
 * Load database configuration from environment variables
 */
function loadConfig(): DbConfig {
  const config: DbConfig = {
    connections: {},
    default: null
  };

  // Check for JSON-encoded database map
  if (process.env.PG_DB_MAP) {
    try {
      const dbMap = JSON.parse(process.env.PG_DB_MAP) as Record<string, string>;

      // Extract connections
      for (const [key, value] of Object.entries(dbMap)) {
        if (key !== 'default' && typeof value === 'string') {
          config.connections[key] = value;
        }
      }

      // Extract default connection
      if (dbMap.default && typeof dbMap.default === 'string') {
        config.default = dbMap.default;
      }
    } catch (err) {
      console.error(`Error parsing PG_DB_MAP: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return config;
}

/**
 * Save changes to database configuration
 */
function saveConfig(config: DbConfig): boolean {
  try {
    // We need to update the PG_DB_MAP environment variable
    // This won't persist after restart, but it will work for the current session
    const jsonConfig = JSON.stringify(config);
    process.env.PG_DB_MAP = jsonConfig;

    console.log('Database configuration updated in memory');
    console.log('Note: To make this change permanent, update your ~/.cursor/mcp.json file');

    return true;
  } catch (err) {
    console.error(`Error saving configuration: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

/**
 * List all available database connections
 */
export async function listDatabaseConnections(): Promise<ConnectionResult> {
  try {
    const config = loadConfig();

    return {
      success: true,
      message: 'Database connections',
      details: {
        connections: Object.keys(config.connections).map(name => ({
          name,
          connectionString: config.connections[name],
          isDefault: name === config.default
        })),
        default: config.default
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to list database connections: ${error instanceof Error ? error.message : String(error)}`,
      details: null
    };
  }
}

/**
 * Add a new database connection
 */
export async function addDatabaseConnection(
  name: string,
  connectionString: string
): Promise<ConnectionResult> {
  try {
    const config = loadConfig();

    // Add the connection
    config.connections[name] = connectionString;

    // If this is the first connection, set it as default
    if (!config.default) {
      config.default = name;
    }

    // Save the config
    if (!saveConfig(config)) {
      throw new Error('Failed to save configuration');
    }

    return {
      success: true,
      message: `Added database connection "${name}"`,
      details: {
        name,
        connectionString,
        note: "Connection added in memory. To make permanent, update ~/.cursor/mcp.json"
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to add database connection: ${error instanceof Error ? error.message : String(error)}`,
      details: null
    };
  }
}

/**
 * Remove a database connection
 */
export async function removeDatabaseConnection(
  name: string
): Promise<ConnectionResult> {
  try {
    const config = loadConfig();

    // Check if the connection exists
    if (!config.connections[name]) {
      throw new Error(`Connection "${name}" does not exist`);
    }

    // Remove the connection
    delete config.connections[name];

    // If this was the default, clear the default or set a new one
    if (config.default === name) {
      const connectionNames = Object.keys(config.connections);
      config.default = connectionNames.length > 0 ? connectionNames[0] : null;
    }

    // Save the config
    if (!saveConfig(config)) {
      throw new Error('Failed to save configuration');
    }

    return {
      success: true,
      message: `Removed database connection "${name}"`,
      details: {
        name,
        note: "Connection removed in memory. To make permanent, update ~/.cursor/mcp.json"
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to remove database connection: ${error instanceof Error ? error.message : String(error)}`,
      details: null
    };
  }
}

/**
 * Set the default database connection
 */
export async function setDefaultConnection(
  name: string
): Promise<ConnectionResult> {
  try {
    const config = loadConfig();

    // Check if the connection exists
    if (!config.connections[name]) {
      throw new Error(`Connection "${name}" does not exist`);
    }

    // Set as default
    config.default = name;

    // Save the config
    if (!saveConfig(config)) {
      throw new Error('Failed to save configuration');
    }

    return {
      success: true,
      message: `Set "${name}" as the default database connection`,
      details: {
        name,
        note: "Default updated in memory. To make permanent, update ~/.cursor/mcp.json"
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to set default connection: ${error instanceof Error ? error.message : String(error)}`,
      details: null
    };
  }
}