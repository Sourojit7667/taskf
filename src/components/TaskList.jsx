import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";
import { ListTodo, Plus, Filter } from "lucide-react";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;

      // Update task statuses based on current date
      await updateTaskStatuses(data);

      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();

    // Set up real-time subscription
    const subscription = supabase
      .channel("tasks_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          fetchTasks();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchTasks]);

  const updateTaskStatuses = async (tasks) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const task of tasks) {
      if (task.status === "completed") continue;

      const taskDate = new Date(task.scheduled_date);
      const taskDateOnly = new Date(
        taskDate.getFullYear(),
        taskDate.getMonth(),
        taskDate.getDate(),
      );

      let newStatus = task.status;

      // If scheduled time has passed, mark as missed
      if (taskDate < now) {
        newStatus = "missed";
      } else if (taskDateOnly > today) {
        // Tomorrow or later = upcoming
        newStatus = "upcoming";
      } else if (taskDateOnly.getTime() === today.getTime()) {
        // Today (but time hasn't passed) = pending
        newStatus = "pending";
      }

      if (newStatus !== task.status) {
        await supabase
          .from("tasks")
          .update({ status: newStatus })
          .eq("id", task.id);
        task.status = newStatus;
      }
    }
  };

  const filteredTasks = tasks.filter((task) => task.status === activeTab);

  const getTabCount = (status) => {
    return tasks.filter((task) => task.status === status).length;
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const tabs = [
    { id: "upcoming", label: "Upcoming", icon: "📅" },
    { id: "pending", label: "Pending", icon: "⏳" },
    { id: "completed", label: "Completed", icon: "✅" },
    { id: "missed", label: "Missed", icon: "❌" },
  ];

  if (showForm) {
    return (
      <TaskForm
        editTask={editingTask}
        onTaskCreated={() => {
          fetchTasks();
          handleCloseForm();
        }}
        onClose={handleCloseForm}
      />
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
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
            <ListTodo size={24} color="white" />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "700" }}>My Tasks</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={18} />
          New Task
        </button>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            {tab.label}
            <span
              style={{
                marginLeft: "8px",
                padding: "2px 8px",
                background:
                  activeTab === tab.id
                    ? "var(--accent-primary)"
                    : "var(--bg-tertiary)",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              {getTabCount(tab.id)}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div
            style={{
              animation: "pulse 1.5s ease-in-out infinite",
              color: "var(--text-secondary)",
            }}
          >
            Loading tasks...
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "var(--text-secondary)",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "16px",
              opacity: 0.5,
            }}
          >
            {activeTab === "upcoming" && "📅"}
            {activeTab === "pending" && "⏳"}
            {activeTab === "completed" && "✅"}
            {activeTab === "missed" && "❌"}
          </div>
          <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>
            No {activeTab} tasks
          </h3>
          <p style={{ fontSize: "14px" }}>
            {activeTab === "pending" && "Create a task to get started!"}
            {activeTab === "upcoming" &&
              "Schedule tasks for the future to see them here."}
            {activeTab === "completed" && "Complete tasks to see them here."}
            {activeTab === "missed" && "Missed tasks will appear here."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={fetchTasks}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
