const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "config", "config.env") });
const User = require("./models/userModel");

async function run() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("DB Connected.");

    const testEmail = "test_expiry_bug@example.com";
    await User.deleteMany({ email: testEmail });

    // Create a user with a reset token expiring in 15 minutes
    const expiry = Date.now() + 15 * 60 * 1000;
    console.log("Current time:", new Date());
    console.log("Setting expiry to:", new Date(expiry));

    const user = await User.create({
      name: "Expiry Test",
      email: testEmail,
      password: "somePassword123",
      role: "tourist",
      isVerified: true,
      resetPasswordToken: "dummy_token_hash",
      resetPasswordExpire: expiry
    });

    console.log("User created with resetPasswordExpire:", user.resetPasswordExpire);

    // Query using { $gt: Date.now() }
    const queriedUserNumeric = await User.findOne({
      email: testEmail,
      resetPasswordExpire: { $gt: Date.now() }
    });
    console.log("Queried using numeric Date.now() - Found user?", queriedUserNumeric ? "Yes" : "No");

    // Query using { $gt: new Date() }
    const queriedUserDate = await User.findOne({
      email: testEmail,
      resetPasswordExpire: { $gt: new Date() }
    });
    console.log("Queried using new Date() - Found user?", queriedUserDate ? "Yes" : "No");

    // Let's check timezone settings or time differences
    // Sometimes the server is running on a different time or timezone
    console.log("Database server time vs Local server time check:");
    // We can do a db.serverStatus() or similar, or just check the roundtrip
    
    await User.deleteMany({ email: testEmail });
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}
run();
