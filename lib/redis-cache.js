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
    _client;
    isSharedDatabase = false;
    get client() {
        return this._client;
    }
    constructor(options) {
        super(options);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkaXMtY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcmVkaXMtY2FjaGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkJBQTZCO0FBQzdCLDRCQUE0QjtBQUM1QiwrQkFBK0I7QUFDL0IseURBQThFO0FBUzlFOzs7R0FHRztBQUNILE1BQWEsVUFBVyxTQUFRLGlDQUFjO0lBQ3pCLE9BQU8sQ0FBQztJQUNsQixnQkFBZ0IsR0FBRyxLQUFLLENBQUM7SUFFaEMsSUFBVyxNQUFNO1FBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3hCLENBQUM7SUFFRCxZQUFZLE9BQWtCO1FBQzFCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVmLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztZQUNuRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztRQUN2RCxDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVNLEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBZSxFQUFFLEdBQUcsSUFBVztRQUNuRCxhQUFhO1FBQ2IsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVEOztPQUVHO0lBQ0ksS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFRLEVBQUUsTUFBZTtRQUN6QyxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFakMsT0FB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