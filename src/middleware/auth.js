const jwt = require('jsonwebtoken');
const config = require("../config/config");

const auth = (req, res, next) => {
    try {
        const token = req.cookies?.token;

        console.log("Token from cookie: ", token);

        if(!token) {
            return res.status(400).json({ message: "Authentication required!"});
        }

        const decoded = jwt.verify(token, config.JWT_SECRET_KEY);
        req.user = decoded;

        console.log("Decoded user: ", decoded);
        
        next();

    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token"});
    }
};

module.exports = auth;