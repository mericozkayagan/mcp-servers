import { DatabaseConnection } from '../utils/connection.js';
export async function debugDatabase(connectionString, issue, logLevel = 'info') {
    const db = DatabaseConnection.getInstance();
    try {
        await db.connect(connectionString);
        switch (issue) {
            case 'connection':
                return await debugConnection(db);
            case 'performance':
                return await debugPerformance(db);
            case 'locks':
                return await debugLocks(db);
            case 'replication':
                return await debugReplication(db);
            default:
                throw new Error(`Unsupported issue type: ${issue}`);
        }
    }
    finally {
        await db.disconnect();
    }
}
async function debugConnection(db) {
    const result = {
        issue: 'connection',
        status: 'ok',
        details: [],
        recommendations: []
    };
    try {
        // Check max connections
        const maxConns = await db.query("SELECT setting FROM pg_settings WHERE name = 'max_connections'");
        const currentConns = await db.query('SELECT count(*) FROM pg_stat_activity');
        const max = parseInt(maxConns[0].setting);
        const current = parseInt(currentConns[0].count);
        const percentage = (current / max) * 100;
        result.details.push(`Current connections: ${current}/${max} (${percentage.toFixed(1)}%)`);
        if (percentage > 80) {
            result.status = 'warning';
            result.recommendations.push('High connection usage. Consider implementing connection pooling', 'Review application connection handling', 'Monitor for connection leaks');
        }
        // Check for idle connections
        const idleConns = await db.query("SELECT count(*) FROM pg_stat_activity WHERE state = 'idle'");
        const idleCount = parseInt(idleConns[0].count);
        if (idleCount > 5) {
            result.details.push(`High number of idle connections: ${idleCount}`);
            result.recommendations.push('Consider implementing connection timeouts', 'Review connection pool settings');
        }
    }
    catch (error) {
        result.status = 'error';
        result.details.push(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
    }
    return result;
}
async function debugPerformance(db) {
    const result = {
        issue: 'performance',
        status: 'ok',
        details: [],
        recommendations: []
    };
    try {
        // Check slow queries
        const slowQueries = await db.query(`SELECT query, extract(epoch from now() - query_start) as duration
       FROM pg_stat_activity
       WHERE state = 'active'
         AND query NOT LIKE '%pg_stat_activity%'
         AND query_start < now() - interval '30 second'`);
        if (slowQueries.length > 0) {
            result.status = 'warning';
            result.details.push('Long-running queries detected:');
            slowQueries.forEach(q => {
                result.details.push(`Duration: ${q.duration}s - Query: ${q.query}`);
            });
            result.recommendations.push('Review and optimize slow queries', 'Consider adding appropriate indexes', 'Check for missing VACUUM operations');
        }
        // Check index usage
        const unusedIndexes = await db.query(`SELECT s.schemaname,
             s.relname AS tablename,
             s.indexrelname AS indexname,
             s.idx_scan
      FROM pg_stat_user_indexes s
      WHERE s.idx_scan = 0
        AND s.schemaname NOT IN ('pg_catalog', 'information_schema')`);
        if (unusedIndexes.length > 0) {
            result.details.push('Unused indexes found:');
            unusedIndexes.forEach(idx => {
                result.details.push(`${idx.schemaname}.${idx.tablename} - ${idx.indexname}`);
            });
            result.recommendations.push('Consider removing unused indexes', 'Review index strategy');
        }
    }
    catch (error) {
        result.status = 'error';
        result.details.push(`Performance analysis error: ${error instanceof Error ? error.message : String(error)}`);
    }
    return result;
}
async function debugLocks(db) {
    const result = {
        issue: 'locks',
        status: 'ok',
        details: [],
        recommendations: []
    };
    try {
        const locks = await db.query(`SELECT blocked_locks.pid AS blocked_pid,
              blocked_activity.usename AS blocked_user,
              blocking_locks.pid AS blocking_pid,
              blocking_activity.usename AS blocking_user,
              blocked_activity.query AS blocked_statement
       FROM pg_catalog.pg_locks blocked_locks
       JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
       JOIN pg_catalog.pg_locks blocking_locks 
            ON blocking_locks.locktype = blocked_locks.locktype
            AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
            AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
            AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
            AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
            AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
            AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
            AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
            AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
            AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
            AND blocking_locks.pid != blocked_locks.pid
       JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
       WHERE NOT blocked_locks.GRANTED`);
        if (locks.length > 0) {
            result.status = 'warning';
            result.details.push('Lock conflicts detected:');
            locks.forEach(lock => {
                result.details.push(`Process ${lock.blocked_pid} (${lock.blocked_user}) blocked by process ${lock.blocking_pid} (${lock.blocking_user})`);
                result.details.push(`Blocked query: ${lock.blocked_statement}`);
            });
            result.recommendations.push('Consider killing blocking queries if appropriate', 'Review transaction management in application code', 'Check for long-running transactions');
        }
    }
    catch (error) {
        result.status = 'error';
        result.details.push(`Lock analysis error: ${error instanceof Error ? error.message : String(error)}`);
    }
    return result;
}
async function debugReplication(db) {
    const result = {
        issue: 'replication',
        status: 'ok',
        details: [],
        recommendations: []
    };
    try {
        // Check replication status
        const replicationStatus = await db.query(`SELECT client_addr, 
              state,
              sent_lsn,
              write_lsn,
              flush_lsn,
              replay_lsn,
              write_lag,
              flush_lag,
              replay_lag
       FROM pg_stat_replication`);
        if (replicationStatus.length === 0) {
            result.details.push('No active replication detected');
            result.recommendations.push('If replication is expected, check configuration', 'Verify replication slots are created', 'Check network connectivity between nodes');
            return result;
        }
        replicationStatus.forEach(rep => {
            result.details.push(`Replica ${rep.client_addr}:`);
            result.details.push(`State: ${rep.state}`);
            result.details.push(`Write Lag: ${rep.write_lag || '0s'}`);
            result.details.push(`Flush Lag: ${rep.flush_lag || '0s'}`);
            result.details.push(`Replay Lag: ${rep.replay_lag || '0s'}`);
            if (rep.replay_lag && parseFloat(rep.replay_lag) > 300) {
                result.status = 'warning';
                result.recommendations.push(`High replication lag (${rep.replay_lag}) for ${rep.client_addr}`, 'Check network bandwidth between nodes', 'Review WAL settings', 'Monitor system resources on replica');
            }
        });
    }
    catch (error) {
        result.status = 'error';
        result.details.push(`Replication analysis error: ${error instanceof Error ? error.message : String(error)}`);
    }
    return result;
}
//# sourceMappingURL=debug.js.map