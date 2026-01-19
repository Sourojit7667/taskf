# Supabase Database Setup

Follow these steps to set up your Supabase database for TaskMaster.

## Step 1: Create Tables

Go to your Supabase project dashboard → SQL Editor and run the following SQL commands:

### 1. Tasks Table

```sql
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  reminder_minutes_before INTEGER DEFAULT 60,
  status TEXT DEFAULT 'pending' CHECK (status IN ('upcoming', 'pending', 'completed', 'missed')),
  completed_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX idx_tasks_status ON tasks(status);
```

### 2. User Activity Table

```sql
CREATE TABLE user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_login TIMESTAMPTZ DEFAULT NOW(),
  last_feedback_request TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own activity"
  ON user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
  ON user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity"
  ON user_activity FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
```

### 3. Feedback Table

```sql
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
```

### 4. Contact Messages Table

```sql
CREATE TABLE contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own messages"
  ON contact_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages"
  ON contact_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_contact_messages_user_id ON contact_messages(user_id);
```

## Step 2: Enable Email Authentication

1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates (optional)

## Step 3: Configure Email Settings (Optional)

For production use with custom email domain:

1. Go to Project Settings → Auth
2. Configure SMTP settings with your email provider
3. Update email templates

## Step 4: Test the Setup

1. Run the React app: `npm run dev`
2. Sign up with a test account
3. Verify email confirmation works
4. Create a test task

## Notes

- **Row Level Security (RLS)** is enabled on all tables to ensure users can only access their own data
- **Indexes** are created for better query performance
- **Foreign keys** ensure data integrity
- All timestamps use `TIMESTAMPTZ` for timezone awareness

## Email Reminders (Advanced - Optional)

To enable automated email reminders, you'll need to set up Supabase Edge Functions. This requires:

1. Installing Supabase CLI
2. Creating Edge Functions for:
   - Sending reminder emails
   - Updating task statuses daily
3. Setting up cron jobs

For now, the app works fully without Edge Functions. Users can manually check their tasks, and the app will automatically update statuses when they log in.
