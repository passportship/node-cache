import * as _ from 'lodash';
import * as crypto from 'crypto';

function mb5(data: any): string {
    return crypto.createHash('md5').update(data).digest('hex');
}

// TODO add dependency

export interface IOptions {
    keyPrefix?: string;
    defaultDuration?: number;
    serialization?: boolean;
}

export abstract class BaseCache {
    /**
     * @type {string} a string prefixed to every cache key so that it is unique globally in the whole cache storage.
     * It is recommended that you set a unique cache key prefix for each application if the same cache
     * storage is being used by different applications.
     *
     * To ensure interoperability, only alphanumeric characters should be used.
     */
    public keyPrefix: string = '';

    /**
     * @type {number} Default duration in seconds before a cache entry will expire. Default value is 0, meaning infinity. This value is used by set() if the duration is not explicitly given.
     */
    public defaultDuration: number = 0;

    public serialization: boolean = true;

    protected constructor(options?: IOptions) {
        if (_.isPlainObject(options)) {
            if (_.isString(options?.keyPrefix)) {
                this.keyPrefix = options.keyPrefix;
            }

            // @ts-ignore
            if (_.isInteger(options.defaultDuration) && options.defaultDuration > 0) {
                this.defaultDuration = <number>options?.defaultDuration;
            }

            if (_.isBoolean(options?.serialization)) {
                this.serialization = options.serialization;
            }
        }
    }

    private getDuration(duration?: number) {
        // @ts-ignore
        return _.isInteger(duration) && duration >= 0 ? duration : this.defaultDuration;
    }

    /**
     * Builds a normalized cache key from a given key.
     *
     * If the given key is a string containing alphanumeric characters only and no more than 32 characters,
     * then the key will be returned back prefixed with [[keyPrefix]]. Otherwise, a normalized key
     * is generated by serializing the given key, applying MD5 hashing, and prefixing with [[keyPrefix]].
     *
     * @param key the key to be normalized
     * @returns {string} the generated cache key
     */
    public buildKey(key: any, prefix?: any): string {
        if (_.isString(key)) {
            key = key.length <= 32 ? key : mb5(key);
        } else {
            key = mb5(JSON.stringify(key));
        }

        return (prefix || this.keyPrefix) + key;
    }

    /**
     * Retrieves a value from cache with a specified key.
     *
     * @param key a key identifying the cached value. This can be a simple string or
     * a complex data structure consisting of factors representing the key.
     * @returns {any} the value stored in cache, false if the value is not in the cache, expired.
     */
    public get(key: any, prefix?: string): any {
        key = this.buildKey(key, prefix);

        const value = this.getValue(key);

        if (value === false || this.serialization === false) {
            return value;
        }

        return JSON.parse(value as string);
    }

    /**
     * Retrieves multiple values from cache with the specified keys.
     * @param {any[]} keys list of string keys identifying the cached values
     * @return {any} list of cached values corresponding to the specified keys. The list
     * is returned in terms of (key, value) pairs.
     * If a value is not cached or expired, the corresponding array value will be false.
     */
    public multiGet(keys: any[], prefix?: string) {
        const keyMap: any = {};

        for (const key of keys) {
            keyMap[key] = this.buildKey(key, prefix);
        }

        const values = this.getValues(_.values(keyMap));
        const results: any = {};

        _.forEach(keyMap, (newKey, key) => {
            results[key] = false;

            if (values[newKey] !== undefined) {
                if (!this.serialization) {
                    results[key] = values[newKey];
                } else {
                    results[key] = JSON.parse(values[newKey]);
                }
            }
        });

        return results;
    }

    /**
     * Checks whether a specified key exists in the cache.
     * This can be faster than getting the value from the cache if the data is big.
     * In case a cache does not support this feature natively, this method will try to simulate it
     * but has no performance improvement over getting it.
     *
     * @param key a key identifying the cached value. This can be a simple string or
     * a complex data structure consisting of factors representing the key.
     * @returns {boolean} true if a value exists in cache, false if the value is not in the cache or expired.
     */
    public exists(key: any, prefix?: string): boolean {
        key = this.buildKey(key, prefix);
        const value = this.getValue(key);

        return value !== false;
    }

    /**
     * Stores a value identified by a key into cache.
     * If the cache already contains such a key, the existing value and
     * expiration time will be replaced with the new ones, respectively.
     *
     * @param key a key identifying the value to be cached. This can be a simple string or
     * a complex data structure consisting of factors representing the key.
     * @param value the value to be cached
     * @param {number} duration the number of seconds in which the cached value will expire. 0 means never expire.
     * @returns {boolean} whether the value is successfully stored into cache
     */
    public set(key: any, value: any, duration?: number, prefix?: string): boolean {
        key = this.buildKey(key, prefix);

        if (this.serialization === true) {
            value = JSON.stringify(value);
        }

        // @ts-ignore
        return this.setValue(key, value, this.getDuration(duration));
    }

    /**
     * Stores multiple items in cache. Each item contains a value identified by a key.
     * If the cache already contains such a key, the existing value and
     * expiration time will be replaced with the new ones, respectively.
     *
     * @param {any} items the items to be cached, as key-value pairs.
     * @param int {number} duration the number of seconds in which the cached values will expire. 0 means never expire.
     * @return {any[]} array of failed keys
     */
    public multiSet(items: any, duration?: number, prefix?: string) {
        const data: any = {};

        _.forEach(items, (value, key) => {
            if (this.serialization === true) {
                value = JSON.stringify(value);
            }

            key = this.buildKey(key, prefix);
            data[key] = value;
        });

        // @ts-ignore
        return this.setValues(data, this.getDuration(duration));
    }

