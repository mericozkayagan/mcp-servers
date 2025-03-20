# PostgreSQL MCP Server - Developer Guide

This guide provides examples and best practices for using the PostgreSQL MCP server in your applications.

## Getting Started

### Installation

1. Install the server:
   ```bash
   npm install
   npm run build
   ```

2. Test the server:
   ```bash
   # On Unix/Linux/macOS
   ./test-client.js get_schema_info '{"connectionString":"postgresql://user:password@localhost:5432/dbname"}'
   
   # On Windows
   node test-client.js get_schema_info '{"connectionString":"postgresql://user:password@localhost:5432/dbname"}'
   ```

### Connection Strings

PostgreSQL connection strings follow this format:
```
postgresql://[user[:password]@][host][:port][/dbname][?param1=value1&...]
```

Examples:
- `postgresql://postgres:password@localhost:5432/mydb`
- `postgresql://postgres@localhost/mydb`
- `postgresql://postgres:password@localhost/mydb?sslmode=require`

## Tool Examples

### Schema Management

#### Get Schema Information

List all tables in a database:
```javascript
{
  "name": "get_schema_info",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb"
  }
}
```

Get detailed information about a specific table:
```javascript
{
  "name": "get_schema_info",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "tableName": "users"
  }
}
```

#### Create a Table

Create a new users table:
```javascript
{
  "name": "create_table",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "tableName": "users",
    "columns": [
      { "name": "id", "type": "SERIAL", "nullable": false },
      { "name": "username", "type": "VARCHAR(100)", "nullable": false },
      { "name": "email", "type": "VARCHAR(255)", "nullable": false },
      { "name": "created_at", "type": "TIMESTAMP", "default": "NOW()" }
    ]
  }
}
```

#### Alter a Table

Add, modify, and drop columns:
```javascript
{
  "name": "alter_table",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "tableName": "users",
    "operations": [
      { "type": "add", "columnName": "last_login", "dataType": "TIMESTAMP" },
      { "type": "alter", "columnName": "email", "nullable": false },
      { "type": "drop", "columnName": "temporary_field" }
    ]
  }
}
```

### Data Migration

#### Export Table Data

Export to JSON:
```javascript
{
  "name": "export_table_data",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "tableName": "users",
    "outputPath": "./exports/users.json",
    "where": "created_at > '2023-01-01'",
    "limit": 1000
  }
}
```

Export to CSV:
```javascript
{
  "name": "export_table_data",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "tableName": "users",
    "outputPath": "./exports/users.csv",
    "format": "csv"
  }
}
```

#### Import Table Data

Import from JSON:
```javascript
{
  "name": "import_table_data",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "tableName": "users",
    "inputPath": "./imports/users.json",
    "truncateFirst": true
  }
}
```

Import from CSV:
```javascript
{
  "name": "import_table_data",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "tableName": "users",
    "inputPath": "./imports/users.csv",
    "format": "csv",
    "delimiter": ","
  }
}
```

#### Copy Between Databases

Copy data between databases:
```javascript
{
  "name": "copy_between_databases",
  "arguments": {
    "sourceConnectionString": "postgresql://postgres:password@localhost:5432/source_db",
    "targetConnectionString": "postgresql://postgres:password@localhost:5432/target_db",
    "tableName": "users",
    "where": "active = true",
    "truncateTarget": false
  }
}
```

### Database Monitoring

#### Monitor Database

Basic monitoring:
```javascript
{
  "name": "monitor_database",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb"
  }
}
```

Advanced monitoring with alerts:
```javascript
{
  "name": "monitor_database",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "includeTables": true,
    "includeQueries": true,
    "includeLocks": true,
    "includeReplication": true,
    "alertThresholds": {
      "connectionPercentage": 80,
      "longRunningQuerySeconds": 30,
      "cacheHitRatio": 0.95,
      "deadTuplesPercentage": 10,
      "vacuumAge": 7
    }
  }
}
```

### Database Analysis and Debugging

#### Analyze Database

Analyze configuration:
```javascript
{
  "name": "analyze_database",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "analysisType": "configuration"
  }
}
```

Analyze performance:
```javascript
{
  "name": "analyze_database",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "analysisType": "performance"
  }
}
```

Analyze security:
```javascript
{
  "name": "analyze_database",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "analysisType": "security"
  }
}
```

#### Debug Database Issues

Debug connection issues:
```javascript
{
  "name": "debug_database",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "issue": "connection",
    "logLevel": "debug"
  }
}
```

Debug performance issues:
```javascript
{
  "name": "debug_database",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "issue": "performance",
    "logLevel": "debug"
  }
}
```

Debug lock issues:
```javascript
{
  "name": "debug_database",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "issue": "locks",
    "logLevel": "debug"
  }
}
```

Debug replication issues:
```javascript
{
  "name": "debug_database",
  "arguments": {
    "connectionString": "postgresql://postgres:password@localhost:5432/mydb",
    "issue": "replication",
    "logLevel": "debug"
  }
}
```

#### Get Setup Instructions

Get Linux setup instructions:
```javascript
{
  "name": "get_setup_instructions",
  "arguments": {
    "platform": "linux",
    "version": "15",
    "useCase": "production"
  }
}
```

Get macOS setup instructions:
```javascript
{
  "name": "get_setup_instructions",
  "arguments": {
    "platform": "macos",
    "version": "15",
    "useCase": "development"
  }
}
```

Get Windows setup instructions:
```javascript
{
  "name": "get_setup_instructions",
  "arguments": {
    "platform": "windows",
    "version": "15",
    "useCase": "production"
  }
}
```

## Best Practices

1. **Connection Pooling**: The server implements connection pooling internally, but you should still close connections when done.

2. **Error Handling**: Always check the `success` field in responses and handle errors appropriately.

3. **Security**: 
   - Never hardcode connection strings with passwords in your code
   - Use environment variables or secure vaults for credentials
   - Use SSL connections in production environments

4. **Performance**:
   - Limit the amount of data returned by using WHERE clauses and LIMIT
   - For large data exports/imports, consider using batching
   - Monitor query performance regularly

5. **Monitoring**:
   - Set up regular monitoring to catch issues early
   - Configure appropriate alert thresholds based on your application needs
   - Pay special attention to connection usage and cache hit ratio

## Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Check that the PostgreSQL server is running
   - Verify connection string parameters
   - Ensure network connectivity between the MCP server and PostgreSQL

2. **Permission Errors**:
   - Verify that the user has appropriate permissions for the requested operations
   - Check schema and table permissions

3. **Performance Issues**:
   - Use the `analyze_database` and `debug_database` tools to identify bottlenecks
   - Check for long-running queries
   - Verify proper indexing on tables

4. **Data Migration Issues**:
   - Ensure table schemas match when copying between databases
   - Check disk space for large exports
   - Verify file permissions for import/export paths 