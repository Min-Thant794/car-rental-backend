const carModel = require("../models/car.model");
const { uploadImage, uploadImages, deleteImage} = require("../config/supabase");
const config = require("../config/config");

const getAllCarModel = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 15); //fetch 15 per request
        const skip = (page - 1) * limit;

        const filter = {};
        const sort = { createdAt: -1};

        const [cars, total] = await Promise.all([
            carModel.find(filter).sort(sort).skip(skip).limit(limit),
            carModel.countDocuments(filter),
        ]);

        if(cars.length === 0) {
            return res.status(404).json({
                message: "No car model found!",
                success: false,
                data: [],
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1,
                    hasPrev: page > 1,
                    hasNext: page < (Math.ceil(total / limit) || 1),
                }
            });
        }

        const totalPages = Math.ceil(total / limit)|| 1;

        return res.status(200).json({
            message: "Successfully fetched from MongoDB",
            success: true,
            data: cars,
            count: cars.length,
            total,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasPrev: page > 1,
                hasNext: page < totalPages,
            }
        });
    } catch (error) {
        console.log("An Error Occurred at getAllCarModel()", error);
        return res.status(500).json({ message: "Internal Server Error!", success: false });
    }
}

const createCarModel = async (req, res) => {
    try {
        //console.log("HEADERS: ", req.headers["content-type"]);
        //console.log("BODY: ", req.body);
        //console.log("FILE: ", req.file);
        const {carName, description, fuelType, vehicleType, pricePerDay, discount, brand, availabilityStatus} = req.body;
        const carImageFile = req.file;

        const safePrice = Number(pricePerDay);
        const safeDiscount = Number.isFinite(Number(discount)) ? Number(discount) : 0;

        let carImageUrl = null;

        if(carImageFile) {
            carImageUrl = await uploadImage(carImageFile, config.SUPABASE_CAR_BUCKET);
        }

        const createCarModel = await carModel.create({
            carName,
            description,
            fuelType,
            vehicleType,
            carImageUrl,
            pricePerDay: safePrice,
            discount: safeDiscount,
            brand,
            availabilityStatus
        });

        if(createCarModel) {
            return res.status(200).json({ 
                data: createCarModel,
                message: `A new car ${createCarModel.carName} has successfully created!`,
                success: true
            });
        } else {
            console.log("An Error Occurred at createCarModel()", error);
            return res.status(400).json({ message: "Failed to create car model!", success: false });
        }

    } catch (error) {
        console.log("An Error Occurred at createCarModel()!", error);
        console.log("MIME type", req.file.mimetype);
        return res.status(500).json({ message: "Internal Server Error!", success: false });
    }
}

const updateCarModel = async (req, res) => {
    try {
        const { id } = req.params;
        const car = await carModel.findById(id);

        if(!car) {
            return res.status(404).json({ message: "No Car found!", success: false });
        };

        let finalData = {...req.body};
        const carImage = req.file;

        if(carImage) {
            if(car?.carImageUrl) {
                await deleteImage(car?.carImageUrl);
            }
            const newCarImageUrl = await uploadImage(carImage, config.SUPABASE_CAR_BUCKET);
            finalData.carImageUrl = newCarImageUrl;
        }

        const updatedCarModel = await carModel.findByIdAndUpdate(id, finalData, { new: true });

        if (updatedCarModel) {
            return res.status(200).json({ message: "Car information updated successfully!", data: updatedCarModel, success: true});
        } else {
            return res.status(400).json({ message: "Failed to update car information!", success: false });
        }
    } catch (error) {
        console.log("An Error Occurred at updateCarModel().", error);
        return res.status(500).json({ message: "Internal Server Error!", success: false });
    }
}

const deleteCarModel = async (req, res) => {
    try {
        const { id } = req.params;
        const car = await carModel.findById(id);
        if(!car) {
            return res.status(404).json({ message: "No car found!", success: false });
        } else {
            await deleteImage(car?.carImageUrl);
        }

        const deletedCarModel = await carModel.findByIdAndDelete(car);

        if(deletedCarModel) {
            return res.status(200).json({ message: "Car model deleted successfully!", success: true });
        } else {
            return res.status(400).json({ message: "Failed to delete car model!", success: false });
        }
    } catch (error) {
        console.log("An Error Occurred at deleteCarModel()", error);
        return res.status(500).json({ message: "Internal Server Error!", success: false });
    }
}

module.exports = {getAllCarModel, createCarModel, updateCarModel, deleteCarModel};