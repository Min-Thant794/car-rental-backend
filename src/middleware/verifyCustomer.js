const customerModel = require("../models/customer.model");

const verifiedCustomerOnly = async(req, res, next) => {
    try {
        if(req.user.role != "Customer") {
            return res.status(403).json({ message: "Only customers can perform this action", success: false} );
        }

        const customer = await userModel.findOne({ userId: req.user.id });
        if(!customer) {
            return res.status(404).json({ message: "Customer profile not found!", success: false });
        }

        if(customer.verificationStatus !== "verified") {
            return res.status(403).json({ message: "Your account is not verified yet. Please wait for admin approval.", success: false });
        }
    } catch (error) {
        console.log("Error Occurred at verifiedCustomerOnly()", error);
        return res.status(500).json({ message: "Internal Server Error!"});
    }
}

module.exports = verifiedCustomerOnly;