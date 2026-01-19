# Email Reminder System Setup Guide

## Overview

This guide will help you set up automated email reminders for your TaskMaster application using Supabase Edge Functions and Resend.

## Prerequisites

- Supabase project (already set up)
- Supabase CLI installed
- Resend account (free tier available)

## Step 1: Install Supabase CLI

```bash
# Install via npm
npm install -g supabase

# Or via Homebrew (Mac)
brew install supabase/tap/supabase

# Or via Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Step 2: Link Your Project

```bash
# Navigate to your project directory
cd c:\Users\souro\Desktop\Task\task-manager

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

## Step 3: Set Up Resend

1. **Sign up at Resend.com**
   - Go to https://resend.com
   - Create a free account (3,000 emails/month free)

2. **Get your API Key**
   - Go to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)

3. **Verify your domain (optional but recommended)**
   - Add your domain in Resend dashboard
   - Add DNS records as instructed
   - Or use Resend's test domain for development

## Step 4: Set Supabase Secrets

```bash
# Set the Resend API key
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Verify secrets are set
supabase secrets list
```

## Step 5: Run Database Migrations

```bash
# Apply the reminder_sent column migration
supabase db push

# Or run SQL directly in Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy content from supabase/migrations/add_reminder_sent_column.sql
# 3. Run the query
```

## Step 6: Deploy the Edge Function

```bash
# Deploy the send-task-reminders function
supabase functions deploy send-task-reminders

# Verify deployment
supabase functions list
```

## Step 7: Set Up Cron Job

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to Database → Extensions
3. Enable `pg_cron` extension
4. Go to SQL Editor
5. Run the content from `supabase/migrations/schedule_reminder_cron.sql`
6. **Important**: Replace `YOUR_PROJECT_REF` and `YOUR_ANON_KEY` with your actual values

### Option B: Using Supabase CLI

```bash
# Get your project ref and anon key from .env file
# Then run the SQL migration
supabase db execute -f supabase/migrations/schedule_reminder_cron.sql
```

## Step 8: Update Email "From" Address

In `supabase/functions/send-task-reminders/index.ts`, update line 82:

```typescript
from: "TaskMaster <reminders@yourdomain.com>", // Change to your verified domain
```

If using Resend's test domain:

```typescript
from: "TaskMaster <onboarding@resend.dev>",
```

## Step 9: Test the Function

### Manual Test

```bash
# Invoke the function manually
supabase functions invoke send-task-reminders
```

### Create a Test Task

1. Log in to your app
2. Create a task scheduled for 1 hour from now
3. Set reminder to 5 minutes
4. Wait 55 minutes (or adjust the task's scheduled_date in database)
5. Check your email inbox

## Step 10: Monitor Logs

```bash
# View function logs
supabase functions logs send-task-reminders

# Or view in Supabase Dashboard:
# Edge Functions → send-task-reminders → Logs
```

## Troubleshooting

### No emails being sent?

1. **Check cron job is running**

   ```sql
   SELECT * FROM cron.job;
   ```

2. **Check function logs**

   ```bash
   supabase functions logs send-task-reminders --tail
   ```

3. **Verify Resend API key**

   ```bash
   supabase secrets list
   ```

4. **Test Resend API directly**
   - Go to Resend dashboard
   - Send a test email

### Emails going to spam?

1. Verify your domain in Resend
2. Add SPF, DKIM records
3. Use a professional "from" address

### Function timing out?

- Increase function timeout in Supabase dashboard
- Optimize query to fetch fewer tasks at once

## Cost Breakdown

- **Resend**: Free tier (3,000 emails/month)
- **Supabase Edge Functions**: Free tier (500K invocations/month)
- **pg_cron**: Included with Supabase
- **Total**: $0 for most users

## Next Steps

1. Monitor email delivery rates
2. Add email templates for different task types
3. Add user preferences for reminder frequency
4. Implement email unsubscribe functionality

## Support

- Supabase Docs: https://supabase.com/docs
- Resend Docs: https://resend.com/docs
- Edge Functions: https://supabase.com/docs/guides/functions
