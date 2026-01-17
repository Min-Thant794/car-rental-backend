const { Server } = require("socket.io");

let io;

const initializeSocket = (httpServer, corsOptions) => {
    io = new Server(httpServer, {
        cors: corsOptions
    });
    return io;
}

const getIo = () => {
    if(!io) {
        throw new Error("Socket.IO not initialized!");
    }
    return io;
};

module.exports = { initializeSocket, getIo };