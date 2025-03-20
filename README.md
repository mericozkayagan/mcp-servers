# MCP Servers for Cursor AI

This repository contains Model Context Protocol (MCP) server setups for Cursor AI, enabling integration with external tools and databases.

## Available MCP Servers

### 1. PostgreSQL MCP Server

A full-featured Model Context Protocol (MCP) server that provides PostgreSQL database management capabilities. This server assists with analyzing existing PostgreSQL setups, providing implementation guidance, debugging database issues, managing schemas, migrating data, and monitoring database performance.

- **Location**: `./postgresql-mcp/`
- **Features**: Database analysis, schema management, data migration, monitoring
- **Source**: [HenkDz/postgresql-mcp-server](https://github.com/HenkDz/postgresql-mcp-server)

#### Main Tools

- `analyze_database`: Analyze PostgreSQL configuration and performance
- `get_setup_instructions`: Get step-by-step PostgreSQL setup guidance
- `debug_database`: Debug common PostgreSQL issues
- `get_schema_info`: Retrieve database schema information
- `create_table`, `alter_table`: Manage database tables
- `export_table_data`, `import_table_data`: Migrate data between formats
- `copy_between_databases`: Copy data between PostgreSQL instances
- `monitor_database`: Real-time monitoring of PostgreSQL metrics

#### Usage Examples in Cursor AI

- "Analyze my PostgreSQL database at postgresql://user:password@localhost:5432/dbname"
- "Show me the schema for the users table in my PostgreSQL database"
- "Create a new products table with id, name, price, and created_at columns"
- "Monitor my database performance and show me any queries taking longer than 30 seconds"

### 2. Obsidian MCP Server

A server that enables AI interaction with Obsidian.md notes and vaults through the Local REST API plugin. This allows you to search, read, and write content in your Obsidian vault directly from Cursor AI.

- **Location**: `./obsidian-mcp/`
- **Features**: List files, search notes, read and write content
- **Source**: [MarkusPfundstein/mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian)
- **Requires**: Obsidian with the Local REST API plugin installed

#### Main Tools

- `list_files_in_vault`: List all files in your Obsidian vault
- `list_files_in_dir`: List files in a specific directory
- `get_file_contents`: Get the content of a specific note
- `simple_search`: Search your vault for text matches
- `complex_search`: Advanced search with pattern matching
- `patch_content`: Insert content into existing notes
- `append_content`: Add content to new or existing notes
- `batch_get_file_contents`: Retrieve multiple files at once

#### Usage Examples in Cursor AI

- "List all files in my Obsidian vault"
- "Get the content of my note called 'Project Requirements'"
- "Search my vault for all mentions of 'machine learning'"
- "Create a new note called 'Meeting Summary' with a summary of the latest project meeting"
- "Add today's tasks to my 'Daily Notes' file under the heading 'Tasks'"

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- Python 3.11 or higher with pip
- Obsidian.md with Local REST API plugin installed (for Obsidian integration)
- PostgreSQL database (for PostgreSQL integration)

### PostgreSQL Server Setup

1. Navigate to the PostgreSQL MCP directory:

   ```bash
   cd postgresql-mcp
   ```

2. Install dependencies and build:

   ```bash
   npm install
   npm run build
   ```

3. The server will be built to `build/index.js`

### Obsidian Server Setup

1. Install the Local REST API plugin in Obsidian:

   - Open Obsidian settings → Community plugins
   - Browse for "Local REST API" and install
   - Enable the plugin and copy the API key from settings

2. Navigate to the Obsidian MCP directory:

   ```bash
   cd obsidian-mcp
   ```

3. Install the package in development mode:

   ```bash
   pip install -e .
   ```

4. Set your API key in `.env` file or in the MCP configuration

### Configuration for Cursor AI

Edit your Cursor AI MCP configuration file at `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "postgresql-mcp": {
      "command": "node",
      "args": ["/path/to/mcp-servers/postgresql-mcp/build/index.js"],
      "env": {
        "PG_DB_MAP": "{\"db1\":\"postgresql://username:password@hostname:5432/database_name?sslmode=require\",\"analytics\":\"postgresql://analytics_user:secure_password@analytics-db.example.com:5432/analytics?sslmode=require\",\"default\":\"db1\"}"
      }
    },
    "mcp-obsidian": {
      "command": "/path/to/python/bin/mcp-obsidian",
      "args": [],
      "env": {
        "OBSIDIAN_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Replace paths, database connection details, and API key with your actual values. The `PG_DB_MAP` environment variable lets you configure multiple database connections and reference them by name.

## Debugging

### Log Files

- PostgreSQL MCP logs: `~/Library/Logs/Cursor/mcp-server-postgresql-mcp.log`
- Obsidian MCP logs: `~/Library/Logs/Cursor/mcp-server-mcp-obsidian.log`

### Using MCP Inspector

For PostgreSQL:

```bash
npx @modelcontextprotocol/inspector node /path/to/postgresql-mcp/build/index.js
```

For Obsidian:

```bash
npx @modelcontextprotocol/inspector /path/to/python/bin/mcp-obsidian
```

## Security Considerations

- PostgreSQL connection strings contain sensitive credentials - use environment variables when possible
- The Obsidian MCP server has read/write access to your notes - review permissions carefully
- Both servers run locally on your machine and don't expose services to the network by default
