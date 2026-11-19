import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  Ticket,
  ShieldAlert,
  Info,
} from "lucide-react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const SeatSelection = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [show, setShow] = useState(null);
  const [layout, setLayout] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSeats, setSelectedSeats] = useState([]); // array of ShowSeat objects
  const [isHolding, setIsHolding] = useState(false);
  const [holdError, setHoldError] = useState("");

  // Countdown Timer State (10 minutes)
  const [timeLeft, setTimeLeft] = useState(null); // in seconds

  const fetchSeatLayout = async () => {
    setLoading(true);
    setError(null);
    setHoldError("");
    try {
      const response = await API.get(`/shows/${showId}/seats`);
      const data = response.data.data;
      setShow(data.show);
      setLayout(data.layout || []);

      // If user had previously held seats, pre-select them
      const heldByMe = [];
      data.layout.forEach((cat) => {
        cat.rows.forEach((r) => {
          r.seats.forEach((s) => {
            if (s.isHeldByMe) {
              heldByMe.push(s);
            }
          });
        });
      });

      if (heldByMe.length > 0) {
        setSelectedSeats(heldByMe);
        // Calculate remaining seconds
        const expiry = new Date(heldByMe[0].heldExpiresAt).getTime();
        const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
        setTimeLeft(diff);
      }
    } catch (err) {
      setError(err.message || "Failed to load seat layout");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatLayout();
  }, [showId]);

  // Hold Timer Ticker
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setHoldError("Your seat hold has expired. Please select your seats again.");
          fetchSeatLayout();
          setSelectedSeats([]);
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

  const handleSeatClick = (seat) => {
    setHoldError("");

    if (seat.status === "BOOKED") return;
    if (seat.status === "HELD" && !seat.isHeldByMe) return;

    const isAlreadySelected = selectedSeats.some((s) => s._id === seat._id);

    if (isAlreadySelected) {
      setSelectedSeats(selectedSeats.filter((s) => s._id !== seat._id));
    } else {
      if (selectedSeats.length >= 10) {
        setHoldError("You can select a maximum of 10 seats per booking.");
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleProceedToHold = async () => {
    if (selectedSeats.length === 0) {
      setHoldError("Please select at least one seat.");
      return;
    }

    if (!user) {
      // Prompt user to login, preserving destination
      navigate("/login", {
        state: { from: { pathname: `/shows/${showId}/seats` } },
      });
      return;
    }

    setIsHolding(true);
    setHoldError("");
    try {
      const seatIds = selectedSeats.map((s) => s._id);
      const res = await API.post(`/shows/${showId}/hold`, { seatIds });

      const expiry = new Date(res.data.data.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setTimeLeft(diff);

      // Store held seat information in session/state for Checkout
      sessionStorage.setItem(
        "imovies_held_booking",
        JSON.stringify({
          showId,
          show,
          heldSeats: res.data.data.heldSeats,
          totalAmount: res.data.data.totalAmount,
          expiresAt: res.data.data.expiresAt,
        })
      );

      navigate(`/checkout/${showId}`);
    } catch (err) {
      setHoldError(err.message || "Failed to hold seats. Someone may have booked them.");
      // Re-fetch layout to show updated availability
      fetchSeatLayout();
    } finally {
      setIsHolding(false);
    }
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((acc, curr) => acc + curr.price, 0);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 1rem", color: "var(--text-secondary)" }}>
        <RefreshCw size={36} style={{ animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
        <p>Loading real-time seat layout...</p>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }} className="glass-card">
        <AlertCircle size={44} color="var(--danger)" style={{ margin: "0 auto 1rem" }} />
        <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Show Unavailable</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          {error || "Could not retrieve the requested show."}
        </p>
        <Link to="/movies" className="btn btn-primary">
          Browse Shows
        </Link>
      </div>
    );
  }

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
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "7rem" }}>
      {/* Top Navigation & Show Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          to={`/theatres?movie=${show.movie?._id}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.75rem" }}
        >
          <ArrowLeft size={16} />
          <span>Change Showtime</span>
        </Link>

        <div className="glass-card" style={{ padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span className="badge badge-primary">{show.movie?.certificate}</span>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 800 }}>{show.movie?.title}</h1>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              {show.theatre?.name} • {show.screen?.name} • <strong style={{ color: "#fff" }}>{showDateFormatted}, {showTimeFormatted}</strong>
            </p>
          </div>

          {/* Real-time Refresh & Timer */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {timeLeft !== null && timeLeft > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.85rem",
                  backgroundColor: timeLeft < 120 ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 197, 24, 0.15)",
                  border: `1px solid ${timeLeft < 120 ? "var(--danger)" : "var(--accent)"}`,
                  borderRadius: "var(--radius-md)",
                  color: timeLeft < 120 ? "var(--danger)" : "var(--accent)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                <Clock size={15} />
                <span>Seats Held: {formatTimer(timeLeft)}</span>
              </div>
            )}

            <button
              onClick={fetchSeatLayout}
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}
              title="Refresh seat availability"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {holdError && (
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
            fontSize: "0.9rem",
          }}
        >
          <ShieldAlert size={20} color="var(--danger)" style={{ flexShrink: 0 }} />
          <span>{holdError}</span>
        </div>
      )}

      {/* Cinema Screen Visualizer */}
      <div style={{ margin: "2.5rem 0 3.5rem", textAlign: "center" }}>
        <div
          style={{
            height: "8px",
            background: "linear-gradient(90deg, rgba(229, 9, 20, 0.05) 0%, rgba(229, 9, 20, 0.9) 50%, rgba(229, 9, 20, 0.05) 100%)",
            borderRadius: "50%",
            boxShadow: "0 4px 24px rgba(229, 9, 20, 0.7)",
            maxWidth: "650px",
            margin: "0 auto 0.75rem",
          }}
        />
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.25em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
          Cinema Screen This Way
        </p>
      </div>

      {/* Tiered Seat Layout */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", marginBottom: "3rem" }}>
        {layout.map((categoryGroup) => (
          <div key={categoryGroup.category}>
            {/* Category Tier Pricing Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)" }}>
                {categoryGroup.category} Tier
              </span>
              <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent)" }}>
                ₹{categoryGroup.price}
              </span>
            </div>

            {/* Rows Container */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", alignItems: "center" }}>
              {categoryGroup.rows.map((rowObj) => (
                <div key={rowObj.row} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {/* Row Label Left */}
                  <span style={{ width: "22px", textAlign: "center", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {rowObj.row}
                  </span>

                  {/* Seat Grid */}
                  <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", justifyContent: "center" }}>
                    {rowObj.seats.map((seat) => {
                      const isSelected = selectedSeats.some((s) => s._id === seat._id);
                      const isBooked = seat.status === "BOOKED";
                      const isHeldByOther = seat.status === "HELD" && !seat.isHeldByMe;

                      let bgColor = "var(--bg-secondary)";
                      let borderColor = "var(--border-color)";
                      let textColor = "var(--text-primary)";
                      let cursor = "pointer";

                      if (isBooked) {
                        bgColor = "rgba(100, 116, 139, 0.15)";
                        borderColor = "rgba(100, 116, 139, 0.3)";
                        textColor = "rgba(148, 163, 184, 0.4)";
                        cursor = "not-allowed";
                      } else if (isHeldByOther) {
                        bgColor = "rgba(245, 158, 11, 0.15)";
                        borderColor = "rgba(245, 158, 11, 0.4)";
                        textColor = "var(--warning)";
                        cursor = "not-allowed";
                      } else if (isSelected) {
                        bgColor = "var(--primary)";
                        borderColor = "var(--primary)";
                        textColor = "#fff";
                      }

                      return (
                        <button
                          key={seat._id}
                          onClick={() => handleSeatClick(seat)}
                          disabled={isBooked || isHeldByOther}
                          title={
                            isBooked
                              ? `Seat ${seat.seatNumber} is booked`
                              : isHeldByOther
                              ? `Seat ${seat.seatNumber} is temporarily held by another customer`
                              : `Seat ${seat.seatNumber} - ₹${seat.price}`
                          }
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "6px",
                            backgroundColor: bgColor,
                            border: `1px solid ${borderColor}`,
                            color: textColor,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor,
                            transition: "all 0.15s ease",
                            boxShadow: isSelected ? "0 0 10px rgba(229, 9, 20, 0.6)" : "none",
                            transform: isSelected ? "scale(1.08)" : "none",
                          }}
                        >
                          {seat.column}
                        </button>
                      );
                    })}
                  </div>

                  {/* Row Label Right */}
                  <span style={{ width: "22px", textAlign: "center", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {rowObj.row}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Seat State Legend */}
      <div
        className="glass-card"
        style={{
          padding: "1rem",
          display: "flex",
          justifyContent: "center",
          gap: "1.75rem",
          flexWrap: "wrap",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <div style={{ width: "18px", height: "18px", borderRadius: "4px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)" }} />
          <span>Available</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <div style={{ width: "18px", height: "18px", borderRadius: "4px", backgroundColor: "var(--primary)", border: "1px solid var(--primary)", boxShadow: "0 0 8px rgba(229,9,20,0.5)" }} />
          <span>Selected</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <div style={{ width: "18px", height: "18px", borderRadius: "4px", backgroundColor: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.5)" }} />
          <span>Held (10m)</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <div style={{ width: "18px", height: "18px", borderRadius: "4px", backgroundColor: "rgba(100, 116, 139, 0.2)", border: "1px solid rgba(100, 116, 139, 0.3)" }} />
          <span>Sold Out</span>
        </div>
      </div>

      {/* Floating Bottom Checkout Action Bar */}
      {selectedSeats.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(18, 22, 31, 0.95)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid var(--border-color)",
            padding: "1rem 1.5rem",
            zIndex: 50,
            boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            style={{
              maxWidth: "var(--max-width)",
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Selected ({selectedSeats.length} seats):
                </span>
                <span style={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem" }}>
                  {selectedSeats.map((s) => s.seatNumber).join(", ")}
                </span>
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent)", marginTop: "0.15rem" }}>
                ₹{calculateTotal()}{" "}
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>
                  (Excl. convenience fee)
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToHold}
              disabled={isHolding}
              className="btn btn-primary"
              style={{ padding: "0.8rem 2rem", fontSize: "1rem" }}
            >
              <Ticket size={18} />
              <span>{isHolding ? "Holding Seats..." : "Proceed to Checkout"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelection;

