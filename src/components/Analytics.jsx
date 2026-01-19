import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, CheckCircle2, XCircle, Clock, Target } from "lucide-react";

export default function Analytics() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    missed: 0,
    upcoming: 0,
    completionRate: 0,
    weeklyData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === "completed").length;
      const pending = tasks.filter((t) => t.status === "pending").length;
      const missed = tasks.filter((t) => t.status === "missed").length;
      const upcoming = tasks.filter((t) => t.status === "upcoming").length;
      const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate weekly data
      const weeklyData = calculateWeeklyData(tasks);

      setStats({
        total,
        completed,
        pending,
        missed,
        upcoming,
        completionRate,
        weeklyData,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyData = (tasks) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekData = days.map((day) => ({
      name: day,
      completed: 0,
      missed: 0,
    }));

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    tasks.forEach((task) => {
      const taskDate = new Date(task.scheduled_date);
      if (taskDate >= weekAgo && taskDate <= now) {
        const dayIndex = taskDate.getDay();
        if (task.status === "completed") {
          weekData[dayIndex].completed++;
        } else if (task.status === "missed") {
          weekData[dayIndex].missed++;
        }
      }
    });

    return weekData;
  };

  const pieData = [
    { name: "Completed", value: stats.completed, color: "#10b981" },
    { name: "Pending", value: stats.pending, color: "#f59e0b" },
    { name: "Missed", value: stats.missed, color: "#ef4444" },
    { name: "Upcoming", value: stats.upcoming, color: "#3b82f6" },
  ].filter((item) => item.value > 0);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div
          style={{
            animation: "pulse 1.5s ease-in-out infinite",
            color: "var(--text-secondary)",
          }}
        >
          Loading analytics...
        </div>
      </div>
    );
  }

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
          <TrendingUp size={24} color="white" />
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "700" }}>Analytics</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-2" style={{ marginBottom: "32px" }}>
        <div
          className="card"
          style={{
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
            borderColor: "var(--accent-primary)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <div>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  marginBottom: "8px",
                }}
              >
                Completion Rate
              </p>
              <h2
                style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  color: "var(--accent-primary)",
                }}
              >
                {stats.completionRate}%
              </h2>
            </div>
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
              <Target size={24} color="white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <div>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  marginBottom: "8px",
                }}
              >
                Total Tasks
              </p>
              <h2 style={{ fontSize: "36px", fontWeight: "700" }}>
                {stats.total}
              </h2>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(161, 161, 170, 0.2)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={24} color="var(--text-secondary)" />
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            borderColor: "var(--success)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <div>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  marginBottom: "8px",
                }}
              >
                Completed
              </p>
              <h2
                style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  color: "var(--success)",
                }}
              >
                {stats.completed}
              </h2>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(16, 185, 129, 0.2)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={24} color="var(--success)" />
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            borderColor: "var(--error)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <div>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  marginBottom: "8px",
                }}
              >
                Missed
              </p>
              <h2
                style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  color: "var(--error)",
                }}
              >
                {stats.missed}
              </h2>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(239, 68, 68, 0.2)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <XCircle size={24} color="var(--error)" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-2">
        <div className="card">
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "20px",
            }}
          >
            Weekly Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.weeklyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-color)"
              />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="missed" fill="#ef4444" name="Missed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "20px",
            }}
          >
            Task Distribution
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
              }}
            >
              No tasks to display
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="card" style={{ marginTop: "24px" }}>
        <h3
          style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}
        >
          📊 Insights
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {stats.completionRate >= 80 && (
            <p style={{ color: "var(--success)", fontSize: "14px" }}>
              🎉 Excellent! You're maintaining a high completion rate of{" "}
              {stats.completionRate}%.
            </p>
          )}
          {stats.completionRate < 50 && stats.total > 0 && (
            <p style={{ color: "var(--warning)", fontSize: "14px" }}>
              💡 Your completion rate is {stats.completionRate}%. Try breaking
              tasks into smaller, manageable pieces.
            </p>
          )}
          {stats.missed > stats.completed && stats.total > 0 && (
            <p style={{ color: "var(--error)", fontSize: "14px" }}>
              ⚠️ You have more missed tasks than completed. Consider setting
              more realistic deadlines.
            </p>
          )}
          {stats.total === 0 && (
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              📝 Start creating tasks to see your analytics and track your
              productivity!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
