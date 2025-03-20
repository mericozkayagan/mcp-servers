interface MonitoringResult {
    timestamp: string;
    metrics: {
        database: DatabaseMetrics;
        tables: Record<string, TableMetrics>;
        queries: ActiveQueryInfo[];
        locks: LockInfo[];
        replication?: ReplicationInfo[];
    };
    alerts: Alert[];
}
interface DatabaseMetrics {
    name: string;
    size: string;
    connections: {
        active: number;
        idle: number;
        total: number;
        max: number;
    };
    uptime: string;
    transactions: {
        committed: number;
        rolledBack: number;
    };
    cacheHitRatio: number;
}
interface TableMetrics {
    name: string;
    size: string;
    rowCount: number;
    deadTuples: number;
    lastVacuum: string | null;
    lastAnalyze: string | null;
    scanCount: number;
    indexUseRatio: number;
}
interface ActiveQueryInfo {
    pid: number;
    username: string;
    database: string;
    startTime: string;
    duration: number;
    state: string;
    query: string;
    waitEvent?: string;
}
interface LockInfo {
    relation: string;
    mode: string;
    granted: boolean;
    pid: number;
    username: string;
    query: string;
}
interface ReplicationInfo {
    clientAddr: string;
    state: string;
    sentLsn: string;
    writeLsn: string;
    flushLsn: string;
    replayLsn: string;
    writeLag: string | null;
    flushLag: string | null;
    replayLag: string | null;
}
interface Alert {
    level: 'info' | 'warning' | 'critical';
    message: string;
    context?: Record<string, unknown>;
}
/**
 * Get real-time monitoring information for a PostgreSQL database
 */
export declare function monitorDatabase(connectionString: string, options?: {
    includeTables?: boolean;
    includeQueries?: boolean;
    includeLocks?: boolean;
    includeReplication?: boolean;
    alertThresholds?: {
        connectionPercentage?: number;
        longRunningQuerySeconds?: number;
        cacheHitRatio?: number;
        deadTuplesPercentage?: number;
        vacuumAge?: number;
    };
}): Promise<MonitoringResult>;
export {};
