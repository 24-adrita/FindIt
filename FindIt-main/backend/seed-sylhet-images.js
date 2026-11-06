const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const ItemReport = require("./src/models/ItemReport");

async function seedSylhetImages() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/findit";
  console.log("Connecting to MongoDB:", uri);
  await mongoose.connect(uri);

  const BASE_URL = "http://localhost:5000";

  // 1. Update Water Bottles
  await ItemReport.updateMany(
    { title: { $regex: /water bottle|hydro/i } },
    {
      $set: {
        imageUrls: [`${BASE_URL}/uploads/bd_water_bottle.jpg`],
        imagePaths: ["uploads/bd_water_bottle.jpg"],
      },
    }
  );
  console.log("Updated Water Bottle items with real BD photo.");

  // 2. Update Laptops
  await ItemReport.updateMany(
    { title: { $regex: /macbook|laptop/i } },
    {
      $set: {
        imageUrls: [`${BASE_URL}/uploads/bd_laptop_desk.jpg`],
        imagePaths: ["uploads/bd_laptop_desk.jpg"],
      },
    }
  );
  console.log("Updated Laptop items with real BD photo.");

  // 3. Update Calculus Textbook
  await ItemReport.updateMany(
    { title: { $regex: /calculus|textbook|book/i } },
    {
      $set: {
        imageUrls: [`${BASE_URL}/uploads/bd_calculus_book.jpg`],
        imagePaths: ["uploads/bd_calculus_book.jpg"],
      },
    }
  );
  console.log("Updated Textbook items with real BD photo.");

  // 4. Create/Update Sylhet CNG Wallet (Found & Lost pair)
  const existingWallet = await ItemReport.findOne({ title: { $regex: /CNG/i } });
  if (!existingWallet) {
    await ItemReport.create([
      {
        type: "found",
        title: "Black Leather Wallet in Green CNG (Amberkhana to Zindabazar)",
        category: "bags_wallets",
        brand: "Apex / Leather",
        primaryColor: "Black",
        secondaryColor: "None",
        description: "Found a black zippered leather wallet left on the green rexine passenger seat of a CNG auto rickshaw near Zindabazar Point. Contains student cards and cash.",
        uniqueMarks: "Has a transparent front slot with a photo ID inside.",
        secretVerificationDetail: "Contains 1250 Taka and a national ID ending with 407.",
        location: {
          campusZone: "syl_zinda",
          specificLocation: "Zindabazar Point (CNG dropped from Amberkhana)",
        },
        dateTime: new Date(),
        imageUrls: [`${BASE_URL}/uploads/sylhet_cng_wallet.jpg`],
        imagePaths: ["uploads/sylhet_cng_wallet.jpg"],
        submitterName: "Farhan Ahmed (CNG Driver Contact)",
        submitterEmail: "cng.helpline.sylhet@gmail.com",
        submitterPhone: "01711234567",
        status: "active",
      },
      {
        type: "lost",
        title: "Lost Black Leather Wallet in CNG from Amberkhana",
        category: "bags_wallets",
        brand: "Apex / Leather",
        primaryColor: "Black",
        secondaryColor: "None",
        description: "Lost my black zippered wallet while riding a green CNG from Amberkhana Point to Zindabazar. Dropped on the seat.",
        uniqueMarks: "Has a transparent ID card pocket on the front.",
        secretVerificationDetail: "1250 Taka cash and NID card inside.",
        location: {
          campusZone: "syl_amber",
          specificLocation: "Amberkhana to Zindabazar CNG Route",
        },
        dateTime: new Date(),
        imageUrls: [`${BASE_URL}/uploads/sylhet_cng_wallet.jpg`],
        imagePaths: ["uploads/sylhet_cng_wallet.jpg"],
        submitterName: "Tanvir Rahman",
        submitterEmail: "tanvir.syl@gmail.com",
        submitterPhone: "01819876543",
        status: "active",
      },
    ]);
    console.log("Created Sylhet CNG Wallet demo reports with real photo.");
  }

  // 5. Create/Update Sylhet Surma River Backpack
  const existingBag = await ItemReport.findOne({ title: { $regex: /Surma River/i } });
  if (!existingBag) {
    await ItemReport.create([
      {
        type: "found",
        title: "Navy Blue Student Backpack at Surma River View Cafe",
        category: "bags_wallets",
        brand: "Fjallraven / Student Bag",
        primaryColor: "Blue / Navy",
        secondaryColor: "None",
        description: "Found a navy blue student backpack left on a wooden chair at the riverside tea stall cafe near Keane Bridge (Surma River). Contains notebooks and a steel water bottle.",
        uniqueMarks: "Has an embroidered circular crest patch on front pocket and a silver keychain.",
        secretVerificationDetail: "Contains 3 engineering spiral notebooks and a dark blue water bottle.",
        location: {
          campusZone: "syl_bandar",
          specificLocation: "Surma River View Cafe beside Keane Bridge, Bandarbazar",
        },
        dateTime: new Date(),
        imageUrls: [`${BASE_URL}/uploads/sylhet_cafe_backpack.jpg`],
        imagePaths: ["uploads/sylhet_cafe_backpack.jpg"],
        submitterName: "Kawsar Mia (Tea Stall Owner)",
        submitterEmail: "surma.cafe.sylhet@gmail.com",
        status: "active",
      },
    ]);
    console.log("Created Sylhet Surma River Backpack demo report with real photo.");
  }

  // 6. Create/Update Student ID Card
  const existingId = await ItemReport.findOne({ title: { $regex: /Student ID Card/i } });
  if (!existingId) {
    await ItemReport.create([
      {
        type: "found",
        title: "University Student ID Card with Blue Lanyard",
        category: "id_cards",
        brand: "University",
        primaryColor: "Blue / Navy",
        secondaryColor: "White",
        description: "Found a university student identity card inside a clear plastic holder with a blue neck ribbon lanyard left on a classroom wooden bench.",
        uniqueMarks: "Lanyard has university lettering and photo ID inside.",
        secretVerificationDetail: "Student ID number ending in 5678, valid until Dec 2025.",
        location: {
          campusZone: "syl_mu",
          specificLocation: "Metropolitan University Bateshwar Campus, Academic Building 1",
        },
        dateTime: new Date(),
        imageUrls: [`${BASE_URL}/uploads/bd_student_id.jpg`],
        imagePaths: ["uploads/bd_student_id.jpg"],
        submitterName: "Campus Lost & Found Desk",
        submitterEmail: "security@metrouni.edu.bd",
        status: "active",
      },
    ]);
    console.log("Created Student ID Card demo report with real photo.");
  }

  console.log("All Sylhet demo items populated successfully!");
  await mongoose.disconnect();
}

seedSylhetImages().catch(console.error);
