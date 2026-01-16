const { Server } = require("socket.io");

let io;

const initializeSocket = (httpServer, corsOptions) => {
    io = new Server(httpServer, {
        cors: corsOptions
    });
    return io;
}

const getIo = () => io;

module.exports = { initializeSocket, getIo };