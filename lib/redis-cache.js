"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
const util = require("util");
const _ = require("lodash");
const redis = require("redis");
const async_base_cache_1 = require("./async-base-cache");
/**
 * > Note: If you need to share database, you should set [[isSharedDatabase]] to `true` and make sure that
 * > [[keyPrefix]] has unique value which will allow to distinguish between cache keys and other data in database.
 */
class RedisCache extends async_base_cache_1.AsyncBaseCache {
    get client() {
        return this._client;
    }
    constructor(options) {
        super(options);
        this.isSharedDatabase = false;
        if (options && _.isBoolean(options.isSharedDatabase)) {
            this.isSharedDatabase = !!options.isSharedDatabase;
        }
        this._client = redis.createClient(options && options.clientOptions);
    }
    async runCommand(command, ...args) {
        // @ts-ignore
        return util.promisify(this.client[command]).bind(this.client)(...args);
    }
    /**
     * @inheritDoc
     */
    async exists(key, prefix) {
        key = this.buildKey(key, prefix);
        return !!(await this.runCommand('exists', key));
    }
    /**
     * @inheritDoc
     */
    async getValue(key) {
        const value = await this.runCommand('get', key);
        return value !== null ? value : false;
    }
    /**
     * @inheritDoc
     */
    async multiGet(keys, prefix) {
        const builtKeys = _.map(keys, (key) => this.buildKey(key, prefix));
        const values = await this.runCommand('mget', builtKeys);
        const results = {};
        for (const [index, value] of values.entries()) {
            const key = keys[index];
            results[key] = false;
            if (value !== null) {
                if (!this.serialization) {
                    results[key] = value;
                }
                else {
                    results[key] = JSON.parse(value);
                }
            }
        }
        return results;
    }
    /**
     * @inheritDoc
     */
    async setValue(key, value, duration) {
        let result;
        if (duration === 0) {
            result = await this.runCommand('set', key, value);
        }
        else {
            result = await this.runCommand('set', key, value, 'EX', duration);
        }
        return result === 'OK';
    }
    /**
     * @inheritDoc
     */
    async addValue(key, value, duration) {
        let result;
        if (duration === 0) {
            result = await this.runCommand('set', key, value, 'NX');
        }
        else {
            result = await this.runCommand('set', key, value, 'EX', duration, 'NX');
        }
        return result === 'OK';
    }
    /**
     * @inheritDoc
     */
    async deleteValue(key) {
        return !!(await this.runCommand('del', key));
    }
    /**
     * @inheritDoc
     */
    async flushValues() {
        if (this.isSharedDatabase) {
            let cursor = 0;
            do {
                const result = await this.runCommand('scan', '0', 'MATCH', `${this.keyPrefix}*`, 'COUNT', 100);
                cursor = _.toNumber(result[0]);
                const keys = result[1];
                if (keys.length) {
                    await this.runCommand('del', keys);
                }
            } while (cursor !== 0);
            return true;
        }
        return !!(await this.runCommand('flushdb'));
    }
}
exports.RedisCache = RedisCache;
