/**
 * Seed Script: Secure Admin Account Setup (Day 4)
 *
 * Reads initial admin credentials from environment variables or .env file.
 * Prevents accidental overwrite if an admin account already exists.
 * Hashing is handled automatically via bcrypt in the User model.
 *
 * Usage:
 *   node src/scripts/seedAdmin.js
 */

const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const User = require("../models/User");

async function seedAdmin() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/findit";
  const adminName = process.env.ADMIN_NAME || "Campus Security Admin";
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@campus.edu").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminStudentId = process.env.ADMIN_STUDENT_ID || "ADMIN-001";
  const adminPhone = process.env.ADMIN_PHONE || "+1 (555) 019-9000";

  if (!adminPassword || adminPassword.length < 6) {
    console.error("❌ ERROR: ADMIN_PASSWORD must be defined in .env and be at least 6 characters long.");
    process.exit(1);
  }

  console.log("==================================================");
  console.log("🛡️  FINDIT SECURE ADMIN SEEDING");
  console.log("==================================================");
  console.log(`📡 Connecting to MongoDB at: ${mongoUri}`);

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully.");

    // Check if an account already exists with this email
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      if (existingAdmin.role === "admin") {
        console.log(`ℹ️  Admin account for "${adminEmail}" already exists with role: "${existingAdmin.role}".`);
        console.log("🔒 Preserving existing credentials. Admin account will NOT be overwritten.");
      } else {
        console.log(`⚠️  User account for "${adminEmail}" exists with role "${existingAdmin.role}". Upgrading to "admin"...`);
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log("✅ User upgraded to admin role successfully.");
      }
    } else {
      console.log(`🌱 Creating new Administrator account for: ${adminEmail}`);
      const newAdmin = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        studentId: adminStudentId,
        phone: adminPhone,
        role: "admin",
      });

      await newAdmin.save();
      console.log("🎉 Administrator account created successfully!");
      console.log(`   - Name: ${newAdmin.name}`);
      console.log(`   - Email: ${newAdmin.email}`);
      console.log(`   - Role: ${newAdmin.role}`);
      console.log(`   - ID: ${newAdmin._id}`);
    }

    console.log("==================================================");
    console.log("Admin setup complete.");
  } catch (err) {
    console.error("❌ Failed to seed administrator account:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed.");
  }
}

seedAdmin();
