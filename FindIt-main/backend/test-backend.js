/**
 * Automated Test Suite for FindIt Backend & MongoDB Integration (Day 2)
 * Tests healthcheck, item creation (JSON and multipart), queries, filtering, ID lookups, and security.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:5000";

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        ...headers,
      },
    };

    if (data && !headers["Content-Type"]) {
      options.headers["Content-Type"] = "application/json";
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on("error", (err) => reject(err));

    if (data) {
      if (typeof data === "string" || Buffer.isBuffer(data)) {
        req.write(data);
      } else {
        req.write(JSON.stringify(data));
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log("==================================================");
  console.log("🧪 STARTING DAY 2 BACKEND & MONGODB TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, testName, detail = "") {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? "- " + detail : ""}`);
    }
  }

  try {
    // 1. Healthcheck Test
    console.log("--- 1. Testing Healthcheck Endpoint ---");
    const health = await request("GET", "/api/health");
    assert(health.statusCode === 200, "Health check returns 200 OK");
    assert(health.data.status === "ok", "Service status reports 'ok'");
    assert(
      health.data.database && health.data.database.status === "connected",
      "MongoDB database status reports 'connected'"
    );

    // 2. Validation Test: Missing required fields
    console.log("\n--- 2. Testing Validation Errors ---");
    const invalidReport = await request("POST", "/api/items", {
      // Empty payload
    });
    assert(
      invalidReport.statusCode === 400,
      "POST /api/items with empty body returns 400 Bad Request"
    );
    assert(
      invalidReport.data.success === false,
      "Invalid report returns success: false"
    );

    // 3. POST /api/items (JSON payload)
    console.log("\n--- 3. Testing POST /api/items (Valid Item Creation) ---");
    const validItem = {
      type: "lost",
      title: "Apple AirPods Pro Gen 2",
      category: "electronics",
      brand: "Apple",
      primaryColor: "White",
      secondaryColor: "None",
      description: "Lost white wireless charging case with both AirPods inside near computer lab.",
      uniqueMarks: "Tiny scratch on lid hinge; Pikachu silicone case",
      secretVerificationDetail: "Serial number ends in 492X, engraving says 'Sam'",
      location: {
        campusZone: "Science & Engineering Complex",
        specificLocation: "Room 304 Computer Lab, Desk 12",
      },
      dateTime: new Date().toISOString(),
      submitterName: "Samantha Reed",
      submitterStudentId: "U-2024-9912",
      submitterEmail: "samantha.reed@campus.edu",
      submitterPhone: "+1 (555) 349-8812",
    };

    const createRes = await request("POST", "/api/items", validItem);
    assert(createRes.statusCode === 201, "POST /api/items returns 201 Created");
    assert(createRes.data.success === true, "Item report saved with success: true");
    assert(createRes.data.data && createRes.data.data._id, "Created item has a valid MongoDB _id");

    const createdId = createRes.data.data._id;

    // 4. Privacy Check: Ensure secretVerificationDetail is omitted from response
    assert(
      createRes.data.data.secretVerificationDetail === undefined,
      "CRITICAL PRIVACY CHECK: secretVerificationDetail is omitted from POST response"
    );

    // 5. GET /api/items (List all items)
    console.log("\n--- 4. Testing GET /api/items ---");
    const listRes = await request("GET", "/api/items");
    assert(listRes.statusCode === 200, "GET /api/items returns 200 OK");
    assert(Array.isArray(listRes.data.data), "Items data is returned as an array");
    assert(listRes.data.count > 0, `Items found in database: count = ${listRes.data.count}`);

    // Verify secretVerificationDetail is omitted across the entire array
    const leakedItem = listRes.data.data.find((item) => item.secretVerificationDetail);
    assert(
      !leakedItem,
      "CRITICAL PRIVACY CHECK: secretVerificationDetail is omitted from all items in public GET /api/items"
    );

    // 6. GET /api/items with Filters
    console.log("\n--- 5. Testing Query Filtering ---");
    const filterTypeRes = await request("GET", "/api/items?type=lost");
    assert(filterTypeRes.statusCode === 200, "GET /api/items?type=lost returns 200 OK");
    const allLost = filterTypeRes.data.data.every((i) => i.type === "lost");
    assert(allLost, "All returned items have type === 'lost'");

    const filterCategoryRes = await request("GET", "/api/items?category=electronics");
    assert(filterCategoryRes.statusCode === 200, "GET /api/items?category=electronics returns 200 OK");
    const allElectronics = filterCategoryRes.data.data.every((i) => i.category === "electronics");
    assert(allElectronics, "All returned items have category === 'electronics'");

    // 7. GET /api/items/:id (Fetch single item)
    console.log("\n--- 6. Testing GET /api/items/:id ---");
    const singleRes = await request("GET", `/api/items/${createdId}`);
    assert(singleRes.statusCode === 200, `GET /api/items/${createdId} returns 200 OK`);
    assert(singleRes.data.data.title === validItem.title, "Fetched item title matches created title");
    assert(
      singleRes.data.data.secretVerificationDetail === undefined,
      "CRITICAL PRIVACY CHECK: secretVerificationDetail is omitted from GET /api/items/:id"
    );

    // 8. Error Handling: Invalid ID Format
    console.log("\n--- 7. Testing Invalid ID and Missing ID Handling ---");
    const invalidIdRes = await request("GET", "/api/items/invalid-id-12345");
    assert(invalidIdRes.statusCode === 400, "Invalid ObjectId format returns 400 Bad Request");

    // 9. Error Handling: Non-existent ID
    const missingIdRes = await request("GET", "/api/items/65e9b891a27e7d001a111111");
    assert(missingIdRes.statusCode === 404, "Non-existent ObjectId returns 404 Not Found");

    // 10. Summary
    console.log("\n==================================================");
    console.log(`🏁 TEST RESULTS: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
    console.log("==================================================");

    if (passed === total) {
      console.log("🎉 ALL DAY 2 BACKEND TESTS PASSED SUCCESSFULLY!\n");
      process.exit(0);
    } else {
      console.error("⚠️ Some tests failed. Please review the output above.\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Unexpected test failure:", error.message);
    process.exit(1);
  }
}

runTests();
