require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDb } = require("./db/connect");

const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicles");
const bookingRoutes = require("./routes/bookings");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);

// Generic error handler as a safety net
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ detail: "Something went wrong on our end. Please try again." });
});

const PORT = process.env.PORT || 4000;

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Rental API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err.message);
    process.exit(1);
  });
