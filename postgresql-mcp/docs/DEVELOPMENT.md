# PostgreSQL MCP Server Development Guide

## Development Environment Setup

### Prerequisites

1. **Node.js Environment**
   - Node.js >= 18.0.0
   - npm or yarn
   - TypeScript knowledge

2. **PostgreSQL Setup**
   - PostgreSQL server (latest stable version)
   - psql command-line tool
   - Development database

3. **Development Tools**
   - VS Code or preferred IDE
   - ESLint
   - Git

### Initial Setup

1. **Clone Repository**
   ```bash
   git clone [repository-url]
   cd postgresql-mcp-server
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Development Environment**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit with your settings
   vim .env
   ```

4. **Build Project**
   ```bash
   npm run build
   ```

## Project Structure

```
postgresql-mcp-server/
├── src/
│   ├── index.ts              # Main entry point
│   ├── server/              # MCP server implementation
│   │   ├── index.ts         # Server setup
│   │   └── handlers.ts      # Request handlers
│   ├── tools/               # MCP tools implementation
│   │   ├── analyze.ts       # Database analysis
│   │   ├── setup.ts         # Setup instructions
│   │   └── debug.ts         # Debugging tools
│   ├── db/                  # Database interactions
│   │   ├── connection.ts    # Connection management
│   │   └── queries.ts       # SQL queries
│   └── utils/               # Utility functions
├── tests/                   # Test files
├── docs/                    # Documentation
└── build/                   # Compiled output
```

## Adding New Features

### 1. Creating a New Tool

1. **Define Tool Interface**
   ```typescript
   // src/types/tools.ts
   interface NewToolInput {
     param1: string;
     param2?: number;
     options?: {
       // Tool options
     };
   }

   interface NewToolOutput {
     status: "success" | "error";
     data: {
       // Tool output
     };
     error?: {
       code: string;
       message: string;
     };
   }
   ```

2. **Implement Tool Logic**
   ```typescript
   // src/tools/newTool.ts
   import { Tool } from '../types';

   export class NewTool implements Tool {
     async execute(input: NewToolInput): Promise<NewToolOutput> {
       try {
         // Tool implementation
         return {
           status: "success",
           data: {
             // Result data
           }
         };
       } catch (error) {
         return {
           status: "error",
           error: {
             code: "TOOL_ERROR",
             message: error.message
           }
         };
       }
     }
   }
   ```

3. **Register Tool**
   ```typescript
   // src/server/index.ts
   import { NewTool } from '../tools/newTool';

   server.registerTool('new_tool', new NewTool());
   ```

### 2. Adding Database Features

1. **Define Database Queries**
   ```typescript
   // src/db/queries.ts
   export const newFeatureQueries = {
     getData: `
       SELECT *
       FROM your_table
       WHERE condition = $1
     `,
     updateData: `
       UPDATE your_table
       SET column = $1
       WHERE id = $2
     `
   };
   ```

2. **Implement Database Operations**
   ```typescript
   // src/db/operations.ts
   import { pool } from './connection';
   import { newFeatureQueries } from './queries';

   export async function performNewOperation(params: any) {
     const client = await pool.connect();
     try {
       await client.query('BEGIN');
       // Perform operations
       await client.query('COMMIT');
     } catch (error) {
       await client.query('ROLLBACK');
       throw error;
     } finally {
       client.release();
     }
   }
   ```

### 3. Adding Utility Functions

1. **Create Utility Module**
   ```typescript
   // src/utils/newUtil.ts
   export function newUtilityFunction(input: any): any {
     // Implementation
   }
   ```

2. **Add Tests**
   ```typescript
   // tests/utils/newUtil.test.ts
   import { newUtilityFunction } from '../../src/utils/newUtil';

   describe('newUtilityFunction', () => {
     it('should handle valid input', () => {
       // Test implementation
     });

     it('should handle invalid input', () => {
       // Test implementation
     });
   });
   ```

## Testing

### Unit Tests

```typescript
// tests/tools/newTool.test.ts
import { NewTool } from '../../src/tools/newTool';

describe('NewTool', () => {
  let tool: NewTool;

  beforeEach(() => {
    tool = new NewTool();
  });

  it('should process valid input', async () => {
    const input = {
      param1: 'test',
      param2: 123
    };

    const result = await tool.execute(input);
    expect(result.status).toBe('success');
  });

  it('should handle errors', async () => {
    const input = {
      param1: 'invalid'
    };

    const result = await tool.execute(input);
    expect(result.status).toBe('error');
  });
});
```

### Integration Tests

```typescript
// tests/integration/newTool.test.ts
import { setupTestDatabase, teardownTestDatabase } from '../helpers';

describe('NewTool Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should interact with database', async () => {
    // Test implementation
  });
});
```

## Error Handling

### 1. Custom Error Types

```typescript
// src/types/errors.ts
export class ToolError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ToolError';
  }
}
```

### 2. Error Handling in Tools

```typescript
try {
  // Tool operation
} catch (error) {
  if (error instanceof DatabaseError) {
    throw new ToolError(
      'Database operation failed',
      'DATABASE_ERROR',
      error
    );
  }
  throw error;
}
```

## Documentation

### 1. Code Documentation

```typescript
/**
 * Performs analysis of database configuration
 * @param {string} connectionString - PostgreSQL connection string
 * @param {AnalysisOptions} options - Analysis options
 * @returns {Promise<AnalysisResult>} Analysis results
 * @throws {ToolError} When analysis fails
 */
async function analyzeConfiguration(
  connectionString: string,
  options: AnalysisOptions
): Promise<AnalysisResult> {
  // Implementation
}
```

### 2. Tool Documentation

```typescript
/**
 * @tool new_tool
 * @description Performs new operation on database
 * @input {
 *   param1: string,
 *   param2?: number,
 *   options?: object
 * }
 * @output {
 *   status: "success" | "error",
 *   data: object,
 *   error?: {
 *     code: string,
 *     message: string
 *   }
 * }
 */
```

## Release Process

1. **Version Update**
   ```bash
   npm version patch|minor|major
   ```

2. **Build and Test**
   ```bash
   npm run build
   npm test
   ```

3. **Documentation Update**
   - Update CHANGELOG.md
   - Update API documentation
   - Review README.md

4. **Create Release**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

## Best Practices

1. **Code Style**
   - Follow TypeScript best practices
   - Use ESLint rules
   - Maintain consistent formatting
   - Write clear comments

2. **Testing**
   - Write unit tests for new features
   - Include integration tests
   - Maintain test coverage
   - Use meaningful test names

3. **Error Handling**
   - Use custom error types
   - Provide meaningful error messages
   - Include error context
   - Log errors appropriately

4. **Documentation**
   - Document new features
   - Update API documentation
   - Include examples
   - Keep README current