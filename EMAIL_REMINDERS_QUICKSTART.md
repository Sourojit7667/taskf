# Email Reminders - Quick Start

## 🚀 Quick Setup (5 minutes)

### 1. Get Resend API Key

- Sign up at https://resend.com (free)
- Create API key
- Copy the key (starts with `re_`)

### 2. Install Supabase CLI

```bash
npm install -g supabase
```

### 3. Deploy

```bash
# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set secret
supabase secrets set RESEND_API_KEY=re_your_key_here

# Deploy function
supabase functions deploy send-task-reminders
```

### 4. Run Database Migration

Go to Supabase Dashboard → SQL Editor, run:

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
```

### 5. Schedule Cron Job

In SQL Editor, run (replace YOUR_PROJECT_REF and YOUR_ANON_KEY):

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'send-task-reminders-job',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-task-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

### 6. Update Email Address

Edit `supabase/functions/send-task-reminders/index.ts` line 82:

```typescript
from: "TaskMaster <onboarding@resend.dev>", // Use Resend test domain
// OR
from: "TaskMaster <reminders@yourdomain.com>", // Use your verified domain
```

## ✅ Test It

1. Create a task with a 5-minute reminder
2. Wait 5 minutes
3. Check your email!

## 📊 Monitor

```bash
# View logs
supabase functions logs send-task-reminders --tail
```

## 💰 Cost

- **FREE** for up to 3,000 emails/month
- **FREE** for up to 500K function calls/month

## 🆘 Troubleshooting

**No emails?**

- Check `supabase secrets list`
- View logs: `supabase functions logs send-task-reminders`
- Verify cron job: `SELECT * FROM cron.job;` in SQL Editor

**Emails in spam?**

- Verify your domain in Resend
- Use Resend's test domain for development

## 📚 Full Guide

See `EMAIL_REMINDER_SETUP.md` for detailed instructions.
