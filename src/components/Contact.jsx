import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Mail, MessageSquare, Send } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Contact() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Call Go backend API to store message and send email notification
      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          subject,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      toast.success("Message sent! We'll get back to you soon.");
      setSubject("");
      setMessage("");
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
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
        <h1 style={{ fontSize: "28px", fontWeight: "700" }}>Contact Support</h1>
      </div>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card">
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Get in Touch
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: "24px",
              lineHeight: "1.6",
            }}
          >
            Have a question, suggestion, or found a bug? We'd love to hear from
            you! Fill out the form and we'll get back to you as soon as
            possible.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                }}
              >
                Subject *
              </label>
              <input
                type="text"
                className="input"
                placeholder="What's this about?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                }}
              >
                Message *
              </label>
              <textarea
                className="input"
                placeholder="Tell us more..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {loading ? (
                <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
                  Sending...
                </span>
              ) : (
                <>
                  <Send size={18} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>

        <div
          className="card"
          style={{
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
            borderColor: "var(--accent-primary)",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            💡 Quick Tips
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "4px",
                  color: "var(--accent-primary)",
                }}
              >
                Reporting Bugs
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.5",
                }}
              >
                Include steps to reproduce the issue and what you expected to
                happen.
              </p>
            </div>
            <div>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "4px",
                  color: "var(--accent-primary)",
                }}
              >
                Feature Requests
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.5",
                }}
              >
                Describe the feature and how it would improve your experience.
              </p>
            </div>
            <div>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "4px",
                  color: "var(--accent-primary)",
                }}
              >
                General Questions
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.5",
                }}
              >
                We're here to help! Ask us anything about TaskMaster.
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              background: "var(--bg-tertiary)",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                lineHeight: "1.5",
              }}
            >
              <strong style={{ color: "var(--text-primary)" }}>
                Response Time:
              </strong>
              <br />
              We typically respond within 24-48 hours during business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
