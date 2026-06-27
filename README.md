# Life Tracker - Personal Webapp

Your all-in-one personal life management system. Track everything in one place, completely free, stored locally on your computer.

## 🚀 Quick Start

**Your app is now running!**

Open your web browser and go to: **http://127.0.0.1:5000**

Or access from your phone (connected to same WiFi): **http://10.250.92.199:5000**

## 📱 Mobile Access

To use this on your phone:
1. Make sure your phone is connected to the same WiFi network as your computer
2. On your phone's browser, go to: **http://10.250.92.199:5000**
3. Bookmark it for easy access!

## 🎯 Features Included

### Core Modules
- **📔 Journal** - Morning gratitude (7 prompts) + Night reflection
- **✅ Habits** - Daily/specific day tracking with visual grid
- **💪 Gym Log** - 6 workout types, progressive overload tracking, stats
- **💰 Financial** - Income/expense tracking, categories, savings goals
- **💼 Job Applications** - Company/position tracking, status pipeline
- **📝 Todos** - Priority-based tasks, due dates, categories
- **🌅 Routines** - Morning & night routine checklists
- **😴 Sleep** - Auto-calculate hours, quality tracking
- **🕌 Deen** - 5 daily prayers, Quran reading/memorization tracker
- **🌍 Language** - Arabic (64 videos + Bayyinah) & Kazakh tracking
- **🎯 Goals** - Short/medium/long term goal planning
- **📓 Notes** - Personal wiki and note-taking

### Additional Features
- **📅 Calendar** - Month view of all activities
- **📊 Weekly Reviews** - Auto-generated summaries
- **📚 Books** - Reading tracker
- **⏱️ Focus Timer** - Pomodoro sessions
- **😊 Mood** - Daily mood tracking
- **💧 Water** - Hydration logging
- **🎂 Important Dates** - Birthdays, deadlines, events

### Smart Features
- 🔥 **Streak Counters** - Visual motivation
- 📊 **Data Export** - Download your data anytime (JSON)
- 🔍 **Search & Tags** - Find anything quickly
- ➕ **Quick Add Widget** - Floating button for fast logging
- 🌙 **Dark Mode** - Easy on the eyes at night
- 📱 **Mobile Responsive** - Works perfectly on phones

## 💾 Database

All your data is stored in `lifetracker.db` - a single SQLite file on your computer.

**Location:** `c:\Users\WINDOWS\Desktop\rusland\lifetracker.db`

This file contains ALL your data. To backup:
- Simply copy this file to a safe location (USB drive, cloud storage, etc.)
- To restore: replace the file

**You own your data completely. No cloud storage, no monthly fees!**

## 📁 Project Structure

```
rusland/
├── app.py              # Main Flask application
├── database.py         # Database schema and initialization
├── lifetracker.db      # Your data (SQLite database)
├── requirements.txt    # Python dependencies
└── templates/          # HTML pages
    ├── base.html       # Layout template
    ├── dashboard.html  # Home page
    ├── journal.html
    ├── habits.html
    ├── gym.html
    ├── financial.html
    ├── deen.html
    ├── language.html
    └── ... (all other pages)
```

## 🔧 How to Use

### Starting the App

The app is already running! But if you need to restart:

```powershell
cd c:\Users\WINDOWS\Desktop\rusland
py app.py
```

### Stopping the App

Press `Ctrl+C` in the terminal where the app is running.

## 📊 Database Tables

Your database has 40+ tables for complete data tracking:

### Core Data
- `journal_entries` - Morning/night journal entries
- `habits` & `habit_logs` - Habit definitions and daily logs
- `workout_sessions` & `exercises` - Gym tracking
- `transactions` - Financial records
- `job_applications` - Job search tracking
- `todos` - Task management

### Islamic/Deen
- `prayer_logs` - 5 daily prayers
- `quran_reading` - Pages/verses read
- `quran_memorization` - Memorized surahs
- `quran_revision_logs` - Spaced repetition tracking
- `duas` - Personal dua collection

### Language Learning
- `arabic_learning` - 64 videos + Bayyinah programs
- `kazakh_learning` - Book progress tracker
- `kazakh_topics` - 13 topic reference

### Wellness
- `sleep_logs` - Sleep tracking
- `mood_logs` - Mood & energy levels
- `water_logs` - Hydration tracking
- `body_stats` - Weight & measurements

