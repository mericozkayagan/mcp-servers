interface SetupInstructions {
    steps: string[];
    configuration: string[];
    postInstall: string[];
}
export declare function getSetupInstructions(platform: 'linux' | 'macos' | 'windows', version?: string, useCase?: 'development' | 'production'): SetupInstructions;
export {};
