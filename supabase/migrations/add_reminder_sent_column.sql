-- Add reminder_sent column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_sent ON tasks(reminder_sent) WHERE reminder_sent = FALSE;

-- Add comment
COMMENT ON COLUMN tasks.reminder_sent IS 'Tracks whether a reminder email has been sent for this task';
