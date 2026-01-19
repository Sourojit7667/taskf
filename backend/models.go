package main

import (
	"time"
)

// Task represents a task from the database
type Task struct {
	ID                    string     `json:"id"`
	UserID                string     `json:"user_id"`
	Title                 string     `json:"title"`
	Description           string     `json:"description"`
	ScheduledDate         time.Time  `json:"scheduled_date"`
	ReminderMinutesBefore int        `json:"reminder_minutes_before"`
	Status                string     `json:"status"` // 'upcoming', 'pending', 'completed', 'missed'
	CompletedAt           *time.Time `json:"completed_at,omitempty"`
	ReminderSent          bool       `json:"reminder_sent" db:"reminder_sent"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
}

// UserActivity tracks user engagement
type UserActivity struct {
	ID                  string     `json:"id"`
	UserID              string     `json:"user_id"`
	FirstLogin          time.Time  `json:"first_login"`
	LastFeedbackRequest *time.Time `json:"last_feedback_request"`
	CreatedAt           time.Time  `json:"created_at"`
}

// Feedback represents user feedback
type Feedback struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Rating    int       `json:"rating" binding:"required,min=1,max=5"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

// ContactMessage represents a message from the contact form
type ContactMessage struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	UserEmail string    `json:"user_email" binding:"required,email"`
	Subject   string    `json:"subject" binding:"required"`
	Message   string    `json:"message" binding:"required"`
	CreatedAt time.Time `json:"created_at"`
}

// Analytics represents dashboard statistics
type Analytics struct {
	TotalTasks     int            `json:"total_tasks"`
	CompletedTasks int            `json:"completed_tasks"`
	PendingTasks   int            `json:"pending_tasks"`
	MissedTasks    int            `json:"missed_tasks"`
	StatusCounts   map[string]int `json:"status_counts"`
}
