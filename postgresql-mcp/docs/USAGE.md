# PostgreSQL MCP Server Usage Guide

## Overview

The PostgreSQL MCP Server provides tools for managing and analyzing PostgreSQL databases through the Model Context Protocol (MCP). This guide covers common usage patterns and examples.

## Tools

### 1. Database Analysis

The `analyze_database` tool provides comprehensive database analysis:

```typescript
const result = await useMcpTool("postgresql-mcp", "analyze_database", {
  connectionString: "postgresql://user:password@localhost:5432/dbname",
  analysisType: "performance"
});
```

#### Analysis Types

1. **Configuration Analysis**
   ```typescript
   {
     "connectionString": "postgresql://user:password@localhost:5432/dbname",
     "analysisType": "configuration"
   }
   ```
   - Reviews database settings
   - Checks configuration parameters
   - Validates security settings
   - Suggests optimizations

2. **Performance Analysis**
   ```typescript
   {
     "connectionString": "postgresql://user:password@localhost:5432/dbname",
     "analysisType": "performance"
   }
   ```
   - Query performance metrics
   - Index usage statistics
   - Buffer cache hit ratios
   - Table statistics

3. **Security Analysis**
   ```typescript
   {
     "connectionString": "postgresql://user:password@localhost:5432/dbname",
     "analysisType": "security"
   }
   ```
   - Permission audits
   - Security configuration review
   - SSL/TLS settings
   - Access control validation

### 2. Setup Instructions

The `get_setup_instructions` tool provides platform-specific guidance:

```typescript
const instructions = await useMcpTool("postgresql-mcp", "get_setup_instructions", {
  platform: "linux",
  version: "15",
  useCase: "production"
});
```

#### Use Cases

1. **Development Setup**
   ```typescript
   {
     "platform": "linux",
     "version": "15",
     "useCase": "development"
   }
   ```
   - Local installation steps
   - Development configurations
   - Testing environment setup
   - Debug settings

2. **Production Setup**
   ```typescript
   {
     "platform": "linux",
     "version": "15",
     "useCase": "production"
   }
   ```
   - Production-grade configurations
   - Security hardening steps
   - Performance optimizations
   - Monitoring setup

### 3. Database Debugging

The `debug_database` tool helps troubleshoot issues:

```typescript
const debug = await useMcpTool("postgresql-mcp", "debug_database", {
  connectionString: "postgresql://user:password@localhost:5432/dbname",
  issue: "performance",
  logLevel: "debug"
});
```

#### Debug Categories

1. **Connection Issues**
   ```typescript
   {
     "connectionString": "postgresql://user:password@localhost:5432/dbname",
     "issue": "connection"
   }
   ```
   - Network connectivity
   - Authentication problems
   - SSL/TLS issues
   - Connection pooling

2. **Performance Issues**
   ```typescript
   {
     "connectionString": "postgresql://user:password@localhost:5432/dbname",
     "issue": "performance"
   }
   ```
   - Slow queries
   - Resource utilization
   - Index effectiveness
   - Query planning

3. **Lock Issues**
   ```typescript
   {
     "connectionString": "postgresql://user:password@localhost:5432/dbname",
     "issue": "locks"
   }
   ```
   - Transaction deadlocks
   - Lock contention
   - Blocking queries
   - Lock timeouts

4. **Replication Issues**
   ```typescript
   {
     "connectionString": "postgresql://user:password@localhost:5432/dbname",
     "issue": "replication"
   }
   ```
   - Replication lag
   - Streaming status
   - WAL issues
   - Synchronization problems

## Best Practices

1. **Connection Management**
   - Use connection pooling
   - Implement timeouts
   - Handle reconnection logic
   - Monitor connection counts

2. **Security**
   - Use SSL/TLS connections
   - Implement least privilege access
   - Regular security audits
   - Credential rotation

3. **Performance**
   - Regular performance analysis
   - Index maintenance
   - Query optimization
   - Resource monitoring

4. **Error Handling**
   - Implement proper error handling
   - Log relevant information
   - Set appropriate timeouts
   - Handle edge cases

## Common Issues

1. **Connection Failures**
   ```typescript
   // Check connection with debug logging
   const debug = await useMcpTool("postgresql-mcp", "debug_database", {
     connectionString: "postgresql://user:password@localhost:5432/dbname",
     issue: "connection",
     logLevel: "debug"
   });
   ```

2. **Performance Problems**
   ```typescript
   // Analyze performance with detailed metrics
   const analysis = await useMcpTool("postgresql-mcp", "analyze_database", {
     connectionString: "postgresql://user:password@localhost:5432/dbname",
     analysisType: "performance"
   });
   ```

3. **Security Concerns**
   ```typescript
   // Run security audit
   const security = await useMcpTool("postgresql-mcp", "analyze_database", {
     connectionString: "postgresql://user:password@localhost:5432/dbname",
     analysisType: "security"
   });
   ```

## Troubleshooting

1. **Tool Connection Issues**
   - Verify MCP server status
   - Check network connectivity
   - Validate configuration
   - Review error logs

2. **Analysis Failures**
   - Check database permissions
   - Verify connection string
   - Review PostgreSQL logs
   - Check resource availability

3. **Setup Problems**
   - Verify system requirements
   - Check installation paths
   - Review environment variables
   - Validate configurations

## Support

For issues and questions:
1. Check documentation
2. Review error logs
3. Search issue tracker
4. Submit detailed bug reports