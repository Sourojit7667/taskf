package main

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// TaskHandler handles HTTP requests for tasks
type TaskHandler struct {
	DB *sql.DB
}

// GetTasks retrieves all tasks for a user
func (h *TaskHandler) GetTasks(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	// Auto-update missed tasks before fetching
	h.autoUpdateMissedTasks(userID)

	query := `SELECT id, user_id, title, description, scheduled_date, reminder_minutes_before, status, completed_at, reminder_sent, created_at, updated_at 
	          FROM tasks WHERE user_id = $1 ORDER BY scheduled_date ASC`
	rows, err := h.DB.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var tasks []Task
	for rows.Next() {
		var t Task
		var description sql.NullString
		var completedAt sql.NullTime

		err := rows.Scan(&t.ID, &t.UserID, &t.Title, &description, &t.ScheduledDate, &t.ReminderMinutesBefore, &t.Status, &completedAt, &t.ReminderSent, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if description.Valid {
			t.Description = description.String
		}
		if completedAt.Valid {
			t.CompletedAt = &completedAt.Time
		}
		tasks = append(tasks, t)
	}

	c.JSON(http.StatusOK, tasks)
}

// CreateTask creates a new task
func (h *TaskHandler) CreateTask(c *gin.Context) {
	var t Task
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set initial status based on scheduled date/time
	if t.Status == "" {
		now := time.Now()

		// If scheduled time has passed, it's missed
		if t.ScheduledDate.Before(now) {
			t.Status = "missed"
		} else {
			// Check if task is today or future
			today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
			taskDate := time.Date(t.ScheduledDate.Year(), t.ScheduledDate.Month(), t.ScheduledDate.Day(), 0, 0, 0, 0, t.ScheduledDate.Location())

			if taskDate.Equal(today) {
				// Today (time hasn't passed) = pending
				t.Status = "pending"
			} else {
				// Tomorrow or later = upcoming
				t.Status = "upcoming"
			}
		}
	}

	// Initialize reminder_sent to false for new tasks
	t.ReminderSent = false

	query := `INSERT INTO tasks (user_id, title, description, scheduled_date, reminder_minutes_before, status, reminder_sent) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at, updated_at`
	err := h.DB.QueryRow(query, t.UserID, t.Title, t.Description, t.ScheduledDate, t.ReminderMinutesBefore, t.Status, t.ReminderSent).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, t)
}

// UpdateTask updates an existing task
func (h *TaskHandler) UpdateTask(c *gin.Context) {
	id := c.Param("id")
	var t Task
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// First, get the existing task to check if scheduled_date changed
	var existingScheduledDate time.Time
	err := h.DB.QueryRow("SELECT scheduled_date FROM tasks WHERE id = $1 AND user_id = $2", id, t.UserID).Scan(&existingScheduledDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Task not found"})
		return
	}

	// Reset reminder_sent if scheduled_date changed (task was rescheduled)
	reminderSent := false
	if !existingScheduledDate.Equal(t.ScheduledDate) {
		reminderSent = false // Reset reminder when task is rescheduled
	}

	query := `UPDATE tasks SET title = $1, description = $2, scheduled_date = $3, reminder_minutes_before = $4, status = $5, completed_at = $6, reminder_sent = $7, updated_at = NOW() 
	          WHERE id = $8 AND user_id = $9`

	var completedAt interface{}
	if t.Status == "completed" {
		now := time.Now()
		completedAt = now
		t.CompletedAt = &now
		reminderSent = true // No need to send reminder for completed tasks
	} else {
		completedAt = nil
		t.CompletedAt = nil
	}

	_, err = h.DB.Exec(query, t.Title, t.Description, t.ScheduledDate, t.ReminderMinutesBefore, t.Status, completedAt, reminderSent, id, t.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	t.ReminderSent = reminderSent
	c.JSON(http.StatusOK, t)
}

// DeleteTask removes a task
func (h *TaskHandler) DeleteTask(c *gin.Context) {
	id := c.Param("id")
	userID := c.Query("user_id")

	_, err := h.DB.Exec("DELETE FROM tasks WHERE id = $1 AND user_id = $2", id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted"})
}

// GetAnalytics calculates task statistics
func (h *TaskHandler) GetAnalytics(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	var stats Analytics
	stats.StatusCounts = make(map[string]int)

	query := `SELECT status, COUNT(*) FROM tasks WHERE user_id = $1 GROUP BY status`
	rows, err := h.DB.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			continue
		}
		stats.StatusCounts[status] = count
		stats.TotalTasks += count

		switch status {
		case "completed":
			stats.CompletedTasks = count
		case "pending", "upcoming":
			stats.PendingTasks += count
		case "missed":
			stats.MissedTasks = count
		}
	}

	c.JSON(http.StatusOK, stats)
}

// SubmitFeedback handles user feedback
func (h *TaskHandler) SubmitFeedback(c *gin.Context) {
	var f Feedback
	if err := c.ShouldBindJSON(&f); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `INSERT INTO feedback (user_id, rating, message) VALUES ($1, $2, $3) RETURNING id, created_at`
	err := h.DB.QueryRow(query, f.UserID, f.Rating, f.Message).Scan(&f.ID, &f.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, f)
}

// SubmitContact handles contact form submissions and sends email to admin
func (h *TaskHandler) SubmitContact(c *gin.Context) {
	var contact ContactMessage
	if err := c.ShouldBindJSON(&contact); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Save to database
	query := `INSERT INTO contact_messages (user_id, user_email, subject, message) VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	err := h.DB.QueryRow(query, contact.UserID, contact.UserEmail, contact.Subject, contact.Message).Scan(&contact.ID, &contact.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Send email notification to admin
	go SendContactNotificationEmail(contact)

	c.JSON(http.StatusCreated, contact)
}

// autoUpdateMissedTasks marks overdue tasks as 'missed'
func (h *TaskHandler) autoUpdateMissedTasks(userID string) {
	query := `UPDATE tasks SET status = 'missed' 
	          WHERE user_id = $1 
	          AND status IN ('pending', 'upcoming') 
	          AND scheduled_date < NOW()`
	_, err := h.DB.Exec(query, userID)
	if err != nil {
		// Log the error but don't fail the request
		println("Error auto-updating missed tasks:", err.Error())
	}
}
