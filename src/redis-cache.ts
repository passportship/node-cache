import * as util from 'util';
import * as _ from 'lodash';
import * as redis from 'redis';
import { AsyncBaseCache } from './async-base-cache';


// TODO add getValues, setValues and addValues with specified redis commands?

/**
 * > Note: If you need to share database, you should set [[isSharedDatabase]] to `true` and make sure that
 * > [[keyPrefix]] has unique value which will allow to distinguish between cache keys and other data in database.
 */
export class RedisCache extends AsyncBaseCache {
    private readonly _client;
    public isSharedDatabase = false;

    public get client() {
        return this._client;
    }

    constructor(options?: any, clientOptions?: any) {
        super(options);

        if (options.isSharedDatabase !== undefined) {
            this.isSharedDatabase = !! options.isSharedDatabase;
        }

        this._client = redis.createClient(clientOptions);
    }

    public async runCommand(command, ...args) {
        return await util.promisify(this.client[command]).bind(this.client)(...args);
    }

    /**
     * @inheritDoc
     */
    public async exists(key: any): Promise<boolean> {
        key = this.buildKey(key);

        return !!await this.runCommand('exists', key);
    }

    /**
     * @inheritDoc
     */
    protected async getValue(key: string): Promise<string | boolean> {
        const value = await this.runCommand('get', key);

        return value !== null ? value : false;

    }

    /**
     * @inheritDoc
     */
    protected async setValue(key: string, value: string, duration: number): Promise<boolean> {
        let result = undefined;

        if (duration === 0) {
            result = await this.runCommand('set', key, value);
        } else {
            result = await this.runCommand('set', key, value, 'EX', duration);
        }

        return result === 'OK';
    }

    /**
     * @inheritDoc
     */
    protected async addValue(key: string, value: string, duration: number): Promise<boolean> {
        let result = undefined;

        if (duration === 0) {
            result = await this.runCommand('set', key, value, 'NX');
        } else {
            result = await this.runCommand('set', key, value, 'EX', duration, 'NX');
        }

        return result === 'OK';
    }

    /**
     * @inheritDoc
     */
    protected async deleteValue(key: string): Promise<boolean> {
        return !! await this.runCommand('del', key);
    }

    /**
     * @inheritDoc
     */
    protected async flushValues(): Promise<boolean> {
        if (this.isSharedDatabase) {
            let cursor = 0;

            do {
                const result = await this.runCommand('scan', '0', 'MATCH', this.keyPrefix + '*', 'COUNT', 100);

                cursor = _.toNumber(result[0]);
                const keys = result[1];

                if (keys.length) {
                    await this.runCommand('del', keys);
                }
            } while (cursor !== 0);

            return true;
        }

        return !! await this.runCommand('flushdb');
    }
}
