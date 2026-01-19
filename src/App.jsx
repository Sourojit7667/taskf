import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Toaster } from "react-hot-toast";
import Auth from "./components/Auth";
import TaskList from "./components/TaskList";
import Analytics from "./components/Analytics";
import Contact from "./components/Contact";
import FeedbackPopup from "./components/FeedbackPopup";
import {
  ListTodo,
  TrendingUp,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import "./index.css";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("tasks");
  const [showFeedback, setShowFeedback] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);

      if (session) {
        checkAndInitializeUser(session.user.id);
        checkFeedbackPopup(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session) {
        checkAndInitializeUser(session.user.id);
        checkFeedbackPopup(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAndInitializeUser = async (userId) => {
    try {
      const { data: _data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        // User doesn't exist, create entry
        await supabase.from("user_activity").insert([
          {
            user_id: userId,
            first_login: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error initializing user:", error);
    }
  };

  const checkFeedbackPopup = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("user_activity")
        .select("first_login, last_feedback_request")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      const firstLogin = new Date(data.first_login);
      const now = new Date();
      const daysSinceFirstLogin = Math.floor(
        (now - firstLogin) / (1000 * 60 * 60 * 24),
      );

      // Show feedback after 5-6 days
      if (daysSinceFirstLogin >= 5) {
        if (!data.last_feedback_request) {
          setShowFeedback(true);
        } else {
          const lastRequest = new Date(data.last_feedback_request);
          const daysSinceLastRequest = Math.floor(
            (now - lastRequest) / (1000 * 60 * 60 * 24),
          );

          // Show again after 30 days if not set to "don't show again"
          if (daysSinceLastRequest >= 30 && lastRequest.getFullYear() < 2099) {
            setShowFeedback(true);
          }
        }
      }
    } catch (error) {
      console.error("Error checking feedback popup:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActiveView("tasks");
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
        }}
      >
        <div
          style={{
            animation: "pulse 1.5s ease-in-out infinite",
            color: "var(--text-secondary)",
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Auth />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
            },
          }}
        />
      </>
    );
  }

  const navItems = [
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "contact", label: "Contact", icon: MessageSquare },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0a0a0f 0%, #13131a 50%, #0a0a0f 100%)",
        backgroundSize: "400% 400%",
        animation: "gradientMove 20s ease infinite",
        position: "relative",
      }}
    >
      {/* Subtle Background Orb */}
      <div
        style={{
          position: "fixed",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          animation: "floatSlow 30s ease-in-out infinite",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header
        style={{
          background: "rgba(19, 19, 26, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-color)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "var(--accent-gradient)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ListTodo size={20} color="white" />
            </div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "700",
                background: "var(--accent-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              TaskMaster
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
            className="desktop-nav"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className="btn btn-secondary"
                  style={{
                    background:
                      activeView === item.id
                        ? "var(--accent-gradient)"
                        : "transparent",
                    color:
                      activeView === item.id
                        ? "white"
                        : "var(--text-secondary)",
                    border:
                      activeView === item.id
                        ? "none"
                        : "1px solid var(--border-color)",
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
            <button onClick={handleSignOut} className="btn btn-secondary">
              <LogOut size={16} />
              Sign Out
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-secondary mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div
            className="mobile-nav"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-secondary"
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    background:
                      activeView === item.id
                        ? "var(--accent-gradient)"
                        : "transparent",
                    color:
                      activeView === item.id
                        ? "white"
                        : "var(--text-secondary)",
                    border:
                      activeView === item.id
                        ? "none"
                        : "1px solid var(--border-color)",
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={handleSignOut}
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "flex-start" }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main
        className="container fade-in"
        style={{
          padding: "32px 20px",
          maxWidth: "1400px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {activeView === "tasks" && <TaskList />}
        {activeView === "analytics" && <Analytics />}
        {activeView === "contact" && <Contact />}
      </main>

      {/* Feedback Popup */}
      {showFeedback && <FeedbackPopup onClose={() => setShowFeedback(false)} />}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
          },
        }}
      />

      {/* Mobile Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .mobile-nav {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
