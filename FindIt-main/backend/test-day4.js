/**
 * Comprehensive Automated Test Suite for FindIt Day 4:
 * User Authentication (bcrypt + JWT), Role Management (Student/Admin),
 * Ownership Claims Workflow, Admin Review & Data Privacy Safeguards.
 *
 * Usage:
 *   node test-day4.js
 */

const http = require("http");

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

async function runDay4Tests() {
  console.log("==================================================");
  console.log("🧪 STARTING FINDIT DAY 4 AUTOMATED TEST SUITE");
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

  const runId = Date.now().toString(36);
  let studentAliceToken = null;
  let studentBobToken = null;
  let adminToken = null;
  let foundItemId = null;
  let lostItemId = null;
  let bobClaimId = null;
  let secondFoundItemId = null;
  let secondClaimId = null;

  try {
    // --- 1. Healthcheck ---
    console.log("--- 1. Healthcheck & Version ---");
    const healthRes = await request("GET", "/api/health");
    assert(healthRes.statusCode === 200, "Healthcheck returns HTTP 200 OK");
    assert(
      healthRes.data && healthRes.data.version && (healthRes.data.version.includes("Day 4") || healthRes.data.version.includes("Day 5")),
      "API version reports valid milestone",
      JSON.stringify(healthRes.data)
    );

    // --- 2. Student Registration ---
    console.log("\n--- 2. User Registration & Security ---");
    const aliceEmail = `alice_${runId}@campus.edu`;
    const regRes = await request("POST", "/api/auth/register", {
      name: "Alice Johnson",
      email: aliceEmail,
      password: "AlicePassword123!",
      studentId: "U-2024-1101",
      phone: "+1 (555) 111-2222",
    });
    assert(regRes.statusCode === 201, "Valid student registration returns HTTP 201 Created");
    assert(regRes.data.success === true, "Registration response indicates success");
    assert(!!regRes.data.token, "Registration returns signed JWT token");
    assert(regRes.data.user && regRes.data.user.role === "student", "Registered account role is strictly 'student'");
    assert(!regRes.data.user.password, "Password hash is never exposed in registration response");
    studentAliceToken = regRes.data.token;

    // --- 3. Role Escalation Prevention ---
    const hackerEmail = `hacker_${runId}@campus.edu`;
    const escalateRes = await request("POST", "/api/auth/register", {
      name: "Malicious User",
      email: hackerEmail,
      password: "HackerPassword123!",
      role: "admin", // Attempting to register as admin
    });
    assert(
      escalateRes.statusCode === 403,
      "Public registration attempting role='admin' is rejected with HTTP 403 Forbidden",
      `Got ${escalateRes.statusCode}`
    );

    // --- 4. Duplicate Email Rejection ---
    const dupRes = await request("POST", "/api/auth/register", {
      name: "Alice Impersonator",
      email: aliceEmail.toUpperCase(), // Case insensitive check
      password: "DifferentPassword123!",
    });
    assert(
      dupRes.statusCode === 400,
      "Duplicate email registration is rejected with HTTP 400 Bad Request",
      `Got ${dupRes.statusCode}`
    );

    // --- 5. Registration Validation ---
    const weakPassRes = await request("POST", "/api/auth/register", {
      name: "Short Pass",
      email: `short_${runId}@campus.edu`,
      password: "123", // Too short
    });
    assert(weakPassRes.statusCode === 400, "Password < 6 chars is rejected with HTTP 400 Bad Request");

    // --- 6. User Login ---
    console.log("\n--- 3. Authentication & Login Verification ---");
    const loginRes = await request("POST", "/api/auth/login", {
      email: aliceEmail,
      password: "AlicePassword123!",
    });
    assert(loginRes.statusCode === 200, "Valid credentials return HTTP 200 OK");
    assert(!!loginRes.data.token, "Login returns signed JWT token");
    assert(!loginRes.data.user.password, "Password hash is not leaked in login response");

    // Login with wrong password
    const wrongPassRes = await request("POST", "/api/auth/login", {
      email: aliceEmail,
      password: "WrongPassword999!",
    });
    assert(wrongPassRes.statusCode === 401, "Invalid password returns HTTP 401 Unauthorized");

    // Login with non-existent email
    const nonUserRes = await request("POST", "/api/auth/login", {
      email: `nonexistent_${runId}@campus.edu`,
      password: "SomePassword123!",
    });
    assert(nonUserRes.statusCode === 401, "Nonexistent email returns HTTP 401 Unauthorized");

    // --- 7. Profile Verification (/api/auth/me) ---
    console.log("\n--- 4. Profile & Token Middleware Verification ---");
    const meRes = await request("GET", "/api/auth/me", null, {
      Authorization: `Bearer ${studentAliceToken}`,
    });
    assert(meRes.statusCode === 200, "GET /api/auth/me with valid Bearer token returns HTTP 200 OK");
    assert(meRes.data.user && meRes.data.user.email === aliceEmail, "GET /api/auth/me returns current user profile");

    // Unauthenticated profile check
    const noTokenRes = await request("GET", "/api/auth/me");
    assert(noTokenRes.statusCode === 401, "GET /api/auth/me without token returns HTTP 401 Unauthorized");

    // Invalid token check
    const badTokenRes = await request("GET", "/api/auth/me", null, {
      Authorization: "Bearer invalid.token.signature",
    });
    assert(badTokenRes.statusCode === 401, "GET /api/auth/me with invalid signature returns HTTP 401 Unauthorized");

    // --- 8. Item Creation Authorization ---
    console.log("\n--- 5. Item Authorization & Privacy Safeguards ---");
    // Unauthenticated item creation MUST be rejected
    const unauthItemRes = await request("POST", "/api/items", {
      type: "found",
      title: "Unauthenticated Item",
      category: "electronics",
      description: "Should fail because user is not authenticated",
      campusZone: "Library",
      specificLocation: "Desk 1",
    });
    assert(
      unauthItemRes.statusCode === 401,
      "Unauthenticated POST /api/items is rejected with HTTP 401 Unauthorized"
    );

    // Authenticated item creation (Found Item)
    const foundItemRes = await request(
      "POST",
      "/api/items",
      {
        type: "found",
        title: "Apple MacBook Pro 14 Inch Space Grey",
        category: "electronics",
        brand: "Apple",
        primaryColor: "Black",
        secondaryColor: "Silver / Grey",
        description: "Found space grey MacBook Pro on 3rd floor quiet study desk.",
        uniqueMarks: "Has a sticker of GitHub Octocat on the bottom casing.",
        secretVerificationDetail: "Lockscreen wallpaper is a golden retriever and user account name is 'Dave'.",
        campusZone: "Central University Library",
        specificLocation: "3rd Floor Quiet Study Desk 42",
      },
      {
        Authorization: `Bearer ${studentAliceToken}`,
      }
    );
    assert(foundItemRes.statusCode === 201, "Authenticated student can create item report (HTTP 201 Created)");
    assert(foundItemRes.data.data.submitterName === "Alice Johnson", "Submitter name autofilled from authenticated user");
    assert(!foundItemRes.data.data.secretVerificationDetail, "secretVerificationDetail is strictly excluded from creation response");
    foundItemId = foundItemRes.data.data._id;

    // Authenticated item creation (Lost Item)
    const lostItemRes = await request(
      "POST",
      "/api/items",
      {
        type: "lost",
        title: "Lost Hydroflask Water Bottle",
        category: "bottles_accessories",
        brand: "Hydro Flask",
        primaryColor: "Blue / Navy",
        description: "Left blue hydroflask water bottle near student gym.",
        campusZone: "Sports & Recreation Center",
        specificLocation: "Locker Room Bench",
      },
      {
        Authorization: `Bearer ${studentAliceToken}`,
      }
    );
    lostItemId = lostItemRes.data.data._id;

    // Public item lookup check: Ensure secretVerificationDetail is NEVER leaked
    const publicItemRes = await request("GET", `/api/items/${foundItemId}`);
    assert(publicItemRes.statusCode === 200, "Public item lookup returns HTTP 200 OK");
    assert(
      publicItemRes.data.data.secretVerificationDetail === undefined,
      "Public GET /api/items/:id strictly excludes secretVerificationDetail"
    );

    // --- 9. Claim Workflow ---
    console.log("\n--- 6. Ownership Claims Workflow ---");
    // Register second student (Bob)
    const bobEmail = `bob_${runId}@campus.edu`;
    const bobRegRes = await request("POST", "/api/auth/register", {
      name: "Bob Martinez",
      email: bobEmail,
      password: "BobPassword123!",
      studentId: "U-2024-2202",
      phone: "+1 (555) 222-3333",
    });
    studentBobToken = bobRegRes.data.token;

    // Unauthenticated claim submission
    const unauthClaimRes = await request("POST", "/api/claims", {
      itemId: foundItemId,
      secretVerificationAnswer: "My wallpaper is a dog",
      proofDetails: "I have the purchase receipt",
    });
    assert(unauthClaimRes.statusCode === 401, "Unauthenticated POST /api/claims rejected with HTTP 401");

    // Invalid claim: claiming a Lost item
    const claimLostRes = await request(
      "POST",
      "/api/claims",
      {
        itemId: lostItemId,
        secretVerificationAnswer: "Test answer",
        proofDetails: "Test proof",
      },
      {
        Authorization: `Bearer ${studentBobToken}`,
      }
    );
    assert(
      claimLostRes.statusCode === 400,
      "Submitting claim against a 'lost' item is rejected with HTTP 400",
      `Got ${claimLostRes.statusCode}`
    );

    // Valid claim submission by Bob
    const validClaimRes = await request(
      "POST",
      "/api/claims",
      {
        itemId: foundItemId,
        secretVerificationAnswer: "The wallpaper is my golden retriever named Cooper, and user login is Dave.",
        proofDetails: "Receipt from Apple Store Regent St, Serial #C02D1234MD6R, purchase date 2024.",
      },
      {
        Authorization: `Bearer ${studentBobToken}`,
      }
    );
    assert(validClaimRes.statusCode === 201, "Valid student claim submission returns HTTP 201 Created");
    assert(validClaimRes.data.data.status === "pending", "Initial claim status is 'pending'");
    bobClaimId = validClaimRes.data.data._id;

    // Duplicate pending claim rejection
    const dupClaimRes = await request(
      "POST",
      "/api/claims",
      {
        itemId: foundItemId,
        secretVerificationAnswer: "Another duplicate attempt",
        proofDetails: "Receipt",
      },
      {
        Authorization: `Bearer ${studentBobToken}`,
      }
    );
    assert(dupClaimRes.statusCode === 400, "Duplicate pending claim by same user is rejected with HTTP 400");

    // Bob views My Claims
    const myClaimsRes = await request("GET", "/api/claims/my-claims", null, {
      Authorization: `Bearer ${studentBobToken}`,
    });
    assert(myClaimsRes.statusCode === 200, "GET /api/claims/my-claims returns HTTP 200 OK");
    assert(myClaimsRes.data.count >= 1, "Bob sees his submitted claim in my-claims");
    assert(myClaimsRes.data.data[0].itemId.title.includes("MacBook"), "Populated item summary is included");

    // Alice views My Claims (should have 0 claims)
    const aliceClaimsRes = await request("GET", "/api/claims/my-claims", null, {
      Authorization: `Bearer ${studentAliceToken}`,
    });
    assert(aliceClaimsRes.data.count === 0, "Alice cannot view Bob's claims in my-claims (strict user isolation)");

    // --- 10. Role-Based Access Control ---
    console.log("\n--- 7. Role-Based Access Control (Student vs Admin) ---");
    // Student Bob attempts to access admin queue
    const studentAdminQueueRes = await request("GET", "/api/claims", null, {
      Authorization: `Bearer ${studentBobToken}`,
    });
    assert(
      studentAdminQueueRes.statusCode === 403,
      "Student access to admin claim queue GET /api/claims is blocked with HTTP 403 Forbidden"
    );

    // Student Bob attempts to approve his own claim
    const studentApproveRes = await request(
      "PATCH",
      `/api/claims/${bobClaimId}/status`,
      { status: "approved" },
      {
        Authorization: `Bearer ${studentBobToken}`,
      }
    );
    assert(
      studentApproveRes.statusCode === 403,
      "Student attempt to PATCH claim status is blocked with HTTP 403 Forbidden"
    );

    // Student attempts to view admin-only item route
    const studentAdminItemRes = await request("GET", `/api/items/${foundItemId}/admin`, null, {
      Authorization: `Bearer ${studentBobToken}`,
    });
    assert(
      studentAdminItemRes.statusCode === 403,
      "Student access to GET /api/items/:id/admin is blocked with HTTP 403 Forbidden"
    );

    // --- 11. Admin Review Workflow ---
    console.log("\n--- 8. Admin Review & Ownership Authentication ---");
    // Login as Admin
    const adminLoginRes = await request("POST", "/api/auth/login", {
      email: "admin@campus.edu",
      password: process.env.ADMIN_PASSWORD || "AdminSecure2026!",
    });
    assert(adminLoginRes.statusCode === 200, "Admin login succeeds with HTTP 200 OK");
    assert(adminLoginRes.data.user.role === "admin", "Authenticated user confirmed as 'admin'");
    adminToken = adminLoginRes.data.token;

    // Admin views claims queue
    const adminClaimsRes = await request("GET", "/api/claims?status=pending", null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(adminClaimsRes.statusCode === 200, "Admin access to GET /api/claims returns HTTP 200 OK");
    const targetClaim = adminClaimsRes.data.data.find((c) => c._id === bobClaimId);
    assert(!!targetClaim, "Bob's claim is found in admin pending claims queue");
    assert(
      !!targetClaim.secretVerificationAnswer,
      "Admin is authorized to inspect claimant's secretVerificationAnswer"
    );
    assert(
      !!targetClaim.itemId.secretVerificationDetail,
      "Admin is authorized to cross-examine item's secretVerificationDetail"
    );

    // Admin views item details via admin route
    const adminItemViewRes = await request("GET", `/api/items/${foundItemId}/admin`, null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(adminItemViewRes.statusCode === 200, "Admin GET /api/items/:id/admin returns HTTP 200 OK");
    assert(
      !!adminItemViewRes.data.data.secretVerificationDetail,
      "Admin endpoint reveals secretVerificationDetail for cross-examination"
    );

    // Admin Approves Bob's Claim
    const approveRes = await request(
      "PATCH",
      `/api/claims/${bobClaimId}/status`,
      {
        status: "approved",
        reviewNotes: "Evidence verified against Apple Store receipt and lockscreen photo.",
      },
      {
        Authorization: `Bearer ${adminToken}`,
      }
    );
    assert(approveRes.statusCode === 200, "Admin approval returns HTTP 200 OK");
    assert(approveRes.data.data.claim.status === "approved", "Claim status transitions to 'approved'");
    assert(approveRes.data.data.itemStatus === "claimed", "Item status transitions to 'claimed'");

    // Verify item in database is now 'claimed'
    const updatedItemRes = await request("GET", `/api/items/${foundItemId}`);
    assert(updatedItemRes.data.data.status === "claimed", "Item report in DB is now marked 'claimed'");

    // Attempting to re-approve already reviewed claim
    const reApproveRes = await request(
      "PATCH",
      `/api/claims/${bobClaimId}/status`,
      { status: "approved" },
      {
        Authorization: `Bearer ${adminToken}`,
      }
    );
    assert(reApproveRes.statusCode === 400, "Cannot re-review an already approved claim (HTTP 400 Bad Request)");

    // Attempting to claim an already claimed item
    const claimClaimedItemRes = await request(
      "POST",
      "/api/claims",
      {
        itemId: foundItemId,
        secretVerificationAnswer: "Another attempt",
        proofDetails: "Proof",
      },
      {
        Authorization: `Bearer ${studentAliceToken}`,
      }
    );
    assert(
      claimClaimedItemRes.statusCode === 400,
      "Claiming an already claimed item is blocked with HTTP 400 Bad Request"
    );

    // --- 12. Admin Rejection Workflow ---
    console.log("\n--- 9. Admin Rejection Workflow & Item Availability ---");
    // Alice creates another found item
    const item2Res = await request(
      "POST",
      "/api/items",
      {
        type: "found",
        title: "Calculus Textbook (Stewart 9th Edition)",
        category: "books_notes",
        description: "Found thick math textbook in Lecture Hall 101.",
        campusZone: "Science & Engineering Complex",
        specificLocation: "Lecture Hall 101, Row F",
        secretVerificationDetail: "Student name 'Marcus Cole' written on page 100 inside margin.",
      },
      {
        Authorization: `Bearer ${studentAliceToken}`,
      }
    );
    secondFoundItemId = item2Res.data.data._id;

    // Bob submits claim with wrong answer
    const claim2Res = await request(
      "POST",
      "/api/claims",
      {
        itemId: secondFoundItemId,
        secretVerificationAnswer: "Name inside is John Doe",
        proofDetails: "I took Calculus last semester",
      },
      {
        Authorization: `Bearer ${studentBobToken}`,
      }
    );
    secondClaimId = claim2Res.data.data._id;

    // Admin rejects Bob's claim
    const rejectRes = await request(
      "PATCH",
      `/api/claims/${secondClaimId}/status`,
      {
        status: "rejected",
        reviewNotes: "Name stated does not match name written inside textbook margin.",
      },
      {
        Authorization: `Bearer ${adminToken}`,
      }
    );
    assert(rejectRes.statusCode === 200, "Admin rejection returns HTTP 200 OK");
    assert(rejectRes.data.data.claim.status === "rejected", "Claim status transitions to 'rejected'");
    assert(rejectRes.data.data.itemStatus === "active", "Item status remains 'active' following claim rejection");

    // Verify item remains active and available for other legitimate claims
    const activeItemRes = await request("GET", `/api/items/${secondFoundItemId}`);
    assert(activeItemRes.data.data.status === "active", "Item in DB remains 'active' after claim rejection");

  } catch (err) {
    console.error("🔥 Unexpected test error:", err);
    assert(false, "Test execution encountered an unhandled exception", err.message);
  }

  console.log("\n==================================================");
  console.log(`📊 TEST RESULTS: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL DAY 4 INTEGRATION TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error("⚠️ SOME TESTS FAILED.");
    process.exit(1);
  }
}

runDay4Tests();
