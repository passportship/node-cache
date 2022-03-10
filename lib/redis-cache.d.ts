import { AsyncBaseCache, IOptions as IBaseOptions } from './async-base-cache';
export interface IOptions extends IBaseOptions {
    isSharedDatabase?: boolean;
    clientOptions?: any;
}
/**
 * > Note: If you need to share database, you should set [[isSharedDatabase]] to `true` and make sure that
 * > [[keyPrefix]] has unique value which will allow to distinguish between cache keys and other data in database.
 */
export declare class RedisCache extends AsyncBaseCache {
    private readonly _client;
    isSharedDatabase: boolean;
    get client(): any;
    constructor(options?: IOptions);
    runCommand(command: any, ...args: any[]): Promise<any>;
    /**
     * @inheritDoc
     */
    exists(key: any, prefix?: string): Promise<boolean>;
    /**
     * @inheritDoc
     */
    protected getValue(key: string): Promise<string | boolean>;
    /**
     * @inheritDoc
     */
    multiGet(keys: any[], prefix?: string): Promise<any>;
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
