# TaskMaster - Intelligent Task Management App

A modern, feature-rich task management application built with React and Supabase.

## Features

✅ **Smart Task Management**

- Create, edit, and delete tasks
- Schedule tasks with date and time
- Configurable reminder notifications
- Automatic status transitions (Upcoming → Pending → Completed/Missed)

📊 **Analytics Dashboard**

- Track completion rates
- Weekly performance charts
- Task distribution visualization
- Intelligent insights and recommendations

🔔 **Email Reminders** (via Supabase)

- Customizable reminder times (15 min to 2 days before)
- Free email notifications through Supabase

💬 **User Engagement**

- Feedback system (appears after 5-6 days)
- Contact/support form
- User activity tracking

🎨 **Modern UI/UX**

- Dark mode with glassmorphic design
- Responsive layout (mobile, tablet, desktop)
- Smooth animations and transitions
- Beautiful charts and visualizations

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: Vanilla CSS with modern design system
- **Charts**: Recharts
- **Date Handling**: date-fns, react-datepicker
- **Notifications**: react-hot-toast
- **Icons**: lucide-react

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account (free tier works great!)

### Installation

1. **Clone and install dependencies**

   ```bash
   cd task-manager
   npm install
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Create a `.env` file in the project root:
     ```
     VITE_SUPABASE_URL=your-project-url
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Set up the database**
   - Follow the instructions in `SUPABASE_SETUP.md`
   - Run the SQL commands in your Supabase SQL Editor

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Sign up for an account and start managing tasks!

## Project Structure

```
task-manager/
├── src/
│   ├── components/
│   │   ├── Auth.jsx           # Authentication UI
│   │   ├── TaskForm.jsx       # Task creation/editing
│   │   ├── TaskCard.jsx       # Individual task display
│   │   ├── TaskList.jsx       # Task list with filtering
│   │   ├── Analytics.jsx      # Analytics dashboard
│   │   ├── Contact.jsx        # Support contact form
│   │   └── FeedbackPopup.jsx  # User feedback modal
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   ├── index.css              # Global styles
│   └── supabaseClient.js      # Supabase configuration
├── .env                       # Environment variables
├── SUPABASE_SETUP.md         # Database setup guide
└── package.json
```

## Usage

### Creating Tasks

1. Click "New Task" button
2. Enter task details (title, description, date/time)
3. Set reminder time (when to be notified before the task)
4. Click "Create Task"

### Task Statuses

- **Upcoming**: Tasks scheduled for tomorrow or later
- **Pending**: Tasks scheduled for today
- **Completed**: Tasks you've marked as done
- **Missed**: Overdue tasks not completed

### Analytics

View your productivity metrics:

- Overall completion rate
- Weekly performance charts
- Task distribution
- Personalized insights

### Feedback

After using the app for 5-6 days, you'll be prompted to provide feedback. You can:

- Rate your experience (1-5 stars)
- Share comments and suggestions
- Choose "Don't show again" to dismiss permanently

## Building for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` folder.

## Deployment

You can deploy to:

- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop the `dist` folder
- **Supabase Hosting**: Follow Supabase hosting docs

Make sure to set environment variables in your hosting platform.

## Future Enhancements

- [ ] Automated email reminders via Supabase Edge Functions
- [ ] Task categories and tags
- [ ] Recurring tasks
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] Calendar integration

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

If you encounter any issues or have questions:

- Use the in-app Contact form
- Check the `SUPABASE_SETUP.md` for database setup help

---

Built with ❤️ using React and Supabase
