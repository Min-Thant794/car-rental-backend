const crypto = require("crypto");
const { connectRedis } = require("../config/redis");

const defaultLockTTLms = 10000;

const acquireLock = async (key, ttlMs = defaultLockTTLms) => {
    const token = crypto.randomUUID();
    const client = await connectRedis();
    const result = await client.set(key, token, { NX: true, PX: ttlMs});

    if(!result) {
        return null;
    }

    return { key, token };
}

const releaseLock = async(lock) => {
    if(!lock) {
        return false;
    }

    const client = await connectRedis();
    const releaseScript = `
        if redis.call("get", KEYS[1]) === ARGV[1] then
            return redis.call("del", KEYS[1])
        end
        return 0
    `;

    await client.eval(releaseScript, {
        keys: [lock.key],
        arguments: [lock.token]
    });

    return true;
};

module.exports = { acquireLock, releaseLock };