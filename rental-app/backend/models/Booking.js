const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  vehicleId: { type: String, required: true },
  vehicleName: { type: String, required: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  days: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  notes: { type: String, default: "" },
  status: { type: String, default: "pending" }, // pending -> paid -> confirmed (or -> cancelled)
  createdAt: { type: String, required: true },
});

bookingSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Booking", bookingSchema);
