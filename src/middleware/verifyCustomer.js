const userModel = require("../models/user.model");
const customerModel = require("../models/customer.model");

const verifiedCustomerOnly = async(req, res, next) => {
    try {
        if(req.user.role != "Customer") {
            return res.status(403).json({ message: "Only customers can perform this action", success: false} );
        }

        console.log("req.user =", req.user);
        console.log("req.user.id =", req.user?.id);
        console.log("req.user._id =", req.user?._id);
        console.log("req.user.userId =", req.user?.userId);
        const customer = await customerModel.findOne({ userId: req.user?.userId });
        if(!customer) {
            return res.status(404).json({ message: "Customer profile not found!", success: false });
        }

        if(customer.verificationStatus !== "verified") {
            return res.status(403).json({ message: "Your account is not verified yet. Please wait for admin approval.", success: false });
        }

        next();
    } catch (error) {
        console.log("Error Occurred at verifiedCustomerOnly()", error);
        return res.status(500).json({ message: "Internal Server Error!"});
    }
}

module.exports = verifiedCustomerOnly;