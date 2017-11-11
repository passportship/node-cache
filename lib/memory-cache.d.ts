import { BaseCache } from './base-cache';
export declare class MemoryCache extends BaseCache {
    private _cache;
    /**
     * @inheritDoc
     */
    serialization: boolean;
    /**
     * @inheritDoc
     */
    exists(key: any): boolean;
    /**
     * @inheritDoc
     */
    protected getValue(key: string): string | boolean;
    /**
     * @inheritDoc
     */
    protected setValue(key: string, value: string, duration: number): boolean;
    /**
     * @inheritDoc
     */
    protected addValue(key: string, value: string, duration: number): boolean;
    /**
     * @inheritDoc
     */
    protected deleteValue(key: string): boolean;
    /**
     * @inheritDoc
     */
    protected flushValues(): boolean;
}
