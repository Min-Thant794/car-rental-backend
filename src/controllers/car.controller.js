const carModel = require("../models/car.model");
const { uploadImage, uploadImages, deleteImage} = require("../config/supabase");
const config = require("../config/config");
const bookingModel = require("../models/booking.model");

const escapeRegex = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAllCarModel = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 15);
    const skip = (page - 1) * limit;

    const q = (req.query.q || "").trim();
    const mode = (req.query.mode || "contain").toLowerCase();

    const brand = (req.query.brand || "").trim();
    const fuelType = (req.query.fuelType || "").trim();
    const vehicleType = (req.query.vehicleType || "").trim();
    const seaterRaw = (req.query.seater || "").trim();
    const seater = seaterRaw ? Number(seaterRaw) : null;
    const availabilityStatus = (req.query.availabilityStatus || "").trim();

    const startDate = (req.query.startDate || "").trim();
    const endDate = (req.query.endDate || "").trim();

    const filter = {};

    if (brand) filter.brand = brand;
    if (fuelType) filter.fuelType = fuelType;
    if (vehicleType) filter.vehicleType = vehicleType;
    if (Number.isFinite(seater)) filter.seater = seater;

    const role = req.user?.role;

    if (role === "Customer") {
      filter.availabilityStatus = "Available";
    } else {
      if (availabilityStatus) filter.availabilityStatus = availabilityStatus;
    }

    // Search
    if (q) {
      const safeQ = escapeRegex(q);
      filter.carName =
        mode === "typeahead"
          ? { $regex: `^${safeQ}`, $options: "i" }
          : { $regex: safeQ, $options: "i" };
    }

    let conflictingCarIds = [];
    if (startDate && endDate) {
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);

      if (Number.isNaN(newStart.getTime()) || Number.isNaN(newEnd.getTime())) {
        return res.status(400).json({ message: "Invalid startDate or endDate!", success: false });
      }

      if (newEnd <= newStart) {
        return res.status(400).json({ message: "endDate must be after startDate!", success: false });
      }

      conflictingCarIds = await bookingModel.distinct("carId", {
        bookingStatus: { $in: ["Pending", "Confirmed"] },
        startDate: { $lte: newEnd },
        endDate: { $gte: newStart }
      });

      if (conflictingCarIds.length) {
        filter._id = { $nin: conflictingCarIds };
      }
    }

    const sort = q && mode === "typeahead" ? { carName: 1 } : { createdAt: -1 };

    const [cars, total] = await Promise.all([
      carModel.find(filter).sort(sort).skip(skip).limit(limit),
      carModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      message: cars.length ? "Successfully fetched from MongoDB" : "No car model found!",
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
      },
      query: {
        q,
        mode,
        brand,
        fuelType,
        vehicleType,
        seater,
        availabilityStatus: filter.availabilityStatus ?? availabilityStatus,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.log("An Error Occurred at getAllCarModel()", error);
    return res.status(500).json({ message: "Internal Server Error!", success: false });
  }
};

const getCarByDiscount = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limitRaw = req.query.limit;
    const limit = limitRaw === undefined ? 6 : Math.max(parseInt(limitRaw, 10), 0);
    const skip = limit > 0 ? (page - 1) * limit : 0;

    const discountRaw = req.query.discount;
    const discountNum = discountRaw !== undefined ? Number(discountRaw) : null;

    const q = (req.query.q || "").trim();
    const mode = (req.query.mode || "contain").toLowerCase();

    const filter = {};

    if (discountRaw !== undefined && Number.isFinite(discountNum)) {
      filter.discount = discountNum;
    } else {
      filter.discount = { $gt: 0 };
    }

    if (q) {
      const safeQ = escapeRegex(q);
      filter.carName =
        mode === "typeahead"
          ? { $regex: `^${safeQ}`, $options: "i" }
          : { $regex: safeQ, $options: "i" };
    }

    const query = carModel.find(filter).sort({ discount: -1, createdAt: -1 });
    if (limit > 0) query.skip(skip).limit(limit);

    const [cars, total] = await Promise.all([
      query,
      carModel.countDocuments(filter),
    ]);

    if (cars.length === 0) {
      return res.status(404).json({ message: "No discounted car available", success: false });
    }

    return res.status(200).json({
      message: "Discounted cars fetched successfully!",
      success: true,
      data: cars,
      pagination: limit > 0 ? {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      } : { total }
    });
  } catch (error) {
    console.log("An Error Occurred at getDiscountedCars()", error);
    return res.status(500).json({ message: "Internal Server Error!", success: false });
  }
};

const getCarById = async (req, res) => {
    try {
        const { id } = req.params;

        const car = await carModel.findById(id);

        if(!car) {
            return res.status(404).json({
                message: "Car not found",
                success: false,
            });
        }

        return res.status(200).json({
            success: true,
            data: car
        });
    } catch (error) {
        console.log("An Error Occurred at getCarById()", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

const createCarModel = async (req, res) => {
    try {
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

module.exports = {getAllCarModel, getCarById, getCarByDiscount, createCarModel, updateCarModel, deleteCarModel};