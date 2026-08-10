const express = require("express");
const crypto = require("crypto");
const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");
const { requireAdmin } = require("../middleware/auth");
const { buildUpiLink } = require("../utils/upi");

const router = express.Router();

function newId() {
  return crypto.randomBytes(4).toString("hex");
}

function daysBetween(start, end) {
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// --- Public: a customer submits a booking request ---

router.post("/", async (req, res, next) => {
  try {
    const { vehicleId, customerName, phone, startDate, endDate, notes } = req.body || {};

    if (!vehicleId || !customerName || !phone || !startDate || !endDate) {
      return res.status(400).json({ detail: "Please fill in all required fields." });
    }

    const vehicle = await Vehicle.findOne({ id: vehicleId });
    if (!vehicle) return res.status(404).json({ detail: "That vehicle could not be found." });
    if (!vehicle.available) return res.status(400).json({ detail: "That vehicle is not currently available." });

    const days = daysBetween(startDate, endDate);
    const totalAmount = days * vehicle.pricePerDay;
    const bookingId = newId();

    const booking = await Booking.create({
      id: bookingId,
      vehicleId,
      vehicleName: vehicle.name,
      customerName,
      phone,
      startDate,
      endDate,
      days,
      totalAmount,
      notes: notes || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    const upiLink = buildUpiLink({
      payeeVpa: process.env.UPI_ID,
      payeeName: process.env.UPI_PAYEE_NAME || "Rental Business",
      amount: totalAmount,
      note: `${vehicle.name} rental (${days}d) - booking ${bookingId}`,
      txnRef: bookingId,
    });

    res.status(201).json({ booking, upiLink });
  } catch (err) {
    next(err);
  }
});

// A customer can re-fetch the UPI link for an existing booking (e.g. if they
// closed the tab before paying).
router.get("/:id/upi-link", async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) return res.status(404).json({ detail: "Booking not found." });

    const upiLink = buildUpiLink({
      payeeVpa: process.env.UPI_ID,
      payeeName: process.env.UPI_PAYEE_NAME || "Rental Business",
      amount: booking.totalAmount,
      note: `${booking.vehicleName} rental (${booking.days}d) - booking ${booking.id}`,
      txnRef: booking.id,
    });

    res.json({ upiLink });
  } catch (err) {
    next(err);
  }
});

// --- Admin only: view and manage bookings ---

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const allowedStatuses = ["pending", "paid", "confirmed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ detail: "Invalid status." });
    }

    const booking = await Booking.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
    if (!booking) return res.status(404).json({ detail: "Booking not found." });
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
