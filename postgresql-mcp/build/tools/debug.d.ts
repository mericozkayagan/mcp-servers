interface DebugResult {
    issue: string;
    status: 'error' | 'warning' | 'ok';
    details: string[];
    recommendations: string[];
}
type IssueType = 'connection' | 'performance' | 'locks' | 'replication';
type LogLevel = 'info' | 'debug' | 'trace';
export declare function debugDatabase(connectionString: string, issue: IssueType, logLevel?: LogLevel): Promise<DebugResult>;
export {};
