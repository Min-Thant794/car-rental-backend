const {createClient} = require('redis')
const config = require('./config')

let client;
const connectRedis = async () => {
    try {
        client = createClient({
        username: config.REDIS_USERNAME,
        password: config.REDIS_PASSWORD,
        socket: {
            host: config.REDIS_HOST,
            port: config.REDIS_PORT
        }
    });
    if(!client){
        console.log("Redis client failed to connect!")
    }

    await client.connect();
    client.on("error", () => console.log("Error connecting redis client"))
    client.on("success", () => "Redis successfully connected!")

    } catch (error) {
        console.log("An error ocurred!", error)
    }
}

module.exports = { connectRedis };