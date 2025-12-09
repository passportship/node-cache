const assert = require('assert');
const util = require('util');
const { RedisCache } = require('../lib/redis-cache');

describe('RedisCache Integration Test', function () {
  let cache;

  before(async function () {
    cache = new RedisCache({
      clientOptions: {
        db: 4
      }
    });
  });

  after(async function () {
    if (cache && cache.client) {
      const quit = util.promisify(cache.client.quit.bind(cache.client));
      await quit();
    }
  });

  it('should be able to set and get a simple string value', async function () {
    const key = 'test:simple:string';
    const value = 'test-value-123';

    const setResult = await cache.set(key, value);
    assert.strictEqual(setResult, true, 'set() should return true');

    const getResult = await cache.get(key);
    assert.strictEqual(getResult, value, 'get() should return the same value');

    await cache.delete(key);
  });

  it('should be able to set and get an object value', async function () {
    const key = 'test:object';
    const value = { name: 'test', id: 42, nested: { data: 'value' } };

    const setResult = await cache.set(key, value);
    assert.strictEqual(setResult, true, 'set() should return true');

    const getResult = await cache.get(key);
    assert.deepStrictEqual(getResult, value, 'get() should return the same object');

    await cache.delete(key);
  });

  it('should be able to set value with expiration and get it before expiration', async function () {
    const key = 'test:expiration';
    const value = 'expiring-value';
    const duration = 5; // 5 sec

    const setResult = await cache.set(key, value, duration);
    assert.strictEqual(setResult, true, 'set() should return true');

    const existsBefore = await cache.exists(key);
    assert.strictEqual(existsBefore, true, 'key should exist before expiration');

    const getResult = await cache.get(key);
    assert.strictEqual(getResult, value, 'get() should return the value');

    await cache.delete(key);
  });

  it('should return false for non-existent key', async function () {
    const key = 'test:nonexistent:key';

    const exists = await cache.exists(key);
    assert.strictEqual(exists, false, 'key should not exist');

    const getResult = await cache.get(key);
    assert.strictEqual(getResult, false, 'get() should return false for non-existent key');
  });

  it('should be able to use multiGet to get multiple values', async function () {
    const key1 = 'test:multi1';
    const key2 = 'test:multi2';
    const key3 = 'test:multi3';
    const value1 = 'value1';
    const value2 = { data: 'value2' };
    const value3 = 'value3';

    try {
      await cache.set(key1, value1);
      await cache.set(key2, value2);
      await cache.set(key3, value3);

      const results = await cache.multiGet([key1, key2, key3, 'nonexistent']);

      assert.strictEqual(results[key1], value1, 'multiGet should return value1');
      assert.deepStrictEqual(results[key2], value2, 'multiGet should return value2');
      assert.strictEqual(results[key3], value3, 'multiGet should return value3');
      assert.strictEqual(results['nonexistent'], false, 'multiGet should return false for nonexistent key');
    } finally {
      await cache.delete(key1);
      await cache.delete(key2);
      await cache.delete(key3);
    }
  });

  it('should be able to delete a key', async function () {
    const key = 'test:delete';
    const value = 'to-be-deleted';

    await cache.set(key, value);

    assert.strictEqual(await cache.exists(key), true, 'key should exist before delete');

    const deleteResult = await cache.delete(key);
    assert.strictEqual(deleteResult, true, 'delete() should return true');

    assert.strictEqual(await cache.exists(key), false, 'key should not exist after delete');
    assert.strictEqual(await cache.get(key), false, 'get() should return false after delete');
  });
});

