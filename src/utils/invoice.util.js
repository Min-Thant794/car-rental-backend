const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#1A1A2E",      // deep navy
  accent: "#E94560",       // vibrant red
  accentLight: "#FF6B6B",  // soft red
  surface: "#F7F8FC",      // light grey background
  border: "#E2E8F0",       // subtle border
  textPrimary: "#1A202C",  // near-black
  textSecondary: "#718096",// muted grey
  white: "#FFFFFF",
  success: "#38A169",      // green for "paid" badge
};

const FONTS = {
  regular: "Helvetica",
  bold: "Helvetica-Bold",
  oblique: "Helvetica-Oblique",
};

const PAGE = { width: 595.28, height: 841.89, margin: 50 };

// ─── Helper Utilities ─────────────────────────────────────────────────────────
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const calcRentalDays = (start, end) => {
  const diff = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ─── Drawing Helpers ──────────────────────────────────────────────────────────
const drawRoundedRect = (doc, x, y, w, h, r, fillColor, strokeColor) => {
  doc.save().roundedRect(x, y, w, h, r);
  if (fillColor) doc.fillColor(fillColor).fill();
  if (strokeColor) doc.strokeColor(strokeColor).stroke();
  doc.restore();
};

const drawHRule = (doc, y, color = COLORS.border, thickness = 0.5) => {
  doc
    .save()
    .moveTo(PAGE.margin, y)
    .lineTo(PAGE.width - PAGE.margin, y)
    .lineWidth(thickness)
    .strokeColor(color)
    .stroke()
    .restore();
};

// ─── Section Builders ─────────────────────────────────────────────────────────
const drawHeader = (doc) => {
  // Full-width hero band
  doc
    .save()
    .rect(0, 0, PAGE.width, 130)
    .fill(COLORS.primary)
    .restore();

  // Accent stripe
  doc
    .save()
    .rect(0, 120, PAGE.width, 10)
    .fill(COLORS.accent)
    .restore();

  // Brand name
  doc
    .font(FONTS.bold)
    .fontSize(28)
    .fillColor(COLORS.white)
    .text("Let's Drive", PAGE.margin, 36, { lineBreak: false });

  doc
    .font(FONTS.regular)
    .fontSize(13)
    .fillColor(COLORS.accentLight)
    .text("  ·  Premium Car Rentals", PAGE.margin + 118, 44, { lineBreak: false });

  // INVOICE label (top-right)
  doc
    .font(FONTS.bold)
    .fontSize(11)
    .fillColor(COLORS.accentLight)
    .text("INVOICE", PAGE.width - PAGE.margin - 100, 44, { width: 100, align: "right", lineBreak: false });

  // Paid badge
  drawRoundedRect(doc, PAGE.width - PAGE.margin - 64, 62, 64, 22, 4, COLORS.success, null);
  doc
    .font(FONTS.bold)
    .fontSize(9)
    .fillColor(COLORS.white)
    .text("✓  CONFIRMED", PAGE.width - PAGE.margin - 62, 68, { width: 60, align: "center", lineBreak: false });
};

const drawMetaRow = (doc, booking) => {
  const y = 148;

  const items = [
    { label: "Invoice No.", value: `#${String(booking._id).slice(-8).toUpperCase()}` },
    { label: "Issue Date", value: formatDate(new Date()) },
    { label: "Start Date", value: formatDate(booking.startDate) },
    { label: "End Date", value: formatDate(booking.endDate) },
  ];

  const colW = (PAGE.width - PAGE.margin * 2) / items.length;

  items.forEach((item, i) => {
    const x = PAGE.margin + i * colW;

    if (i > 0) {
      doc
        .save()
        .moveTo(x, y)
        .lineTo(x, y + 40)
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .stroke()
        .restore();
    }

    doc
      .font(FONTS.regular)
      .fontSize(8)
      .fillColor(COLORS.textSecondary)
      .text(item.label.toUpperCase(), x + (i === 0 ? 0 : 12), y, { width: colW - 12, lineBreak: false });

    doc
      .font(FONTS.bold)
      .fontSize(10)
      .fillColor(COLORS.textPrimary)
      .text(item.value, x + (i === 0 ? 0 : 12), y + 13, { width: colW - 12, lineBreak: false });
  });

  drawHRule(doc, y + 46);
};

const drawParties = (doc, user, car) => {
  const y = 218;
  const midX = PAGE.width / 2 + 10;

  // ── Billed To ──
  doc
    .font(FONTS.bold)
    .fontSize(8)
    .fillColor(COLORS.accent)
    .text("BILLED TO", PAGE.margin, y, { lineBreak: false });

  doc
    .font(FONTS.bold)
    .fontSize(13)
    .fillColor(COLORS.textPrimary)
    .text(user.userName, PAGE.margin, y + 14, { lineBreak: false });

  doc
    .font(FONTS.regular)
    .fontSize(10)
    .fillColor(COLORS.textSecondary)
    .text(user.email, PAGE.margin, y + 30, { lineBreak: false });

  // ── Vehicle ──
  doc
    .font(FONTS.bold)
    .fontSize(8)
    .fillColor(COLORS.accent)
    .text("VEHICLE", midX, y, { lineBreak: false });

  doc
    .font(FONTS.bold)
    .fontSize(13)
    .fillColor(COLORS.textPrimary)
    .text(car.carName, midX, y + 14, { lineBreak: false });

  doc
    .font(FONTS.regular)
    .fontSize(10)
    .fillColor(COLORS.textSecondary)
    .text(car.brand, midX, y + 30, { lineBreak: false });

  drawHRule(doc, y + 56);
};

const drawLineItemsTable = (doc, booking, car) => {
  const tableTop = 300;
  const colX = {
    desc: PAGE.margin,
    days: PAGE.margin + 270,
    rate: PAGE.margin + 350,
    amount: PAGE.width - PAGE.margin - 80,
  };
  const tableW = PAGE.width - PAGE.margin * 2;

  // Table header
  drawRoundedRect(doc, PAGE.margin, tableTop, tableW, 26, 4, COLORS.primary, null);

  const headers = [
    { label: "DESCRIPTION", x: colX.desc + 10, align: "left" },
    { label: "DAYS", x: colX.days, align: "center" },
    { label: "DAILY RATE", x: colX.rate, align: "center" },
    { label: "AMOUNT", x: colX.amount, align: "right" },
  ];

  headers.forEach(({ label, x, align }) => {
    doc
      .font(FONTS.bold)
      .fontSize(8)
      .fillColor(COLORS.white)
      .text(label, x, tableTop + 9, { width: 80, align, lineBreak: false });
  });

  // Row data
  const days = calcRentalDays(booking.startDate, booking.endDate);
  const dailyRate = days > 0 ? (booking.totalPrice / days).toFixed(2) : booking.totalPrice;
  const rowY = tableTop + 36;

  // Alternating row background
  doc
    .save()
    .rect(PAGE.margin, rowY, tableW, 28)
    .fill(COLORS.surface)
    .restore();

  doc
    .font(FONTS.bold)
    .fontSize(11)
    .fillColor(COLORS.textPrimary)
    .text(`${car.brand} ${car.carName}`, colX.desc + 10, rowY + 8, { lineBreak: false });

  doc
    .font(FONTS.regular)
    .fontSize(9)
    .fillColor(COLORS.textSecondary)
    .text("Car rental service", colX.desc + 10, rowY + 20, { lineBreak: false });

  doc
    .font(FONTS.regular)
    .fontSize(11)
    .fillColor(COLORS.textPrimary)
    .text(String(days), colX.days, rowY + 9, { width: 80, align: "center", lineBreak: false });

  doc
    .text(`$${dailyRate}`, colX.rate, rowY + 9, { width: 80, align: "center", lineBreak: false });

  doc
    .font(FONTS.bold)
    .text(formatCurrency(booking.totalPrice), colX.amount, rowY + 9, { width: 80, align: "right", lineBreak: false });

  drawHRule(doc, rowY + 34);

  // Totals block
  const totalsX = PAGE.width - PAGE.margin - 220;
  let totY = rowY + 50;
  const totW = 220;

  const rows = [
    { label: "Subtotal", value: formatCurrency(booking.totalPrice) },
    { label: "Tax / VAT (0%)", value: "$0.00" },
  ];

  rows.forEach(({ label, value }) => {
    doc
      .font(FONTS.regular)
      .fontSize(10)
      .fillColor(COLORS.textSecondary)
      .text(label, totalsX, totY, { width: totW - 80, lineBreak: false });

    doc
      .font(FONTS.regular)
      .fontSize(10)
      .fillColor(COLORS.textPrimary)
      .text(value, totalsX + totW - 80, totY, { width: 80, align: "right", lineBreak: false });

    totY += 18;
  });

  drawHRule(doc, totY + 4, COLORS.accent, 1);
  totY += 14;

  // Grand total
  drawRoundedRect(doc, totalsX - 10, totY, totW + 10, 36, 6, COLORS.accent, null);

  doc
    .font(FONTS.bold)
    .fontSize(11)
    .fillColor(COLORS.white)
    .text("TOTAL DUE", totalsX, totY + 11, { width: totW - 80, lineBreak: false });

  doc
    .font(FONTS.bold)
    .fontSize(14)
    .fillColor(COLORS.white)
    .text(formatCurrency(booking.totalPrice), totalsX + totW - 80, totY + 9, {
      width: 80,
      align: "right",
      lineBreak: false,
    });
};

const drawFooter = (doc, booking) => {
  const footerY = PAGE.height - 90;

  drawHRule(doc, footerY, COLORS.border);

  // Left — thank you note
  doc
    .font(FONTS.oblique)
    .fontSize(10)
    .fillColor(COLORS.textSecondary)
    .text("Thank you for choosing Let's Drive. Safe travels!", PAGE.margin, footerY + 14, { lineBreak: false });

  // Right — support
  doc
    .font(FONTS.regular)
    .fontSize(9)
    .fillColor(COLORS.textSecondary)
    .text("Questions? support@letsdrive.com", PAGE.margin, footerY + 30, {
      width: PAGE.width - PAGE.margin * 2,
      align: "right",
      lineBreak: false,
    });

  // Bottom band
  doc
    .save()
    .rect(0, PAGE.height - 20, PAGE.width, 20)
    .fill(COLORS.primary)
    .restore();

  doc
    .font(FONTS.regular)
    .fontSize(7)
    .fillColor(COLORS.textSecondary)
    .text(
      `Invoice ${String(booking._id).slice(-8).toUpperCase()} · Generated ${new Date().toUTCString()}`,
      PAGE.margin,
      PAGE.height - 14,
      { width: PAGE.width - PAGE.margin * 2, align: "center", lineBreak: false }
    );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
const generateInvoicePDF = (booking, user, car) => {
  return new Promise((resolve, reject) => {
    try {
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const filePath = path.join(tempDir, `invoice-${booking._id}.pdf`);
      const doc = new PDFDocument({
        size: "A4",
        margin: PAGE.margin,
        autoFirstPage: false,
        bufferPages: true,
        info: {
          Title: `Invoice ${booking._id}`,
          Author: "Let's Drive",
          Subject: "Car Rental Invoice",
        },
      });

      // Add exactly one page — prevents PDFKit from auto-adding more
      doc.addPage({ size: "A4", margin: PAGE.margin });

      const stream = fs.createWriteStream(filePath);
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
      doc.pipe(stream);

      drawHeader(doc);
      drawMetaRow(doc, booking);
      drawParties(doc, user, car);
      drawLineItemsTable(doc, booking, car);
      drawFooter(doc, booking);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };