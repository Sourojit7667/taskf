import { format } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Trash2,
  Edit,
  MoveRight,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export default function TaskCard({ task, onUpdate, onEdit }) {
  const handleToggleComplete = async () => {
    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      const { error } = await supabase
        .from("tasks")
        .update({
          status: newStatus,
          completed_at:
            newStatus === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", task.id);

      if (error) throw error;
      toast.success(
        newStatus === "completed"
          ? "Task completed!"
          : "Task marked as pending",
      );
      onUpdate();
    } catch (error) {
      toast.error("Failed to update task");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);

      if (error) throw error;
      toast.success("Task deleted");
      onUpdate();
    } catch (error) {
      toast.error("Failed to delete task");
      console.error(error);
    }
  };

  const handleMoveToCompleted = async () => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;
      toast.success("Task moved to completed!");
      onUpdate();
    } catch (error) {
      toast.error("Failed to update task");
      console.error(error);
    }
  };

  const getStatusBadge = () => {
    const badges = {
      upcoming: { label: "Upcoming", className: "badge-upcoming" },
      pending: { label: "Pending", className: "badge-pending" },
      completed: { label: "Completed", className: "badge-completed" },
      missed: { label: "Missed", className: "badge-missed" },
    };
    const badge = badges[task.status] || badges.pending;
    return <span className={`badge ${badge.className}`}>{badge.label}</span>;
  };

  const getReminderText = () => {
    const minutes = task.reminder_minutes_before;
    if (minutes < 60) return `${minutes}m before`;
    if (minutes < 1440) return `${minutes / 60}h before`;
    return `${minutes / 1440}d before`;
  };

  return (
    <div
      className="card fade-in"
      style={{
        opacity: task.status === "completed" ? 0.7 : 1,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", gap: "16px" }}>
        <div style={{ paddingTop: "4px" }}>
          <button
            onClick={handleToggleComplete}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color:
                task.status === "completed"
                  ? "var(--success)"
                  : "var(--text-muted)",
            }}
          >
            {task.status === "completed" ? (
              <CheckCircle2 size={24} />
            ) : (
              <Circle size={24} />
            )}
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              marginBottom: "8px",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                textDecoration:
                  task.status === "completed" ? "line-through" : "none",
                marginBottom: "4px",
              }}
            >
              {task.title}
            </h3>
            {getStatusBadge()}
          </div>

          {task.description && (
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                marginBottom: "12px",
                lineHeight: "1.5",
              }}
            >
              {task.description}
            </p>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "var(--text-muted)",
              }}
            >
              <Calendar size={14} />
              {format(new Date(task.scheduled_date), "MMM dd, yyyy")}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "var(--text-muted)",
              }}
            >
              <Clock size={14} />
              {format(new Date(task.scheduled_date), "h:mm a")}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "var(--text-muted)",
              }}
            >
              <span
                style={{
                  padding: "2px 8px",
                  background: "rgba(99, 102, 241, 0.1)",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                🔔 {getReminderText()}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {task.status === "missed" && (
              <button
                onClick={handleMoveToCompleted}
                className="btn btn-sm"
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "var(--success)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                <MoveRight size={14} />
                Mark as Completed
              </button>
            )}
            <button
              onClick={() => onEdit(task)}
              className="btn btn-secondary btn-sm"
            >
              <Edit size={14} />
              Edit
            </button>
            <button onClick={handleDelete} className="btn btn-danger btn-sm">
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
