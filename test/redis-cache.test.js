const assert = require('assert');
const proxyquire = require('proxyquire');

function createMockRedisClient(overrides = {}) {
  // default behaviors
  const calls = { set: [], del: [], scan: [], flushdb: [], exists: [], get: [], mget: [] };

  const client = {
    // Redis v4 methods return Promises
    exists: async (key) => {
      calls.exists.push([key]);
      return overrides.exists != null ? overrides.exists(key) : 0;
    },
    get: async (key) => {
      calls.get.push([key]);
      return overrides.get != null ? overrides.get(key) : null;
    },
    mget: async (keys) => {
      calls.mget.push([keys]);
      if (overrides.mget) return overrides.mget(keys);
      return keys.map(() => null);
    },
    set: async (...args) => {
      calls.set.push(args);
      if (overrides.set) return overrides.set(...args);
      return 'OK';
    },
    del: async (keysOrKey) => {
      calls.del.push([keysOrKey]);
      if (overrides.del) return overrides.del(keysOrKey);
      // return number of deleted keys
      return Array.isArray(keysOrKey) ? keysOrKey.length : 1;
    },
    scan: async (...args) => {
      calls.scan.push(args);
      if (overrides.scan) return overrides.scan(...args);
      // default: no keys, stop immediately
      return ['0', []];
    },
    flushdb: async () => {
      calls.flushdb.push([]);
      return overrides.flushdb ? overrides.flushdb() : 'OK';
    },
    __calls: calls,
  };

  return client;
}

function getRedisCacheWithMock(mockClient) {
  const { RedisCache } = proxyquire('../lib/redis-cache.js', {
    redis: { createClient: () => mockClient },
  });
  return RedisCache;
}

describe('RedisCache', function () {
  it('exists() returns boolean based on redis exists', async function () {
    const client = createMockRedisClient({ exists: () => 1 });
    const RedisCache = getRedisCacheWithMock(client);
    const cache = new RedisCache();
    assert.strictEqual(await cache.exists('k1'), true);

    client.__calls.exists = []; // reset calls
    client.exists = async () => 0;
    assert.strictEqual(await cache.exists('k1'), false);
  });

  it('get() returns parsed value and false on miss', async function () {
    const data = { a: 1 };
    const client = createMockRedisClient({
      get: (key) => (key.endsWith('user') ? JSON.stringify(data) : null),
    });
    const RedisCache = getRedisCacheWithMock(client);
    const cache = new RedisCache();
    assert.deepStrictEqual(await cache.get('user'), data);
    assert.strictEqual(await cache.get('none'), false);
  });

  it('set() uses EX when duration > 0 and returns true', async function () {
    const client = createMockRedisClient();
    const RedisCache = getRedisCacheWithMock(client);
    const cache = new RedisCache();

    const ok = await cache.set('k', { v: 1 }, 10);
    assert.strictEqual(ok, true);
    // last set call should include EX and seconds
    const last = client.__calls.set[client.__calls.set.length - 1];
    assert.strictEqual(last[0], cache.buildKey('k'));
    assert.strictEqual(last[1], JSON.stringify({ v: 1 }));
    assert.strictEqual(last[2], 'EX');
    assert.strictEqual(last[3], 10);
  });

  it('set() without duration uses simple SET and returns true', async function () {
    const client = createMockRedisClient();
    const RedisCache = getRedisCacheWithMock(client);
    const cache = new RedisCache();

    const ok = await cache.set('k2', 'val', 0);
    assert.strictEqual(ok, true);
    const last = client.__calls.set[client.__calls.set.length - 1];
    assert.strictEqual(last[0], cache.buildKey('k2'));
    assert.strictEqual(last[1], JSON.stringify('val'));
    assert.strictEqual(last.length, 2); // no EX
  });

  it('add() uses NX and EX appropriately', async function () {
    const client = createMockRedisClient();
    const RedisCache = getRedisCacheWithMock(client);
    const cache = new RedisCache();

    let ok = await cache.add('k3', 1, 0);
    assert.strictEqual(ok, true);
    let last = client.__calls.set[client.__calls.set.length - 1];
    assert.deepStrictEqual(last.slice(2), ['NX']);

    ok = await cache.add('k4', 2, 5);
    assert.strictEqual(ok, true);
    last = client.__calls.set[client.__calls.set.length - 1];
    assert.deepStrictEqual(last.slice(2), ['EX', 5, 'NX']);
  });

  it('delete() returns true when del count > 0', async function () {
    const client = createMockRedisClient({ del: () => 1 });
    const RedisCache = getRedisCacheWithMock(client);
    const cache = new RedisCache();
    assert.strictEqual(await cache.delete('k5'), true);
    client.del = async () => 0;
    assert.strictEqual(await cache.delete('k6'), false);
  });

  it('multiGet() maps values correctly with serialization', async function () {
    const client = createMockRedisClient({
      mget: (keys) => [JSON.stringify({ a: 1 }), null, JSON.stringify('x')],
    });
    const RedisCache = getRedisCacheWithMock(client);
    const cache = new RedisCache();
    const res = await cache.multiGet(['k1', 'k2', 'k3']);
    assert.deepStrictEqual(res, { k1: { a: 1 }, k2: false, k3: 'x' });
  });

  it('flush() uses flushdb when not shared', async function () {
    const client = createMockRedisClient();
    const RedisCache = getRedisCacheWithMock(client);
    const cache = new RedisCache({ isSharedDatabase: false });
    const ok = await cache.flush();
    assert.strictEqual(ok, true);
    assert.strictEqual(client.__calls.flushdb.length, 1);
  });

  it('flush() scans and deletes matched keys when shared', async function () {
    const keysToDelete = ['pref:a', 'pref:b'];
    const client = createMockRedisClient({
      scan: () => ['0', keysToDelete],
    });
    const RedisCache = getRedisCacheWithMock(client);
    const cache = new RedisCache({ isSharedDatabase: true, keyPrefix: 'pref:' });
    const ok = await cache.flush();
    assert.strictEqual(ok, true);
    // del should be called with the array of keys
    const lastDelArgs = client.__calls.del[client.__calls.del.length - 1][0];
    assert.deepStrictEqual(lastDelArgs, keysToDelete);
  });
});
