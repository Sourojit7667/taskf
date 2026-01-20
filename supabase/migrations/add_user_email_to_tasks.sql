-- Add email column to tasks table to store user email for reminders
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Update existing tasks with user emails from auth.users
UPDATE tasks t
SET user_email = au.email
FROM auth.users au
WHERE t.user_id = au.id AND t.user_email IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_user_email ON tasks(user_email);
