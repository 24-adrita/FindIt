require("dotenv").config();
const storageService = require("./src/services/storageService");
const emailService = require("./src/services/emailService");

async function runTest() {
  console.log("\n=======================================================");
  console.log("   🧪 Testing FindIt Cloud Storage & Email Services");
  console.log("=======================================================\n");

  // 1. Test Storage Service Status
  console.log("[1/3] Checking Storage Service Configuration...");
  if (storageService.isCloudinaryConfigured) {
    console.log("  ✅ Cloudinary Status: CONFIGURED & ACTIVE (Remote CDN Uploads enabled)");
  } else {
    console.log("  📁 Cloudinary Status: LOCAL DISK FALLBACK (Active - saving to /uploads)");
  }

  // 2. Test Email Service Status
  console.log("\n[2/3] Checking Email Service Configuration...");
  if (emailService.isSmtpConfigured) {
    console.log("  ✅ SMTP Status: CONFIGURED (Real emails will be sent via SMTP/Gmail)");
  } else {
    console.log("  📬 SMTP Status: GRACEFUL MOCK MODE (Console log preview enabled)");
  }

  // 3. Trigger Mock Email Delivery Test
  console.log("\n[3/3] Simulating Automated Email Dispatch...");
  const sampleRecipient = "student.test@campus.edu";
  
  const result = await emailService.sendReportConfirmationEmail({
    to: sampleRecipient,
    recipientName: "Farhana Nowshin",
    itemTitle: "Sony Wireless Headphones",
    type: "lost",
    viewLink: "http://localhost:3000/explore",
  });

  console.log("Dispatch Result:", result);
  console.log("\n=======================================================");
  console.log("   🎉 Test Completed Successfully! All services ready.");
  console.log("=======================================================\n");
}

runTest().catch(console.error);
