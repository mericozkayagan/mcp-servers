import fs from 'fs';
import path from 'path';
import os from 'os';
/**
 * Get the path to the database configuration file
 */
function getConfigPath() {
    return process.env.PGCONFIG_PATH || path.join(os.homedir(), 'db-config.json');
}
/**
 * Load the database configuration file
 */
function loadConfig() {
    const configPath = getConfigPath();
    try {
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configData);
            // Validate the config structure
            if (!config.connections || typeof config.connections !== 'object') {
                return { connections: {}, default: null };
            }
            return config;
        }
        else {
            // If file doesn't exist, create an empty config
            const emptyConfig = { connections: {}, default: null };
            fs.writeFileSync(configPath, JSON.stringify(emptyConfig, null, 2), 'utf8');
            return emptyConfig;
        }
    }
    catch (err) {
        console.error(`Error loading configuration: ${err instanceof Error ? err.message : String(err)}`);
        return { connections: {}, default: null };
    }
}
/**
 * Save the database configuration file
 */
function saveConfig(config) {
    const configPath = getConfigPath();
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return true;
    }
    catch (err) {
        console.error(`Error saving configuration: ${err instanceof Error ? err.message : String(err)}`);
        return false;
    }
}
/**
 * List all available database connections
 */
export async function listDatabaseConnections() {
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
    }
    catch (error) {
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
export async function addDatabaseConnection(name, connectionString) {
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
            details: { name, connectionString }
        };
    }
    catch (error) {
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
export async function removeDatabaseConnection(name) {
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
            details: { name }
        };
    }
    catch (error) {
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
export async function setDefaultConnection(name) {
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
            details: { name }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Failed to set default connection: ${error instanceof Error ? error.message : String(error)}`,
            details: null
        };
    }
}
//# sourceMappingURL=connections.js.map