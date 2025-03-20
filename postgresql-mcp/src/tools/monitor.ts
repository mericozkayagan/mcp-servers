import { DatabaseConnection } from '../utils/connection.js';

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
export async function monitorDatabase(
  connectionString: string,
  options: {
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
  } = {}
): Promise<MonitoringResult> {
  const db = DatabaseConnection.getInstance();
  const alerts: Alert[] = [];
  
  try {
    await db.connect(connectionString);
    
    // Get timestamp
    const now = new Date();
    const timestamp = now.toISOString();
    
    // Get database metrics
    const dbMetrics = await getDatabaseMetrics(db);
    
    // Check connection threshold
    const connectionPercentage = (dbMetrics.connections.total / dbMetrics.connections.max) * 100;
    if (options.alertThresholds?.connectionPercentage && 
        connectionPercentage > options.alertThresholds.connectionPercentage) {
      alerts.push({
        level: connectionPercentage > 90 ? 'critical' : 'warning',
        message: `High connection usage: ${connectionPercentage.toFixed(1)}%`,
        context: {
          current: dbMetrics.connections.total,
          max: dbMetrics.connections.max
        }
      });
    }
    
    // Check cache hit ratio
    if (options.alertThresholds?.cacheHitRatio && 
        dbMetrics.cacheHitRatio < options.alertThresholds.cacheHitRatio) {
      alerts.push({
        level: dbMetrics.cacheHitRatio < 0.8 ? 'critical' : 'warning',
        message: `Low cache hit ratio: ${(dbMetrics.cacheHitRatio * 100).toFixed(1)}%`,
        context: {
          current: dbMetrics.cacheHitRatio
        }
      });
    }
    
    // Get table metrics if requested
    const tableMetrics: Record<string, TableMetrics> = {};
    if (options.includeTables) {
      const tables = await getTableMetrics(db);
      
      for (const table of tables) {
        tableMetrics[table.name] = table;
        
        // Check for tables with high dead tuple percentage
        if (options.alertThresholds?.deadTuplesPercentage) {
          const deadTuplePercentage = table.rowCount > 0 
            ? (table.deadTuples / table.rowCount) * 100 
            : 0;
            
          if (deadTuplePercentage > options.alertThresholds.deadTuplesPercentage) {
            alerts.push({
              level: deadTuplePercentage > 30 ? 'critical' : 'warning',
              message: `High dead tuple percentage in table ${table.name}: ${deadTuplePercentage.toFixed(1)}%`,
              context: {
                table: table.name,
                deadTuples: table.deadTuples,
                totalRows: table.rowCount
              }
            });
          }
        }
        
        // Check for tables that haven't been vacuumed recently
        if (options.alertThresholds?.vacuumAge && table.lastVacuum) {
          const lastVacuumDate = new Date(table.lastVacuum);
          const daysSinceVacuum = Math.floor((now.getTime() - lastVacuumDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceVacuum > options.alertThresholds.vacuumAge) {
            alerts.push({
              level: 'warning',
              message: `Table ${table.name} hasn't been vacuumed in ${daysSinceVacuum} days`,
              context: {
                table: table.name,
                lastVacuum: table.lastVacuum
              }
            });
          }
        }
      }
    }
    
    // Get active queries if requested
    let activeQueries: ActiveQueryInfo[] = [];
    if (options.includeQueries) {
      activeQueries = await getActiveQueries(db);
      
      // Check for long-running queries
      if (options.alertThresholds?.longRunningQuerySeconds) {
        const longRunningQueries = activeQueries.filter(
          q => q.duration > options.alertThresholds!.longRunningQuerySeconds!
        );
        
        for (const query of longRunningQueries) {
          alerts.push({
            level: query.duration > options.alertThresholds.longRunningQuerySeconds * 2 ? 'critical' : 'warning',
            message: `Long-running query (${query.duration.toFixed(1)}s) by ${query.username}`,
            context: {
              pid: query.pid,
              duration: query.duration,
              query: query.query.substring(0, 100) + (query.query.length > 100 ? '...' : '')
            }
          });
        }
      }
    }
    
    // Get lock information if requested
    let locks: LockInfo[] = [];
    if (options.includeLocks) {
      locks = await getLockInfo(db);
      
      // Alert on blocking locks
      const blockingLocks = locks.filter(l => !l.granted);
      if (blockingLocks.length > 0) {
        alerts.push({
          level: 'warning',
          message: `${blockingLocks.length} blocking locks detected`,
          context: {
            count: blockingLocks.length
          }
        });
      }
    }
    
    // Get replication information if requested
    let replication: ReplicationInfo[] = [];
    if (options.includeReplication) {
      replication = await getReplicationInfo(db);
      
      // Alert on replication lag
      for (const replica of replication) {
        if (replica.replayLag) {
          const lagMatch = replica.replayLag.match(/(\d+):(\d+):(\d+)/);
          if (lagMatch) {
            const hours = parseInt(lagMatch[1]);
            const minutes = parseInt(lagMatch[2]);
            
            if (hours > 0 || minutes > 5) {
              alerts.push({
                level: hours > 0 ? 'critical' : 'warning',
                message: `High replication lag for ${replica.clientAddr}: ${replica.replayLag}`,
                context: {
                  clientAddr: replica.clientAddr,
                  lag: replica.replayLag
                }
              });
            }
          }
        }
      }
    }
    
    return {
      timestamp,
      metrics: {
        database: dbMetrics,
        tables: tableMetrics,
        queries: activeQueries,
        locks,
        replication: options.includeReplication ? replication : undefined
      },
      alerts
    };
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      metrics: {
        database: {
          name: '',
          size: '',
          connections: { active: 0, idle: 0, total: 0, max: 0 },
          uptime: '',
          transactions: { committed: 0, rolledBack: 0 },
          cacheHitRatio: 0
        },
        tables: {},
        queries: [],
        locks: []
      },
      alerts: [{
        level: 'critical',
        message: `Monitoring error: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  } finally {
    await db.disconnect();
  }
}

/**
 * Get database-level metrics
 */
async function getDatabaseMetrics(db: DatabaseConnection): Promise<DatabaseMetrics> {
  // Get database name and size
  const dbInfo = await db.query<{ datname: string; size: string }>(
    `SELECT 
       current_database() as datname,
       pg_size_pretty(pg_database_size(current_database())) as size`
  );
  
  // Get connection information
  const connectionInfo = await db.query<{ max_conn: string; active: string; idle: string; total: string }>(
    `SELECT 
       setting as max_conn 
     FROM pg_settings 
     WHERE name = 'max_connections'`
  );
  
  const activeConns = await db.query<{ count: string }>(
    `SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND pid <> pg_backend_pid()`
  );
  
  const idleConns = await db.query<{ count: string }>(
    `SELECT count(*) FROM pg_stat_activity WHERE state = 'idle'`
  );
  
  const totalConns = await db.query<{ count: string }>(
    `SELECT count(*) FROM pg_stat_activity`
  );
  
  // Get uptime
  const uptime = await db.query<{ uptime: string }>(
    `SELECT pg_postmaster_start_time()::text as uptime`
  );
  
  // Get transaction stats
  const txStats = await db.query<{ xact_commit: string; xact_rollback: string }>(
    `SELECT xact_commit, xact_rollback 
     FROM pg_stat_database 
     WHERE datname = current_database()`
  );
  
  // Get cache hit ratio
  const cacheHit = await db.query<{ ratio: number }>(
    `SELECT 
       CASE WHEN blks_hit + blks_read = 0 THEN 0
       ELSE blks_hit::float / (blks_hit + blks_read)::float 
       END as ratio
     FROM pg_stat_database
     WHERE datname = current_database()`
  );
  
  return {
    name: dbInfo[0].datname,
    size: dbInfo[0].size,
    connections: {
      active: parseInt(activeConns[0].count),
      idle: parseInt(idleConns[0].count),
      total: parseInt(totalConns[0].count),
      max: parseInt(connectionInfo[0].max_conn)
    },
    uptime: uptime[0].uptime,
    transactions: {
      committed: parseInt(txStats[0].xact_commit),
      rolledBack: parseInt(txStats[0].xact_rollback)
    },
    cacheHitRatio: cacheHit[0].ratio
  };
}

/**
 * Get table-level metrics
 */
async function getTableMetrics(db: DatabaseConnection): Promise<TableMetrics[]> {
  const tableStats = await db.query<{
    relname: string;
    size: string;
    n_live_tup: string;
    n_dead_tup: string;
    last_vacuum: string | null;
    last_analyze: string | null;
    seq_scan: string;
    idx_scan: string;
  }>(
    `SELECT
       c.relname,
       pg_size_pretty(pg_total_relation_size(c.oid)) as size,
       s.n_live_tup,
       s.n_dead_tup,
       s.last_vacuum,
       s.last_analyze,
       s.seq_scan,
       s.idx_scan
     FROM pg_class c
     JOIN pg_stat_user_tables s ON s.relid = c.oid
     WHERE c.relkind = 'r'
     ORDER BY c.relname`
  );
  
  return tableStats.map(table => ({
    name: table.relname,
    size: table.size,
    rowCount: parseInt(table.n_live_tup),
    deadTuples: parseInt(table.n_dead_tup),
    lastVacuum: table.last_vacuum,
    lastAnalyze: table.last_analyze,
    scanCount: parseInt(table.seq_scan),
    indexUseRatio: parseInt(table.seq_scan) + parseInt(table.idx_scan) > 0
      ? parseInt(table.idx_scan) / (parseInt(table.seq_scan) + parseInt(table.idx_scan))
      : 0
  }));
}

/**
 * Get information about active queries
 */
async function getActiveQueries(db: DatabaseConnection): Promise<ActiveQueryInfo[]> {
  const queries = await db.query<{
    pid: string;
    usename: string;
    datname: string;
    query_start: string;
    state: string;
    wait_event: string | null;
    query: string;
  }>(
    `SELECT
       pid,
       usename,
       datname,
       query_start::text,
       state,
       wait_event,
       query
     FROM pg_stat_activity
     WHERE state != 'idle'
       AND pid <> pg_backend_pid()
     ORDER BY query_start`
  );
  
  const now = new Date();
  
  return queries.map(q => {
    const startTime = new Date(q.query_start);
    const durationSeconds = (now.getTime() - startTime.getTime()) / 1000;
    
    return {
      pid: parseInt(q.pid),
      username: q.usename,
      database: q.datname,
      startTime: q.query_start,
      duration: durationSeconds,
      state: q.state,
      waitEvent: q.wait_event || undefined,
      query: q.query
    };
  });
}

/**
 * Get information about locks
 */
async function getLockInfo(db: DatabaseConnection): Promise<LockInfo[]> {
  const locks = await db.query<{
    relation: string;
    mode: string;
    granted: string;
    pid: string;
    usename: string;
    query: string;
  }>(
    `SELECT
       CASE
         WHEN l.relation IS NOT NULL THEN (SELECT relname FROM pg_class WHERE oid = l.relation)
         ELSE 'transactionid'
       END as relation,
       l.mode,
       l.granted::text,
       l.pid,
       a.usename,
       a.query
     FROM pg_locks l
     JOIN pg_stat_activity a ON l.pid = a.pid
     WHERE l.pid <> pg_backend_pid()
     ORDER BY relation, mode`
  );
  
  return locks.map(lock => ({
    relation: lock.relation,
    mode: lock.mode,
    granted: lock.granted === 't',
    pid: parseInt(lock.pid),
    username: lock.usename,
    query: lock.query
  }));
}

/**
 * Get information about replication
 */
async function getReplicationInfo(db: DatabaseConnection): Promise<ReplicationInfo[]> {
  const replication = await db.query<{
    client_addr: string | null;
    state: string;
    sent_lsn: string;
    write_lsn: string;
    flush_lsn: string;
    replay_lsn: string;
    write_lag: string | null;
    flush_lag: string | null;
    replay_lag: string | null;
  }>(
    `SELECT
       client_addr,
       state,
       sent_lsn::text,
       write_lsn::text,
       flush_lsn::text,
       replay_lsn::text,
       write_lag::text,
       flush_lag::text,
       replay_lag::text
     FROM pg_stat_replication`
  );
  
  return replication.map(rep => ({
    clientAddr: rep.client_addr || 'local',
    state: rep.state,
    sentLsn: rep.sent_lsn,
    writeLsn: rep.write_lsn,
    flushLsn: rep.flush_lsn,
    replayLsn: rep.replay_lsn,
    writeLag: rep.write_lag,
    flushLag: rep.flush_lag,
    replayLag: rep.replay_lag
  }));
} 