    /**
     * Stores a value identified by a key into cache if the cache does not contain this key.
     * Nothing will be done if the cache already contains the key.
     *
     * @param key a key identifying the value to be cached. This can be a simple string or
     * a complex data structure consisting of factors representing the key.
     * @param value the value to be cached
     * @param {number} duration the number of seconds in which the cached value will expire. 0 means never expire.
     * @returns {boolean} whether the value is successfully stored into cache
     */
    public add(key: any, value: any, duration?: number, prefix?: string): boolean {
        key = this.buildKey(key, prefix);

        if (this.serialization === true) {
            value = JSON.stringify(value);
        }

        // @ts-ignore
        return this.addValue(key, value, this.getDuration(duration));
    }

    /**
     * Stores multiple items in cache. Each item contains a value identified by a key.
     * If the cache already contains such a key, the existing value and expiration time will be preserved.
     *
     * @param {any} items the items to be cached, as key-value pairs.
     * @param {number} duration the number of seconds in which the cached values will expire. 0 means never expire.
     * @return {any[]} array of failed keys
     */
    public multiAdd(items: any, duration?: number, prefix?: string) {
        const data: any = {};

        _.forEach(items, (value, key) => {
            if (this.serialization === true) {
                value = JSON.stringify(value);
            }

            key = this.buildKey(key, prefix);
            data[key] = value;
        });

        // @ts-ignore
        return this.addValues(data, this.getDuration(duration));
    }

    /**
     * Deletes a value with the specified key from cache
     *
     * @param key a key identifying the value to be deleted from cache. This can be a simple string or
     * a complex data structure consisting of factors representing the key.
     * @returns {boolean} if no error happens during deletion
     */
    public delete(key: any, prefix?: string): boolean {
        key = this.buildKey(key, prefix);

        return this.deleteValue(key);
    }

    /**
     * Deletes all values from cache.
     * Be careful of performing this operation if the cache is shared among multiple applications.
     *
     * @returns {boolean} whether the flush operation was successful.
     */
    public flush(): boolean {
        return this.flushValues();
    }

    /**
     * Retrieves a value from cache with a specified key.
     * This method should be implemented by child classes to retrieve the data
     * from specific cache storage.
     *
     * @param {string} key a unique key identifying the cached value
     * @returns {string | boolean} the value stored in cache, false if the value is not in the cache or expired.
     */
    protected abstract getValue(key: string): string | boolean;

    /**
     * Stores a value identified by a key in cache.
     * This method should be implemented by child classes to store the data
     * in specific cache storage.
     *
     * @param {string} key the key identifying the value to be cached
     * @param {string} value the value to be cached
     * @param {number} duration the number of seconds in which the cached value will expire. 0 means never expire.
     * @returns {boolean} true if the value is successfully stored into cache, false otherwise
     */
    protected abstract setValue(key: string, value: string, duration: number): boolean;

    /**
     * Stores a value identified by a key into cache if the cache does not contain this key.
     * This method should be implemented by child classes to store the data
     * in specific cache storage.
     *
     * @param {string} key the key identifying the value to be cached
     * @param {string} value the value to be cached
     * @param {number} duration the number of seconds in which the cached value will expire. 0 means never expire.
     * @returns {boolean} true if the value is successfully stored into cache, false otherwise
     */
    protected abstract addValue(key: string, value: string, duration: number): boolean;

    /**
     * Deletes a value with the specified key from cache
     * This method should be implemented by child classes to delete the data from actual cache storage.
     *
     * @param {string} key the key of the value to be deleted
     * @returns {boolean} if no error happens during deletion
     */
    protected abstract deleteValue(key: string): boolean;

    /**
     * Deletes all values from cache.
     * Child classes may implement this method to realize the flush operation.
     *
     * @returns {boolean} whether the flush operation was successful.
     */
    protected abstract flushValues(): boolean;

    /**
     * Retrieves multiple values from cache with the specified keys.
     * The default implementation calls [[getValue()]] multiple times to retrieve
     * the cached values one by one. If the underlying cache storage supports multiget,
     * this method should be overridden to exploit that feature.
     *
     * @param {string[]} keys a list of keys identifying the cached values
     * @returns {any} a list of cached values indexed by the keys
     */
    protected getValues(keys: string[]): any {
        const results: any = {};

        for (const key of keys) {
            results[key] = this.getValue(key);
        }

        return results;
    }

    /**
     * Stores multiple key-value pairs in cache.
     * The default implementation calls [[setValue()]] multiple times store values one by one. If the underlying cache
     * storage supports multi-set, this method should be overridden to exploit that feature.
     *
     * @param data array where key corresponds to cache key while value is the value stored
     * @param duration the number of seconds in which the cached values will expire. 0 means never expire.
     * @returns {any[]} array of failed keys
     */
    protected setValues(data: any, duration: number): any[] {
        const failedKeys: any[] = [];

        _.forEach(data, (value, key) => {
            if (this.setValue(key, value, duration) === false) {
                failedKeys.push(key);
            }
        });

        return failedKeys;
    }

    /**
     * Stores multiple key-value pairs in cache.
     * The default implementation calls [[setValue()]] multiple times store values one by one. If the underlying cache
     * storage supports multi-set, this method should be overridden to exploit that feature.
     *
     * @param {any} data array where key corresponds to cache key while value is the value stored
     * @param {number} duration the number of seconds in which the cached values will expire. 0 means never expire.
     * @returns {any[]} array of failed keys
     */
    protected addValues(data: any, duration: number): any[] {
        const failedKeys: any[] = [];

        _.forEach(data, (value, key) => {
            if (this.addValue(key, value, duration) === false) {
                failedKeys.push(key);
            }
        });

        return failedKeys;
    }
}
