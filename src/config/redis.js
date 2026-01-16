const {createClient} = require('redis');
const config = require("./config");

const redisUrl = config.REDIS_URL || "redis://localhost:6379";
const redisClient = createClient({ url: redisUrl});

redisClient.on("error", (error) => {
    console.error("Redis Client Error: ", error);
});

const connectRedis = async() => {
    if(!redisClient.isOpen) {
        await redisClient.connect();
    }
    return redisClient;
}

module.exports = {redisClient, connectRedis};