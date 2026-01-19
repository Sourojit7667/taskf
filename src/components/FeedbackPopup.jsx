import { useState } from "react";
import { supabase } from "../supabaseClient";
import { X, Star, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function FeedbackPopup({ onClose }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("feedback").insert([
        {
          user_id: user.id,
          rating,
          message: feedback,
        },
      ]);

      if (error) throw error;

      // Update last feedback request time
      await supabase
        .from("user_activity")
        .update({ last_feedback_request: new Date().toISOString() })
        .eq("user_id", user.id);

      toast.success("Thank you for your feedback!");
      onClose();
    } catch (error) {
      toast.error("Failed to submit feedback");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDontShowAgain = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Set a far future date to prevent popup
      await supabase
        .from("user_activity")
        .update({ last_feedback_request: new Date("2099-12-31").toISOString() })
        .eq("user_id", user.id);

      toast.success("Got it! We won't ask again.");
      onClose();
    } catch (error) {
      console.error(error);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal scale-in" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "var(--accent-gradient)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageSquare size={24} color="white" />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: "700" }}>
              How are we doing?
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "8px",
            }}
          >
            <X size={24} />
          </button>
        </div>

        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
          You've been using TaskMaster for a while now. We'd love to hear your
          thoughts!
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "12px",
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--text-secondary)",
              }}
            >
              Rate your experience
            </label>
            <div
              style={{ display: "flex", gap: "8px", justifyContent: "center" }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <Star
                    size={32}
                    fill={star <= rating ? "#f59e0b" : "none"}
                    color={star <= rating ? "#f59e0b" : "var(--text-muted)"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--text-secondary)",
              }}
            >
              Tell us more (optional)
            </label>
            <textarea
              className="input"
              placeholder="What do you like? What could be better?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>

          <div
            style={{ display: "flex", gap: "12px", flexDirection: "column" }}
          >
            <button
              type="submit"
              className="btn btn-primary"
              disabled={rating === 0 || loading}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>
            <button
              type="button"
              onClick={handleDontShowAgain}
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Don't show again
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
