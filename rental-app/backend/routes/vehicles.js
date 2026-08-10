const express = require("express");
const crypto = require("crypto");
const Vehicle = require("../models/Vehicle");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

function newId() {
  return crypto.randomBytes(4).toString("hex");
}

// --- Public: anyone browsing the site can see the fleet ---

router.get("/", async (req, res, next) => {
  try {
    const filter = req.query.available === "true" ? { available: true } : {};
    const vehicles = await Vehicle.find(filter).sort({ name: 1 });
    res.json(vehicles);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ id: req.params.id });
    if (!vehicle) return res.status(404).json({ detail: "Vehicle not found." });
    res.json(vehicle);
  } catch (err) {
    next(err);
  }
});

// --- Admin only: manage the fleet ---

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { name, type, seats, transmission, fuel, pricePerDay, photoUrl, description } = req.body || {};

    if (!name || !pricePerDay) {
      return res.status(400).json({ detail: "Name and price per day are required." });
    }

    const vehicle = await Vehicle.create({
      id: newId(),
      name,
      type: type || "Car",
      seats: Number(seats) || 5,
      transmission: transmission || "Manual",
      fuel: fuel || "Petrol",
      pricePerDay: Number(pricePerDay),
      available: true,
      photoUrl: photoUrl || "",
      description: description || "",
    });

    res.status(201).json(vehicle);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const allowedFields = ["name", "type", "seats", "transmission", "fuel", "pricePerDay", "available", "photoUrl", "description"];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (updates.pricePerDay !== undefined) updates.pricePerDay = Number(updates.pricePerDay);
    if (updates.seats !== undefined) updates.seats = Number(updates.seats);

    const vehicle = await Vehicle.findOneAndUpdate({ id: req.params.id }, updates, { new: true });
    if (!vehicle) return res.status(404).json({ detail: "Vehicle not found." });
    res.json(vehicle);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const deleted = await Vehicle.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ detail: "Vehicle not found." });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
