const bookingModel = require("../models/booking.model");
const carModel = require("../models/car.model");
const customerModel = require("../models/customer.model");
const userModel = require("../models/user.model");
const { sendBookingConfirmedEmail } = require("../utils/mailer.util");
const fs = require("fs");
const { generateInvoicePDF } =  require("../utils/invoice.util");
const { acquireLock, releaseLock } = require("../utils/redisLock.util");
const { getIo } = require("../utils/socket");
const { recomputeCarAvailability } = require("../helper/recomputeCarAvailability");

const getAllBooking = async (req, res) => {
    try {
        const allBookings = await bookingModel.find()
            .populate({
              path: "customerId",
              populate: {
                path: "userId",
                select: "userName email"
              }
            })
            .populate("carId", "carName");

        if(allBookings.length === 0) {
            return res.status(404).json({ data: [], message: "No Booking Found!", count: 0, success: false });
        } else {
            return res.status(200).json({
                message: "Successfully fetched from Mongo",
                data: allBookings,
                count: allBookings.length,
                success: true
            });
        }

    } catch (error) {
        console.log("An Error Occurred at getAllBooking()", error);
        return res.status(500).json({ message: "Internal Server Error!", success: false });
    }
}

const getMyBooking = async(req, res) => {
    try {
        const customer = await customerModel.findOne({ userId: req.user?.userId });

        if(!customer) {
            return res.status(404).json({ message: "Customer profile not found!", success: false });
        }

        const myBookings = await bookingModel
            .find({ customerId: customer._id })
            .populate("carId")
            .sort({ createdAt: -1 });

        if(myBookings.length === 0) {
            return res.status(404).json({ message: "No Booking Found!", success: false });
        } else {
            return res.status(200).json({
                message: "Successfully fetched from Mongo",
                data: myBookings,
                count: myBookings.length,
                success: true
            });
        }
    } catch (error) {
        console.log("An Error Occurred at getMyBooking()", error);
        return res.status(500).json({ message: "Internal Server Error!", success: false });
    }
}

const createBooking = async(req, res) => {

    let bookingLock;

    try {
        if(req.user.role !== "Customer") {
            return res.status(403).json({ message: "Only customers can book cars", success: false });
        }

        const customer = await customerModel.findOne({ userId: req.user.userId });
        if(!customer) {
            return res.status(404).json({ message: "Customer profile not found!", success: false });
        }

        const { carId, startDate, endDate } = req.body;

        if (!carId || !startDate || !endDate) {
            return res.status(400).json({ message: "Missing booking details!", success: false });
        };

        const newStart = new Date(startDate);
        const newEnd = new Date(endDate);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        if (newStart < tomorrow) {
            return res.status(400).json({
                message: "Bookings must start from tomorrow or later",
                success: false
            });
        }

        const maxFuture = new Date();
        maxFuture.setMonth(maxFuture.getMonth() + 3);

        if(newStart > maxFuture) {
            return res.status(400).json({
                message: "Bookings can only be made up to 3 months in advance.",
                success: false
            })
        }

        if(newEnd <= newStart) {
            return res.status(400).json({ message: "End date must be after start date!", success: false });
        }

        const car = await carModel.findById(carId);

        if(!car) return res.status(404).json({ message: "Car not found!", success: false });

        if(car.availabilityStatus !== "Available") {
            return res.status(400).json({
                message: "This car is currently not available for booking.",
                success: false
            })
        }

        //booking lock

        const lockKey = `lock:booking:${carId}:${newStart.toISOString()}:${newEnd.toISOString()}`;
        bookingLock = await acquireLock(lockKey);
        if(!bookingLock) {
            return res.status(409).json({ message: "Booking is currently being processed. Please try again.", success: false });
        }
        
        const isConflict = await bookingModel.findOne({
            carId,
            bookingStatus: { $in: ["Pending", "Confirmed"]},
            startDate: {$lte: newEnd},
            endDate: {$gte: newStart}
        });

        if(isConflict) {
            return res.status(409).json({ message: "Car is already booked for selected dates.", success: false });
        }

        const days = Math.ceil((newEnd - newStart) / (1000 * 60 * 60 * 24));
        const totalPrice = days * car.pricePerDay;

        const booking = await bookingModel.create({
            customerId: customer._id,
            carId,
            startDate: newStart,
            endDate: newEnd,
            totalPrice,
            bookingStatus: "Pending"
        });

        //socket io
        const io = getIo();
        if(io) {
            io.emit("booking:created", {
                bookingId: booking._id,
                carId: booking.carId,
                startDate: booking.startDate,
                endDate: booking.endDate,
                bookingStatus: booking.bookingStatus,
                totalPrice: booking.totalPrice
            });
        }

        return res.status(201).json({ message: "Booking created successfully!", data: booking, success: true });

    } catch (error) {
        console.log("An Error Occurred at createBooking()", error);
        return res.status(500).json({ message: "Internal Server Error!", success: false });
    } finally {
        await releaseLock(bookingLock);
    }
}

