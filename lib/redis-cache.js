"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const _ = require("lodash");
const redis = require("redis");
const async_base_cache_1 = require("./async-base-cache");
// TODO add getValues, setValues and addValues with specified redis commands?
/**
 * > Note: If you need to share database, you should set [[shareDatabase]] to `true` and make sure that
 * > [[keyPrefix]] has unique value which will allow to distinguish between cache keys and other data in database.
 */
class RedisCache extends async_base_cache_1.AsyncBaseCache {
    constructor(options) {
        super();
        this.shareDatabase = false;
        this._client = redis.createClient(options);
    }
    get client() {
        return this._client;
    }
    runCommand(command, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield util.promisify(this.client[command]).bind(this.client)(...args);
        });
    }
    /**
     * @inheritDoc
     */
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            key = this.buildKey(key);
            return !!(yield this.runCommand('exists', key));
        });
    }
    /**
     * @inheritDoc
     */
    getValue(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const value = yield this.runCommand('get', key);
            return value !== null ? value : false;
        });
    }
    /**
     * @inheritDoc
     */
    setValue(key, value, duration) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = undefined;
            if (duration === 0) {
                result = yield this.runCommand('set', key, value);
            }
            else {
                result = yield this.runCommand('set', key, value, 'EX', duration);
            }
            return result === 'OK';
        });
    }
    /**
     * @inheritDoc
     */
    addValue(key, value, duration) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = undefined;
            if (duration === 0) {
                result = yield this.runCommand('set', key, value, 'NX');
            }
            else {
                result = yield this.runCommand('set', key, value, 'EX', duration, 'NX');
            }
            return result === 'OK';
        });
    }
    /**
     * @inheritDoc
     */
    deleteValue(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return !!(yield this.runCommand('del', key));
        });
    }
    /**
     * @inheritDoc
     */
    flushValues() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.shareDatabase) {
                let cursor = 0;
                do {
                    const result = yield this.runCommand('scan', '0', 'MATCH', this.keyPrefix + '*', 'COUNT', 100);
                    cursor = _.toNumber(result[0]);
                    const keys = result[1];
                    if (keys.length) {
                        yield this.runCommand('del', keys);
                    }
                } while (cursor !== 0);
                return true;
            }
            return !!(yield this.runCommand('flushdb'));
        });
    }
}
exports.RedisCache = RedisCache;
