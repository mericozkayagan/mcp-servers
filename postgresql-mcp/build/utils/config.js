import path from 'path';
import os from 'os';
// Default config path in user's home directory
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), 'db-config.json');
/**
 * Load database configuration from environment variables
 */
export function loadConfig() {
    // Initialize with empty config
    const config = {
        connections: {},
        default: null
    };
    // Check for JSON-encoded database map
    if (process.env.PG_DB_MAP) {
        try {
            const dbMap = JSON.parse(process.env.PG_DB_MAP);
            // Extract connections
            for (const [key, value] of Object.entries(dbMap)) {
                if (key !== 'default' && typeof value === 'string') {
                    config.connections[key.toLowerCase()] = value;
                }
            }
            // Extract default connection
            if (dbMap.default && typeof dbMap.default === 'string') {
                const defaultDb = dbMap.default.toLowerCase();
                if (config.connections[defaultDb]) {
                    config.default = defaultDb;
                }
            }
        }
        catch (err) {
            console.error(`Error parsing PG_DB_MAP: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    // If no connections loaded, check for legacy PG_CONNECTION_STRING
    if (Object.keys(config.connections).length === 0 && process.env.PG_CONNECTION_STRING) {
        config.connections['default'] = process.env.PG_CONNECTION_STRING;
        config.default = 'default';
    }
    return config;
}
// Cache for the loaded configuration
let configCache = null;
/**
 * Get a connection string by its name
 * @param {string} name - The name of the connection or the connection string
 * @returns {string|null} - The connection string or null if not found
 */
export function getConnectionString(name) {
    // If it's already a connection string, return it directly
    if (name && name.startsWith('postgresql://')) {
        return name;
    }
    // Load config if not cached
    if (!configCache) {
        configCache = loadConfig();
    }
    // If no name provided but we have a default, use that
    if (!name && configCache?.default) {
        return configCache.connections[configCache.default] || null;
    }
    // Look for the connection by name (case insensitive)
    const nameLower = name.toLowerCase();
    return configCache?.connections[nameLower] || null;
}
/**
 * List all available database connections
 */
export function listConnections() {
    // Load config if not cached
    if (!configCache) {
        configCache = loadConfig();
    }
    return configCache || { connections: {}, default: null };
}
// Initialize by loading the config when this module is imported
configCache = loadConfig();
//# sourceMappingURL=config.js.map