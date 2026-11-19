import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  XCircle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Film,
} from "lucide-react";
import API from "../services/api";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cancellingId, setCancellingId] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get("/bookings/my");
      setBookings(response.data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this ticket? The seats will be released and a mock refund issued."
    );
    if (!confirmed) return;

    setCancellingId(bookingId);
    setActionMessage({ type: "", text: "" });
    try {
      await API.patch(`/bookings/${bookingId}/cancel`);
      setActionMessage({
        type: "success",
        text: "Booking cancelled successfully. Seats have been returned to available inventory.",
      });
      fetchBookings();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.message || "Failed to cancel booking",
      });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "1.5rem auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>My Bookings</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            View your active tickets and past booking history
          </p>
        </div>
        <button
          onClick={fetchBookings}
          disabled={loading}
          className="btn btn-secondary"
          style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}
        >
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          <span>Refresh</span>
        </button>
      </div>

      {actionMessage.text && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            backgroundColor: actionMessage.type === "success" ? "var(--success-bg)" : "rgba(239, 68, 68, 0.12)",
            border: `1px solid ${actionMessage.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            borderRadius: "var(--radius-md)",
            marginBottom: "1.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.9rem",
            color: actionMessage.type === "success" ? "var(--success)" : "#fecaca",
          }}
        >
          {actionMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-secondary)" }}>
          <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p>Loading your booking history...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <p style={{ color: "var(--danger)", marginBottom: "1rem" }}>{error}</p>
          <button onClick={fetchBookings} className="btn btn-secondary">Retry</button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <Ticket size={48} color="var(--text-muted)" style={{ margin: "0 auto 1rem" }} />
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            No Bookings Found
          </h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            You haven't booked any movie tickets yet.
          </p>
          <Link to="/movies" className="btn btn-primary">
            Explore Movies & Book
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {bookings.map((b) => {
            const isCancelled = b.bookingStatus === "CANCELLED";
            const showTime = new Date(b.show?.startTime);
            const isPastShow = new Date() >= showTime;

            const showDateStr = showTime.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });

            const showTimeStr = showTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });

            return (
              <div
                key={b._id}
                className="glass-card"
                style={{
                  padding: "1.5rem",
                  display: "flex",
                  gap: "1.5rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                  borderLeft: `4px solid ${isCancelled ? "var(--danger)" : "var(--success)"}`,
                }}
              >
                <img
                  src={b.show?.movie?.posterUrl}
                  alt={b.show?.movie?.title}
                  style={{ width: "75px", height: "110px", objectFit: "cover", borderRadius: "6px" }}
                />

                <div style={{ flex: 1, minWidth: "220px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                    <span className={`badge ${isCancelled ? "badge-primary" : "badge-success"}`}>
                      {b.bookingStatus}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                      {b.bookingNumber}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{b.show?.movie?.title}</h3>

                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                    {b.show?.theatre?.name} • {b.show?.screen?.name}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                      {showDateStr}, {showTimeStr}
                    </span>
                    <span>Seats: <strong style={{ color: "#fff" }}>{b.seats.map((s) => s.seatNumber).join(", ")}</strong></span>
                    <span>Paid: <strong style={{ color: "#fff" }}>₹{b.finalAmount}</strong></span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", minWidth: "140px" }}>
                  <Link to={`/booking/success/${b._id}`} className="btn btn-secondary" style={{ fontSize: "0.85rem", padding: "0.5rem" }}>
                    <Ticket size={15} />
                    <span>View Ticket</span>
                  </Link>

                  {!isCancelled && !isPastShow && (
                    <button
                      onClick={() => handleCancelBooking(b._id)}
                      disabled={cancellingId === b._id}
                      className="btn btn-secondary"
                      style={{ fontSize: "0.8rem", padding: "0.45rem", color: "var(--danger)" }}
                    >
                      <XCircle size={14} />
                      <span>{cancellingId === b._id ? "Cancelling..." : "Cancel Ticket"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;

