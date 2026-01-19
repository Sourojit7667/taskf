package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// Load environment variables - try multiple locations
	if err := godotenv.Load(); err != nil {
		if err := godotenv.Load("../.env"); err != nil {
			log.Println("No .env file found, using system environment variables")
		}
	}

	// Database connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Connected to database successfully")

	// Initialize handlers
	taskHandler := &TaskHandler{DB: db}

	// Start background services
	go startReminderService(db)
	go startStatusUpdateService(db)

	// Set up Gin
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// Configure CORS - Allow frontend URLs
	allowedOrigins := []string{
		"http://localhost:5173",
		"http://localhost:3000",
	}
	
	// Add production frontend URL from environment
	if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
		allowedOrigins = append(allowedOrigins, frontendURL)
	}
	
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API Routes
	api := r.Group("/api")
	{
		tasks := api.Group("/tasks")
		{
			tasks.GET("", taskHandler.GetTasks)
			tasks.POST("", taskHandler.CreateTask)
			tasks.PATCH("/:id", taskHandler.UpdateTask)
			tasks.DELETE("/:id", taskHandler.DeleteTask)
		}

		api.GET("/analytics", taskHandler.GetAnalytics)
		api.POST("/feedback", taskHandler.SubmitFeedback)
		api.POST("/contact", taskHandler.SubmitContact)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func startReminderService(db *sql.DB) {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	log.Println("Starting background reminder service...")

	// Run once immediately
	checkAndSendReminders(db)

	for range ticker.C {
		checkAndSendReminders(db)
	}
}

func startStatusUpdateService(db *sql.DB) {
	ticker := time.NewTicker(1 * time.Minute) // Check every minute for missed tasks
	defer ticker.Stop()

	log.Println("Starting background status update service...")

	updateAllMissedTasks(db)

	for range ticker.C {
		updateAllMissedTasks(db)
	}
}

func updateAllMissedTasks(db *sql.DB) {
	// Mark tasks as missed if their scheduled time has passed
	query := `UPDATE tasks SET status = 'missed' 
	          WHERE status IN ('pending', 'upcoming') 
	          AND scheduled_date < NOW()`
	result, err := db.Exec(query)
	if err != nil {
		log.Printf("Failed to update missed tasks: %v", err)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected > 0 {
		log.Printf("Automatically marked %d task(s) as missed", rowsAffected)
	}
}

func checkAndSendReminders(db *sql.DB) {
	now := time.Now().UTC()

	query := `
		SELECT t.id, t.title, t.description, t.scheduled_date, 
		       t.reminder_minutes_before, t.user_id
		FROM tasks t
		WHERE t.reminder_sent = false
		  AND t.status NOT IN ('completed', 'missed')
		  AND t.scheduled_date > NOW()
		  AND (t.scheduled_date - (t.reminder_minutes_before * interval '1 minute')) <= NOW()
	`

	rows, err := db.Query(query)
	if err != nil {
		log.Printf("Failed to query tasks for reminders: %v", err)
		return
	}
	defer rows.Close()

	type TaskReminder struct {
		Task
		Email string
	}

	var tasksToRemind []TaskReminder

	for rows.Next() {
		var task Task
		var description sql.NullString

		err := rows.Scan(
			&task.ID,
			&task.Title,
			&description,
			&task.ScheduledDate,
			&task.ReminderMinutesBefore,
			&task.UserID,
		)
		if err != nil {
			log.Printf("Failed to scan task row: %v", err)
			continue
		}

		if description.Valid {
			task.Description = description.String
		}

		tasksToRemind = append(tasksToRemind, TaskReminder{Task: task})
	}

	if len(tasksToRemind) == 0 {
		return
	}

	log.Printf("Found %d task(s) that need reminders at %s", len(tasksToRemind), now.Format(time.RFC3339))

	// Get user emails from Supabase auth.users table
	for i, item := range tasksToRemind {
		email, err := getUserEmail(db, item.UserID)
		if err != nil {
			log.Printf("Failed to get email for user %s: %v", item.UserID, err)
			continue
		}
		tasksToRemind[i].Email = email
	}

	// Send reminders
	for _, item := range tasksToRemind {
		if item.Email == "" {
			log.Printf("Skipping task %s - no email found for user %s", item.Task.ID, item.UserID)
			continue
		}

		if err := SendTaskReminderEmail(item.Task, item.Email); err != nil {
			log.Printf("Failed to send reminder for task %s: %v", item.Task.ID, err)
			continue
		}

		// Mark reminder as sent
		_, err := db.Exec(
			"UPDATE tasks SET reminder_sent = true, updated_at = NOW() WHERE id = $1",
			item.Task.ID,
		)
		if err != nil {
			log.Printf("Failed to update reminder_sent for task %s: %v", item.Task.ID, err)
		} else {
			log.Printf("Successfully sent reminder for task '%s' to %s", item.Task.Title, item.Email)
		}
	}
}

// getUserEmail retrieves user email from Supabase auth.users table
func getUserEmail(db *sql.DB, userID string) (string, error) {
	var email string

	query := `SELECT email FROM auth.users WHERE id = $1`
	err := db.QueryRow(query, userID).Scan(&email)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("user not found: %s", userID)
		}
		return "", fmt.Errorf("failed to query user email: %w", err)
	}

	return email, nil
}
