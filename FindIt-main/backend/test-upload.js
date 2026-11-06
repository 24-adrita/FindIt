/**
 * Test multipart/form-data upload with a real image file
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

async function testMultipartUpload() {
  console.log("--- Testing Multipart / Multer Image Upload ---");

  // Create a minimal valid 1x1 PNG in memory
  const png1x1 = Buffer.from(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d0b0000000049454e44ae426082",
    "hex"
  );

  const boundary = "----FindItFormBoundary" + Date.now();
  
  // Build multipart body
  const crlf = "\r\n";
  let bodyBuffer = Buffer.alloc(0);

  function appendField(name, val) {
    let part = `--${boundary}${crlf}`;
    part += `Content-Disposition: form-data; name="${name}"${crlf}${crlf}`;
    part += `${val}${crlf}`;
    bodyBuffer = Buffer.concat([bodyBuffer, Buffer.from(part, "utf-8")]);
  }

  function appendFile(fieldName, fileName, mimeType, fileBuffer) {
    let part = `--${boundary}${crlf}`;
    part += `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"${crlf}`;
    part += `Content-Type: ${mimeType}${crlf}${crlf}`;
    bodyBuffer = Buffer.concat([
      bodyBuffer,
      Buffer.from(part, "utf-8"),
      fileBuffer,
      Buffer.from(crlf, "utf-8"),
    ]);
  }

  appendField("type", "found");
  appendField("title", "Car Keys with Red Toyota Lanyard");
  appendField("category", "keys");
  appendField("brand", "Toyota");
  appendField("primaryColor", "Red / Burgundy");
  appendField("secondaryColor", "Silver / Grey");
  appendField("description", "Found set of 2 silver keys with red Toyota branded lanyard on library steps.");
  appendField("uniqueMarks", "Small scratch on the lock button");
  appendField("secretVerificationDetail", "Gym membership tag number is #8821");
  appendField("campusZone", "Central University Library");
  appendField("specificLocation", "Main entrance steps near book return bin");
  appendField("submitterName", "Campus Security Staff");
  appendField("submitterEmail", "security@campus.edu");
  appendFile("images", "test-keys.png", "image/png", png1x1);

  // Close boundary
  bodyBuffer = Buffer.concat([
    bodyBuffer,
    Buffer.from(`--${boundary}--${crlf}`, "utf-8"),
  ]);

  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/items",
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": bodyBuffer.length,
    },
  };

  const req = http.request(options, (res) => {
    let resBody = "";
    res.on("data", (chunk) => (resBody += chunk));
    res.on("end", () => {
      try {
        const json = JSON.parse(resBody);
        console.log(`Status Code: ${res.statusCode}`);
        if (res.statusCode === 201 && json.success) {
          console.log("✅ Multipart Upload Succeeded!");
          console.log(`Saved Item ID: ${json.data._id}`);
          console.log(`Image URLs: ${JSON.stringify(json.data.imageUrls)}`);
          console.log(`Image Paths: ${JSON.stringify(json.data.imagePaths)}`);
          
          if (json.data.imageUrls && json.data.imageUrls.length > 0) {
            console.log("✅ Image URL generated successfully!");
          }
          process.exit(0);
        } else {
          console.error("❌ Multipart Upload Failed:", resBody);
          process.exit(1);
        }
      } catch (err) {
        console.error("❌ Parse Error:", err, resBody);
        process.exit(1);
      }
    });
  });

  req.on("error", (err) => {
    console.error("❌ Request Error:", err);
    process.exit(1);
  });

  req.write(bodyBuffer);
  req.end();
}

testMultipartUpload();