const updateMyBooking = async (req, res) => {
  let bookingLock;

  try {
    const { id } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate && !endDate) {
      return res.status(400).json({ message: "At least start date or end date must be provided!", success: false });
    }

    const customer = await customerModel.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found!", success: false });
    }

    const booking = await bookingModel.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found!", success: false });
    }

    if (booking.customerId.toString() !== customer._id.toString()) {
      return res.status(403).json({ message: "You cannot update this booking", success: false });
    }

    const blockedStatuses = ["Confirmed", "Cancelled", "Expired", "Completed"];
    if (blockedStatuses.includes(booking.bookingStatus)) {
      return res.status(400).json({ message: "This booking cannot be modified anymore.", success: false });
    }

    const now = new Date();

    // If booking already started, no changes
    const startDay = new Date(booking.startDate);
      startDay.setHours(0,0,0,0);

      const today = new Date();
      today.setHours(0,0,0,0);

      // if today is the pickup day or after, block
      if (startDay <= today) {
        return res.status(400).json({
          message: "Booking already started and cannot be modified",
          success: false
        });
      }

    const normalizeLocalMidnight = (d) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    }

    const newStartDate = startDate ? normalizeLocalMidnight(startDate) : normalizeLocalMidnight(booking.startDate);
    const newEndDate   = endDate   ? normalizeLocalMidnight(endDate)   : normalizeLocalMidnight(booking.endDate);

    if (Number.isNaN(newStartDate.getTime()) || Number.isNaN(newEndDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format", success: false });
    }

    // Must start from tomorrow (same rule as create)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (newStartDate < tomorrow) {
      return res.status(400).json({ message: "Bookings must start from tomorrow or later", success: false });
    }

    // max 3 months advance (same rule as create)
    const maxFuture = new Date();
    maxFuture.setMonth(maxFuture.getMonth() + 3);
    if (newStartDate > maxFuture) {
      return res.status(400).json({ message: "Bookings can only be made up to 3 months in advance.", success: false });
    }

    if (newEndDate <= newStartDate) {
      return res.status(400).json({ message: "End date must be after start date!", success: false });
    }

    // lock by booking id (prevents concurrent edits)
    const lockKey = `lock:booking:update:${booking._id}`;
    bookingLock = await acquireLock(lockKey);
    if (!bookingLock) {
      return res.status(409).json({ message: "Booking update is currently being processed. Please try again.", success: false });
    }

    // conflict check (strict overlap)
    const isConflict = await bookingModel.findOne({
      _id: { $ne: booking._id },
      carId: booking.carId,
      bookingStatus: { $in: ["Pending", "Confirmed"] },
      startDate: { $lt: newEndDate },
      endDate: { $gt: newStartDate }
    });

    if (isConflict) {
      return res.status(409).json({ message: "Car is already booked for the selected dates.", success: false });
    }

    const car = await carModel.findById(booking.carId);
    if (!car) {
      return res.status(404).json({ message: "Car not found!", success: false });
    }

    const days = Math.ceil((newEndDate - newStartDate) / (1000 * 60 * 60 * 24));
    booking.startDate = newStartDate;
    booking.endDate = newEndDate;
    booking.totalPrice = days * car.pricePerDay;

    await booking.save();

    const io = getIo();
    if (io) {
      io.emit("booking:updated", {
        bookingId: booking._id,
        carId: booking.carId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        bookingStatus: booking.bookingStatus,
        totalPrice: booking.totalPrice
      });
    }

    return res.status(200).json({ message: "Booking updated successfully!", success: true, data: booking });

  } catch (error) {
    console.log("Error at updateMyBooking()", error);
    return res.status(500).json({ message: "Internal Server Error!", success: false });
  } finally {
    if (bookingLock) await releaseLock(bookingLock);
  }
};

const updateBookingAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingStatus } = req.body;

    const allowedStatus = ["Pending", "Confirmed", "Cancelled"];
    if (!allowedStatus.includes(bookingStatus)) {
      return res.status(400).json({ message: "Invalid booking status!", success: false });
    }

    const booking = await bookingModel.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found!", success: false });
    }

    const prevStatus = booking.bookingStatus;

    if (prevStatus === bookingStatus) {
      return res.status(200).json({
        message: "Booking status unchanged.",
        data: booking,
        success: true,
      });
    }

    booking.bookingStatus = bookingStatus;
    const updatedBooking = await booking.save();

    await recomputeCarAvailability(updatedBooking.carId);

    if (prevStatus !== "Confirmed" && updatedBooking.bookingStatus === "Confirmed") {
      const customer = await customerModel.findById(updatedBooking.customerId);
      if (customer) {
        const user = await userModel.findById(customer.userId);
        const car = await carModel.findById(updatedBooking.carId);

        if (user && car) {
          const invoicePath = await generateInvoicePDF(updatedBooking, user, car);
          try {
            await sendBookingConfirmedEmail(user.email, updatedBooking, car, invoicePath);
          } finally {
            await fs.unlink(invoicePath).catch(() => {});
          }
        }
      }
    }

    const io = getIo();
    if (io) {
      io.emit("booking:status-updated", {
        bookingId: updatedBooking._id,
        carId: updatedBooking.carId,
        bookingStatus: updatedBooking.bookingStatus,
      });
    }

    return res.status(200).json({
      message: "Booking updated successfully by admin!",
      data: updatedBooking,
      success: true,
    });
  } catch (error) {
    console.log("Error Occurred at updateBookingAdmin()", error);
    return res.status(500).json({ message: "Internal Server Error!", success: false });
  }
};

