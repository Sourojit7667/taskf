import { useState } from "react";
import {supabase } from "../supabaseClient";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Clock, Bell, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

export default function TaskForm({ onTaskCreated, editTask, onClose }) {
  const [title, setTitle] = useState(editTask?.title || "");
  const [description, setDescription] = useState(editTask?.description || "");
  const [scheduledDate, setScheduledDate] = useState(
    editTask?.scheduled_date ? new Date(editTask.scheduled_date) : new Date(),
  );
  const [reminderMinutes, setReminderMinutes] = useState(
    editTask?.reminder_minutes_before || 60,
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const taskData = {
        user_id: user.id,
        title,
        description,
        scheduled_date: scheduledDate.toISOString(),
        reminder_minutes_before: reminderMinutes,
        status: getTaskStatus(scheduledDate),
      };

      if (editTask) {
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", editTask.id);

        if (error) throw error;
        toast.success("Task updated successfully!");
      } else {
        const { error } = await supabase.from("tasks").insert([taskData]);

        if (error) throw error;
        toast.success("Task created successfully!");
      }

      setTitle("");
      setDescription("");
      setScheduledDate(new Date());
      setReminderMinutes(60);

      if (onTaskCreated) onTaskCreated();
      if (onClose) onClose();
    } catch (error) {
      toast.error("Failed to save task");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (date) => {
    const now = new Date();
    const taskDate = new Date(date);

    // If scheduled time has passed, it's missed
    if (taskDate < now) {
      return "missed";
    }

    // Check if task is today or future
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

    if (taskDateOnly.getTime() === today.getTime()) {
      // Today (but time hasn't passed yet) = pending
      return "pending";
    } else {
      // Tomorrow or later = upcoming
      return "upcoming";
    }
  };

  return (
    <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ fontSize: "24px", fontWeight: "700" }}>
          {editTask ? "Edit Task" : "Create New Task"}
        </h2>
        {onClose && (
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
        )}
      </div>

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
            Task Title *
          </label>
          <input
            type="text"
            className="input"
            placeholder="Enter task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            Description
          </label>
          <textarea
            className="input"
            placeholder="Add more details about your task..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
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
            <Calendar
              size={16}
              style={{
                display: "inline",
                marginRight: "8px",
                verticalAlign: "middle",
              }}
            />
            Scheduled Date & Time *
          </label>
          <DatePicker
            selected={scheduledDate}
            onChange={(date) => setScheduledDate(date)}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="MMMM d, yyyy h:mm aa"
            className="input"
            minDate={new Date()}
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
            <Bell
              size={16}
              style={{
                display: "inline",
                marginRight: "8px",
                verticalAlign: "middle",
              }}
            />
            Remind me before
          </label>
          <select
            className="input"
            value={reminderMinutes}
            onChange={(e) => setReminderMinutes(Number(e.target.value))}
            style={{ cursor: "pointer" }}
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={1440}>1 day</option>
            <option value={2880}>2 days</option>
          </select>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {loading ? (
            <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
              {editTask ? "Updating..." : "Creating..."}
            </span>
          ) : (
            <>
              <Plus size={18} />
              {editTask ? "Update Task" : "Create Task"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
