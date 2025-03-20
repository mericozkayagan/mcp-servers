# PostgreSQL MCP Server Documentation

## Overview

The PostgreSQL MCP Server is a Model Context Protocol (MCP) server that provides PostgreSQL database management capabilities. This documentation set covers all aspects of using, understanding, and developing the server.

## Documentation Structure

### 1. [README](../README.md)
- Project overview
- Feature summary
- Installation instructions
- Basic usage
- Security considerations
- Best practices

### 2. [Usage Guide](USAGE.md)
- Detailed tool usage
- Common patterns
- Configuration examples
- Troubleshooting
- Best practices
- Common issues and solutions

### 3. [Technical Documentation](TECHNICAL.md)
- Architecture overview
- Tool specifications
- Implementation details
- Error handling
- Performance considerations
- Security implementation

### 4. [Development Guide](DEVELOPMENT.md)
- Development environment setup
- Project structure
- Adding new features
- Testing guidelines
- Error handling
- Documentation standards
- Release process

## Quick Start

1. **Installation**
   ```bash
   npm install postgresql-mcp-server
   ```

2. **Basic Usage**
   ```typescript
   // Analyze database
   const result = await useMcpTool("postgresql-mcp", "analyze_database", {
     connectionString: "postgresql://user:password@localhost:5432/dbname",
     analysisType: "performance"
   });
   ```

## Tool Reference

### 1. analyze_database
Analyzes PostgreSQL database configuration and performance.
- [Technical Specification](TECHNICAL.md#1-analyze_database)
- [Usage Guide](USAGE.md#1-database-analysis)
- [Implementation Details](DEVELOPMENT.md#1-creating-a-new-tool)

### 2. get_setup_instructions
Provides platform-specific setup guidance.
- [Technical Specification](TECHNICAL.md#2-get_setup_instructions)
- [Usage Guide](USAGE.md#2-setup-instructions)
- [Implementation Details](DEVELOPMENT.md#2-adding-database-features)

### 3. debug_database
Helps troubleshoot database issues.
- [Technical Specification](TECHNICAL.md#3-debug_database)
- [Usage Guide](USAGE.md#3-database-debugging)
- [Implementation Details](DEVELOPMENT.md#3-adding-utility-functions)

## Contributing

See the [Development Guide](DEVELOPMENT.md) for detailed information on:
- Setting up development environment
- Code style and standards
- Testing requirements
- Documentation guidelines
- Release process

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPLv3).
See the [LICENSE](../LICENSE) file for details.

## Support

- Review the [Usage Guide](USAGE.md) for common issues
- Check [Technical Documentation](TECHNICAL.md) for implementation details
- Follow the [Development Guide](DEVELOPMENT.md) for contribution guidelines
- Submit issues through the project's issue tracker

## Version History

See [CHANGELOG.md](../CHANGELOG.md) for a detailed list of changes.

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MCP Protocol Documentation](https://modelcontextprotocol.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)