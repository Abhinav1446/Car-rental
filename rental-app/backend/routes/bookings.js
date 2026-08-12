const express = require("express");
const crypto = require("crypto");
const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");
const { requireAdmin } = require("../middleware/auth");
const { buildUpiLink } = require("../utils/upi");
const { sendBookingNotification } = require("../utils/email");

const router = express.Router();

function newId() {
  return crypto.randomBytes(4).toString("hex");
}

function daysBetween(start, end) {
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// Two date ranges [aStart, aEnd) and [bStart, bEnd) overlap if each starts
// before the other ends. Using the end date as exclusive (i.e. the return
// day) means a car returned on the 12th can be picked up by someone else
// that same day -- standard rental-industry turnover convention.
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

// Only paid/confirmed bookings hold the vehicle's dates -- see the note
// in routes/vehicles.js for the reasoning and the tradeoff this creates.
const BLOCKING_STATUSES = ["paid", "confirmed"];

// --- Public: a customer submits a booking request ---

router.post("/", async (req, res, next) => {
  try {
    const { vehicleId, customerName, phone, startDate, endDate, notes, paymentMethod } = req.body || {};

    if (!vehicleId || !customerName || !phone || !startDate || !endDate) {
      return res.status(400).json({ detail: "Please fill in all required fields." });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ detail: "Return date must be after the pickup date." });
    }

    const method = paymentMethod === "cash" ? "cash" : "upi";

    const vehicle = await Vehicle.findOne({ id: vehicleId });
    if (!vehicle) return res.status(404).json({ detail: "That vehicle could not be found." });
    if (!vehicle.available) return res.status(400).json({ detail: "That vehicle is not currently available." });

    // Server-side double-booking check -- the calendar UI is just a
    // convenience; this is what actually enforces it.
    const existingBookings = await Booking.find({ vehicleId, status: { $in: BLOCKING_STATUSES } });
    const hasOverlap = existingBookings.some((b) => rangesOverlap(startDate, endDate, b.startDate, b.endDate));
    if (hasOverlap) {
      return res.status(409).json({ detail: "Those dates were just booked by someone else. Please pick different dates." });
    }

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
      paymentMethod: method,
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

    // Fire-and-forget -- the customer's booking is already saved and
    // shouldn't wait on (or fail because of) an email send.
    sendBookingNotification(booking);

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

// Public status lookup by booking reference -- powers the "check your
// booking" page. Deliberately leaves phone number out of the response
// since this endpoint doesn't require login (the booking id itself, an
// 8-character random code, is what gates access).
router.get("/status/:id", async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) return res.status(404).json({ detail: "Booking not found. Double check your booking reference." });

    res.json({
      id: booking.id,
      vehicleName: booking.vehicleName,
      startDate: booking.startDate,
      endDate: booking.endDate,
      days: booking.days,
      totalAmount: booking.totalAmount,
      paymentMethod: booking.paymentMethod,
      status: booking.status,
      createdAt: booking.createdAt,
    });
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

    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) return res.status(404).json({ detail: "Booking not found." });

    // Since pending bookings don't block each other, two customers could
    // both end up pending for the same dates. Catch that here: before
    // actually verifying/confirming one, make sure it doesn't collide with
    // another booking that's already paid/confirmed for the same vehicle.
    if (BLOCKING_STATUSES.includes(status)) {
      const others = await Booking.find({
        vehicleId: booking.vehicleId,
        id: { $ne: booking.id },
        status: { $in: BLOCKING_STATUSES },
      });
      const conflict = others.find((b) => rangesOverlap(booking.startDate, booking.endDate, b.startDate, b.endDate));
      if (conflict) {
        return res.status(409).json({
          detail: `These dates conflict with another ${conflict.status} booking (ref ${conflict.id}, ${conflict.startDate} to ${conflict.endDate}) for the same vehicle. Cancel or resolve that one first.`,
        });
      }
    }

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
