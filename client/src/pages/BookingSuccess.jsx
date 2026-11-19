import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Printer,
  Ticket,
  ArrowRight,
  RefreshCw,
  Film,
} from "lucide-react";
import API from "../services/api";

const BookingSuccess = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await API.get(`/bookings/${bookingId}`);
        setBooking(response.data.data);
      } catch (err) {
        setError(err.message || "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 1rem", color: "var(--text-secondary)" }}>
        <RefreshCw size={36} style={{ animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
        <p style={{ fontSize: "1.1rem" }}>Generating your digital movie ticket...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }} className="glass-card">
        <Film size={44} color="var(--danger)" style={{ margin: "0 auto 1rem" }} />
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Booking Not Found</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          {error || "Could not retrieve ticket confirmation."}
        </p>
        <Link to="/" className="btn btn-primary">
          Return to Home
        </Link>
      </div>
    );
  }

  const { show, seats, bookingNumber, finalAmount, paymentMethod, paymentTransactionId } = booking;

  const showDateFormatted = new Date(show.startTime).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const showTimeFormatted = new Date(show.startTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div style={{ maxWidth: "680px", margin: "2rem auto" }}>
      {/* Success Notification Banner */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
        }}
      >
        <CheckCircle2 size={44} color="var(--success)" style={{ margin: "0 auto 0.5rem" }} />
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>
          Booking Confirmed!
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "0.25rem" }}>
          Your digital ticket pass is ready for cinema entry
        </p>
      </div>

      {/* Cinema Digital Ticket Pass Card */}
      <div
        id="printable-ticket"
        className="glass-card"
        style={{
          padding: 0,
          overflow: "hidden",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-lg)",
          marginBottom: "2rem",
        }}
      >
        {/* Ticket Header Strip */}
        <div
          style={{
            background: "linear-gradient(135deg, #e50914 0%, #8b0000 100%)",
            padding: "1.25rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#fff",
          }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.85 }}>
              IMovies Verified Ticket
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "0.05em" }}>
              {bookingNumber}
            </div>
          </div>
          <span className="badge" style={{ backgroundColor: "rgba(0, 0, 0, 0.4)", color: "#fff" }}>
            CONFIRMED
          </span>
        </div>

        {/* Ticket Main Details */}
        <div style={{ padding: "2rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
            <img
              src={show.movie?.posterUrl}
              alt={show.movie?.title}
              style={{ width: "90px", height: "130px", objectFit: "cover", borderRadius: "8px" }}
            />
            <div style={{ flex: 1, minWidth: "220px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <span className="badge badge-primary">{show.movie?.certificate}</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {show.movie?.duration} mins
                </span>
              </div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800 }}>{show.movie?.title}</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                {show.movie?.language?.join(", ")}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                <MapPin size={16} color="var(--primary)" />
                <span>{show.theatre?.name}</span>
              </div>
            </div>
          </div>

          {/* Screening Metadata Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "1rem",
              padding: "1.25rem",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.75rem",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Date</div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginTop: "0.15rem" }}>{showDateFormatted}</div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Time</div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--accent)", marginTop: "0.15rem" }}>
                {showTimeFormatted}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Screen</div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginTop: "0.15rem" }}>{show.screen?.name}</div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Seats ({seats.length})</div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--primary)", marginTop: "0.15rem" }}>
                {seats.map((s) => s.seatNumber).join(", ")}
              </div>
            </div>
          </div>

          {/* QR Code Pass & Gate Scanner Simulation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px dashed var(--border-color)",
              paddingTop: "1.5rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Payment Mode</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{paymentMethod}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                Txn: <code>{paymentTransactionId}</code>
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)", marginTop: "0.4rem" }}>
                Total Paid: ₹{finalAmount}
              </div>
            </div>

            {/* Simulated QR Code Box */}
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "#fff",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <QrCode size={80} color="#000" />
              <span style={{ fontSize: "0.65rem", color: "#666", fontWeight: 700, marginTop: "0.2rem" }}>
                SCAN AT ENTRY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
        <button onClick={() => window.print()} className="btn btn-secondary">
          <Printer size={16} />
          <span>Print / Save Pass</span>
        </button>

        <Link to="/my-bookings" className="btn btn-secondary">
          <Ticket size={16} />
          <span>My Bookings</span>
        </Link>

        <Link to="/movies" className="btn btn-primary">
          <span>Explore More Movies</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default BookingSuccess;

