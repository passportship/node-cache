import * as _ from 'lodash';
import { BaseCache, IOptions } from './base-cache';

export class MemoryCache extends BaseCache {
    private _cache: any = {};

    /**
     * @inheritDoc
     */
    public serialization: boolean = false;

    constructor(options?: IOptions) {
        super(options);
    }

    /**
     * @inheritDoc
     */
    public exists(key: any, prefix?: string): boolean {
        key = this.buildKey(key, prefix);

        return !this.isExpired(key);
    }

    protected isExpired(key: string): boolean {
        if (!this._cache.hasOwnProperty(key)) {
            return true;
        }

        if (this._cache[key][1] === 0) {
            return false;
        }

        return this._cache[key][1] <= Date.now() / 1000;
    }

    /**
     * @inheritDoc
     */
    protected getValue(key: string): string | boolean {
        if (!this.isExpired(key)) {
            return _.cloneDeep(this._cache[key][0]);
        }

        return false;
    }

    /**
     * @inheritDoc
     */
    protected setValue(key: string, value: string, duration: number): boolean {
        this._cache[key] = [_.cloneDeep(value), duration === 0 ? 0 : Date.now() / 1000 + duration];

        return true;
    }

    /**
     * @inheritDoc
     */
    protected addValue(key: string, value: string, duration: number): boolean {
        if (!this.isExpired(key)) {
            return false;
        }

        this.setValue(key, value, duration);

        return true;
    }

    /**
     * @inheritDoc
     */
    protected deleteValue(key: string): boolean {
        delete this._cache[key];

        return true;
    }

    /**
     * @inheritDoc
     */
    protected flushValues(): boolean {
        this._cache = {};

        return true;
    }
}