const cancelMyBooking = async (req, res) => {
  let bookingLock;
  try {
    const { id } = req.params;

    const customer = await customerModel.findOne({ userId: req.user.userId});
    if(!customer) {
      return res.status(404).json({ message: "Customer profile not found!", success: false });
    }

    const booking = await bookingModel.findById(id);
    if(!booking) {
      return res.status(404).json({ message: "Booking not found!", success: false });
    }

    if(booking.customerId.toString() !== customer._id.toString()) {
      return res.status(403).json({ message: "You cannot cancel this booking", success: false });
    }

    const blockedStatuses = ["Expired", "Confirmed", "Completed", "Cancelled"];
    if (blockedStatuses.includes(booking.bookingStatus)) {
      return res.status(400).json({
        message: `This booking is already ${booking.bookingStatus} and cannot be cancelled.`,
        success: false
      });
    }

    const now = new Date();

    if(booking.startDate <= now) {
      return res.status(400).json({ message: "Booking already started and cannot be modified", success: false });
    }

    const lockKey = `lock:booking:cancel:${booking._id}`;
    bookingLock = await acquireLock(lockKey);
    if(!bookingLock) {
      return res.status(409).json({ message: "Booking cancellation is currently being processed. Please try again.", success: false });
    }

    booking.bookingStatus = "Cancelled";
    await booking.save();

    const io = getIo();
    if(io) {
      io.emit("booking:cancelled", {
        bookingId: booking._id,
        carId: booking.carId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        bookingStatus: booking.bookingStatus
      });
    }

    return res.status(200).json({ message: "Booking cancelled successfully!", success: true, data: booking});
  } catch (error) {
    console.log("An Error Occurred at cancelMyBooking()", error);
    return res.status(500).json({ message: "Internal Server Error!", success: false });
  } finally {
    if(bookingLock) await releaseLock(bookingLock);
  }
}

// const deleteMyBooking = async(req, res) => {
//     try {
//         const { id } = req.params;
//         const customer = await customerModel.findOne({ userId: req.user?.userId });
        
//         if(!customer) return res.status(404).json({ message: "Customer profile not found!", success: false });

//         const booking = await bookingModel.findById(id);

//         if(!booking) {
//             return res.status(404).json({ message: "Booking not found!", success: false });
//         }

//         if(booking.customerId.toString() !== customer._id.toString()) {
//             return res.status(403).json({ message: "You are not allowed to delete this booking.", success: false });
//         }

//         if(booking.bookingStatus === "Confirmed") {
//             return res.status(400).json({ message: "You cannot delete your booking once confirmed!", success: false });
//         }

//         booking.bookingStatus = "Cancelled";
//         await booking.save();

//         const io = getIo();
//         if(io) {
//             io.emit("booking-status-updated", {
//                 bookingId: booking._id,
//                 carId: booking.carId,
//                 bookingStatus: booking.bookingStatus
//             });
//         }

//         return res.status(200).json({ message: "Booking cancelled successfully!", success: true });
//     } catch (error) {
//         console.log("An Error Occurred at deleteMyBooking()", error);
//         return res.status(500).json({ message: "Internal Server Error!", success: false });
//     }
// }

const deleteBooking = async(req, res) => {
    try {
        const { id } = req.params;
        const deleted = await bookingModel.findByIdAndDelete(id);
        
        if(!deleted) return res.status(400).json({ message: "Booking not found!", success: false });

        const io = getIo();
        if(io) {
            io.emit("booking:deleted", {
                bookingId: deleted._id,
                carId: deleted.carId
            });
        }

        return res.status(200).json({ message: "Booking deleted by Admin", success: true });
    } catch (error) {
        console.log("An Error Occurred at deleteBooking()", error);
        return res.status(500).json({ message: "Internal Server Error!", success: false });
    }
}

module.exports = {getAllBooking, getMyBooking, createBooking, updateMyBooking, updateBookingAdmin, cancelMyBooking, deleteBooking};