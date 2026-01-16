const pdfDoc = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoicePDF = (booking, user, car) => {
    return new Promise((resolve, reject) => {
        const doc = new pdfDoc({ size: "A4", margin: 50});

        const filePath = path.join(
            __dirname,
            `../temp/invoice-${booking._id}.pdf`
        );

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        //header
        doc.fontSize(20).text("Let's Drive - Booling Invoice", { align: "center" });
        doc.moveDown();

        doc.fontSize(12).text(`Invoice ID: ${booking._id}`);
        doc.text(`Customer:${user.userName}`);
        doc.text(`Email: ${user.email}`);
        doc.moveDown();

        //car details
        doc.text(`Car: ${car.carName}`);
        doc.text(`Brand: ${car.brand}`);
        doc.moveDown();

        //booking details
        doc.text(`Start Date: ${new Date(booking.startDate).toDateString()}`);
        doc.text(`End Date: ${new Date(booking.endDate).toDateString()}`);
        doc.moveDown();

        //price
        doc.fontSize(14).text(`Total Price: $${booking.totalPrice}`, {
            aligh: "right"
        });

        doc.end();

        stream.on("finish", () => resolve(filePath));
        stream.on("error", reject);
    });
}

module.exports = { generateInvoicePDF };