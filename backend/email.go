package main

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"os"
	"time"

	"github.com/resend/resend-go/v2"
)

// EmailTemplate holds the data for email rendering
type EmailTemplate struct {
	TaskTitle       string
	TaskDescription string
	ScheduledDate   string
	ReminderTime    string
	AppURL          string
}

// SendTaskReminderEmail sends a reminder email for a task using Resend SDK
func SendTaskReminderEmail(task Task, userEmail string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("RESEND_API_KEY environment variable not set")
	}

	fromEmail := os.Getenv("FROM_EMAIL")
	if fromEmail == "" {
		fromEmail = "TaskMaster <onboarding@resend.dev>" // Default for testing
	}

	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:5173" // Default for development
	}

	// Format the scheduled date in user-friendly format
	formattedDate := task.ScheduledDate.Format("Monday, January 2, 2006 at 3:04 PM")

	// Calculate time until task is due
	timeUntilDue := time.Until(task.ScheduledDate)
	reminderTimeStr := formatDuration(timeUntilDue)

	// Render email HTML
	emailHTML, err := renderEmailTemplate(EmailTemplate{
		TaskTitle:       task.Title,
		TaskDescription: task.Description,
		ScheduledDate:   formattedDate,
		ReminderTime:    reminderTimeStr,
		AppURL:          appURL,
	})
	if err != nil {
		return fmt.Errorf("failed to render email template: %w", err)
	}

	// Create Resend client
	client := resend.NewClient(apiKey)

	// Send email
	params := &resend.SendEmailRequest{
		From:    fromEmail,
		To:      []string{userEmail},
		Subject: fmt.Sprintf("⏰ Reminder: %s", task.Title),
		Html:    emailHTML,
	}

	sent, err := client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("failed to send email via Resend: %w", err)
	}

	log.Printf("Successfully sent reminder email (ID: %s) for task '%s' to %s", sent.Id, task.Title, userEmail)
	return nil
}

// formatDuration formats a duration into a human-readable string
func formatDuration(d time.Duration) string {
	if d < 0 {
		return "now"
	}

	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60

	if hours > 0 {
		if minutes > 0 {
			return fmt.Sprintf("%d hour(s) and %d minute(s)", hours, minutes)
		}
		return fmt.Sprintf("%d hour(s)", hours)
	}
	return fmt.Sprintf("%d minute(s)", minutes)
}

// renderEmailTemplate renders the HTML email template
func renderEmailTemplate(data EmailTemplate) (string, error) {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0f; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a24 0%, #13131a 100%); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                                ⏰ Task Reminder
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 32px;">
                            <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #ffffff;">
                                {{.TaskTitle}}
                            </h2>
                            
                            {{if .TaskDescription}}
                            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                                {{.TaskDescription}}
                            </p>
                            {{end}}
                            
                            <div style="background: rgba(99, 102, 241, 0.1); border-left: 4px solid #6366f1; padding: 16px; border-radius: 8px; margin: 24px 0;">
                                <p style="margin: 0; font-size: 14px; color: #a1a1aa;">
                                    <strong style="color: #ffffff;">Scheduled for:</strong><br>
                                    {{.ScheduledDate}}
                                </p>
                                <p style="margin: 12px 0 0 0; font-size: 14px; color: #a1a1aa;">
                                    <strong style="color: #ffffff;">Time remaining:</strong><br>
                                    {{.ReminderTime}}
                                </p>
                            </div>
                            
                            <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a;">
                                This is a friendly reminder about your upcoming task. Make sure you're prepared!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 32px 40px 32px; text-align: center;">
                            <a href="{{.AppURL}}" 
                               style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);">
                                View Task in TaskMaster
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #71717a;">
                                You're receiving this because you set a reminder for this task.<br>
                                <strong style="color: #a1a1aa;">TaskMaster</strong> - Your intelligent task management companion
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`

	t, err := template.New("email").Parse(tmpl)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

// SendContactNotificationEmail sends contact form submission to admin
func SendContactNotificationEmail(contact ContactMessage) {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		log.Println("RESEND_API_KEY not set, skipping contact notification email")
		return
	}

	adminEmail := os.Getenv("ADMIN_EMAIL")
	if adminEmail == "" {
		log.Println("ADMIN_EMAIL not set, skipping contact notification email")
		return
	}

	fromEmail := os.Getenv("FROM_EMAIL")
	if fromEmail == "" {
		fromEmail = "TaskMaster <onboarding@resend.dev>"
	}

	// Create Resend client
	client := resend.NewClient(apiKey)

	emailHTML := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; background-color: #0a0a0f; color: #ffffff; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #1a1a24; border-radius: 12px; padding: 32px; border: 1px solid rgba(255,255,255,0.1);">
        <h1 style="color: #6366f1; margin-bottom: 24px;">📬 New Contact Message</h1>
        
        <div style="margin-bottom: 20px;">
            <strong style="color: #a1a1aa;">From:</strong>
            <p style="margin: 8px 0; color: #ffffff;">%s</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <strong style="color: #a1a1aa;">Subject:</strong>
            <p style="margin: 8px 0; color: #ffffff;">%s</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <strong style="color: #a1a1aa;">Message:</strong>
            <div style="margin: 8px 0; padding: 16px; background: rgba(99, 102, 241, 0.1); border-radius: 8px; color: #ffffff; white-space: pre-wrap;">%s</div>
        </div>
        
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;">
        
        <p style="color: #71717a; font-size: 12px;">
            This message was sent via the TaskMaster contact form.
        </p>
    </div>
</body>
</html>
`, contact.UserEmail, contact.Subject, contact.Message)

	params := &resend.SendEmailRequest{
		From:    fromEmail,
		To:      []string{adminEmail},
		Subject: fmt.Sprintf("📬 TaskMaster Contact: %s", contact.Subject),
		Html:    emailHTML,
		ReplyTo: contact.UserEmail,
	}

	_, err := client.Emails.Send(params)
	if err != nil {
		log.Printf("Failed to send contact notification email: %v", err)
		return
	}

	log.Printf("Contact notification sent to %s from %s", adminEmail, contact.UserEmail)
}
