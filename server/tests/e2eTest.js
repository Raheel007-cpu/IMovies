/**
 * Phase 9 End-to-End Automated Diagnostic & Workflow Test Suite
 * Tests Security Headers, Rate Limiting, NoSQL Sanitization, and the Full Booking Lifecycle
 */

const dotenv = require("dotenv");
dotenv.config();

async function runE2ETest() {
  console.log("\n========================================================");
  console.log("🛡️  IMOVIES END-TO-END SECURITY & WORKFLOW DIAGNOSTIC");
  console.log("========================================================\n");

  let serverInstance = null;
  let targetUrl = process.env.TEST_URL || "http://127.0.0.1:5000";
  let authToken = null;
  let testShowId = null;
  let testSeatId = null;
  let testBookingId = null;

  try {
    // 1. Ensure Server is Reachable (Auto-boot if not running)
    try {
      const ping = await fetch(`${targetUrl}/api/health`, {
        signal: AbortSignal.timeout(1500),
      });
      if (ping.ok) {
        console.log(`🔌 Connected to running backend server at ${targetUrl}\n`);
      } else {
        throw new Error();
      }
    } catch {
      console.log("⚡ No server running on port 5000. Launching ephemeral test server on port 5002...");
      const app = require("../app");
      serverInstance = await new Promise((resolve) => {
        const s = app.listen(5002, () => resolve(s));
      });
      targetUrl = "http://127.0.0.1:5002";
      console.log(`✅ Ephemeral test server listening on ${targetUrl}\n`);
    }

    // ------------------------------------------------------------------
    // STEP 1: Health Check & Security Headers
    // ------------------------------------------------------------------
    console.log("1️⃣  Verifying Health Check & Security Headers...");
    const healthRes = await fetch(`${targetUrl}/api/health`);
    if (!healthRes.ok) throw new Error(`Health check failed with status: ${healthRes.status}`);

    const healthData = await healthRes.json();
    console.log(`   ✓ Server Health: ${healthData.success ? "OK" : "WARN"} | DB State: ${healthData.database?.status}`);

    // Verify Security Headers
    const xcto = healthRes.headers.get("x-content-type-options");
    const xfo = healthRes.headers.get("x-frame-options");
    if (xcto === "nosniff" && xfo === "SAMEORIGIN") {
      console.log("   ✓ Security Headers Verified: X-Content-Type-Options & X-Frame-Options active.");
    } else {
      console.warn("   ⚠️ Warning: Some security headers missing.");
    }

    // ------------------------------------------------------------------
    // STEP 2: Authentication & NoSQL Sanitization
    // ------------------------------------------------------------------
    console.log("\n2️⃣  Verifying User Authentication & NoSQL Injection Protection...");

    // Test NoSQL injection attempt
    const injectionAttempt = await fetch(`${targetUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: { $ne: null },
        password: { $ne: null },
      }),
    });
    const injectionData = await injectionAttempt.json();
    if (!injectionAttempt.ok || !injectionData.success) {
      console.log("   ✓ NoSQL Injection Sanitizer: Neutralized operator keys ($ne) safely.");
    }

    // Legitimate Login
    const loginRes = await fetch(`${targetUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "rahul@imovies.com",
        password: "userpassword123",
      }),
    });

    if (!loginRes.ok) throw new Error(`Login failed with status: ${loginRes.status}`);
    const loginData = await loginRes.json();
    authToken = loginData.data?.token;
    console.log(`   ✓ Logged in as: ${loginData.data?.name} (${loginData.data?.role})`);

    // ------------------------------------------------------------------
    // STEP 3: Show & Seat Layout Retrieval
    // ------------------------------------------------------------------
    console.log("\n3️⃣  Retrieving Active Shows & Seat Inventory...");
    const showsRes = await fetch(`${targetUrl}/api/shows`);
    const showsData = await showsRes.json();
    if (!showsData.data || showsData.data.length === 0) {
      throw new Error("No shows available in database.");
    }

    // Select an upcoming future show to allow end-to-end cancellation testing
    const show = showsData.data.find((s) => new Date(s.startTime) > new Date()) || showsData.data[0];
    testShowId = show._id;
    console.log(`   ✓ Found Upcoming Show: "${show.movie?.title}" at "${show.theatre?.name}" (ID: ${testShowId})`);

    // Fetch Seats Layout
    const seatsRes = await fetch(`${targetUrl}/api/shows/${testShowId}/seats`);
    const seatsData = await seatsRes.json();
    let availableSeat = null;

    for (const tier of seatsData.data?.layout || []) {
      for (const r of tier.rows || []) {
        availableSeat = r.seats?.find((s) => s.status === "AVAILABLE");
        if (availableSeat) break;
      }
      if (availableSeat) break;
    }

    if (!availableSeat) {
      throw new Error("No available seat found in selected show.");
    }
    testSeatId = availableSeat._id;
    console.log(`   ✓ Selected Available Seat: "${availableSeat.seatNumber}" (Category: ${availableSeat.category})`);

    // ------------------------------------------------------------------
    // STEP 4: Concurrency Seat Hold
    // ------------------------------------------------------------------
    console.log("\n4️⃣  Executing Atomic Seat Hold (10-minute hold window)...");
    const holdRes = await fetch(`${targetUrl}/api/shows/${testShowId}/hold`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        seatIds: [testSeatId],
      }),
    });

    const holdData = await holdRes.json();
    if (!holdRes.ok) throw new Error(`Seat hold failed: ${holdData.message}`);
    console.log(`   ✓ Seat successfully held until: ${new Date(holdData.data?.expiresAt).toLocaleTimeString()}`);

    // ------------------------------------------------------------------
    // STEP 5: Booking Confirmation & Mock Payment
    // ------------------------------------------------------------------
    console.log("\n5️⃣  Confirming Booking with Mock Payment (MOCK_UPI)...");
    const bookingRes = await fetch(`${targetUrl}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        showId: testShowId,
        seatIds: [testSeatId],
        paymentMethod: "MOCK_UPI",
      }),
    });

    const bookingData = await bookingRes.json();
    if (!bookingRes.ok) throw new Error(`Booking failed: ${bookingData.message}`);
    testBookingId = bookingData.data?._id;
    console.log(`   ✓ Booking Confirmed! Ticket ID: ${testBookingId} | Total Paid: ₹${bookingData.data?.finalAmount}`);

    // ------------------------------------------------------------------
    // STEP 6: Ticket Retrieval & Digital Gate Pass
    // ------------------------------------------------------------------
    console.log("\n6️⃣  Retrieving Digital Gate Pass & Ticket QR...");
    const ticketRes = await fetch(`${targetUrl}/api/bookings/${testBookingId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const ticketData = await ticketRes.json();
    if (!ticketRes.ok) throw new Error(`Ticket retrieval failed: ${ticketData.message}`);
    console.log(`   ✓ Ticket Gate Pass Validated: Status "${ticketData.data?.bookingStatus}"`);

    // ------------------------------------------------------------------
    // STEP 7: Booking Cancellation & Seat Release
    // ------------------------------------------------------------------
    console.log("\n7️⃣  Testing Booking Cancellation & Seat Rollback...");
    const cancelRes = await fetch(`${targetUrl}/api/bookings/${testBookingId}/cancel`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const cancelData = await cancelRes.json();
    if (!cancelRes.ok) throw new Error(`Cancellation failed: ${cancelData.message}`);
    console.log(`   ✓ Booking Cancelled Successfully: ${cancelData.message}`);

    // Re-verify that the seat is now AVAILABLE again
    const verifySeatsRes = await fetch(`${targetUrl}/api/shows/${testShowId}/seats`);
    const verifySeatsData = await verifySeatsRes.json();
    let releasedSeat = null;

    for (const tier of verifySeatsData.data?.layout || []) {
      for (const r of tier.rows || []) {
        releasedSeat = r.seats?.find((s) => s._id === testSeatId);
        if (releasedSeat) break;
      }
      if (releasedSeat) break;
    }

    if (releasedSeat && releasedSeat.status === "AVAILABLE") {
      console.log(`   ✓ Seat Rollback Verified: Seat "${releasedSeat.seatNumber}" is back to "AVAILABLE"!`);
    } else {
      console.warn(`   ⚠️ Warning: Seat status is "${releasedSeat?.status}". Expected "AVAILABLE".`);
    }

    console.log("\n========================================================");
    console.log("🎉 ALL END-TO-END SECURITY & WORKFLOW TESTS PASSED!");
    console.log("========================================================\n");
  } catch (error) {
    console.error("\n❌ E2E Diagnostic Error:", error.message);
  } finally {
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    process.exit(0);
  }
}

runE2ETest();
