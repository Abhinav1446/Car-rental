const mongoose = require("mongoose");

// Keeping our own short string `id` (instead of relying on Mongo's own
// _id) means the frontend and route code didn't need to change at all --
// vehicles are still looked up by the same kind of id as before.
const vehicleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, default: "Car" },
  seats: { type: Number, default: 5 },
  transmission: { type: String, default: "Manual" },
  fuel: { type: String, default: "Petrol" },
  pricePerDay: { type: Number, required: true },
  available: { type: Boolean, default: true },
  photoUrl: { type: String, default: "" },
  description: { type: String, default: "" },
});

// Hide Mongo's internal _id/__v fields from API responses so the JSON
// shape sent to the frontend is unchanged from the old JSON-file version.
vehicleSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
