const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoicePDF = (booking, user, car) => {
  return new Promise((resolve, reject) => {
    try {
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const filePath = path.join(tempDir, `invoice-${booking._id}.pdf`);

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const stream = fs.createWriteStream(filePath);

      stream.on("finish", () => resolve(filePath));
      stream.on("error", (err) => reject(err));

      doc.pipe(stream);

      doc.fontSize(20).text("Let's Drive - Booking Invoice", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice ID: ${booking._id}`);
      doc.text(`Customer: ${user.userName}`);
      doc.text(`Email: ${user.email}`);
      doc.moveDown();

      doc.text(`Car: ${car.carName}`);
      doc.text(`Brand: ${car.brand}`);
      doc.moveDown();

      doc.text(`Start Date: ${new Date(booking.startDate).toDateString()}`);
      doc.text(`End Date: ${new Date(booking.endDate).toDateString()}`);
      doc.moveDown();

      doc.fontSize(14).text(`Total Price: $${booking.totalPrice}`, { align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };