const isCustomer = (req, res, next) => {
    if(req.user?.role != "Customer") {
        return res.status(403).json({ message: "Access denied!"});
    }

    next();
}

module.exports = isCustomer;