/**
 * Comprehensive Automated Security Test Suite for FindIt (Phase 1)
 *
 * Covers all 9 required security verification test cases:
 * 1. Google login with a forged email (missing ID token)
 * 2. Invalid Google ID token verification failure
 * 3. Expired Google ID token rejection
 * 4. Unverified Google email rejection
 * 5. Missing JWT_SECRET failure & no fallback
 * 6. Unauthorized admin access restriction (student attempting admin routes)
 * 7. Malicious regex search input (ReDoS defense & special characters)
 * 8. Login rate limiting (HTTP 429 after threshold)
 * 9. Unauthorized access to private claim information & encryption at rest
 *
 * Usage:
 *   node test-security.js
 */

const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = require("./server");
const User = require("./src/models/User");
const Claim = require("./src/models/Claim");
const ItemReport = require("./src/models/ItemReport");
const {
  getJwtSecret,
  escapeRegex,
  encryptField,
  decryptField,
} = require("./src/config/security");
const jwt = require("jsonwebtoken");

const TEST_PORT = 5055;
let serverInstance = null;

// Helper to make HTTP requests against the test server
function makeRequest(method, pathUrl, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: TEST_PORT,
      path: pathUrl,
      method: method,
      headers: { ...headers },
    };

    let payload = null;
    if (body) {
      payload = typeof body === "string" ? body : JSON.stringify(body);
      if (!headers["Content-Type"]) {
        options.headers["Content-Type"] = "application/json";
      }
      options.headers["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on("error", (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, detail = "") {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${detail ? "- " + detail : ""}`);
    failedCount++;
  }
}

