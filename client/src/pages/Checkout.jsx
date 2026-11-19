import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  CreditCard,
  QrCode,
  Building,
  ShieldCheck,
  Clock,
  AlertCircle,
  Ticket,
  ArrowLeft,
  Lock,
} from "lucide-react";
import API from "../services/api";

const Checkout = () => {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [bookingData, setBookingData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("MOCK_UPI");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("imovies_held_booking");
    if (!raw) {
      navigate(`/shows/${showId}/seats`);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setBookingData(parsed);

      const expiry = new Date(parsed.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setTimeLeft(diff);
    } catch (e) {
      navigate(`/shows/${showId}/seats`);
    }
  }, [showId, navigate]);

  // Hold Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError("Your seat reservation timer has expired. Please select your seats again.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTimer = (seconds) => {
    if (seconds === null) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleConfirmPayment = async () => {
    if (timeLeft <= 0) {
      setError("Hold has expired. Please return to seat selection.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const seatIds = bookingData.heldSeats.map((s) => s.showSeatId);

      const response = await API.post("/bookings", {
        showId: bookingData.showId,
        seatIds,
        paymentMethod,
      });

      // Clear session hold cache
      sessionStorage.removeItem("imovies_held_booking");

      // Navigate to booking ticket confirmation page
      navigate(`/booking/success/${response.data.data._id}`);
    } catch (err) {
      setError(err.message || "Payment verification failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!bookingData) return null;

  const { show, heldSeats, totalAmount } = bookingData;
  const convenienceFee = 30;
  const gstTax = Math.round(convenienceFee * 0.18);
  const finalPayable = totalAmount + convenienceFee + gstTax;

  const showDateFormatted = new Date(show.startTime).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const showTimeFormatted = new Date(show.startTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div style={{ maxWidth: "880px", margin: "1.5rem auto" }}>
      {/* Back button */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          to={`/shows/${showId}/seats`}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}
        >
          <ArrowLeft size={16} />
          <span>Back to Seat Selection</span>
        </Link>
      </div>

      {/* Timer Banner */}
      {timeLeft !== null && (
        <div
          style={{
            padding: "0.75rem 1.25rem",
            backgroundColor: timeLeft < 120 ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 197, 24, 0.12)",
            border: `1px solid ${timeLeft < 120 ? "var(--danger)" : "rgba(245, 197, 24, 0.3)"}`,
            borderRadius: "var(--radius-md)",
            marginBottom: "1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: timeLeft < 120 ? "#fca5a5" : "var(--accent)" }}>
            <Clock size={18} />
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Seats locked temporarily for checkout
            </span>
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 800, color: timeLeft < 120 ? "var(--danger)" : "var(--accent)" }}>
            Time Remaining: {formatTimer(timeLeft)}
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            color: "#fecaca",
          }}
        >
          <AlertCircle size={20} color="var(--danger)" style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.75rem" }}>
        {/* Left Column: Order Summary */}
        <div className="glass-card">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Ticket size={20} color="var(--primary)" />
            <span>Booking Summary</span>
          </h2>

          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <img
              src={show.movie?.posterUrl}
              alt={show.movie?.title}
              style={{ width: "70px", height: "100px", objectFit: "cover", borderRadius: "6px" }}
            />
            <div>
              <span className="badge badge-primary" style={{ marginBottom: "0.25rem" }}>{show.movie?.certificate}</span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>{show.movie?.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {show.theatre?.name} • {show.screen?.name}
              </p>
              <p style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 700, marginTop: "0.25rem" }}>
                {showDateFormatted}, {showTimeFormatted}
              </p>
            </div>
          </div>

          {/* Seats Detail */}
          <div style={{ padding: "0.85rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Selected Seats ({heldSeats.length}):</span>
              <span style={{ fontWeight: 800, color: "#fff" }}>
                {heldSeats.map((s) => s.seatNumber).join(", ")}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Seat Tiers:</span>
              <span style={{ color: "var(--text-muted)" }}>
                {Array.from(new Set(heldSeats.map((s) => s.category))).join(", ")}
              </span>
            </div>
          </div>

          {/* Fare Breakdown */}
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              <span>Base Ticket Fare</span>
              <span>₹{totalAmount}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              <span>Convenience Fee</span>
              <span>₹{convenienceFee}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              <span>Integrated GST (18%)</span>
              <span>₹{gstTax}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: 800, borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
              <span>Amount Payable</span>
              <span style={{ color: "var(--accent)" }}>₹{finalPayable}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Mock Payment Gateway */}
        <div className="glass-card">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldCheck size={20} color="var(--success)" />
            <span>Secure Mock Payment</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Select a simulated payment method. No real bank charges will be incurred.
          </p>

          {/* Payment Method Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.85rem 1rem",
                backgroundColor: paymentMethod === "MOCK_UPI" ? "var(--primary-light)" : "var(--bg-secondary)",
                border: `1px solid ${paymentMethod === "MOCK_UPI" ? "var(--primary)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="MOCK_UPI"
                checked={paymentMethod === "MOCK_UPI"}
                onChange={() => setPaymentMethod("MOCK_UPI")}
              />
              <QrCode size={22} color="var(--primary)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Instant UPI</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Google Pay, PhonePe, Paytm, BHIM</div>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.85rem 1rem",
                backgroundColor: paymentMethod === "MOCK_CARD" ? "var(--primary-light)" : "var(--bg-secondary)",
                border: `1px solid ${paymentMethod === "MOCK_CARD" ? "var(--primary)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="MOCK_CARD"
                checked={paymentMethod === "MOCK_CARD"}
                onChange={() => setPaymentMethod("MOCK_CARD")}
              />
              <CreditCard size={22} color="var(--primary)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Credit / Debit Card</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Visa, MasterCard, RuPay</div>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.85rem 1rem",
                backgroundColor: paymentMethod === "MOCK_NETBANKING" ? "var(--primary-light)" : "var(--bg-secondary)",
                border: `1px solid ${paymentMethod === "MOCK_NETBANKING" ? "var(--primary)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="MOCK_NETBANKING"
                checked={paymentMethod === "MOCK_NETBANKING"}
                onChange={() => setPaymentMethod("MOCK_NETBANKING")}
              />
              <Building size={22} color="var(--primary)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Net Banking</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>All major Indian banks</div>
              </div>
            </label>
          </div>

          {/* Submit Action */}
          <button
            onClick={handleConfirmPayment}
            disabled={isProcessing || timeLeft <= 0}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.9rem", fontSize: "1.05rem" }}
          >
            <Lock size={18} />
            <span>{isProcessing ? "Verifying Transaction..." : `Pay ₹${finalPayable} & Confirm`}</span>
          </button>

          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "1rem" }}>
            🔒 256-bit Mock Encrypted Payment Gateway
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

