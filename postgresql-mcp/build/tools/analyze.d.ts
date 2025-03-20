interface AnalysisResult {
    version: string;
    settings: Record<string, any>;
    metrics: {
        connections: number;
        activeQueries: number;
        cacheHitRatio: number;
        tableSizes: Record<string, string>;
    };
    recommendations: string[];
}
export declare function analyzeDatabase(connectionString: string, analysisType?: 'configuration' | 'performance' | 'security'): Promise<AnalysisResult>;
export {};
