"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCache = void 0;
const _ = require("lodash");
const base_cache_1 = require("./base-cache");
class MemoryCache extends base_cache_1.BaseCache {
    _cache = {};
    /**
     * @inheritDoc
     */
    serialization = false;
    // eslint-disable-next-line  @typescript-eslint/no-useless-constructor
    constructor(options) {
        super(options);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVtb3J5LWNhY2hlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21lbW9yeS1jYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw0QkFBNEI7QUFDNUIsNkNBQW1EO0FBRW5ELE1BQWEsV0FBWSxTQUFRLHNCQUFTO0lBQzlCLE1BQU0sR0FBUSxFQUFFLENBQUM7SUFFekI7O09BRUc7SUFDSSxhQUFhLEdBQVksS0FBSyxDQUFDO0lBRXRDLHNFQUFzRTtJQUN0RSxZQUFZLE9BQWtCO1FBQzFCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBRUQ7O09BRUc7SUFDSSxNQUFNLENBQUMsR0FBUSxFQUFFLE1BQWU7UUFDbkMsR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRWpDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFUyxTQUFTLENBQUMsR0FBVztRQUMzQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNuQyxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzVCLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztJQUNwRCxDQUFDO0lBRUQ7O09BRUc7SUFDTyxRQUFRLENBQUMsR0FBVztRQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7T0FFRztJQUNPLFFBQVEsQ0FBQyxHQUFXLEVBQUUsS0FBYSxFQUFFLFFBQWdCO1FBQzNELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLFFBQVEsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQztRQUUzRixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDTyxRQUFRLENBQUMsR0FBVyxFQUFFLEtBQWEsRUFBRSxRQUFnQjtRQUMzRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFcEMsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ08sV0FBVyxDQUFDLEdBQVc7UUFDN0IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXhCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7T0FFRztJQUNPLFdBQVc7UUFDakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFFakIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUNKO0FBcEZELGtDQW9GQyJ9