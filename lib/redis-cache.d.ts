import { AsyncBaseCache } from './async-base-cache';
/**
 * > Note: If you need to share database, you should set [[isSharedDatabase]] to `true` and make sure that
 * > [[keyPrefix]] has unique value which will allow to distinguish between cache keys and other data in database.
 */
export declare class RedisCache extends AsyncBaseCache {
    private readonly _client;
    isSharedDatabase: boolean;
    readonly client: any;
    constructor(options?: any, clientOptions?: any);
    runCommand(command: any, ...args: any[]): Promise<any>;
    /**
     * @inheritDoc
     */
    exists(key: any): Promise<boolean>;
    /**
     * @inheritDoc
     */
    protected getValue(key: string): Promise<string | boolean>;
    /**
     * @inheritDoc
     */
    protected setValue(key: string, value: string, duration: number): Promise<boolean>;
    /**
     * @inheritDoc
     */
    protected addValue(key: string, value: string, duration: number): Promise<boolean>;
    /**
     * @inheritDoc
     */
    protected deleteValue(key: string): Promise<boolean>;
    /**
     * @inheritDoc
     */
    protected flushValues(): Promise<boolean>;
}
