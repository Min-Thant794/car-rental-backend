const { createClient } = require("redis");
const config = require("./config");

let client;

const connectRedis = async () => {
    try {
        // Reuse existing connection
        if (client && client.isOpen) {
            return client;
        }

        client = createClient({
            username: config.REDIS_USERNAME,
            password: config.REDIS_PASSWORD,
            socket: {
                host: config.REDIS_HOST,
                port: config.REDIS_PORT
            }
        });

        client.on("error", (err) => {
            console.log("Redis Client Error:", err);
        });

        if (!client.isOpen) {
            await client.connect();
            console.log("Redis successfully connected!");
        }

        return client; // ✅ THIS WAS MISSING

    } catch (error) {
        console.log("An error occurred while connecting Redis!", error);
        throw error; // let caller know connection failed
    }
};

module.exports = { connectRedis };