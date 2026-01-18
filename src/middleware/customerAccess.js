const isCustomer = (req, res, next) => {
    if(req.user?.role !== "Customer") {
        return res.status(403).json({ message: "Only customers can access this resource!", success: false });
    }

    next();
}

module.exports = isCustomer;