### Knowledge & Planning
- `goals` - Goal tracking
- `notes` - Personal wiki
- `books` - Reading list
- `focus_sessions` - Pomodoro timer logs
- `important_dates` - Events & reminders

### Meta
- `tags` - Global tagging system
- `weekly_reviews` - Auto-generated summaries
- `app_settings` - Configuration

**Everything is linked!** Todos link to jobs, habits link to goals, journal links to mood/sleep, etc.

## 🎨 Customization

### Change Colors
Edit the Tailwind CSS classes in template files.

### Add Features
1. Add database table in `database.py`
2. Add route in `app.py`
3. Create template in `templates/`

### Modify Database
Direct access:
```powershell
py
>>> import sqlite3
>>> conn = sqlite3.connect('lifetracker.db')
>>> # Run SQL queries
```

## 💡 Tips

1. **Bookmark the URL** on your phone for instant access
2. **Daily Routine:** 
   - Morning: Open dashboard → Journal → Prayers → Habits
   - Night: Journal → Sleep log → Reflection
3. **Weekly:** Review page auto-generates stats every Sunday
4. **Backup:** Copy `lifetracker.db` weekly to USB/cloud
5. **Export Data:** Use `/export/<table_name>` to download JSON

## 🔒 Privacy & Security

- **100% Local:** Everything runs on your computer
- **No Internet Required:** Works completely offline (except initial setup)
- **No Accounts:** No login, no passwords, no tracking
- **Your Data:** Stored only on your machine in SQLite file

## 📈 Next Steps

1. ✅ App is running
2. Open http://127.0.0.1:5000 in your browser
3. Start with the Dashboard
4. Add your first journal entry
5. Set up your daily habits
6. Configure your routines
7. Start tracking!

## 🛠️ Tech Stack

- **Backend:** Flask (Python) - Lightweight web framework
- **Database:** SQLite - File-based, zero configuration
- **Frontend:** HTML + Tailwind CSS - Responsive design
- **Charts:** Chart.js - Data visualization
- **No Authentication:** Single-user design

## ❓ Troubleshooting

**App won't start?**
- Make sure Python is installed: `py --version`
- Reinstall dependencies: `py -m pip install -r requirements.txt`

**Can't access from phone?**
- Check WiFi - must be same network
- Try computer's IP instead of hostname
- Check firewall settings

**Database error?**
- Reinitialize: `py database.py`
- Or delete `lifetracker.db` and run again (WARNING: loses all data)

**Port 5000 already in use?**
- Change port in `app.py`: `app.run(port=5001)`

## Deploy On Render (No Local Server Needed)

This project is now set up for Render with persistent storage.

### What was added
- `render.yaml` for one-click Render service setup
- `gunicorn` in `requirements.txt`
- Environment-driven settings for database and uploads:
    - `DATABASE_PATH`
    - `UPLOAD_FOLDER`
    - `SECRET_KEY`

### Deploy steps
1. Push this repository to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Connect your repo and select this project.
4. Render will detect `render.yaml` and create the web service + disk.
5. Click **Apply** / **Create**.
6. Wait for deploy to finish, then open your Render URL.

### Sync across phone and laptop
Once deployed, both devices use the same online backend and database.
- Any update from iPhone appears on desktop
- Any update from desktop appears on iPhone

### iPhone app-like install
1. Open your Render URL in Safari.
2. Tap Share -> Add to Home Screen.
3. Launch from your home screen like an app.

## 📝 Future Enhancements (DIY)

Want to add more features? Here are ideas:

- **Data Visualization:** Add Chart.js graphs to each module
- **Export to CSV:** Add CSV export functionality
- **Import Data:** Build import tools for migration
- **Reminders:** Add email/notification system
- **Mobile App:** Wrap in Cordova/React Native
- **Backup Automation:** Schedule automatic backups
- **Analytics Dashboard:** Advanced stats and insights
- **Year in Pixels:** Visual calendar mood tracker
- **Body Diagram:** Interactive muscle group tracker for gym

## 🎉 You're All Set!

Your personal life tracking system is ready. Open **http://127.0.0.1:5000** and start building better habits!

---

**No costs. No subscriptions. Your data, your rules.**