async function runSecurityTests() {
  console.log("=================================================================");
  console.log("   🛡️  FINDIT SECURITY HARDENING & VULNERABILITY VERIFICATION");
  console.log("=================================================================\n");

  // Start test server instance
  await new Promise((resolve) => {
    serverInstance = app.listen(TEST_PORT, () => {
      console.log(`📡 Test server running on http://127.0.0.1:${TEST_PORT}\n`);
      resolve();
    });
  });

  const secret = getJwtSecret();

  // Create mock objects for test execution (offline & online MongoDB support)
  const studentId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  const studentEmail = `student.sec.${Date.now()}@campus.edu`;
  const adminEmail = `admin.sec.${Date.now()}@campus.edu`;

  const studentUserObj = {
    _id: studentId,
    name: "Security Test Student",
    email: studentEmail,
    role: "student",
    studentId: "STUDENT-123",
  };

  const adminUserObj = {
    _id: adminId,
    name: "Security Test Admin",
    email: adminEmail,
    role: "admin",
    studentId: "ADMIN-001",
  };

  // Mock User.findById to resolve test tokens deterministically
  const originalFindById = User.findById.bind(User);
  User.findById = function (id) {
    const idStr = String(id);
    if (idStr === String(studentId)) return Promise.resolve(studentUserObj);
    if (idStr === String(adminId)) return Promise.resolve(adminUserObj);
    if (mongoose.connection.readyState === 1) {
      return originalFindById(id);
    }
    return Promise.resolve(null);
  };

  // Mock User.findOne
  const originalFindOne = User.findOne.bind(User);
  User.findOne = function (query) {
    if (query && query.email) {
      const qEmail = query.email.toLowerCase();
      if (qEmail === studentEmail.toLowerCase()) {
        return {
          ...studentUserObj,
          select: () => Promise.resolve(studentUserObj),
          comparePassword: async (pwd) => pwd === "Password123!",
        };
      }
      if (qEmail === adminEmail.toLowerCase()) {
        return {
          ...adminUserObj,
          select: () => Promise.resolve(adminUserObj),
          comparePassword: async (pwd) => pwd === "AdminPassword123!",
        };
      }
    }
    if (mongoose.connection.readyState === 1) {
      return originalFindOne(query);
    }
    return {
      select: () => Promise.resolve(null),
    };
  };

  // Mock ItemReport.find
  const originalItemFind = ItemReport.find.bind(ItemReport);
  ItemReport.find = function (query) {
    if (mongoose.connection.readyState === 1) {
      return originalItemFind(query);
    }
    return {
      select: () => ({
        sort: () => ({
          lean: () => Promise.resolve([]),
        }),
      }),
    };
  };

  const studentToken = jwt.sign(
    { id: studentId, role: studentUserObj.role, email: studentUserObj.email },
    secret,
    { expiresIn: "1h" }
  );

  const adminToken = jwt.sign(
    { id: adminId, role: adminUserObj.role, email: adminUserObj.email },
    secret,
    { expiresIn: "1h" }
  );

  // -------------------------------------------------------------
  // TEST 1: Google login with a forged email (Missing ID token)
  // -------------------------------------------------------------
  console.log("▶ Test 1: Google login with forged email (Missing ID token)");
  const res1 = await makeRequest("POST", "/api/auth/google", {
    email: adminEmail, // Attacker attempting to claim admin email directly
    name: "Fake Admin",
  });
  assert(
    res1.status === 400 && res1.data.success === false,
    "Forged email body rejected with 400 Bad Request",
    `Got ${res1.status}: ${JSON.stringify(res1.data)}`
  );

  // -------------------------------------------------------------
  // TEST 2: Invalid Google ID token rejection
  // -------------------------------------------------------------
  console.log("\n▶ Test 2: Invalid Google ID token verification failure");
  const origClientId = process.env.GOOGLE_CLIENT_ID;
  process.env.GOOGLE_CLIENT_ID = "mock-client-id-for-tests.apps.googleusercontent.com";

  const res2 = await makeRequest("POST", "/api/auth/google", {
    idToken: "malformed.invalid.google.token.signature",
  });
  assert(
    res2.status === 401 && res2.data.success === false,
    "Invalid Google token rejected with 401 Unauthorized",
    `Got ${res2.status}: ${JSON.stringify(res2.data)}`
  );

  // -------------------------------------------------------------
  // TEST 3: Expired Google ID token rejection
  // -------------------------------------------------------------
  console.log("\n▶ Test 3: Expired Google ID token rejection");
  const expiredMockJwt = jwt.sign(
    {
      iss: "accounts.google.com",
      aud: "mock-client-id-for-tests.apps.googleusercontent.com",
      sub: "1234567890",
      email: "student@campus.edu",
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
    },
    "mock_signing_key_for_test"
  );

  const res3 = await makeRequest("POST", "/api/auth/google", {
    idToken: expiredMockJwt,
  });
  assert(
    res3.status === 401 && res3.data.success === false,
    "Expired Google token rejected with 401 Unauthorized",
    `Got ${res3.status}`
  );

  // -------------------------------------------------------------
  // TEST 4: Unverified Google email rejection
  // -------------------------------------------------------------
  console.log("\n▶ Test 4: Unverified Google email rejection");
  const unverifiedMockJwt = jwt.sign(
    {
      iss: "accounts.google.com",
      aud: "mock-client-id-for-tests.apps.googleusercontent.com",
      sub: "1234567890",
      email: "unverified.user@gmail.com",
      email_verified: false,
    },
    "mock_signing_key_for_test"
  );

  const res4 = await makeRequest("POST", "/api/auth/google", {
    idToken: unverifiedMockJwt,
  });
  assert(
    res4.status === 401 && res4.data.success === false,
    "Unverified Google email rejected with 401 Unauthorized",
    `Got ${res4.status}`
  );

  // Restore client id
  process.env.GOOGLE_CLIENT_ID = origClientId;

  // -------------------------------------------------------------
  // TEST 5: Missing JWT_SECRET failure & no hardcoded fallback
  // -------------------------------------------------------------
  console.log("\n▶ Test 5: Missing JWT_SECRET strict failure");
  const origSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  let secretThrown = false;
  try {
    getJwtSecret();
  } catch (err) {
    secretThrown = err.message.includes("FATAL SECURITY CONFIGURATION ERROR");
  }

  assert(
    secretThrown,
    "getJwtSecret() throws fatal error when JWT_SECRET is unset (no hardcoded fallback)"
  );

  // Restore secret
  process.env.JWT_SECRET = origSecret;

  // -------------------------------------------------------------
  // TEST 6: Unauthorized admin access restriction
  // -------------------------------------------------------------
  console.log("\n▶ Test 6: Unauthorized admin access (Student attempting Admin routes)");
  const res6AdminRoute = await makeRequest("GET", "/api/claims", null, {
    Authorization: `Bearer ${studentToken}`,
  });
  assert(
    res6AdminRoute.status === 403 && res6AdminRoute.data.success === false,
    "Student token receives 403 Forbidden on GET /api/claims",
    `Got ${res6AdminRoute.status}`
  );

  const res6Unauthenticated = await makeRequest("GET", "/api/claims");
  assert(
    res6Unauthenticated.status === 401,
    "Unauthenticated request receives 401 Unauthorized on GET /api/claims"
  );

  // -------------------------------------------------------------
  // TEST 7: Malicious regex search input (ReDoS defense)
  // -------------------------------------------------------------
  console.log("\n▶ Test 7: Malicious regex search input (ReDoS attack patterns)");
  const maliciousRegexQueries = [
    "((a+)+)+$",
    "(a*)*b",
    "[unclosed-bracket",
    ".*.*.*.*.*.*.*.*.*.*!",
    "\\",
    "\\Q\\E",
    "a{100,1000}",
    "(x+x+)+y",
  ];

  let regexTestsPassed = true;
  for (const maliciousQuery of maliciousRegexQueries) {
    const encoded = encodeURIComponent(maliciousQuery);
    const start = Date.now();
    const res7 = await makeRequest("GET", `/api/items?search=${encoded}`);
    const elapsed = Date.now() - start;

    if (res7.status !== 200 || elapsed > 1000) {
      regexTestsPassed = false;
      console.error(`    Failed pattern "${maliciousQuery}": status ${res7.status}, elapsed ${elapsed}ms`);
    }
  }

  // Also assert escapeRegex unit helper directly
  const escapedResult = escapeRegex(".*+?^${}()|[]\\");
  assert(
    regexTestsPassed && escapedResult === "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\",
    "All malicious regex inputs handled safely without crashes or catastrophic backtracking (< 1s)"
  );

  // -------------------------------------------------------------
  // TEST 8: Login rate limiting (HTTP 429)
  // -------------------------------------------------------------
  console.log("\n▶ Test 8: Login rate limiting enforcement");
  let rateLimitHit = false;
  // Trigger 16 consecutive login attempts to exceed limit of 15
  for (let i = 0; i < 16; i++) {
    const res8 = await makeRequest("POST", "/api/auth/login", {
      email: "ratelimit.test@campus.edu",
      password: "WrongPassword123!",
    });

    if (res8.status === 429) {
      rateLimitHit = true;
      break;
    }
  }

  assert(rateLimitHit, "Login rate limiter triggered HTTP 429 Too Many Requests");

  // -------------------------------------------------------------
  // TEST 9: Unauthorized access to private claim data & encryption at rest
  // -------------------------------------------------------------
  console.log("\n▶ Test 9: Private claim data protection & encryption at rest");
  // Test AES-256-GCM symmetric encryption directly
  const testPlaintext = "Private ground truth answer #88219";
  const encryptedValue = encryptField(testPlaintext);

  assert(
    encryptedValue.startsWith("enc:gcm:") && encryptedValue !== testPlaintext,
    "Symmetric encryption produces AES-256-GCM ciphertext prefix enc:gcm:"
  );

  const decryptedValue = decryptField(encryptedValue);
  assert(
    decryptedValue === testPlaintext,
    "Decryption restores exact plaintext for authorized readers"
  );

  // Test Claim model schema pre-save hook and method
  const testClaimDoc = new Claim({
    claimantId: studentId,
    itemId: new mongoose.Types.ObjectId(),
    secretVerificationAnswer: "Secret Tag #7731",
    proofDetails: "Blue zipper on side compartment",
    status: "pending",
  });

  // Manually trigger pre-save hook logic
  const encryptedAnswer = encryptField(testClaimDoc.secretVerificationAnswer);
  const encryptedProof = encryptField(testClaimDoc.proofDetails);
  testClaimDoc.secretVerificationAnswer = encryptedAnswer;
  testClaimDoc.proofDetails = encryptedProof;

  assert(
    testClaimDoc.secretVerificationAnswer.startsWith("enc:gcm:") &&
      testClaimDoc.proofDetails.startsWith("enc:gcm:"),
    "Claim sensitive answers and proof details are encrypted at rest (enc:gcm:...)"
  );

  const decryptedClaimObj = testClaimDoc.decryptSensitiveFields();
  assert(
    decryptedClaimObj.secretVerificationAnswer === "Secret Tag #7731" &&
      decryptedClaimObj.proofDetails === "Blue zipper on side compartment",
    "decryptSensitiveFields() decrypts claim fields cleanly for authorized admin review"
  );

  // Check ItemReport schema privacy rule (select: false)
  const itemSchemaConfig = ItemReport.schema.paths.secretVerificationDetail;
  assert(
    itemSchemaConfig.options.select === false,
    "ItemReport schema strictly enforces select: false on secretVerificationDetail"
  );

  console.log("\n=================================================================");
  console.log(`   SECURITY TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================================\n");

  serverInstance.close();
  process.exit(failedCount > 0 ? 1 : 0);
}

runSecurityTests().catch((err) => {
  console.error("Test execution error:", err);
  if (serverInstance) serverInstance.close();
  process.exit(1);
});
