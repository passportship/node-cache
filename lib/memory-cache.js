"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_cache_1 = require("./base-cache");
class MemoryCache extends base_cache_1.BaseCache {
    constructor() {
        super(...arguments);
        this._cache = {};
        /**
         * @inheritDoc
         */
        this.serialization = false;
    }
    /**
     * @inheritDoc
     */
    exists(key) {
        key = this.buildKey(key);
        return !this.isExpired(key);
    }
    isExpired(key) {
        return !this._cache.hasOwnProperty(key) || this._cache[key][1] !== 0 || this._cache[key][1] <= Date.now() / 1000;
    }
    /**
     * @inheritDoc
     */
    getValue(key) {
        if (!this.isExpired(key)) {
            return this._cache[key][0];
        }
        return false;
    }
    /**
     * @inheritDoc
     */
    setValue(key, value, duration) {
        this._cache[key] = [value, duration === 0 ? 0 : Date.now() / 1000 + duration];
        return true;
    }
    /**
     * @inheritDoc
     */
    addValue(key, value, duration) {
        if (!this.isExpired(key)) {
            return false;
        }
        this.setValue(key, value, duration);
        return true;
    }
    /**
     * @inheritDoc
     */
    deleteValue(key) {
        delete this._cache[key];
        return true;
    }
    /**
     * @inheritDoc
     */
    flushValues() {
        this._cache = {};
        return true;
    }
}
exports.MemoryCache = MemoryCache;
