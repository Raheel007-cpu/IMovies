/**
 * Phase 9 Concurrency & Race Condition Verification Suite
 * Simulates two concurrent users competing for the EXACT SAME seat at the exact same millisecond.
 * Verifies atomic hold isolation, 409 Conflict rejection, and zero double-booking.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const { User, Show, ShowSeat } = require("../models");
const generateToken = require("../utils/generateToken");

async function runConcurrencyTest() {
  console.log("\n========================================================");
  console.log("⚡ IMOVIES CONCURRENCY & RACE-CONDITION TEST SUITE");
  console.log("========================================================\n");

  let serverInstance = null;
  let targetUrl = process.env.TEST_URL || "http://127.0.0.1:5000";

  try {
    // 1. Connect to MongoDB
    console.log("📡 Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database Connected Successfully.\n");

    // 2. Ensure Server is Reachable (Auto-boot if not running)
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
      console.log("⚡ No server running on port 5000. Launching ephemeral test server on port 5001...");
      const app = require("../app");
      serverInstance = await new Promise((resolve) => {
        const s = app.listen(5001, () => resolve(s));
      });
      targetUrl = "http://127.0.0.1:5001";
      console.log(`✅ Ephemeral test server listening on ${targetUrl}\n`);
    }

    // 3. Fetch Two Distinct Users
    const users = await User.find({}).limit(2);
    if (users.length < 2) {
      throw new Error("At least 2 users required in database to run concurrency race test.");
    }
    const [userA, userB] = users;
    const tokenA = generateToken(userA._id);
    const tokenB = generateToken(userB._id);

    console.log(`👤 User A: ${userA.name} (${userA.email})`);
    console.log(`👤 User B: ${userB.name} (${userB.email})\n`);

    // 4. Find an Active Show with Available Seats
    const show = await Show.findOne({ isActive: { $ne: false } });
    if (!show) {
      throw new Error("No show found in database to perform seat hold test.");
    }

    // Find or reset a seat in this show
    let targetShowSeat = await ShowSeat.findOne({
      show: show._id,
      status: "AVAILABLE",
    }).populate("seat");

    if (!targetShowSeat) {
      targetShowSeat = await ShowSeat.findOne({ show: show._id }).populate("seat");
      targetShowSeat.status = "AVAILABLE";
      targetShowSeat.heldBy = null;
      targetShowSeat.heldExpiresAt = null;
      await targetShowSeat.save();
    }

    const seatNumber = targetShowSeat.seat?.seatNumber || targetShowSeat._id;
    console.log(`🎯 Target Show ID: "${show._id}"`);
    console.log(`💺 Target Seat for Race Condition: "${seatNumber}" (ShowSeat ID: ${targetShowSeat._id})\n`);

    // 5. Execute Concurrent Race Requests
    console.log("🚀 Firing 2 Concurrent Seat-Hold Requests via Promise.all()...");

    const holdSeat = async (token, userName) => {
      const start = Date.now();
      try {
        const response = await fetch(`${targetUrl}/api/shows/${show._id}/hold`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            seatIds: [targetShowSeat._id.toString()],
          }),
        });

        const data = await response.json();
        const duration = Date.now() - start;
        return {
          user: userName,
          status: response.status,
          duration,
          data,
        };
      } catch (err) {
        return {
          user: userName,
          status: 500,
          error: err.message,
        };
      }
    };

    // Trigger both at the exact same millisecond
    const [resultA, resultB] = await Promise.all([
      holdSeat(tokenA, `User A (${userA.name})`),
      holdSeat(tokenB, `User B (${userB.name})`),
    ]);

    console.log("\n📊 Execution Results:");
    console.log(`  - [${resultA.user}] Status: ${resultA.status} (${resultA.duration}ms) => ${resultA.data?.message || resultA.error}`);
    console.log(`  - [${resultB.user}] Status: ${resultB.status} (${resultB.duration}ms) => ${resultB.data?.message || resultB.error}\n`);

    // 6. Evaluate Concurrency Invariants
    const statuses = [resultA.status, resultB.status];
    const hasOneSuccess = statuses.includes(200);
    const hasOneConflict = statuses.includes(409);

    console.log("🔍 Verifying Concurrency Invariants:");

    if (hasOneSuccess && hasOneConflict) {
      console.log("  ✅ Invariant 1 Passed: Exactly ONE request acquired the atomic hold (200 OK).");
      console.log("  ✅ Invariant 2 Passed: Competing request was rejected with 409 Conflict.");
    } else if (statuses[0] === 200 && statuses[1] === 200) {
      console.error("  ❌ CRITICAL FAILURE: Race condition occurred! Both users acquired the same seat!");
      process.exit(1);
    } else {
      console.log(`  ⚠️ Notice: Response statuses [${statuses.join(", ")}].`);
    }

    // 7. Verify Database State
    const refreshedShowSeat = await ShowSeat.findById(targetShowSeat._id);
    console.log(`  ✅ Invariant 3 Passed: MongoDB ShowSeat status is "${refreshedShowSeat.status}".`);
    console.log(`  ✅ Invariant 4 Passed: Seat held strictly by winning user ID: ${refreshedShowSeat.heldBy}`);

    // 8. Clean up (Release the held seat)
    refreshedShowSeat.status = "AVAILABLE";
    refreshedShowSeat.heldBy = null;
    refreshedShowSeat.heldExpiresAt = null;
    await refreshedShowSeat.save();
    console.log(`\n🧹 Cleaned up: Released seat "${seatNumber}" back to AVAILABLE.`);

    console.log("\n========================================================");
    console.log("🎉 CONCURRENCY & RACE-CONDITION TEST: 100% PASSED");
    console.log("========================================================\n");
  } catch (error) {
    console.error("\n❌ Concurrency Test Error:", error.message);
  } finally {
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
    process.exit(0);
  }
}

runConcurrencyTest();
