"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCache = void 0;
const _ = __importStar(require("lodash"));
const base_cache_1 = require("./base-cache");
class MemoryCache extends base_cache_1.BaseCache {
    // eslint-disable-next-line  @typescript-eslint/no-useless-constructor
    constructor(options) {
        super(options);
        this._cache = {};
        /**
         * @inheritDoc
         */
        this.serialization = false;
    }
    /**
     * @inheritDoc
     */
    exists(key, prefix) {
        key = this.buildKey(key, prefix);
        return !this.isExpired(key);
    }
    isExpired(key) {
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
    getValue(key) {
        if (!this.isExpired(key)) {
            return _.cloneDeep(this._cache[key][0]);
        }
        return false;
    }
    /**
     * @inheritDoc
     */
    setValue(key, value, duration) {
        this._cache[key] = [_.cloneDeep(value), duration === 0 ? 0 : Date.now() / 1000 + duration];
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
