const userModel = require('../models/user.model');

const getAllUsers = async (req, res) => {
    try {
        const fetchedUsers = await userModel.find({});
        if(fetchedUsers){
            return res.status(200).json({message: "Users successfully fetched!", success: true})
        }
    } catch (error) {
        console.log("An Error Occurred during fetching users", error);
        res.status(500).json({message: "Internal Server Error"})
    }
}

const regiseterUser = async (req, res) => {
    try {
        console.log("req.body: ", req.body);

    } catch (error) {
        
    }
}

const loginUser = async (req, res) => {
    try {
        
    } catch (error) {
        console.log('Error occurred at loginUser()')
        res.status(500).json({message: "Internal Server Error!", error});
    }
}

const updateUser = async (req, res) => {
    try {
        
    } catch (error) {
        console.log('Error occurred at updateUser()');
        req.status(500).json({message: "Internal Server Error", error});
    }
}

const deleteUser = async function (req, res) {
    try {
        
    } catch (error) {
        console.log("An Error at deleteUser()", error);
        res.status(500).json({message: "Internal Server Error", error});
    }
}

module.exports = {
    getAllUsers,
    regiseterUser,
    loginUser,
    updateUser,
    deleteUser
}