const mongoose = require("mongoose");
const dns = require("dns");

// On some networks -- Windows especially -- Node's default DNS resolver
// fails to look up the special "SRV" record that mongodb+srv:// URIs need,
// even though normal internet/DNS works fine otherwise. Pointing Node's
// resolver at a public DNS server directly sidesteps that.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Connects to MongoDB Atlas (or any MongoDB instance) using the connection
// string in MONGODB_URI. Unlike the old JSON-file storage, this data lives
// outside the server's own filesystem -- so it survives redeploys, restarts,
// and free-tier hosts spinning the service down after inactivity.
async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add your MongoDB Atlas connection string to .env (see .env.example)."
    );
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");
}

module.exports = { connectDb };
