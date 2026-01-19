# Go Backend for Task Manager with Email Reminders

## Overview

This Go backend provides:
- REST API for task management (CRUD operations)
- Background email reminder service using Resend API
- Automatic task status updates (missed tasks detection)
- Analytics endpoint

## Setup

1. **Install Go** (if not already installed)
   - Download from https://go.dev/dl/
   - Version 1.21 or higher

2. **Install Dependencies**

   ```bash
   cd backend
   go mod download
   ```

3. **Set Environment Variables**

   Create a `.env` file in the project root directory:

   ```env
   # Database
   DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

   # Resend API for email reminders
   RESEND_API_KEY=re_your_api_key_here

   # App URL (for email links)
   APP_URL=http://localhost:5173

   # Email sender (optional, defaults to onboarding@resend.dev for testing)
   FROM_EMAIL=TaskMaster <reminders@yourdomain.com>

   # Server port (optional, defaults to 8080)
   PORT=8080
   ```

4. **Run the Service**
   ```bash
   cd backend
   go run .
   ```

## Email Reminder System

### How It Works

1. **Background Service**: Runs every minute to check for tasks needing reminders
2. **Smart Scheduling**: Sends reminders based on `reminder_minutes_before` set by user
3. **Duplicate Prevention**: Uses `reminder_sent` flag to avoid sending multiple emails
4. **Auto-reset**: Reminder flag resets when a task is rescheduled

### Reminder Logic

- A reminder is sent when: `(scheduled_date - reminder_minutes_before) <= current_time`
- Only sends if: task is not completed/missed AND scheduled_date is in the future
- Email includes: task title, description, scheduled time, and time remaining

### Testing Reminders

1. Create a task with a `scheduled_date` a few minutes in the future
2. Set `reminder_minutes_before` to match (e.g., 5 minutes before)
3. Watch the backend logs to see reminders being sent

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?user_id=xxx` | Get all tasks for a user |
| POST | `/api/tasks` | Create a new task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id?user_id=xxx` | Delete a task |
| GET | `/api/analytics?user_id=xxx` | Get task statistics |
| POST | `/api/feedback` | Submit user feedback |

## Production Deployment

### Option 1: Run as a Service (Linux)

Create `/etc/systemd/system/task-reminders.service`:

```ini
[Unit]
Description=TaskMaster Email Reminder Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/backend
ExecStart=/usr/local/go/bin/go run .
Restart=always
Environment="RESEND_API_KEY=your_key"
Environment="DATABASE_URL=your_db_url"
Environment="APP_URL=https://yourdomain.com"

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl enable task-reminders
sudo systemctl start task-reminders
sudo systemctl status task-reminders
```

### Option 2: Build and Run

```bash
# Build
go build -o task-reminder-service

# Run
./task-reminder-service
```

### Option 3: Docker

Create `Dockerfile`:

```dockerfile
FROM golang:1.21-alpine
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o task-reminder-service
CMD ["./task-reminder-service"]
```

Build and run:

```bash
docker build -t task-reminders .
docker run -d --env-file ../.env task-reminders
```

## Logs

The service logs to stdout. View logs:

```bash
# If running directly
go run . 2>&1 | tee reminder.log

# If using systemd
sudo journalctl -u task-reminders -f
```

## Testing

Create a test task with a 5-minute reminder and run:

```bash
go run .
```

Check the logs to see if the reminder was sent.
