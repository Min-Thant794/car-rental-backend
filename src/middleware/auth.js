const jwt = require('jsonwebtoken');
const config = require("../config/config");

const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader) {
            return res.status(401).json({ message: "Missing token."});
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, config.JWT_SECRET_KEY);

        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token"});
    }
};

module.exports = auth;