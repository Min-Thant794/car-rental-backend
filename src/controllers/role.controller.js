const roleModel = require('../models/role.model');

const getAllRole = async (req, res) => {
    try {
        const fetchRole = await roleModel.find({})
        res.status(200).json({message: "Role is successfully fetched!", success: true})
    } catch (error) {
        console.log("An Error Occurred During Fetching Role", error)
        res.status(500).json({message: "Internal Server Error"})
    }
}

const createRole = async (req, res) => {
    try {
        const createdRole = await roleModel.create(req.body);
        if(!createdRole){
            return res.status(400).json({message: "Failed to create role", success: false});
        }else{
            return res.status(200).json({message: "Role successfully created!", success: true}, createdRole)
        }
            
    } catch (error) {
        console.log("An Error Occurred at createRole()", error);
        res.status(500).json({message: "Internal Server Error!", error});
    }
}

module.exports = {
    getAllRole,
    createRole,
}