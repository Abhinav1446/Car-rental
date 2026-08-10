// Run with: npm run seed
//
// Adds a couple of sample vehicles to the database if none exist yet --
// edit or remove these once the real fleet is entered through the admin
// dashboard.
//
// Note: the admin login no longer needs seeding. It's read directly from
// ADMIN_EMAIL / ADMIN_PASSWORD in your .env file every time the server
// starts, so rotating the password is just "change .env and restart."

require("dotenv").config();
const mongoose = require("mongoose");
const { connectDb } = require("../db/connect");
const Vehicle = require("../models/Vehicle");

async function seed() {
  await connectDb();

  const existingCount = await Vehicle.countDocuments();
  if (existingCount > 0) {
    console.log(`Vehicles already exist (${existingCount}) -- skipping sample data.`);
  } else {
    await Vehicle.create([
      {
        id: "v1",
        name: "Maruti Swift",
        type: "Hatchback",
        seats: 5,
        transmission: "Manual",
        fuel: "Petrol",
        pricePerDay: 1500,
        available: true,
        photoUrl: "",
        description: "Compact and easy to park, great for city trips.",
      },
      {
        id: "v2",
        name: "Hyundai Creta",
        type: "SUV",
        seats: 5,
        transmission: "Automatic",
        fuel: "Diesel",
        pricePerDay: 2800,
        available: true,
        photoUrl: "",
        description: "Comfortable SUV, good for family trips and highways.",
      },
    ]);
    console.log("Sample vehicles added.");
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
