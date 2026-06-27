from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, send_from_directory
from database import get_db, init_db, get_database_path
from datetime import datetime, date, timedelta
from werkzeug.utils import secure_filename
import json, os, math
from collections import defaultdict
from urllib.request import urlopen
from urllib.parse import urlencode

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', os.urandom(24).hex())
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', os.path.join(os.path.dirname(__file__), 'static', 'uploads'))
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

_PRAYER_CACHE = {}

GYM_PROGRESS_TABLES = [
    'user_profile',
    'workout_types',
    'exercises',
    'workout_stretches',
    'workout_sessions',
    'workout_exercise_logs',
    'session_stretch_logs',
    'exercise_strength_benchmarks',
    'body_stats',
    'daily_steps',
]

GYM_RESTORE_DELETE_ORDER = [
    'session_stretch_logs',
    'workout_exercise_logs',
    'exercise_strength_benchmarks',
    'workout_stretches',
    'exercises',
    'workout_sessions',
    'workout_types',
    'body_stats',
    'daily_steps',
    'user_profile',
]

init_db()

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_settings():
    conn = get_db()
    rows = conn.execute('SELECT setting_key, setting_value FROM app_settings').fetchall()
    conn.close()
    return {r['setting_key']: r['setting_value'] for r in rows}


def table_exists(conn, table_name):
    row = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
        (table_name,),
    ).fetchone()
    return bool(row)


def get_table_columns(conn, table_name):
    return [row['name'] for row in conn.execute(f'PRAGMA table_info({table_name})').fetchall()]


def dump_tables(conn, table_names):
    payload = {}
    for table in table_names:
        if not table_exists(conn, table):
            continue
        payload[table] = [dict(row) for row in conn.execute(f'SELECT * FROM {table}').fetchall()]
    return payload


def restore_table_rows(conn, table_name, rows):
    if not table_exists(conn, table_name):
        return
    valid_columns = get_table_columns(conn, table_name)
    if not valid_columns:
        return
    for row in rows:
        row_dict = dict(row)
        insert_cols = [col for col in valid_columns if col in row_dict]
        if not insert_cols:
            continue
        placeholders = ','.join(['?'] * len(insert_cols))
        conn.execute(
            f"INSERT INTO {table_name} ({','.join(insert_cols)}) VALUES ({placeholders})",
            tuple(row_dict.get(col) for col in insert_cols),
        )


def ensure_todos_parent_column(conn):
    cols = {row['name'] for row in conn.execute('PRAGMA table_info(todos)').fetchall()}
    if 'parent_todo_id' not in cols:
        conn.execute('ALTER TABLE todos ADD COLUMN parent_todo_id INTEGER')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_todos_parent_todo_id ON todos(parent_todo_id)')
        conn.commit()

def setting_is_true(settings, key, default='false'):
    return str(settings.get(key, default)).lower() == 'true'

def parse_hhmm(value):
    if not value:
        return 0, 0
    clean = str(value).strip().split(' ')[0]
    hh, mm = clean.split(':')[:2]
    return int(hh), int(mm)

def combine_date_and_time(day_obj, hhmm):
    hh, mm = parse_hhmm(hhmm)
    return datetime(day_obj.year, day_obj.month, day_obj.day, hh, mm)

def format_hhmm(dt_obj):
    return dt_obj.strftime('%H:%M') if dt_obj else '--:--'

def fetch_prayer_timings(day_obj, latitude, longitude, method=2):
    cache_key = (day_obj.isoformat(), latitude, longitude, method)
    cached = _PRAYER_CACHE.get(cache_key)
    if cached:
        return cached
    params = urlencode({
        'latitude': latitude,
        'longitude': longitude,
        'method': method,
    })
    url = f"https://api.aladhan.com/v1/timings/{day_obj.isoformat()}?{params}"
    with urlopen(url, timeout=5) as response:
        payload = json.loads(response.read().decode('utf-8'))
    timings = payload.get('data', {}).get('timings', {})
    result = {
        'Fajr': timings.get('Fajr'),
        'Dhuhr': timings.get('Dhuhr'),
        'Asr': timings.get('Asr'),
        'Maghrib': timings.get('Maghrib'),
        'Isha': timings.get('Isha'),
    }
    _PRAYER_CACHE[cache_key] = result
    return result

def build_deen_prayer_times(day_obj, latitude, longitude):
    # Deen page uses a dedicated practical setup:
    # - Fajr from the ISNA-style 15 degree method
    # - Dhuhr/Asr/Maghrib from Umm al-Qura base timings
    # - Isha fixed at 90 minutes after Maghrib
    fajr_source = fetch_prayer_timings(day_obj, latitude, longitude, method=2)
    umm_al_qura_source = fetch_prayer_timings(day_obj, latitude, longitude, method=4)

    maghrib_value = umm_al_qura_source.get('Maghrib')
    isha_value = '--:--'
    if maghrib_value:
        isha_value = format_hhmm(combine_date_and_time(day_obj, maghrib_value) + timedelta(minutes=90))

    return {
        'fajr': fajr_source.get('Fajr') or '--:--',
        'dhuhr': umm_al_qura_source.get('Dhuhr') or '--:--',
        'asr': umm_al_qura_source.get('Asr') or '--:--',
        'maghrib': maghrib_value or '--:--',
        'isha': isha_value,
    }

def build_notifications_context(settings):
    notifications = []
    now = datetime.now()
    enabled = setting_is_true(settings, 'notif_enabled', 'true')
    if not enabled:
        return {
            'notifications_enabled': False,
            'notifications_items': [],
            'notifications_unread_count': 0,
            'notifications_settings': settings,
        }

    conn = get_db()

    # Water reminders every scheduled slot, upcoming over next 24h.
    if setting_is_true(settings, 'notif_water_hourly', 'true'):
        today = date.today().isoformat()
        water_rows = conn.execute(
            'SELECT hour_label, target_ml, completed FROM water_hourly WHERE log_date=? ORDER BY slot_index, hour_label',
            (today,)
        ).fetchall()
        for row in water_rows:
            if row['completed']:
                continue
            slot_dt = combine_date_and_time(date.today(), row['hour_label'])
            if slot_dt < now - timedelta(minutes=5):
                continue
            if slot_dt > now + timedelta(hours=24):
                continue
            notifications.append({
                'type': 'water',
                'title': 'Water reminder',
                'message': f"Drink {row['target_ml']}ml ({row['hour_label']})",
                'at': slot_dt,
                'link': '/water'
            })

    # Prayer reminders from location-based prayer API.
    latitude = settings.get('notif_latitude', '').strip()
    longitude = settings.get('notif_longitude', '').strip()
    if latitude and longitude and (
        setting_is_true(settings, 'notif_prayer_before_start', 'true')
        or setting_is_true(settings, 'notif_prayer_before_end', 'true')
    ):
        try:
            method = int(settings.get('notif_prayer_method', '4') or '4')
            todays = fetch_prayer_timings(date.today(), latitude, longitude, method)
            tomorrow = fetch_prayer_timings(date.today() + timedelta(days=1), latitude, longitude, method)
            prayer_order = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
            prayer_starts = {name: combine_date_and_time(date.today(), todays[name]) for name in prayer_order}
            prayer_ends = {
                'Fajr': prayer_starts['Dhuhr'],
                'Dhuhr': prayer_starts['Asr'],
                'Asr': prayer_starts['Maghrib'],
                'Maghrib': prayer_starts['Isha'],
                'Isha': combine_date_and_time(date.today() + timedelta(days=1), tomorrow['Fajr'])
            }
            prayer_log = conn.execute('SELECT * FROM prayer_logs WHERE prayer_date=?', (date.today().isoformat(),)).fetchone()
            completed_map = {
                'Fajr': bool(prayer_log['fajr']) if prayer_log else False,
                'Dhuhr': bool(prayer_log['dhuhr']) if prayer_log else False,
                'Asr': bool(prayer_log['asr']) if prayer_log else False,
                'Maghrib': bool(prayer_log['maghrib']) if prayer_log else False,
                'Isha': bool(prayer_log['isha']) if prayer_log else False,
            }

            for prayer_name in prayer_order:
                if completed_map[prayer_name]:
                    continue
                if setting_is_true(settings, 'notif_prayer_before_start', 'true'):
                    start_notify = prayer_starts[prayer_name] - timedelta(minutes=10)
                    if now - timedelta(minutes=5) <= start_notify <= now + timedelta(hours=24):
                        notifications.append({
                            'type': 'prayer',
                            'title': f'{prayer_name} starts soon',
                            'message': f'10 minutes until {prayer_name}',
                            'at': start_notify,
                            'link': '/deen'
                        })
                if setting_is_true(settings, 'notif_prayer_before_end', 'true'):
                    end_notify = prayer_ends[prayer_name] - timedelta(minutes=15)
                    if now - timedelta(minutes=5) <= end_notify <= now + timedelta(hours=24):
                        notifications.append({
                            'type': 'prayer',
                            'title': f'{prayer_name} window ending soon',
                            'message': f'15 minutes left before {prayer_name} time ends',
                            'at': end_notify,
                            'link': '/deen'
                        })
        except Exception:
            pass

    if setting_is_true(settings, 'notif_todos_upcoming', 'true'):
        todo_rows = conn.execute(
            'SELECT id, title, due_date, due_time FROM todos WHERE status != "completed" AND due_date IS NOT NULL ORDER BY due_date, due_time'
        ).fetchall()
        for row in todo_rows:
            due_time = row['due_time'] if row['due_time'] else '09:00'
            due_dt = combine_date_and_time(datetime.strptime(row['due_date'], '%Y-%m-%d').date(), due_time)
            if now - timedelta(minutes=5) <= due_dt <= now + timedelta(hours=24):
                notifications.append({
                    'type': 'todo',
                    'title': 'Upcoming todo',
                    'message': f"{row['title']} due at {due_dt.strftime('%H:%M')} on {row['due_date']}",
                    'at': due_dt,
                    'link': '/todos'
                })

    if setting_is_true(settings, 'notif_special_dates', 'true'):
        date_rows = conn.execute(
            'SELECT title, event_date, event_type FROM important_dates WHERE event_date >= date("now", "-1 day") ORDER BY event_date LIMIT 60'
        ).fetchall()
        for row in date_rows:
            event_day = datetime.strptime(row['event_date'], '%Y-%m-%d').date()
            reminder_dt = datetime(event_day.year, event_day.month, event_day.day) - timedelta(hours=24)
            if now - timedelta(minutes=5) <= reminder_dt <= now + timedelta(hours=24):
                notifications.append({
                    'type': 'date',
                    'title': 'Special date reminder',
                    'message': f"{row['title']} is tomorrow",
                    'at': reminder_dt,
                    'link': '/important-dates'
                })

    conn.close()

    notifications.sort(key=lambda item: item['at'])
    unread_count = sum(1 for item in notifications if item['at'] <= now + timedelta(minutes=15))
    for item in notifications:
        item['at_text'] = item['at'].strftime('%Y-%m-%d %H:%M')

    return {
        'notifications_enabled': True,
        'notifications_items': notifications[:30],
        'notifications_unread_count': unread_count,
        'notifications_settings': settings,
    }

def is_habit_due_on(habit, day_obj):
    if habit['frequency_type'] != 'specific_days' or not habit['days_of_week']:
        return True
    configured = {token.strip().lower() for token in habit['days_of_week'].split(',') if token.strip()}
    day_tokens = {
        str(day_obj.weekday()),
        day_obj.strftime('%a').lower(),
        day_obj.strftime('%A').lower()
    }
    return bool(configured & day_tokens)

def get_wake_time_for_date(conn, log_date):
    sleep_log = conn.execute('SELECT wake_time FROM sleep_logs WHERE sleep_date=?', (log_date,)).fetchone()
    if sleep_log and sleep_log['wake_time']:
        return sleep_log['wake_time']
    setting = conn.execute("SELECT setting_value FROM app_settings WHERE setting_key='wake_time'").fetchone()
    return setting['setting_value'] if setting and setting['setting_value'] else '07:00'

@app.context_processor
def inject_settings():
    settings = get_settings()
    context = {'app_settings': settings, 'today_iso': date.today().isoformat()}
    context.update(build_notifications_context(settings))
    return context

def build_dashboard_payload():
    conn = get_db()
    today = date.today()
    today_iso = today.isoformat()

    pending_todos = conn.execute('''
        SELECT id, title, due_date, priority
        FROM todos
        WHERE status != "completed"
        ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date, priority DESC
        LIMIT 6
    ''').fetchall()
    overdue_todos = conn.execute('SELECT COUNT(*) as c FROM todos WHERE status != "completed" AND due_date < ?', (today_iso,)).fetchone()['c']

    all_habits = conn.execute("SELECT * FROM habits WHERE is_active=1").fetchall()
    today_logs = conn.execute('SELECT habit_id, completed FROM habit_logs WHERE log_date=?', (today_iso,)).fetchall()
    habit_log_map = {row['habit_id']: row['completed'] for row in today_logs}
    due_habits = [habit for habit in all_habits if is_habit_due_on(habit, today)]
    habits_done = sum(1 for habit in due_habits if habit_log_map.get(habit['id']) == 1)

    water_rows = conn.execute('SELECT target_ml, completed FROM water_hourly WHERE log_date=?', (today_iso,)).fetchall()
    water_target = sum(int(row['target_ml'] or 0) for row in water_rows)
    water_done = sum(int(row['target_ml'] or 0) for row in water_rows if row['completed'])

    latest_sleep = conn.execute('SELECT * FROM sleep_logs ORDER BY sleep_date DESC LIMIT 1').fetchone()
    sleep_goal_hours = 8
    sleep_gap = max(0, sleep_goal_hours - float(latest_sleep['total_hours'] or 0)) if latest_sleep and latest_sleep['total_hours'] else None

    prayer_log = conn.execute('SELECT * FROM prayer_logs WHERE prayer_date=?', (today_iso,)).fetchone()
    prayer_done = 0
    if prayer_log:
        prayer_done = sum(1 for key in ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] if prayer_log[key])

    upcoming_dates = conn.execute('''
        SELECT title, event_date, event_type
        FROM important_dates
        WHERE event_date BETWEEN ? AND ?
        ORDER BY event_date ASC
        LIMIT 5
    ''', (today_iso, (today + timedelta(days=7)).isoformat())).fetchall()

    actions = []
    if overdue_todos:
        actions.append({'label': f'{overdue_todos} overdue todo' + ('s' if overdue_todos != 1 else ''), 'hint': 'Clear overdue tasks first', 'link': '/todos'})
    if due_habits and habits_done < len(due_habits):
        actions.append({'label': f'{len(due_habits) - habits_done} habit' + ('s' if (len(due_habits) - habits_done) != 1 else '') + ' still due today', 'hint': f'{habits_done}/{len(due_habits)} completed', 'link': '/habits'})
    if water_target and water_done < water_target:
        actions.append({'label': f'{water_target - water_done}ml water remaining', 'hint': f'{water_done}/{water_target}ml logged today', 'link': '/water'})
    if prayer_done < 5:
        actions.append({'label': f'{5 - prayer_done} prayer' + ('s' if (5 - prayer_done) != 1 else '') + ' still open today', 'hint': f'{prayer_done}/5 completed', 'link': '/deen'})
    if sleep_gap and sleep_gap > 0:
        actions.append({'label': f'{sleep_gap:.1f}h below sleep goal', 'hint': 'Latest logged sleep versus 8h target', 'link': '/sleep'})
    if upcoming_dates:
        actions.append({'label': upcoming_dates[0]['title'], 'hint': f"Upcoming on {upcoming_dates[0]['event_date']}", 'link': '/important-dates'})

    recent_journal = conn.execute('SELECT entry_date, entry_type FROM journal_entries ORDER BY entry_date DESC, id DESC LIMIT 1').fetchone()
    conn.close()
    return {
        'today': today_iso,
        'pending_todos': pending_todos,
        'overdue_todos': overdue_todos,
        'due_habits_count': len(due_habits),
        'habits_done': habits_done,
        'water_target': water_target,
        'water_done': water_done,
        'latest_sleep': latest_sleep,
        'sleep_gap': sleep_gap,
        'prayer_done': prayer_done,
        'upcoming_dates': upcoming_dates,
        'actions': actions,
        'recent_journal': recent_journal,
    }

def build_weekly_review_payload():
    conn = get_db()
    today = date.today()
    start = today - timedelta(days=6)
    start_iso = start.isoformat()
    end_iso = today.isoformat()

    journal_count = conn.execute('SELECT COUNT(*) as c FROM journal_entries WHERE entry_date BETWEEN ? AND ?', (start_iso, end_iso)).fetchone()['c']
    completed_todos = conn.execute('SELECT COUNT(*) as c FROM todos WHERE completed_at IS NOT NULL AND date(completed_at) BETWEEN ? AND ?', (start_iso, end_iso)).fetchone()['c']
    workout_rows = conn.execute('''
        SELECT ws.*, wt.name as workout_name, wt.is_cardio
        FROM workout_sessions ws
        JOIN workout_types wt ON wt.id = ws.workout_type_id
        WHERE ws.session_date BETWEEN ? AND ?
        ORDER BY ws.session_date DESC
    ''', (start_iso, end_iso)).fetchall()
    profile = conn.execute('SELECT * FROM user_profile WHERE id=1').fetchone()
    hydrated_workouts = [hydrate_cardio_session_metrics(conn, row, profile=profile, persist=False) for row in workout_rows]
    workouts_count = len(hydrated_workouts)
    cardio_minutes = sum(float(row.get('duration_minutes') or 0) for row in hydrated_workouts if row.get('is_cardio'))

    sleep_logs = conn.execute('SELECT total_hours FROM sleep_logs WHERE sleep_date BETWEEN ? AND ?', (start_iso, end_iso)).fetchall()
    avg_sleep = round(sum(float(row['total_hours'] or 0) for row in sleep_logs) / len(sleep_logs), 1) if sleep_logs else 0

    steps_total = conn.execute('SELECT SUM(step_count) as total FROM daily_steps WHERE log_date BETWEEN ? AND ?', (start_iso, end_iso)).fetchone()['total'] or 0

    water_logs = conn.execute('SELECT log_date, target_ml, total_ml FROM water_logs WHERE log_date BETWEEN ? AND ?', (start_iso, end_iso)).fetchall()
    water_goal_days = sum(1 for row in water_logs if (row['total_ml'] or 0) >= (row['target_ml'] or 0) and (row['target_ml'] or 0) > 0)

    prayer_logs = conn.execute('SELECT fajr, dhuhr, asr, maghrib, isha FROM prayer_logs WHERE prayer_date BETWEEN ? AND ?', (start_iso, end_iso)).fetchall()
    prayer_total = len(prayer_logs) * 5
    prayer_done = 0
    for row in prayer_logs:
        prayer_done += sum(1 for key in ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] if row[key])
    prayer_rate = round((prayer_done / prayer_total) * 100, 1) if prayer_total else 0

    habit_rows = conn.execute('SELECT * FROM habits WHERE is_active=1').fetchall()
    habit_due = 0
    habit_done = 0
    current_day = start
    while current_day <= today:
        day_logs = conn.execute('SELECT habit_id, completed FROM habit_logs WHERE log_date=?', (current_day.isoformat(),)).fetchall()
        day_map = {row['habit_id']: row['completed'] for row in day_logs}
        for habit in habit_rows:
            if is_habit_due_on(habit, current_day):
                habit_due += 1
                if day_map.get(habit['id']) == 1:
                    habit_done += 1
        current_day += timedelta(days=1)
    habit_rate = round((habit_done / habit_due) * 100, 1) if habit_due else 0

    wins = []
    if workouts_count >= 4:
        wins.append(f'{workouts_count} workouts logged')
    if avg_sleep >= 7.5:
        wins.append(f'Average sleep at {avg_sleep}h')
    if habit_rate >= 80:
        wins.append(f'Habit completion at {habit_rate}%')
    if prayer_rate >= 85:
        wins.append(f'Prayer completion at {prayer_rate}%')
    if water_goal_days >= 5:
        wins.append(f'Hydration target hit on {water_goal_days} days')

    slips = []
    if completed_todos < 3:
        slips.append('Low todo throughput this week')
    if avg_sleep and avg_sleep < 7:
        slips.append(f'Average sleep only {avg_sleep}h')
    if habit_rate and habit_rate < 70:
        slips.append(f'Habit completion dropped to {habit_rate}%')
    if cardio_minutes < 60:
        slips.append(f'Only {round(cardio_minutes)} cardio minutes logged')

    next_steps = []
    if avg_sleep < 8:
        next_steps.append('Protect bedtime and recover sleep debt first')
    if completed_todos < 5:
        next_steps.append('Plan next week around 3-5 non-negotiable tasks')
    if habit_rate < 85:
        next_steps.append('Reduce friction on the first missed habit in your day')
    if cardio_minutes < 90:
        next_steps.append('Schedule fixed cardio blocks before the week starts')

    conn.close()
    return {
        'start_date': start_iso,
        'end_date': end_iso,
        'journal_count': journal_count,
        'completed_todos': completed_todos,
        'workouts_count': workouts_count,
        'cardio_minutes': round(cardio_minutes, 1),
        'avg_sleep': avg_sleep,
        'steps_total': steps_total,
        'water_goal_days': water_goal_days,
        'prayer_rate': prayer_rate,
        'habit_rate': habit_rate,
        'wins': wins,
        'slips': slips,
        'next_steps': next_steps,
    }

def get_streak(conn, table, date_col, check_func=None):
    streak = 0
    d = date.today()
    while True:
        row = conn.execute(f'SELECT * FROM {table} WHERE {date_col} = ?', (d.isoformat(),)).fetchone()
        if not row:
            break
        if check_func and not check_func(row):
            break
        streak += 1
        d -= timedelta(days=1)
    return streak

# Epley formula for 1RM
def calc_1rm(weight, reps):
    if reps <= 0 or weight <= 0:
        return 0
    if reps == 1:
        return weight
    return weight * (1 + reps / 30.0)

def is_better_strength_set(candidate, current):
    if current is None:
        return True
    candidate_weight = float(candidate['weight_kg'] or 0)
    current_weight = float(current['weight_kg'] or 0)
    if candidate_weight != current_weight:
        return candidate_weight > current_weight
    return int(candidate['reps'] or 0) > int(current['reps'] or 0)

VALID_MUSCLE_GROUPS = {
    'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core', 'Cardio', 'Full Body', 'Uncategorized'
}

# Canonical Quran Juz start points: (surah_number, ayah_number)
JUZ_BOUNDARIES = [
    (1, 1), (2, 142), (2, 253), (3, 93), (4, 24), (4, 148), (5, 82), (6, 111), (7, 88), (8, 41),
    (9, 93), (11, 6), (12, 53), (15, 1), (17, 1), (18, 75), (21, 1), (23, 1), (25, 21), (27, 56),
    (29, 46), (33, 31), (36, 28), (39, 32), (41, 47), (46, 1), (51, 31), (58, 1), (67, 1), (78, 1)
]

HSK_CURRICULUM = [
    {
        'level': 1,
        'vocab': 150,
        'focus': 'Greetings, numbers, time, family, basic daily needs',
        'toc': ['Pinyin & tones', 'Basic sentence order', 'Introductions', 'Shopping basics']
    },
    {
        'level': 2,
        'vocab': 300,
        'focus': 'Daily routines, directions, food, simple opinions',
        'toc': ['Daily schedule', 'Transport & directions', 'Restaurant language', 'Past/future with simple markers']
    },
    {
        'level': 3,
        'vocab': 600,
        'focus': 'Study/work situations, short stories, common social topics',
        'toc': ['Comparisons', 'Requests & suggestions', 'Experience statements', 'Connected speech']
    },
    {
        'level': 4,
        'vocab': 1200,
        'focus': 'Wider real-life topics, paragraph-level reading/listening',
        'toc': ['Complex complements', 'Topic discussion', 'Formal vs informal tone', 'Intermediate reading speed']
    },
    {
        'level': 5,
        'vocab': 2500,
        'focus': 'News, media, and abstract topics with strong fluency',
        'toc': ['Long-form listening', 'Opinion writing', 'Idiom exposure', 'Academic/work communication']
    },
    {
        'level': 6,
        'vocab': 5000,
        'focus': 'High-level comprehension and natural expression across domains',
        'toc': ['Advanced reading strategies', 'Nuanced grammar', 'Extended speaking', 'Near-native comprehension']
    }
]

ARABIC_PROGRAM_META = {
    '64_videos': {'label': '64 Videos', 'order': 1},
    'bayyinah_nahw': {'label': 'Bayyinah Nahw', 'order': 2},
    'bayyinah_sarf': {'label': 'Bayyinah Sarf', 'order': 3},
}

BODY_MEASUREMENT_FIELDS = [
    ('chest_cm', 'Chest'),
    ('shoulders_cm', 'Shoulders'),
    ('relaxed_arm_cm', 'Relaxed Arm'),
    ('flexed_arm_cm', 'Flexed Arm'),
    ('forearm_cm', 'Forearm'),
    ('waist_cm', 'Waist'),
    ('thigh_cm', 'Thigh'),
    ('calf_cm', 'Calf'),
]

def normalize_muscle_group(raw_group, is_cardio=False):
    if is_cardio:
        return 'Cardio'
    if not raw_group:
        return 'Uncategorized'
    group = str(raw_group).strip().title()
    if group == 'Fullbody':
        group = 'Full Body'
    return group if group in VALID_MUSCLE_GROUPS else 'Uncategorized'

def _safe_float(value):
    try:
        if value in (None, ''):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None

def build_body_measurements_payload(conn):
    settings_rows = conn.execute(
        "SELECT setting_key, setting_value FROM app_settings WHERE setting_key='diet_body_fat_pct' OR setting_key='body_measurements_date' OR setting_key LIKE 'measurement_%'"
    ).fetchall()
    settings = {row['setting_key']: row['setting_value'] for row in settings_rows}

    latest_body = conn.execute(
        'SELECT log_date, weight_kg, body_fat_percentage FROM body_stats ORDER BY log_date DESC, id DESC LIMIT 1'
    ).fetchone()
    latest_bodyfat = conn.execute(
        'SELECT body_fat_percentage FROM body_stats WHERE body_fat_percentage IS NOT NULL ORDER BY log_date DESC, id DESC LIMIT 1'
    ).fetchone()
    profile = conn.execute('SELECT * FROM user_profile WHERE id=1').fetchone()

    height_cm = float(profile['height_cm']) if profile and profile['height_cm'] else None
    weight_kg = float(latest_body['weight_kg']) if latest_body and latest_body['weight_kg'] else None
    body_fat_pct = None
    if latest_body and latest_body['body_fat_percentage'] is not None:
        body_fat_pct = float(latest_body['body_fat_percentage'])
    elif latest_bodyfat and latest_bodyfat['body_fat_percentage'] is not None:
        body_fat_pct = float(latest_bodyfat['body_fat_percentage'])
    else:
        body_fat_pct = _safe_float(settings.get('diet_body_fat_pct'))

    measurements = []
    for key, label in BODY_MEASUREMENT_FIELDS:
        value = _safe_float(settings.get(f'measurement_{key}'))
        measurements.append({
            'key': key,
            'label': label,
            'value': value,
        })

    measurement_values = [item['value'] for item in measurements if item['value'] is not None]
    has_measurements = bool(measurement_values)
    measurement_average = round(sum(measurement_values) / len(measurement_values), 1) if measurement_values else None

    bmi = None
    waist_to_height = None
    lean_mass_kg = None
    fat_mass_kg = None
    flex_delta_cm = None
    if height_cm and weight_kg:
        height_m = height_cm / 100
        if height_m > 0:
            bmi = round(weight_kg / (height_m * height_m), 1)
    waist_value = next((item['value'] for item in measurements if item['key'] == 'waist_cm'), None)
    chest_value = next((item['value'] for item in measurements if item['key'] == 'chest_cm'), None)
    relaxed_arm_value = next((item['value'] for item in measurements if item['key'] == 'relaxed_arm_cm'), None)
    flexed_arm_value = next((item['value'] for item in measurements if item['key'] == 'flexed_arm_cm'), None)
    if waist_value and height_cm:
        waist_to_height = round(waist_value / height_cm, 3)
    if body_fat_pct is not None and weight_kg is not None:
        lean_mass_kg = round(weight_kg * (1 - (body_fat_pct / 100)), 1)
        fat_mass_kg = round(weight_kg - lean_mass_kg, 1)
    if relaxed_arm_value is not None and flexed_arm_value is not None:
        flex_delta_cm = round(flexed_arm_value - relaxed_arm_value, 1)

    structure_chart = []
    for key in ['shoulders_cm', 'chest_cm', 'waist_cm', 'thigh_cm', 'calf_cm', 'flexed_arm_cm']:
        item = next((entry for entry in measurements if entry['key'] == key and entry['value'] is not None), None)
        if item:
            structure_chart.append({'label': item['label'], 'value': item['value']})

    chest_to_waist = round(chest_value / waist_value, 2) if chest_value and waist_value else None
    estimated_body_fat = body_fat_pct is not None
    if body_fat_pct is None:
        body_fat_pct = 24.5

    target_metrics = [
        {
            'label': 'Waist / Height',
            'current': waist_to_height,
            'current_text': f'{waist_to_height:.3f}' if waist_to_height is not None else 'N/A',
            'ideal_text': '0.43-0.47 lean look',
            'target': 0.47,
            'direction': 'lower',
        },
        {
            'label': 'Chest / Waist',
            'current': chest_to_waist,
            'current_text': f'{chest_to_waist:.2f}' if chest_to_waist is not None else 'N/A',
            'ideal_text': '1.35+ aesthetic taper',
            'target': 1.35,
            'direction': 'higher',
        },
        {
            'label': 'BMI',
            'current': bmi,
            'current_text': f'{bmi:.1f}' if bmi is not None else 'N/A',
            'ideal_text': '20-25 healthy range',
            'target': 25.0,
            'direction': 'range',
        },
        {
            'label': 'Body Fat',
            'current': body_fat_pct,
            'current_text': f'{body_fat_pct:.1f}%' + (' est.' if not estimated_body_fat else ''),
            'ideal_text': '12-18% visibly lean',
            'target': 18.0,
            'direction': 'lower',
        },
    ]

    def scale_measurement(value, fallback, divisor, minimum=0.2, maximum=1.0):
        base = value if value is not None else fallback
        return round(max(minimum, min(maximum, base / divisor)), 3)

    silhouette = {
        'shoulder_scale': scale_measurement(next((item['value'] for item in measurements if item['key'] == 'shoulders_cm'), None), 46, 65),
        'chest_scale': scale_measurement(chest_value, 95, 120),
        'waist_scale': scale_measurement(waist_value, 78, 110),
        'arm_scale': scale_measurement(flexed_arm_value, 33, 55),
        'thigh_scale': scale_measurement(next((item['value'] for item in measurements if item['key'] == 'thigh_cm'), None), 58, 90),
        'calf_scale': scale_measurement(next((item['value'] for item in measurements if item['key'] == 'calf_cm'), None), 38, 65),
        'height_scale': scale_measurement(height_cm, 178, 210, minimum=0.75, maximum=1.08),
        'body_fat_pct': body_fat_pct,
    }

    insights = []
    if waist_to_height is not None:
        if waist_to_height < 0.5:
            insights.append(f'Waist-to-height ratio is {waist_to_height}, which is a lean baseline.')
        else:
            insights.append(f'Waist-to-height ratio is {waist_to_height}; trimming waist size would improve the silhouette score fastest.')
    if bmi is not None:
        insights.append(f'BMI is {bmi} at {weight_kg:.1f} kg and {height_cm:.0f} cm.')
    if lean_mass_kg is not None and estimated_body_fat:
        insights.append(f'Estimated lean mass is {lean_mass_kg:.1f} kg with {fat_mass_kg:.1f} kg fat mass.')
    if chest_value and waist_value:
        insights.append(f'Chest-to-waist ratio is {round(chest_value / waist_value, 2)}.')
    if flex_delta_cm is not None:
        insights.append(f'Flexed arm adds {flex_delta_cm:.1f} cm over relaxed size.')
    if not estimated_body_fat:
        insights.append('Body-fat percentage is an estimate for now, so treat the composition readout as directional rather than exact.')

    return {
        'measurements': measurements,
        'has_measurements': has_measurements,
        'measurement_average': measurement_average,
        'measurement_date': settings.get('body_measurements_date') or (latest_body['log_date'] if latest_body else None),
        'height_cm': height_cm,
        'weight_kg': weight_kg,
        'body_fat_pct': body_fat_pct,
        'body_fat_estimated': not estimated_body_fat,
        'bmi': bmi,
        'waist_to_height': waist_to_height,
        'chest_to_waist': chest_to_waist,
        'lean_mass_kg': lean_mass_kg,
        'fat_mass_kg': fat_mass_kg,
        'flex_delta_cm': flex_delta_cm,
        'structure_chart': structure_chart,
        'target_metrics': target_metrics,
        'silhouette': silhouette,
        'insights': insights,
    }

def get_juz_ranges(conn):
    surah_rows = conn.execute('SELECT surah_number, total_ayahs FROM quran_surahs').fetchall()
    surah_total_ayahs = {row['surah_number']: row['total_ayahs'] for row in surah_rows}

    def previous_ayah(surah_num, ayah_num):
        if ayah_num > 1:
            return surah_num, ayah_num - 1
        prev_surah = surah_num - 1
        prev_total = surah_total_ayahs.get(prev_surah, 1)
        return prev_surah, prev_total

    ranges = {}
    for idx, (from_surah, from_ayah) in enumerate(JUZ_BOUNDARIES):
        if idx < len(JUZ_BOUNDARIES) - 1:
            next_surah, next_ayah = JUZ_BOUNDARIES[idx + 1]
            to_surah, to_ayah = previous_ayah(next_surah, next_ayah)
        else:
            to_surah = 114
            to_ayah = surah_total_ayahs.get(114, 6)
        juz_number = idx + 1
        ranges[juz_number] = {
            'juz': juz_number,
            'from_surah': from_surah,
            'from_ayah': from_ayah,
            'to_surah': to_surah,
            'to_ayah': to_ayah,
        }
    return ranges

def infer_juz_number_from_reference(surah_number, ayah_number):
    if not surah_number or not ayah_number:
        return None
    try:
        surah_number = int(surah_number)
        ayah_number = int(ayah_number)
    except (TypeError, ValueError):
        return None

    current = 1
    for idx, (start_surah, start_ayah) in enumerate(JUZ_BOUNDARIES, start=1):
        if (surah_number > start_surah) or (surah_number == start_surah and ayah_number >= start_ayah):
            current = idx
        else:
            break
    return current

def build_gym_progress_payload(conn):
    exercises_with_data = conn.execute('''
        SELECT DISTINCT e.id, e.name, e.workout_type_id, e.muscle_group FROM exercises e
        JOIN workout_exercise_logs wel ON wel.exercise_id=e.id WHERE e.is_cardio=0
    ''').fetchall()

    grouped_progress_data = {}
    for ex in exercises_with_data:
        logs = conn.execute('''
            SELECT ws.session_date, wel.weight_kg, wel.reps FROM workout_exercise_logs wel
            JOIN workout_sessions ws ON wel.session_id=ws.id
            WHERE wel.exercise_id=? AND wel.set_type='working' AND wel.weight_kg > 0
            ORDER BY ws.session_date
        ''', (ex['id'],)).fetchall()
        if logs:
            best_logs_by_date = {}
            for log in logs:
                if is_better_strength_set(log, best_logs_by_date.get(log['session_date'])):
                    best_logs_by_date[log['session_date']] = log
            exercise_series = [
                {'date': session_date, '1rm': round(calc_1rm(log['weight_kg'], log['reps']), 1)}
                for session_date, log in sorted(best_logs_by_date.items())
                if log['reps']
            ]
            if exercise_series:
                muscle_group = normalize_muscle_group(ex['muscle_group'])
                if muscle_group in {'Uncategorized', 'Core'}:
                    continue
                grouped_progress_data.setdefault(muscle_group, {})[ex['name']] = exercise_series

    muscle_group_summaries = []
    for muscle_group, exercises in grouped_progress_data.items():
        items = []
        for exercise_name, points in exercises.items():
            peak = max((p['1rm'] for p in points), default=0)
            latest = points[-1]['1rm'] if points else 0
            items.append({'name': exercise_name, 'peak_1rm': peak, 'latest_1rm': latest, 'points': len(points)})
        ranked = sorted(items, key=lambda x: x['peak_1rm'], reverse=True)
        muscle_group_summaries.append({
            'group': muscle_group,
            'exercise_count': len(exercises),
            'top_exercise': ranked[0] if ranked else None,
            'avg_peak_1rm': round(sum(x['peak_1rm'] for x in ranked) / len(ranked), 1) if ranked else 0,
            'exercises': ranked
        })
    muscle_group_summaries.sort(key=lambda x: x['group'])

    # Strength standards: auto-estimated from profile, but overridable manually per exercise.
    profile = conn.execute('SELECT * FROM user_profile WHERE id=1').fetchone()
    latest_weight_row = conn.execute('SELECT weight_kg FROM body_stats ORDER BY log_date DESC, id DESC LIMIT 1').fetchone()
    body_weight = float(latest_weight_row['weight_kg']) if latest_weight_row and latest_weight_row['weight_kg'] else None
    age = int(profile['age']) if profile and profile['age'] else None
    height_cm = float(profile['height_cm']) if profile and profile['height_cm'] else None

    standards_by_group = {}
    if body_weight:
        multipliers = {
            'Chest': {'beginner': 0.75, 'intermediate': 1.0, 'advanced': 1.25},
            'Back': {'beginner': 0.85, 'intermediate': 1.15, 'advanced': 1.45},
            'Shoulders': {'beginner': 0.45, 'intermediate': 0.65, 'advanced': 0.9},
            'Arms': {'beginner': 0.35, 'intermediate': 0.5, 'advanced': 0.7},
            'Legs': {'beginner': 1.0, 'intermediate': 1.4, 'advanced': 1.9},
            'Glutes': {'beginner': 1.15, 'intermediate': 1.65, 'advanced': 2.2},
            'Core': {'beginner': 0.4, 'intermediate': 0.6, 'advanced': 0.8},
            'Full Body': {'beginner': 0.7, 'intermediate': 1.0, 'advanced': 1.3},
            'Uncategorized': {'beginner': 0.6, 'intermediate': 0.85, 'advanced': 1.1}
        }
        age_factor = 1.0
        if age is not None:
            if age <= 24:
                age_factor = 1.03
            elif age <= 35:
                age_factor = 1.0
            elif age <= 45:
                age_factor = 0.96
            elif age <= 55:
                age_factor = 0.92
            else:
                age_factor = 0.88
        height_factor = 1.0
        if height_cm:
            height_factor = max(0.95, min(1.05, 1.0 + ((height_cm - 170.0) * 0.0015)))
        profile_factor = age_factor * height_factor

        for group in grouped_progress_data.keys():
            group_multipliers = multipliers.get(group, multipliers['Uncategorized'])
            standards_by_group[group] = {
                'beginner': round(body_weight * group_multipliers['beginner'] * profile_factor, 1),
                'intermediate': round(body_weight * group_multipliers['intermediate'] * profile_factor, 1),
                'advanced': round(body_weight * group_multipliers['advanced'] * profile_factor, 1),
            }

    # Manual benchmark overrides saved by user.
    benchmark_rows = conn.execute('''
        SELECT e.id, e.name, e.muscle_group, wt.name as workout_name,
               b.beginner_1rm, b.intermediate_1rm, b.advanced_1rm
        FROM exercises e
        JOIN workout_types wt ON wt.id = e.workout_type_id
        LEFT JOIN exercise_strength_benchmarks b ON b.exercise_id = e.id
        WHERE e.is_active=1 AND e.is_cardio=0
        ORDER BY e.name, wt.name
    ''').fetchall()
    exercises_for_benchmarks = []
    manual_benchmarks_by_name = {}
    for row in benchmark_rows:
        group = normalize_muscle_group(row['muscle_group'])
        if group in {'Uncategorized', 'Core'}:
            continue
        item = {
            'id': row['id'],
            'name': row['name'],
            'workout_name': row['workout_name'],
            'group': group,
            'beginner_1rm': row['beginner_1rm'],
            'intermediate_1rm': row['intermediate_1rm'],
            'advanced_1rm': row['advanced_1rm']
        }
        exercises_for_benchmarks.append(item)
        if row['beginner_1rm'] is not None or row['intermediate_1rm'] is not None or row['advanced_1rm'] is not None:
            manual_benchmarks_by_name[row['name']] = {
                'beginner': round(float(row['beginner_1rm']), 1) if row['beginner_1rm'] is not None else None,
                'intermediate': round(float(row['intermediate_1rm']), 1) if row['intermediate_1rm'] is not None else None,
                'advanced': round(float(row['advanced_1rm']), 1) if row['advanced_1rm'] is not None else None,
            }

    standards_by_exercise = {}
    for group, exercises in grouped_progress_data.items():
        standards_by_exercise[group] = {}
        for exercise_name in exercises.keys():
            manual = manual_benchmarks_by_name.get(exercise_name)
            if manual and (manual.get('beginner') is not None or manual.get('intermediate') is not None or manual.get('advanced') is not None):
                standards_by_exercise[group][exercise_name] = {
                    'beginner': manual.get('beginner'),
                    'intermediate': manual.get('intermediate'),
                    'advanced': manual.get('advanced'),
                    'source': 'manual'
                }
            elif standards_by_group.get(group):
                standards_by_exercise[group][exercise_name] = {
                    **standards_by_group[group],
                    'source': 'estimated'
                }

    # PR timeline events (new all-time best 1RM points per exercise).
    pr_rows = conn.execute('''
        SELECT ws.session_date, e.name as exercise_name, e.muscle_group, wel.weight_kg, wel.reps
        FROM workout_exercise_logs wel
        JOIN workout_sessions ws ON ws.id = wel.session_id
        JOIN exercises e ON e.id = wel.exercise_id
        WHERE e.is_cardio=0 AND wel.set_type='working' AND wel.weight_kg > 0 AND wel.reps > 0
        ORDER BY ws.session_date, wel.id
    ''').fetchall()
    pr_timeline = []
    best_1rm_by_exercise = {}
    for row in pr_rows:
        exercise_name = row['exercise_name']
        group = normalize_muscle_group(row['muscle_group'])
        if group in {'Uncategorized', 'Core'}:
            continue
        one_rm = round(calc_1rm(float(row['weight_kg']), int(row['reps'])), 1)
        previous_best = best_1rm_by_exercise.get(exercise_name)
        if previous_best is None or one_rm > previous_best:
            best_1rm_by_exercise[exercise_name] = one_rm
            pr_timeline.append({
                'date': row['session_date'],
                'exercise': exercise_name,
                'muscle_group': group,
                'one_rm': one_rm,
                'weight_kg': float(row['weight_kg']),
                'reps': int(row['reps'])
            })

    # Cardio dashboard metrics.
    cardio_intervals = conn.execute('''
        SELECT ws.id as session_id, ws.session_date, ws.calories_burned, wel.time_seconds, wel.speed, wel.incline
        FROM workout_exercise_logs wel
        JOIN workout_sessions ws ON ws.id = wel.session_id
        JOIN workout_types wt ON wt.id = ws.workout_type_id
        WHERE wt.is_cardio=1 AND wel.set_type='interval'
        ORDER BY ws.session_date, ws.id
    ''').fetchall()
    weekly_minutes = defaultdict(float)
    estimated_daily_calories = defaultdict(float)
    recorded_calories_by_session = {}
    for row in cardio_intervals:
        session_date = row['session_date']
        seconds = int(row['time_seconds']) if row['time_seconds'] else 0
        if seconds > 0:
            d = date.fromisoformat(session_date)
            iso = d.isocalendar()
            week_key = f"{iso.year}-W{iso.week:02d}"
            weekly_minutes[week_key] += seconds / 60.0
            if body_weight and row['speed']:
                estimated_daily_calories[session_date] += estimate_treadmill_interval_calories(
                    body_weight,
                    float(row['speed']),
                    float(row['incline']) if row['incline'] is not None else 0,
                    seconds,
                    age,
                    height_cm
                )
        if row['calories_burned'] and row['session_id'] not in recorded_calories_by_session:
            recorded_calories_by_session[row['session_id']] = {
                'date': session_date,
                'calories': float(row['calories_burned'])
            }

    cardio_minutes_by_week = [
        {'week': wk, 'minutes': round(weekly_minutes[wk], 1)}
        for wk in sorted(weekly_minutes.keys())
    ]
    calories_by_date = defaultdict(float)
    for session in recorded_calories_by_session.values():
        calories_by_date[session['date']] += session['calories']
    if not calories_by_date and estimated_daily_calories:
        for day, calories in estimated_daily_calories.items():
            calories_by_date[day] += calories
    cardio_calories_trend = [{'date': d, 'calories': round(calories_by_date[d], 1)} for d in sorted(calories_by_date.keys())]

    benchmark_profile = {
        'weight_kg': body_weight,
        'age': age,
        'height_cm': height_cm,
        'has_benchmarks': bool(body_weight)
    }

    # Strength standards tracker for key compound lifts
    strength_standards = None
    if body_weight:
        standards_benchmarks = {
            'Bench Press': {'novice': 0.75, 'intermediate': 1.0, 'advanced': 1.5},
            'Incline Dumbbell Press': {'novice': 0.55, 'intermediate': 0.75, 'advanced': 1.0},
            'Squats': {'novice': 1.0, 'intermediate': 1.5, 'advanced': 2.0},
            'Romanian Deadlift': {'novice': 0.9, 'intermediate': 1.3, 'advanced': 1.8},
            'Deadlift': {'novice': 1.25, 'intermediate': 1.75, 'advanced': 2.5},
        }
        
        strength_standards = {}
        for exercise_name, multipliers in standards_benchmarks.items():
            one_rm_row = conn.execute('''
                SELECT MAX(ROUND(wel.weight_kg * (1 + wel.reps / 30.0), 1)) as one_rm
                FROM workout_exercise_logs wel
                JOIN exercises e ON e.id = wel.exercise_id
                WHERE e.name = ? AND wel.set_type = 'working' AND wel.weight_kg > 0 AND wel.reps > 0
            ''', (exercise_name,)).fetchone()
            
            current_1rm = round(float(one_rm_row['one_rm']), 1) if one_rm_row and one_rm_row['one_rm'] else 0
            novice_target = round(body_weight * multipliers['novice'], 1)
            intermediate_target = round(body_weight * multipliers['intermediate'], 1)
            advanced_target = round(body_weight * multipliers['advanced'], 1)
            
            # Determine level and next target
            if current_1rm >= advanced_target:
                level = 'advanced'
                next_target = None
                progress_pct = 100.0
            elif current_1rm >= intermediate_target:
                level = 'intermediate'
                next_target = advanced_target
                progress_pct = round((current_1rm - intermediate_target) / (advanced_target - intermediate_target) * 100, 1)
            elif current_1rm >= novice_target:
                level = 'novice'
                next_target = intermediate_target
                progress_pct = round((current_1rm - novice_target) / (intermediate_target - novice_target) * 100, 1)
            else:
                level = 'untrained'
                next_target = novice_target
                progress_pct = round((current_1rm / novice_target * 100), 1) if novice_target > 0 else 0
            
            strength_standards[exercise_name] = {
                'current_1rm': current_1rm,
                'level': level,
                'novice_target': novice_target,
                'intermediate_target': intermediate_target,
                'advanced_target': advanced_target,
                'next_target': next_target,
                'progress_pct': progress_pct
            }

    return {
        'grouped_progress_data': grouped_progress_data,
        'muscle_group_summaries': muscle_group_summaries,
        'standards_by_exercise': standards_by_exercise,
        'benchmark_profile': benchmark_profile,
        'pr_timeline': pr_timeline,
        'exercises_for_benchmarks': exercises_for_benchmarks,
        'cardio_minutes_by_week': cardio_minutes_by_week,
        'cardio_calories_trend': cardio_calories_trend,
        'strength_standards': strength_standards,
    }

def estimate_treadmill_interval_calories(weight_kg, speed_kmh, incline_pct, time_seconds, age=None, height_cm=None):
    if not weight_kg or not speed_kmh or not time_seconds or time_seconds <= 0:
        return 0
    speed_m_per_min = float(speed_kmh) * 1000 / 60
    grade = max(float(incline_pct or 0), 0) / 100
    if speed_m_per_min < 134:
        vo2 = 3.5 + (0.1 * speed_m_per_min) + (1.8 * speed_m_per_min * grade)
    else:
        vo2 = 3.5 + (0.2 * speed_m_per_min) + (0.9 * speed_m_per_min * grade)

    profile_factor = 1.0
    if age:
        profile_factor *= max(0.95, min(1.08, 1 + ((float(age) - 25) * 0.002)))
    if height_cm and weight_kg:
        height_m = float(height_cm) / 100
        if height_m > 0:
            bmi = float(weight_kg) / (height_m * height_m)
            profile_factor *= max(0.95, min(1.08, 1 + ((bmi - 22) * 0.01)))

    minutes = float(time_seconds) / 60
    calories_per_min = ((vo2 * float(weight_kg)) / 200) * profile_factor
    return round(calories_per_min * minutes, 1)

def estimate_hiit_interval_calories(weight_kg, sprint_seconds, rest_seconds):
    if not weight_kg:
        return 0
    sprint_seconds = max(int(sprint_seconds or 0), 0)
    rest_seconds = max(int(rest_seconds or 0), 0)
    if sprint_seconds <= 0 and rest_seconds <= 0:
        return 0

    sprint_minutes = sprint_seconds / 60
    rest_minutes = rest_seconds / 60
    sprint_met = 11.0
    rest_met = 1.8
    calories_per_min = (3.5 * float(weight_kg)) / 200
    return round((((sprint_met * sprint_minutes) + (rest_met * rest_minutes)) * calories_per_min), 1)

def get_effective_weight_for_date(conn, target_date):
    row = conn.execute(
        'SELECT weight_kg FROM body_stats WHERE log_date <= ? ORDER BY log_date DESC, id DESC LIMIT 1',
        (target_date,)
    ).fetchone()
    if row and row['weight_kg']:
        return float(row['weight_kg'])
    fallback = conn.execute('SELECT weight_kg FROM body_stats ORDER BY log_date DESC, id DESC LIMIT 1').fetchone()
    return float(fallback['weight_kg']) if fallback and fallback['weight_kg'] else None

def get_diet_settings(conn):
    defaults = {
        'diet_height_cm': '178',
        'diet_body_fat_pct': '25',
        'diet_sex': 'male',
        'diet_awake_hours_override': ''
    }
    rows = conn.execute(
        "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('diet_height_cm','diet_body_fat_pct','diet_sex','diet_awake_hours_override')"
    ).fetchall()
    settings = defaults.copy()
    for row in rows:
        settings[row['setting_key']] = row['setting_value'] if row['setting_value'] is not None else defaults.get(row['setting_key'], '')
    return settings

def get_awake_hours_for_date(conn, target_date, override_value=None):
    if override_value not in (None, ''):
        try:
            return float(override_value), 'manual override'
        except (TypeError, ValueError):
            pass

    same_day = conn.execute('SELECT total_hours FROM sleep_logs WHERE sleep_date=?', (target_date,)).fetchone()
    if same_day and same_day['total_hours'] is not None:
        return max(0.0, 24.0 - float(same_day['total_hours'])), 'sleep log'

    latest = conn.execute('SELECT total_hours FROM sleep_logs ORDER BY sleep_date DESC LIMIT 1').fetchone()
    if latest and latest['total_hours'] is not None:
        return max(0.0, 24.0 - float(latest['total_hours'])), 'latest sleep log'

    return 16.0, 'default estimate'

def calculate_maintenance_calories(weight_kg, body_fat_pct, awake_hours):
    if not weight_kg:
        return None
    bf = float(body_fat_pct or 25)
    lean_mass = float(weight_kg) * max(0.0, 1 - (bf / 100.0))
    bmr = 370 + (21.6 * lean_mass)
    activity_factor = 1.15 + (max(float(awake_hours or 16) - 8.0, 0) * 0.025)
    return round(bmr * activity_factor)

def calculate_protein_target(weight_kg):
    if not weight_kg:
        return None
    return round(float(weight_kg) * 1.8, 1)

def build_diet_payload(conn, selected_date):
    settings = get_diet_settings(conn)
    selected_weight = get_effective_weight_for_date(conn, selected_date)
    awake_hours, awake_source = get_awake_hours_for_date(conn, selected_date, settings.get('diet_awake_hours_override'))
    maintenance_calories = calculate_maintenance_calories(selected_weight, settings.get('diet_body_fat_pct'), awake_hours)
    protein_target = calculate_protein_target(selected_weight)

    entries = conn.execute(
        'SELECT * FROM diet_food_entries WHERE log_date=? ORDER BY CASE meal_type WHEN "breakfast" THEN 1 WHEN "lunch" THEN 2 WHEN "dinner" THEN 3 ELSE 4 END, created_at ASC, id ASC',
        (selected_date,)
    ).fetchall()
    saved_meals = conn.execute('SELECT * FROM diet_saved_meals ORDER BY created_at DESC, name').fetchall()

    meal_groups = []
    grouped = defaultdict(list)
    for entry in entries:
        grouped[entry['meal_type']].append(dict(entry))
    meal_order = [('breakfast', 'Breakfast'), ('lunch', 'Lunch'), ('dinner', 'Dinner'), ('snack', 'Snacks')]
    for key, label in meal_order:
        rows = grouped.get(key, [])
        meal_groups.append({
            'key': key,
            'label': label,
            'items': rows,
            'calories': round(sum(float(row['calories'] or 0) for row in rows), 1),
            'protein_g': round(sum(float(row['protein_g'] or 0) for row in rows), 1)
        })

    daily_totals = {
        'calories': round(sum(float(e['calories'] or 0) for e in entries), 1),
        'protein_g': round(sum(float(e['protein_g'] or 0) for e in entries), 1),
        'carbs_g': round(sum(float(e['carbs_g'] or 0) for e in entries), 1),
        'fat_g': round(sum(float(e['fat_g'] or 0) for e in entries), 1),
    }
    net_calories = round(daily_totals['calories'] - maintenance_calories, 1) if maintenance_calories is not None else None

    chart_rows = conn.execute('''
        SELECT log_date,
               ROUND(SUM(calories), 1) as calories,
               ROUND(SUM(protein_g), 1) as protein_g
        FROM diet_food_entries
        GROUP BY log_date
        ORDER BY log_date ASC
    ''').fetchall()
    deficit_chart = []
    protein_chart = []
    for row in chart_rows:
        log_date = row['log_date']
        day_weight = get_effective_weight_for_date(conn, log_date)
        day_awake_hours, _ = get_awake_hours_for_date(conn, log_date, settings.get('diet_awake_hours_override'))
        day_maintenance = calculate_maintenance_calories(day_weight, settings.get('diet_body_fat_pct'), day_awake_hours)
        day_protein_target = calculate_protein_target(day_weight)
        calories = float(row['calories'] or 0)
        protein = float(row['protein_g'] or 0)
        deficit_chart.append({
            'date': log_date,
            'net': round(calories - day_maintenance, 1) if day_maintenance is not None else calories,
            'maintenance': day_maintenance,
            'consumed': calories
        })
        protein_chart.append({
            'date': log_date,
            'protein_g': round(protein, 1),
            'target_g': day_protein_target
        })

    return {
        'selected_date': selected_date,
        'diet_settings': settings,
        'selected_weight': selected_weight,
        'awake_hours': round(awake_hours, 1) if awake_hours is not None else None,
        'awake_source': awake_source,
        'maintenance_calories': maintenance_calories,
        'protein_target': protein_target,
        'meal_groups': meal_groups,
        'daily_totals': daily_totals,
        'net_calories': net_calories,
        'saved_meals': [dict(row) for row in saved_meals],
        'deficit_chart': deficit_chart,
        'protein_chart': protein_chart
    }

def calculate_cardio_session_metrics(conn, session_id, session_date, profile=None):
    workout_type = conn.execute('''
        SELECT wt.name
        FROM workout_sessions ws
        JOIN workout_types wt ON wt.id = ws.workout_type_id
        WHERE ws.id=?
    ''', (session_id,)).fetchone()
    workout_name = workout_type['name'] if workout_type else ''

    interval_rows = conn.execute('''
        SELECT time_seconds, speed, incline
        FROM workout_exercise_logs
        WHERE session_id=? AND set_type='interval'
        ORDER BY set_number, id
    ''', (session_id,)).fetchall()
    if not interval_rows:
        return None

    weight_kg = get_effective_weight_for_date(conn, session_date)
    total_seconds = 0
    total_calories = 0.0
    for row in interval_rows:
        time_seconds = int(row['time_seconds'] or 0)
        if workout_name == 'HIIT Cardio':
            rest_seconds = int(float(row['incline'] or 0))
            total_seconds += time_seconds + rest_seconds
            if weight_kg and (time_seconds > 0 or rest_seconds > 0):
                total_calories += estimate_hiit_interval_calories(weight_kg, time_seconds, rest_seconds)
        else:
            total_seconds += time_seconds
        if workout_name != 'HIIT Cardio' and weight_kg and row['speed'] and time_seconds > 0:
            total_calories += estimate_treadmill_interval_calories(
                weight_kg,
                float(row['speed']),
                float(row['incline']) if row['incline'] is not None else 0,
                time_seconds,
                profile['age'] if profile and profile['age'] else None,
                profile['height_cm'] if profile and profile['height_cm'] else None,
            )

    duration_minutes = round(total_seconds / 60, 1) if total_seconds else None
    if duration_minutes and float(duration_minutes).is_integer():
        duration_minutes = int(duration_minutes)
    return {
        'duration_minutes': duration_minutes,
        'calories_burned': round(total_calories, 1) if total_calories > 0 else 0.0,
        'weight_kg': weight_kg,
    }

def hydrate_cardio_session_metrics(conn, session_row, profile=None, persist=False):
    session = dict(session_row)
    if not session.get('is_cardio'):
        return session

    needs_duration = session.get('duration_minutes') in (None, 0, 0.0)
    needs_calories = float(session.get('calories_burned') or 0) <= 0
    if not (needs_duration or needs_calories):
        return session

    metrics = calculate_cardio_session_metrics(conn, session['id'], session['session_date'], profile=profile)
    if not metrics:
        return session

    if needs_duration:
        session['duration_minutes'] = metrics['duration_minutes']
    if needs_calories:
        session['calories_burned'] = metrics['calories_burned']

    if persist and (needs_duration or needs_calories):
        conn.execute('''
            UPDATE workout_sessions
            SET duration_minutes=?, calories_burned=?
            WHERE id=?
        ''', (
            session.get('duration_minutes'),
            session.get('calories_burned') or 0,
            session['id'],
        ))

    return session

# ===== DASHBOARD =====
@app.route('/')
def dashboard():
    return render_template('dashboard.html', **build_dashboard_payload())

@app.route('/manifest.webmanifest')
def web_manifest():
    return send_from_directory(app.static_folder, 'manifest.webmanifest', mimetype='application/manifest+json')

@app.route('/sw.js')
def service_worker():
    return send_from_directory(app.static_folder, 'sw.js', mimetype='application/javascript')

@app.route('/weekly-review')
def weekly_review():
    flash('Weekly Review has been removed.', 'success')
    return redirect(url_for('dashboard'))

# ===== JOURNAL =====
@app.route('/journal')
def journal():
    conn = get_db()
    entries = conn.execute('SELECT * FROM journal_entries ORDER BY entry_date DESC, entry_type ASC LIMIT 30').fetchall()
    conn.close()
    return render_template('journal.html', entries=entries)

@app.route('/journal/new/<entry_type>')
def journal_new(entry_type):
    entry_day = date.today()
    settings = get_settings()
    if entry_type == 'night' and settings.get('journal_night_after_midnight_to_yesterday', 'false') == 'true':
        now = datetime.now()
        if now.hour < 6:
            entry_day = entry_day - timedelta(days=1)
    return render_template('journal_form.html', entry_type=entry_type, entry_date=entry_day.isoformat(), entry=None)

@app.route('/journal/edit/<int:entry_id>')
def journal_edit(entry_id):
    conn = get_db()
    entry = conn.execute('SELECT * FROM journal_entries WHERE id=?', (entry_id,)).fetchone()
    conn.close()
    if not entry:
        flash('Entry not found', 'error')
        return redirect(url_for('journal'))
    return render_template('journal_form.html', entry_type=entry['entry_type'], entry_date=entry['entry_date'], entry=entry)

@app.route('/journal/save', methods=['POST'])
def journal_save():
    d = request.form
    entry_day = d.get('entry_date')
    settings = get_settings()
    if not d.get('entry_id') and d.get('entry_type') == 'night' and settings.get('journal_night_after_midnight_to_yesterday', 'false') == 'true':
        now = datetime.now()
        default_entry_day = (date.today() - timedelta(days=1)).isoformat() if now.hour < 6 else date.today().isoformat()
        if entry_day == date.today().isoformat():
            entry_day = default_entry_day
    conn = get_db()
    eid = d.get('entry_id')
    if eid:
        conn.execute('UPDATE journal_entries SET content=?, gratitude_1=?, gratitude_2=?, gratitude_3=?, gratitude_4=?, gratitude_5=?, gratitude_6=?, gratitude_7=?, mood=?, tags=? WHERE id=?',
            (d.get('content'), d.get('gratitude_1'), d.get('gratitude_2'), d.get('gratitude_3'),
             d.get('gratitude_4'), d.get('gratitude_5'), d.get('gratitude_6'), d.get('gratitude_7'),
             d.get('mood'), d.get('tags'), eid))
    else:
        conn.execute('INSERT INTO journal_entries (entry_date,entry_type,content,gratitude_1,gratitude_2,gratitude_3,gratitude_4,gratitude_5,gratitude_6,gratitude_7,mood,tags) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
            (entry_day, d.get('entry_type'), d.get('content'),
             d.get('gratitude_1'), d.get('gratitude_2'), d.get('gratitude_3'),
             d.get('gratitude_4'), d.get('gratitude_5'), d.get('gratitude_6'),
             d.get('gratitude_7'), d.get('mood'), d.get('tags')))
    conn.commit()
    conn.close()
    flash('Journal entry saved!', 'success')
    return redirect(url_for('journal'))

@app.route('/journal/delete/<int:entry_id>', methods=['POST'])
def journal_delete(entry_id):
    conn = get_db()
    conn.execute('DELETE FROM journal_entries WHERE id=?', (entry_id,))
    conn.commit()
    conn.close()
    flash('Entry deleted', 'success')
    return redirect(url_for('journal'))

# ===== HABITS =====
@app.route('/habits')
def habits():
    conn = get_db()
    all_habits = conn.execute("SELECT *, COALESCE(NULLIF(category, ''), 'General') as category FROM habits WHERE is_active=1 ORDER BY category, name").fetchall()
    end = date.today()
    start = end - timedelta(days=13)
    habit_logs = {}
    for h in all_habits:
        logs = conn.execute('SELECT log_date, completed FROM habit_logs WHERE habit_id=? AND log_date BETWEEN ? AND ? ORDER BY log_date',
            (h['id'], start.isoformat(), end.isoformat())).fetchall()
        habit_logs[h['id']] = {l['log_date']: l['completed'] for l in logs}
    habit_streaks = {}
    for h in all_habits:
        streak = 0
        d = date.today()
        while True:
            if not is_habit_due_on(h, d):
                d -= timedelta(days=1)
                continue
            ds = d.isoformat()
            if habit_logs.get(h['id'], {}).get(ds) == 1:
                streak += 1
                d -= timedelta(days=1)
            elif d == date.today() and ds not in habit_logs.get(h['id'], {}):
                d -= timedelta(days=1)
            else:
                break
        habit_streaks[h['id']] = streak
    date_range = [(start + timedelta(days=i)).isoformat() for i in range(14)]
    conn.close()
    return render_template('habits.html', habits=all_habits, habit_logs=habit_logs, date_range=date_range, habit_streaks=habit_streaks)

@app.route('/habits/toggle', methods=['POST'])
def habits_toggle():
    data = request.json
    hid, ld = data['habit_id'], data['date']
    conn = get_db()
    ex = conn.execute('SELECT * FROM habit_logs WHERE habit_id=? AND log_date=?', (hid, ld)).fetchone()
    if ex:
        conn.execute('UPDATE habit_logs SET completed=? WHERE habit_id=? AND log_date=?', (0 if ex['completed'] else 1, hid, ld))
    else:
        conn.execute('INSERT INTO habit_logs (habit_id,log_date,completed) VALUES (?,?,1)', (hid, ld))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/habits/add', methods=['POST'])
def habits_add():
    d = request.form
    conn = get_db()
    category = (d.get('category') or 'General').strip()
    conn.execute('INSERT INTO habits (name,description,frequency_type,days_of_week,color,category) VALUES (?,?,?,?,?,?)',
        (d.get('name'), d.get('description'), 'daily', None, d.get('color', '#3b82f6'), category))
    conn.commit()
    conn.close()
    return redirect(url_for('habits'))

@app.route('/habits/edit/<int:hid>', methods=['POST'])
def habits_edit(hid):
    d = request.form
    conn = get_db()
    category = (d.get('category') or 'General').strip()
    conn.execute('UPDATE habits SET name=?, description=?, color=?, category=? WHERE id=?',
        (d.get('name'), d.get('description'), d.get('color', '#3b82f6'), category, hid))
    conn.commit()
    conn.close()
    return redirect(url_for('habits'))

@app.route('/habits/delete/<int:hid>', methods=['POST'])
def habits_delete(hid):
    conn = get_db()
    conn.execute('DELETE FROM habits WHERE id=?', (hid,))
    conn.commit()
    conn.close()
    return redirect(url_for('habits'))

# ===== GYM =====
@app.route('/gym')
def gym():
    conn = get_db()
    edit_weight_id = request.args.get('edit_weight_id', type=int)
    edit_steps_id = request.args.get('edit_steps_id', type=int)
    history_days = request.args.get('history_days', default=30, type=int)
    if history_days not in (14, 30, 90, 180):
        history_days = 30
    cutoff_date = (date.today() - timedelta(days=history_days - 1)).isoformat()
    wt = conn.execute('SELECT * FROM workout_types').fetchall()
    recent = conn.execute('SELECT ws.*, wt.name as workout_name, wt.is_cardio FROM workout_sessions ws JOIN workout_types wt ON ws.workout_type_id=wt.id WHERE ws.session_date >= ? ORDER BY ws.session_date DESC LIMIT 50', (cutoff_date,)).fetchall()
    profile = conn.execute('SELECT * FROM user_profile WHERE id=1').fetchone()
    recent = [hydrate_cardio_session_metrics(conn, row, profile=profile, persist=True) for row in recent]
    conn.commit()
    body = conn.execute('SELECT * FROM body_stats WHERE log_date >= ? ORDER BY log_date DESC LIMIT 60', (cutoff_date,)).fetchall()
    steps = conn.execute('SELECT * FROM daily_steps WHERE log_date >= ? ORDER BY log_date DESC LIMIT 60', (cutoff_date,)).fetchall()
    weight_entries_count = conn.execute('SELECT COUNT(*) as c FROM body_stats').fetchone()['c']
    steps_entries_count = conn.execute('SELECT COUNT(*) as c FROM daily_steps').fetchone()['c']
    edit_weight = conn.execute('SELECT * FROM body_stats WHERE id=?', (edit_weight_id,)).fetchone() if edit_weight_id else None
    edit_steps = conn.execute('SELECT * FROM daily_steps WHERE id=?', (edit_steps_id,)).fetchone() if edit_steps_id else None
    conn.close()
    return render_template('gym.html',
        workout_types=wt,
        recent_sessions=recent,
        body_stats=body,
        step_logs=steps,
        weight_entries_count=weight_entries_count,
        steps_entries_count=steps_entries_count,
        today=date.today().isoformat(),
        edit_weight=edit_weight,
        edit_steps=edit_steps,
        history_days=history_days)

@app.route('/gym/progress')
def gym_progress():
    conn = get_db()
    payload = build_gym_progress_payload(conn)
    measurements_payload = build_body_measurements_payload(conn)
    body = conn.execute('SELECT * FROM body_stats ORDER BY log_date DESC LIMIT 60').fetchall()
    steps = conn.execute('SELECT * FROM daily_steps ORDER BY log_date DESC LIMIT 180').fetchall()
    conn.close()
    return render_template('gym_progress.html',
        grouped_progress_data=payload['grouped_progress_data'],
        muscle_group_summaries=payload['muscle_group_summaries'],
        standards_by_exercise=payload['standards_by_exercise'],
        benchmark_profile=payload['benchmark_profile'],
        pr_timeline=payload['pr_timeline'],
        cardio_minutes_by_week=payload['cardio_minutes_by_week'],
        cardio_calories_trend=payload['cardio_calories_trend'],
        strength_standards=payload['strength_standards'],
        body_measurements=measurements_payload,
        body_stats=body,
        step_logs=[dict(row) for row in steps])

@app.route('/gym/measurements/save', methods=['POST'])
def gym_measurements_save():
    conn = get_db()
    measurement_date = request.form.get('measurement_date') or date.today().isoformat()
    conn.execute(
        'INSERT OR REPLACE INTO app_settings (setting_key,setting_value) VALUES (?,?)',
        ('body_measurements_date', measurement_date)
    )
    for key, _label in BODY_MEASUREMENT_FIELDS:
        raw_value = (request.form.get(key) or '').strip()
        conn.execute(
            'INSERT OR REPLACE INTO app_settings (setting_key,setting_value) VALUES (?,?)',
            (f'measurement_{key}', raw_value)
        )
    conn.commit()
    conn.close()
    flash('Body measurements saved.', 'success')
    return redirect(url_for('gym_progress'))

@app.route('/gym/session/<int:session_id>')
def gym_session_detail(session_id):
    conn = get_db()
    profile = conn.execute('SELECT * FROM user_profile WHERE id=1').fetchone()
    session = conn.execute('''
        SELECT ws.*, wt.name as workout_name, wt.is_cardio
        FROM workout_sessions ws
        JOIN workout_types wt ON wt.id = ws.workout_type_id
        WHERE ws.id=?
    ''', (session_id,)).fetchone()
    if not session:
        conn.close()
        flash('Session not found.', 'error')
        return redirect(url_for('gym'))
    session = hydrate_cardio_session_metrics(conn, session, profile=profile, persist=True)
    conn.commit()

    exercise_logs = conn.execute('''
        SELECT e.name as exercise_name, e.muscle_group, wel.*
        FROM workout_exercise_logs wel
        JOIN exercises e ON e.id = wel.exercise_id
        WHERE wel.session_id=?
        ORDER BY e.name, wel.set_number
    ''', (session_id,)).fetchall()
    stretch_logs = conn.execute('''
        SELECT ws.name as stretch_name, ws.tracking_type, ssl.*
        FROM session_stretch_logs ssl
        JOIN workout_stretches ws ON ws.id = ssl.stretch_id
        WHERE ssl.session_id=?
        ORDER BY ws.name, ssl.set_number
    ''', (session_id,)).fetchall()
    conn.close()
    return render_template('gym_session_detail.html', session=session, exercise_logs=exercise_logs, stretch_logs=stretch_logs)

@app.route('/gym/session/delete/<int:session_id>', methods=['POST'])
def gym_session_delete(session_id):
    conn = get_db()
    conn.execute('DELETE FROM workout_sessions WHERE id=?', (session_id,))
    conn.commit()
    conn.close()
    flash('Workout session deleted.', 'success')
    return redirect(url_for('gym'))

@app.route('/gym/exercises/<int:wt_id>')
def gym_exercises(wt_id):
    conn = get_db()
    wt = conn.execute('SELECT * FROM workout_types WHERE id=?', (wt_id,)).fetchone()
    exercises = conn.execute('SELECT * FROM exercises WHERE workout_type_id=? AND is_active=1 ORDER BY order_index, id', (wt_id,)).fetchall()
    archived_exercises = conn.execute('SELECT * FROM exercises WHERE workout_type_id=? AND is_active=0 ORDER BY order_index, id, name', (wt_id,)).fetchall()
    conn.close()
    return jsonify({
        'workout_type': dict(wt),
        'exercises': [dict(e) for e in exercises],
        'archived_exercises': [dict(e) for e in archived_exercises]
    })

@app.route('/gym/stretches/<int:wt_id>')
def gym_stretches(wt_id):
    conn = get_db()
    wt = conn.execute('SELECT * FROM workout_types WHERE id=?', (wt_id,)).fetchone()
    stretches = conn.execute('SELECT * FROM workout_stretches WHERE workout_type_id=? AND is_active=1 ORDER BY order_index, name', (wt_id,)).fetchall()
    archived_stretches = conn.execute('SELECT * FROM workout_stretches WHERE workout_type_id=? AND is_active=0 ORDER BY order_index, name', (wt_id,)).fetchall()
    conn.close()
    return jsonify({
        'workout_type': dict(wt),
        'stretches': [dict(s) for s in stretches],
        'archived_stretches': [dict(s) for s in archived_stretches]
    })

@app.route('/gym/exercise/add', methods=['POST'])
def gym_exercise_add():
    d = request.form
    conn = get_db()
    wt = conn.execute('SELECT is_cardio FROM workout_types WHERE id=?', (d['workout_type_id'],)).fetchone()
    mx = conn.execute('SELECT MAX(order_index) as m FROM exercises WHERE workout_type_id=?', (d['workout_type_id'],)).fetchone()
    is_cardio = wt['is_cardio'] if wt else 0
    muscle_group = normalize_muscle_group(d.get('muscle_group'), bool(is_cardio))
    conn.execute('INSERT INTO exercises (name,workout_type_id,muscle_group,is_cardio,order_index) VALUES (?,?,?,?,?)',
        (d['name'], d['workout_type_id'], muscle_group, is_cardio, (mx['m'] or 0) + 1))
    conn.commit()
    conn.close()
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({'success': True})
    flash('Exercise added!', 'success')
    return redirect(url_for('gym'))

@app.route('/gym/exercise/reorder/<int:eid>', methods=['POST'])
def gym_exercise_reorder(eid):
    direction = ((request.form.get('direction') if request.form else None) or
        ((request.get_json(silent=True) or {}).get('direction')) or '').strip().lower()
    if direction not in {'up', 'down'}:
        return jsonify({'success': False, 'error': 'Invalid direction'}), 400

    conn = get_db()
    exercise = conn.execute('SELECT id, workout_type_id FROM exercises WHERE id=?', (eid,)).fetchone()
    if not exercise:
        conn.close()
        return jsonify({'success': False, 'error': 'Exercise not found'}), 404

    exercises = conn.execute(
        'SELECT id, order_index FROM exercises WHERE workout_type_id=? AND is_active=1 ORDER BY order_index, id',
        (exercise['workout_type_id'],)
    ).fetchall()
    exercise_ids = [row['id'] for row in exercises]
    if eid not in exercise_ids:
        conn.close()
        return jsonify({'success': False, 'error': 'Exercise not reorderable'}), 400

    current_index = exercise_ids.index(eid)
    target_index = current_index - 1 if direction == 'up' else current_index + 1
    if target_index < 0 or target_index >= len(exercises):
        conn.close()
        return jsonify({'success': True, 'moved': False})

    current_row = exercises[current_index]
    target_row = exercises[target_index]
    conn.execute('UPDATE exercises SET order_index=? WHERE id=?', (target_row['order_index'], current_row['id']))
    conn.execute('UPDATE exercises SET order_index=? WHERE id=?', (current_row['order_index'], target_row['id']))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'moved': True})

@app.route('/gym/stretch/add', methods=['POST'])
def gym_stretch_add():
    d = request.form
    conn = get_db()
    mx = conn.execute('SELECT MAX(order_index) as m FROM workout_stretches WHERE workout_type_id=?', (d['workout_type_id'],)).fetchone()
    conn.execute('INSERT INTO workout_stretches (name,workout_type_id,tracking_type,order_index) VALUES (?,?,?,?)',
        (d['name'], d['workout_type_id'], d.get('tracking_type', 'seconds'), (mx['m'] or 0) + 1))
    conn.commit()
    conn.close()
    flash('Stretch added!', 'success')
    return redirect(url_for('gym'))

@app.route('/gym/exercise/delete/<int:eid>', methods=['POST'])
def gym_exercise_delete(eid):
    conn = get_db()
    conn.execute('UPDATE exercises SET is_active=0 WHERE id=?', (eid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/gym/exercise/restore/<int:eid>', methods=['POST'])
def gym_exercise_restore(eid):
    conn = get_db()
    conn.execute('UPDATE exercises SET is_active=1 WHERE id=?', (eid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/gym/stretch/delete/<int:sid>', methods=['POST'])
def gym_stretch_delete(sid):
    conn = get_db()
    conn.execute('UPDATE workout_stretches SET is_active=0 WHERE id=?', (sid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/gym/stretch/restore/<int:sid>', methods=['POST'])
def gym_stretch_restore(sid):
    conn = get_db()
    conn.execute('UPDATE workout_stretches SET is_active=1 WHERE id=?', (sid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/gym/session/new/<int:wt_id>')
def gym_session_new(wt_id):
    conn = get_db()
    wt = conn.execute('SELECT * FROM workout_types WHERE id=?', (wt_id,)).fetchone()
    exercises = conn.execute('SELECT * FROM exercises WHERE workout_type_id=? AND is_active=1 ORDER BY order_index', (wt_id,)).fetchall()
    if wt and wt['is_cardio'] and not exercises:
        conn.execute('INSERT INTO exercises (name,workout_type_id,is_cardio,order_index,is_active) VALUES (?,?,?,?,1)',
            ('Treadmill', wt_id, 1, 1))
        conn.commit()
        exercises = conn.execute('SELECT * FROM exercises WHERE workout_type_id=? AND is_active=1 ORDER BY order_index', (wt_id,)).fetchall()
    stretches = conn.execute('SELECT * FROM workout_stretches WHERE workout_type_id=? AND is_active=1 ORDER BY order_index, name', (wt_id,)).fetchall()
    profile = conn.execute('SELECT * FROM user_profile WHERE id=1').fetchone()
    latest_weight = conn.execute('SELECT weight_kg, log_date FROM body_stats ORDER BY log_date DESC, id DESC LIMIT 1').fetchone()
    last_performance = {}
    for exercise in exercises:
        params = (exercise['name'].strip().lower(),)
        if wt and wt['is_cardio']:
            row = conn.execute('''
                SELECT ws.session_date, wt.name as workout_name, wel.time_seconds, wel.incline, wel.speed
                FROM workout_exercise_logs wel
                JOIN exercises e ON e.id = wel.exercise_id
                JOIN workout_sessions ws ON ws.id = wel.session_id
                JOIN workout_types wt ON wt.id = ws.workout_type_id
                WHERE lower(trim(e.name)) = ? AND wel.set_type='interval'
                ORDER BY ws.session_date DESC, wel.id DESC
                LIMIT 1
            ''', params).fetchone()
            if row:
                summary = f"{row['speed'] or 0} km/h · {row['incline'] or 0}% · {row['time_seconds'] or 0}s"
                if row['workout_name'] == 'HIIT Cardio':
                    summary = f"{int(row['time_seconds'] or 0)}s sprint · {int(float(row['incline'] or 0))}s rest"
                last_performance[exercise['id']] = {
                    'summary': summary,
                    'date': row['session_date'],
                    'workout_name': row['workout_name']
                }
        else:
            rows = conn.execute('''
                SELECT ws.session_date, wt.name as workout_name, wel.reps, wel.weight_kg
                FROM workout_exercise_logs wel
                JOIN exercises e ON e.id = wel.exercise_id
                JOIN workout_sessions ws ON ws.id = wel.session_id
                JOIN workout_types wt ON wt.id = ws.workout_type_id
                WHERE lower(trim(e.name)) = ? AND wel.set_type='working'
                ORDER BY ws.session_date DESC, wel.id DESC
            ''', params).fetchall()
            latest_row = None
            latest_session_date = None
            for row in rows:
                if latest_session_date is None:
                    latest_session_date = row['session_date']
                if row['session_date'] != latest_session_date:
                    break
                if is_better_strength_set(row, latest_row):
                    latest_row = row
            if latest_row:
                one_rm = round(calc_1rm(latest_row['weight_kg'] or 0, latest_row['reps'] or 0), 1) if latest_row['weight_kg'] and latest_row['reps'] else 0
                summary = f"{latest_row['weight_kg'] or 0}kg x {latest_row['reps'] or 0}"
                if one_rm:
                    summary += f" · est. 1RM {one_rm}kg"
                last_performance[exercise['id']] = {
                    'summary': summary,
                    'date': latest_row['session_date'],
                    'workout_name': latest_row['workout_name']
                }
    conn.close()
    return render_template('gym_session.html', workout_type=wt, exercises=exercises, today=date.today().isoformat(),
        profile=profile, latest_weight=latest_weight, stretches=stretches, last_performance=last_performance)

@app.route('/gym/session/save', methods=['POST'])
def gym_session_save():
    d = request.form
    conn = get_db()
    cur = conn.cursor()
    workout_type = conn.execute('SELECT * FROM workout_types WHERE id=?', (d['workout_type_id'],)).fetchone()
    is_outdoor_run = workout_type and workout_type['name'] == 'Outdoor Run'
    is_hiit_cardio = workout_type and workout_type['name'] == 'HIIT Cardio'
    profile = conn.execute('SELECT * FROM user_profile WHERE id=1').fetchone()
    latest_weight = conn.execute('SELECT weight_kg FROM body_stats ORDER BY log_date DESC, id DESC LIMIT 1').fetchone()
    current_weight = latest_weight['weight_kg'] if latest_weight else None
    total_calories = 0
    total_cardio_seconds = 0

    cur.execute('INSERT INTO workout_sessions (workout_type_id,session_date,duration_minutes,calories_burned,notes) VALUES (?,?,?,?,?)',
        (d['workout_type_id'], d['session_date'], d.get('duration_minutes') or None, 0, d.get('notes')))
    sid = cur.lastrowid

    if is_outdoor_run:
        # Outdoor run: single log entry per exercise using elapsed time, distance, pace
        exercise_ids = request.form.getlist('exercise_id')
        for eid in exercise_ids:
            elapsed_s = d.get(f'elapsed_seconds_{eid}') or None
            distance = d.get(f'distance_km_{eid}') or None
            # avg pace in sec/km (calculated from inputs, or submitted directly)
            pace_sec_km = None
            if elapsed_s and distance and float(distance) > 0:
                pace_sec_km = round(float(elapsed_s) / float(distance), 1)
            conn.execute(
                'INSERT INTO workout_exercise_logs (session_id,exercise_id,set_number,set_type,time_seconds,distance_km,speed) VALUES (?,?,?,?,?,?,?)',
                (sid, eid, 1, 'interval',
                 int(elapsed_s) if elapsed_s else None,
                 float(distance) if distance else None,
                 round(pace_sec_km / 60, 4) if pace_sec_km else None)  # store pace as min/km in speed col
            )
            if elapsed_s:
                total_cardio_seconds += int(elapsed_s)
            if current_weight and distance:
                # ~1.036 kcal per kg per km for running
                total_calories += float(distance) * float(current_weight) * 1.036
    elif is_hiit_cardio:
        exercise_ids = request.form.getlist('exercise_id')
        for eid in exercise_ids:
            set_nums = request.form.getlist(f'set_num_{eid}')
            for i, sn in enumerate(set_nums):
                sprint_s = request.form.getlist(f'time_{eid}')[i] if request.form.getlist(f'time_{eid}') else None
                rest_s = request.form.getlist(f'incline_{eid}')[i] if request.form.getlist(f'incline_{eid}') else None
                conn.execute('INSERT INTO workout_exercise_logs (session_id,exercise_id,set_number,set_type,time_seconds,incline,speed) VALUES (?,?,?,?,?,?,?)',
                    (sid, eid, int(sn), 'interval',
                     int(sprint_s) if sprint_s else None,
                     float(rest_s) if rest_s else None,
                     None))
                sprint_seconds = int(sprint_s) if sprint_s else 0
                rest_seconds = int(float(rest_s)) if rest_s else 0
                total_cardio_seconds += sprint_seconds + rest_seconds
                if current_weight and (sprint_seconds > 0 or rest_seconds > 0):
                    total_calories += estimate_hiit_interval_calories(current_weight, sprint_seconds, rest_seconds)
    else:
        exercise_ids = request.form.getlist('exercise_id')
        for eid in exercise_ids:
            set_nums = request.form.getlist(f'set_num_{eid}')
            for i, sn in enumerate(set_nums):
                set_type = request.form.getlist(f'set_type_{eid}')[i] if request.form.getlist(f'set_type_{eid}') else 'working'
                reps = request.form.getlist(f'reps_{eid}')[i] if request.form.getlist(f'reps_{eid}') else None
                weight = request.form.getlist(f'weight_{eid}')[i] if request.form.getlist(f'weight_{eid}') else None
                time_s = request.form.getlist(f'time_{eid}')[i] if request.form.getlist(f'time_{eid}') else None
                incline = request.form.getlist(f'incline_{eid}')[i] if request.form.getlist(f'incline_{eid}') else None
                speed = request.form.getlist(f'speed_{eid}')[i] if request.form.getlist(f'speed_{eid}') else None
                conn.execute('INSERT INTO workout_exercise_logs (session_id,exercise_id,set_number,set_type,reps,weight_kg,time_seconds,incline,speed) VALUES (?,?,?,?,?,?,?,?,?)',
                    (sid, eid, int(sn), set_type,
                     int(reps) if reps else None, float(weight) if weight else None,
                     int(time_s) if time_s else None, float(incline) if incline else None,
                     float(speed) if speed else None))
                if workout_type and workout_type['is_cardio'] and time_s:
                    total_cardio_seconds += int(time_s)
                if workout_type and workout_type['is_cardio'] and current_weight and time_s and speed:
                    total_calories += estimate_treadmill_interval_calories(
                        current_weight,
                        float(speed),
                        float(incline) if incline else 0,
                        int(time_s),
                        profile['age'] if profile and profile['age'] else None,
                        profile['height_cm'] if profile and profile['height_cm'] else None,
                    )

    stretch_ids = sorted({sid for sid in request.form.getlist('stretch_id') if sid}, key=int)
    for stretch_id in stretch_ids:
        stretch = conn.execute('SELECT tracking_type FROM workout_stretches WHERE id=?', (stretch_id,)).fetchone()
        completed = 1 if request.form.get(f'stretch_done_{stretch_id}') else 0
        values = request.form.getlist(f'stretch_value_{stretch_id}')
        set_numbers = request.form.getlist(f'stretch_set_num_{stretch_id}')
        notes = request.form.get(f'stretch_notes_{stretch_id}') or None
        saved_any = False
        for index, raw_value in enumerate(values):
            amount = raw_value or None
            duration = int(amount) if amount and stretch and stretch['tracking_type'] == 'seconds' else None
            if amount:
                conn.execute('INSERT INTO session_stretch_logs (session_id,stretch_id,set_number,completed,amount,duration_seconds,notes) VALUES (?,?,?,?,?,?,?)',
                    (sid, int(stretch_id), int(set_numbers[index]) if index < len(set_numbers) else index + 1,
                     completed, int(amount), duration, notes))
                saved_any = True
        if not saved_any and (completed or notes):
            conn.execute('INSERT INTO session_stretch_logs (session_id,stretch_id,set_number,completed,amount,duration_seconds,notes) VALUES (?,?,?,?,?,?,?)',
                (sid, int(stretch_id), 1, completed, None, None, notes))

    computed_duration = d.get('duration_minutes') or None
    if workout_type and workout_type['is_cardio'] and total_cardio_seconds > 0:
        computed_duration = round(total_cardio_seconds / 60, 1)
        if float(computed_duration).is_integer():
            computed_duration = int(computed_duration)

    if computed_duration is not None or total_calories > 0:
        conn.execute('UPDATE workout_sessions SET duration_minutes=?, calories_burned=? WHERE id=?',
            (computed_duration, round(total_calories, 1) if total_calories > 0 else 0, sid))
    conn.commit()
    conn.close()
    if total_calories > 0:
        flash(f'Workout saved! Estimated calories burned: {round(total_calories, 1)} kcal', 'success')
    else:
        flash('Workout saved!', 'success')
    return redirect(url_for('gym'))

@app.route('/gym/body-stats/add', methods=['POST'])
def body_stats_add():
    d = request.form
    conn = get_db()
    if d.get('entry_id'):
        conn.execute('UPDATE body_stats SET log_date=?, weight_kg=?, body_fat_percentage=?, notes=? WHERE id=?',
            (d['log_date'], float(d['weight_kg']), float(d['body_fat']) if d.get('body_fat') else None, d.get('notes'), d['entry_id']))
    else:
        conn.execute('INSERT INTO body_stats (log_date,weight_kg,body_fat_percentage,notes) VALUES (?,?,?,?)',
            (d['log_date'], float(d['weight_kg']), float(d['body_fat']) if d.get('body_fat') else None, d.get('notes')))
    conn.commit()
    conn.close()
    flash('Weight logged!', 'success')
    return redirect(url_for('gym'))

@app.route('/gym/body-stats/delete/<int:entry_id>', methods=['POST'])
def body_stats_delete(entry_id):
    conn = get_db()
    conn.execute('DELETE FROM body_stats WHERE id=?', (entry_id,))
    conn.commit()
    conn.close()
    flash('Weight entry deleted.', 'success')
    return redirect(url_for('gym'))

@app.route('/gym/steps/add', methods=['POST'])
def gym_steps_add():
    d = request.form
    conn = get_db()
    conn.execute('''
        INSERT INTO daily_steps (log_date, step_count, notes)
        VALUES (?, ?, ?)
        ON CONFLICT(log_date) DO UPDATE SET
            step_count=excluded.step_count,
            notes=excluded.notes
    ''', (d['log_date'], int(d['step_count']), d.get('notes')))
    conn.commit()
    conn.close()
    flash('Steps logged!', 'success')
    return redirect(url_for('gym'))

@app.route('/gym/steps/delete/<int:entry_id>', methods=['POST'])
def gym_steps_delete(entry_id):
    conn = get_db()
    conn.execute('DELETE FROM daily_steps WHERE id=?', (entry_id,))
    conn.commit()
    conn.close()
    flash('Steps entry deleted.', 'success')
    return redirect(url_for('gym'))

@app.route('/gym/profile/save', methods=['POST'])
def gym_profile_save():
    d = request.form
    conn = get_db()
    ex = conn.execute('SELECT id FROM user_profile WHERE id=1').fetchone()
    if ex:
        conn.execute('UPDATE user_profile SET height_cm=?, age=? WHERE id=1',
            (float(d['height_cm']) if d.get('height_cm') else None, int(d['age']) if d.get('age') else None))
    else:
        conn.execute('INSERT INTO user_profile (id,height_cm,age) VALUES (1,?,?)',
            (float(d['height_cm']) if d.get('height_cm') else None, int(d['age']) if d.get('age') else None))
    conn.commit()
    conn.close()
    flash('Profile saved!', 'success')
    return redirect(url_for('gym'))

@app.route('/gym/progress-data')
def gym_progress_data():
    conn = get_db()
    exercises = conn.execute('SELECT DISTINCT e.id, e.name, e.muscle_group FROM exercises e JOIN workout_exercise_logs wel ON wel.exercise_id=e.id WHERE e.is_cardio=0').fetchall()
    result = {}
    for ex in exercises:
        logs = conn.execute('''
            SELECT ws.session_date, wel.weight_kg, wel.reps
            FROM workout_exercise_logs wel JOIN workout_sessions ws ON wel.session_id=ws.id
            WHERE wel.exercise_id=? AND wel.set_type='working' AND wel.weight_kg > 0
            ORDER BY ws.session_date
        ''', (ex['id'],)).fetchall()
        if logs:
            best_logs_by_date = {}
            for log in logs:
                if is_better_strength_set(log, best_logs_by_date.get(log['session_date'])):
                    best_logs_by_date[log['session_date']] = log
            group = normalize_muscle_group(ex['muscle_group'])
            if group in {'Uncategorized', 'Core'}:
                continue
            result.setdefault(group, {})[ex['name']] = [
                {'date': session_date, '1rm': round(calc_1rm(log['weight_kg'], log['reps']), 1)}
                for session_date, log in sorted(best_logs_by_date.items())
                if log['reps']
            ]
    conn.close()
    return jsonify(result)

# ===== FINANCIAL =====
@app.route('/financial')
def financial():
    conn = get_db()
    history_days = request.args.get('history_days', default=30, type=int)
    if history_days not in (14, 30, 90, 180, 365):
        history_days = 30
    cutoff_date = (date.today() - timedelta(days=history_days - 1)).isoformat()
    edit_txn_id = request.args.get('edit_txn_id', type=int)
    txns = conn.execute('SELECT t.*, fc.name as cat_name, fc.type as cat_type FROM transactions t LEFT JOIN financial_categories fc ON t.category_id=fc.id WHERE t.transaction_date>=? ORDER BY t.transaction_date DESC, t.id DESC', (cutoff_date,)).fetchall()
    chart_txns = conn.execute('SELECT t.*, fc.name as cat_name, fc.type as cat_type FROM transactions t LEFT JOIN financial_categories fc ON t.category_id=fc.id WHERE t.transaction_date>=? ORDER BY t.transaction_date ASC, t.id ASC', (cutoff_date,)).fetchall()
    inc = sum(t['amount'] for t in txns if t['type']=='income')
    exp = sum(t['amount'] for t in txns if t['type']=='expense')
    cats = conn.execute('SELECT * FROM financial_categories ORDER BY type, name').fetchall()
    goals = conn.execute('SELECT * FROM savings_goals ORDER BY is_completed, created_at DESC').fetchall()
    expected = conn.execute('SELECT * FROM expected_cash ORDER BY is_received, expected_date, created_at DESC').fetchall()
    edit_txn = conn.execute('SELECT * FROM transactions WHERE id=?', (edit_txn_id,)).fetchone() if edit_txn_id else None
    currency_setting = conn.execute("SELECT setting_value FROM app_settings WHERE setting_key='currency_symbol'").fetchone()
    conn.close()
    return render_template('financial.html', transactions=txns, categories=cats, income_total=inc, expense_total=exp,
        savings_goals=goals, expected_cash=expected, currency=(currency_setting['setting_value'] if currency_setting else '$'),
        today=date.today().isoformat(), chart_transactions=[dict(t) for t in chart_txns], history_days=history_days, edit_txn=edit_txn)

@app.route('/financial/add', methods=['POST'])
def financial_add():
    d = request.form
    conn = get_db()
    if d.get('transaction_id'):
        conn.execute('UPDATE transactions SET transaction_date=?, type=?, category_id=?, amount=?, description=?, notes=? WHERE id=?',
            (d.get('transaction_date') or date.today().isoformat(), d['type'], d.get('category_id') or None, d['amount'], d['description'], d.get('notes'), d['transaction_id']))
    else:
        conn.execute('INSERT INTO transactions (transaction_date,type,category_id,amount,description,notes) VALUES (?,?,?,?,?,?)',
            (d.get('transaction_date') or date.today().isoformat(), d['type'], d.get('category_id') or None, d['amount'], d['description'], d.get('notes')))
    conn.commit()
    conn.close()
    return redirect(url_for('financial'))

@app.route('/financial/delete/<int:txn_id>', methods=['POST'])
def financial_delete(txn_id):
    conn = get_db()
    conn.execute('DELETE FROM transactions WHERE id=?', (txn_id,))
    conn.commit()
    conn.close()
    return redirect(url_for('financial'))

@app.route('/financial/expected/add', methods=['POST'])
def financial_expected_add():
    d = request.form
    conn = get_db()
    conn.execute('INSERT INTO expected_cash (source,amount,expected_date,notes) VALUES (?,?,?,?)',
        (d['source'], float(d['amount']), d.get('expected_date') or None, d.get('notes')))
    conn.commit()
    conn.close()
    return redirect(url_for('financial'))

@app.route('/financial/expected/toggle/<int:eid>', methods=['POST'])
def financial_expected_toggle(eid):
    conn = get_db()
    row = conn.execute('SELECT is_received FROM expected_cash WHERE id=?', (eid,)).fetchone()
    if row:
        conn.execute('UPDATE expected_cash SET is_received=? WHERE id=?', (0 if row['is_received'] else 1, eid))
    conn.commit()
    conn.close()
    return redirect(url_for('financial'))

@app.route('/financial/savings/add', methods=['POST'])
def financial_savings_add():
    d = request.form
    conn = get_db()
    conn.execute('INSERT INTO savings_goals (name,target_amount,current_amount,deadline,is_completed) VALUES (?,?,?,?,?)',
        (d['name'], float(d['target_amount']), float(d.get('current_amount') or 0), d.get('deadline') or None,
         1 if float(d.get('current_amount') or 0) >= float(d['target_amount']) else 0))
    conn.commit()
    conn.close()
    return redirect(url_for('financial'))

@app.route('/financial/savings/contribute/<int:gid>', methods=['POST'])
def financial_savings_contribute(gid):
    d = request.form
    amount = float(d.get('amount') or 0)
    conn = get_db()
    goal = conn.execute('SELECT * FROM savings_goals WHERE id=?', (gid,)).fetchone()
    if goal and amount > 0:
        new_amount = float(goal['current_amount'] or 0) + amount
        conn.execute('UPDATE savings_goals SET current_amount=?, is_completed=? WHERE id=?',
            (new_amount, 1 if new_amount >= goal['target_amount'] else 0, gid))
    conn.commit()
    conn.close()
    return redirect(url_for('financial'))

# ===== DIET =====
@app.route('/diet')
def diet():
    conn = get_db()
    selected_date = request.args.get('date') or date.today().isoformat()
    payload = build_diet_payload(conn, selected_date)
    conn.close()
    return render_template('diet.html', today=date.today().isoformat(), **payload)

@app.route('/diet/food/add', methods=['POST'])
def diet_food_add():
    d = request.form
    conn = get_db()
    log_date = d.get('log_date') or date.today().isoformat()
    conn.execute('''
        INSERT INTO diet_food_entries (log_date, meal_type, food_name, calories, protein_g, carbs_g, fat_g, notes)
        VALUES (?,?,?,?,?,?,?,?)
    ''', (
        log_date,
        d.get('meal_type') or 'snack',
        d.get('food_name'),
        float(d.get('calories') or 0),
        float(d.get('protein_g') or 0),
        float(d.get('carbs_g') or 0),
        float(d.get('fat_g') or 0),
        d.get('notes') or None
    ))
    if d.get('save_as_custom') == 'on':
        custom_name = (d.get('custom_meal_name') or d.get('food_name') or '').strip()
        if custom_name:
            conn.execute('''
                INSERT INTO diet_saved_meals (name, calories, protein_g, carbs_g, fat_g)
                VALUES (?,?,?,?,?)
                ON CONFLICT(name) DO UPDATE SET
                    calories=excluded.calories,
                    protein_g=excluded.protein_g,
                    carbs_g=excluded.carbs_g,
                    fat_g=excluded.fat_g
            ''', (
                custom_name,
                float(d.get('calories') or 0),
                float(d.get('protein_g') or 0),
                float(d.get('carbs_g') or 0),
                float(d.get('fat_g') or 0)
            ))
    conn.commit()
    conn.close()
    return redirect(url_for('diet', date=log_date))

@app.route('/diet/food/delete/<int:entry_id>', methods=['POST'])
def diet_food_delete(entry_id):
    log_date = request.form.get('log_date') or date.today().isoformat()
    conn = get_db()
    conn.execute('DELETE FROM diet_food_entries WHERE id=?', (entry_id,))
    conn.commit()
    conn.close()
    return redirect(url_for('diet', date=log_date))

@app.route('/diet/saved/add', methods=['POST'])
def diet_saved_add():
    d = request.form
    conn = get_db()
    conn.execute('''
        INSERT INTO diet_saved_meals (name, calories, protein_g, carbs_g, fat_g)
        VALUES (?,?,?,?,?)
        ON CONFLICT(name) DO UPDATE SET
            calories=excluded.calories,
            protein_g=excluded.protein_g,
            carbs_g=excluded.carbs_g,
            fat_g=excluded.fat_g
    ''', (
        d.get('name'),
        float(d.get('calories') or 0),
        float(d.get('protein_g') or 0),
        float(d.get('carbs_g') or 0),
        float(d.get('fat_g') or 0)
    ))
    conn.commit()
    conn.close()
    return redirect(url_for('diet', date=d.get('log_date') or date.today().isoformat()))

@app.route('/diet/saved/quick-add/<int:meal_id>', methods=['POST'])
def diet_saved_quick_add(meal_id):
    d = request.form
    log_date = d.get('log_date') or date.today().isoformat()
    conn = get_db()
    meal = conn.execute('SELECT * FROM diet_saved_meals WHERE id=?', (meal_id,)).fetchone()
    if meal:
        conn.execute('''
            INSERT INTO diet_food_entries (log_date, meal_type, food_name, calories, protein_g, carbs_g, fat_g)
            VALUES (?,?,?,?,?,?,?)
        ''', (
            log_date,
            d.get('meal_type') or 'snack',
            meal['name'],
            meal['calories'],
            meal['protein_g'],
            meal['carbs_g'],
            meal['fat_g']
        ))
        conn.commit()
    conn.close()
    return redirect(url_for('diet', date=log_date))

@app.route('/diet/saved/delete/<int:meal_id>', methods=['POST'])
def diet_saved_delete(meal_id):
    log_date = request.form.get('log_date') or date.today().isoformat()
    conn = get_db()
    conn.execute('DELETE FROM diet_saved_meals WHERE id=?', (meal_id,))
    conn.commit()
    conn.close()
    return redirect(url_for('diet', date=log_date))

@app.route('/diet/settings/save', methods=['POST'])
def diet_settings_save():
    d = request.form
    conn = get_db()
    for key in ['diet_height_cm', 'diet_body_fat_pct', 'diet_sex', 'diet_awake_hours_override']:
        conn.execute('INSERT OR REPLACE INTO app_settings (setting_key,setting_value) VALUES (?,?)', (key, d.get(key, '')))
    conn.commit()
    conn.close()
    return redirect(url_for('diet', date=d.get('selected_date') or date.today().isoformat()))

# ===== JOBS =====
@app.route('/jobs')
def jobs():
    flash('Jobs has been removed.', 'success')
    return redirect(url_for('dashboard'))

@app.route('/jobs/add', methods=['POST'])
def jobs_add():
    flash('Jobs has been removed.', 'success')
    return redirect(url_for('dashboard'))

# ===== TODOS =====
@app.route('/todos')
def todos():
    conn = get_db()
    ensure_todos_parent_column(conn)
    today = date.today().isoformat()
    filt = request.args.get('filter', 'all')
    sort = request.args.get('sort', 'priority')
    history_days = request.args.get('history_days', default=30, type=int)
    if history_days not in (14, 30, 90, 180):
        history_days = 30
    cutoff_date = (date.today() - timedelta(days=history_days - 1)).isoformat()
    edit_todo_id = request.args.get('edit_todo_id', type=int)
    q = 'SELECT * FROM todos WHERE status != "completed"'
    if filt == 'high':
        q += ' AND priority="high"'
    elif filt == 'medium':
        q += ' AND priority="medium"'
    elif filt == 'low':
        q += ' AND priority="low"'
    elif filt == 'today':
        q += f' AND due_date="{date.today().isoformat()}"'
    elif filt == 'overdue':
        q += f' AND due_date < "{date.today().isoformat()}" AND due_date IS NOT NULL'
    elif filt == 'upcoming':
        q += f' AND due_date > "{date.today().isoformat()}" AND due_date IS NOT NULL'
    if sort == 'date':
        q += ' ORDER BY due_date ASC NULLS LAST, priority DESC'
    else:
        q += ' ORDER BY CASE priority WHEN "high" THEN 1 WHEN "medium" THEN 2 WHEN "low" THEN 3 END, due_date ASC'
    pending_rows = conn.execute(q).fetchall()
    completed = conn.execute('SELECT * FROM todos WHERE status="completed" AND (date(completed_at) >= ? OR completed_at IS NULL) ORDER BY completed_at DESC LIMIT 60', (cutoff_date,)).fetchall()
    edit_todo = conn.execute('SELECT * FROM todos WHERE id=?', (edit_todo_id,)).fetchone() if edit_todo_id else None

    pending_ids = {row['id'] for row in pending_rows}
    child_map = defaultdict(list)
    pending = []
    for row in pending_rows:
        parent_id = row['parent_todo_id'] if 'parent_todo_id' in row.keys() else None
        if parent_id and parent_id in pending_ids:
            child_map[parent_id].append(row)
        else:
            pending.append(row)

    root_parents = conn.execute(
        'SELECT id, title FROM todos WHERE status != "completed" AND (parent_todo_id IS NULL OR parent_todo_id = 0) ORDER BY created_at DESC'
    ).fetchall()

    conn.close()
    return render_template('todos.html', pending=pending, completed=completed, current_filter=filt, current_sort=sort, today=today,
        history_days=history_days, edit_todo=edit_todo, child_map=child_map, root_parents=root_parents)

# ===== SHOPPING =====
@app.route('/shopping')
def shopping():
    conn = get_db()
    pending = conn.execute('SELECT * FROM shopping_items WHERE is_bought=0 ORDER BY created_at DESC').fetchall()
    bought = conn.execute('SELECT * FROM shopping_items WHERE is_bought=1 ORDER BY created_at DESC').fetchall()
    conn.close()
    return render_template('shopping.html', pending=pending, bought=bought)

@app.route('/shopping/add', methods=['POST'])
def shopping_add():
    d = request.form
    conn = get_db()
    conn.execute('INSERT INTO shopping_items (item_name,item_url,notes) VALUES (?,?,?)',
        (d['item_name'], d.get('item_url'), d.get('notes')))
    conn.commit()
    conn.close()
    return redirect(url_for('shopping'))

@app.route('/shopping/toggle/<int:item_id>', methods=['POST'])
def shopping_toggle(item_id):
    conn = get_db()
    item = conn.execute('SELECT is_bought FROM shopping_items WHERE id=?', (item_id,)).fetchone()
    if item:
        conn.execute('UPDATE shopping_items SET is_bought=? WHERE id=?', (0 if item['is_bought'] else 1, item_id))
    conn.commit()
    conn.close()
    return redirect(url_for('shopping'))

@app.route('/shopping/delete/<int:item_id>', methods=['POST'])
def shopping_delete(item_id):
    conn = get_db()
    conn.execute('DELETE FROM shopping_items WHERE id=?', (item_id,))
    conn.commit()
    conn.close()
    return redirect(url_for('shopping'))

@app.route('/todos/add', methods=['POST'])
def todos_add():
    d = request.form
    conn = get_db()
    ensure_todos_parent_column(conn)
    parent_todo_id = int(d.get('parent_todo_id')) if d.get('parent_todo_id') else None
    if d.get('todo_id'):
        conn.execute('UPDATE todos SET title=?, description=?, priority=?, due_date=?, due_time=?, category=?, parent_todo_id=? WHERE id=?',
            (d['title'], d.get('description'), d.get('priority','medium'), d.get('due_date') or None, d.get('due_time') or None, d.get('category'), parent_todo_id, d['todo_id']))
    else:
        conn.execute('INSERT INTO todos (title,description,priority,due_date,due_time,category,parent_todo_id) VALUES (?,?,?,?,?,?,?)',
            (d['title'], d.get('description'), d.get('priority','medium'), d.get('due_date') or None, d.get('due_time') or None, d.get('category'), parent_todo_id))
    conn.commit()
    conn.close()
    return redirect(url_for('todos'))

@app.route('/todos/complete/<int:tid>', methods=['POST'])
def todos_complete(tid):
    conn = get_db()
    conn.execute('UPDATE todos SET status="completed", completed_at=datetime("now") WHERE id=?', (tid,))
    conn.commit()
    conn.close()
    return redirect(url_for('todos'))

@app.route('/todos/reopen/<int:tid>', methods=['POST'])
def todos_reopen(tid):
    conn = get_db()
    conn.execute('UPDATE todos SET status="pending", completed_at=NULL WHERE id=?', (tid,))
    conn.commit()
    conn.close()
    return redirect(url_for('todos'))

@app.route('/todos/delete/<int:tid>', methods=['POST'])
def todos_delete(tid):
    conn = get_db()
    conn.execute('DELETE FROM todos WHERE id=? OR parent_todo_id=?', (tid, tid))
    conn.commit()
    conn.close()
    return redirect(url_for('todos'))

# ===== ROUTINES =====
@app.route('/routines')
def routines():
    conn = get_db()
    morning = conn.execute('SELECT * FROM routines WHERE routine_type="morning" AND is_active=1').fetchone()
    night = conn.execute('SELECT * FROM routines WHERE routine_type="night" AND is_active=1').fetchone()
    morning_items = conn.execute('SELECT * FROM routine_items WHERE routine_id=? AND is_active=1 ORDER BY order_index', (morning['id'],)).fetchall() if morning else []
    night_items = conn.execute('SELECT * FROM routine_items WHERE routine_id=? AND is_active=1 ORDER BY order_index', (night['id'],)).fetchall() if night else []
    today = date.today().isoformat()
    ml = conn.execute('SELECT * FROM routine_logs WHERE routine_id=? AND log_date=?', (morning['id'] if morning else 0, today)).fetchone() if morning else None
    nl = conn.execute('SELECT * FROM routine_logs WHERE routine_id=? AND log_date=?', (night['id'] if night else 0, today)).fetchone() if night else None
    conn.close()
    m_completed = json.loads(ml['completed_items']) if ml and ml['completed_items'] else []
    n_completed = json.loads(nl['completed_items']) if nl and nl['completed_items'] else []
    return render_template('routines.html', morning=morning, night=night, morning_items=morning_items, night_items=night_items,
                         m_completed=m_completed, n_completed=n_completed, today=today)

@app.route('/routines/create', methods=['POST'])
def routines_create():
    d = request.form
    rt = d['routine_type']
    conn = get_db()
    conn.execute('UPDATE routines SET is_active=0 WHERE routine_type=?', (rt,))
    cur = conn.cursor()
    cur.execute('INSERT INTO routines (name,routine_type) VALUES (?,?)', (d.get('name', f'{rt.title()} Routine'), rt))
    rid = cur.lastrowid
    items = [i.strip() for i in d.get('items','').split('\n') if i.strip()]
    for idx, item in enumerate(items):
        conn.execute('INSERT INTO routine_items (routine_id,item_text,order_index) VALUES (?,?,?)', (rid, item, idx))
    conn.commit()
    conn.close()
    flash(f'{rt.title()} routine created!', 'success')
    return redirect(url_for('routines'))

@app.route('/routines/toggle', methods=['POST'])
def routines_toggle():
    data = request.json
    item_id = int(data['item_id'])
    rid = data.get('routine_id')
    ld = data.get('log_date', date.today().isoformat())
    conn = get_db()
    if not rid:
        item_row = conn.execute('SELECT routine_id FROM routine_items WHERE id=?', (item_id,)).fetchone()
        rid = item_row['routine_id'] if item_row else None
    if not rid:
        conn.close()
        return jsonify({'success': False}), 400
    log = conn.execute('SELECT * FROM routine_logs WHERE routine_id=? AND log_date=?', (rid, ld)).fetchone()
    completed = [int(x) for x in json.loads(log['completed_items'])] if log and log['completed_items'] else []
    if item_id in completed:
        completed.remove(item_id)
    else:
        completed.append(item_id)
    if log:
        conn.execute('UPDATE routine_logs SET completed_items=? WHERE id=?', (json.dumps(completed), log['id']))
    else:
        conn.execute('INSERT INTO routine_logs (routine_id,log_date,completed_items) VALUES (?,?,?)', (rid, ld, json.dumps(completed)))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'is_completed': item_id in completed, 'completed': completed})

@app.route('/routines/item/add', methods=['POST'])
def routine_item_add():
    d = request.form
    conn = get_db()
    mx = conn.execute('SELECT MAX(order_index) as m FROM routine_items WHERE routine_id=?', (d['routine_id'],)).fetchone()
    item_text = d.get('item_text') or d.get('item_name')
    conn.execute('INSERT INTO routine_items (routine_id,item_text,order_index) VALUES (?,?,?)',
        (d['routine_id'], item_text, (mx['m'] or 0) + 1))
    conn.commit()
    conn.close()
    return redirect(url_for('routines'))

@app.route('/routines/item/move', methods=['POST'])
def routine_item_move():
    item_id = request.form.get('item_id')
    direction = request.form.get('direction')
    if direction not in {'up', 'down'} or not item_id:
        return redirect(url_for('routines'))

    conn = get_db()
    item = conn.execute('SELECT id, routine_id, order_index FROM routine_items WHERE id=? AND is_active=1', (item_id,)).fetchone()
    if not item:
        conn.close()
        return redirect(url_for('routines'))

    if direction == 'up':
        neighbor = conn.execute(
            'SELECT id, order_index FROM routine_items WHERE routine_id=? AND is_active=1 AND order_index < ? ORDER BY order_index DESC LIMIT 1',
            (item['routine_id'], item['order_index'])
        ).fetchone()
    else:
        neighbor = conn.execute(
            'SELECT id, order_index FROM routine_items WHERE routine_id=? AND is_active=1 AND order_index > ? ORDER BY order_index ASC LIMIT 1',
            (item['routine_id'], item['order_index'])
        ).fetchone()

    if neighbor:
        conn.execute('UPDATE routine_items SET order_index=? WHERE id=?', (neighbor['order_index'], item['id']))
        conn.execute('UPDATE routine_items SET order_index=? WHERE id=?', (item['order_index'], neighbor['id']))

    conn.commit()
    conn.close()
    return redirect(url_for('routines'))

@app.route('/routines/item/delete', methods=['POST'])
def routine_item_delete():
    iid = request.form.get('item_id')
    conn = get_db()
    conn.execute('UPDATE routine_items SET is_active=0 WHERE id=?', (iid,))
    conn.commit()
    conn.close()
    return redirect(url_for('routines'))

# ===== SLEEP =====
@app.route('/sleep')
def sleep_tracker():
    conn = get_db()
    today = date.today().isoformat()
    selected_date = request.args.get('date') or today
    history_days = request.args.get('history_days', default=30, type=int)
    if history_days not in (14, 30, 90, 180):
        history_days = 30
    cutoff_date = (date.today() - timedelta(days=history_days - 1)).isoformat()
    today_log = conn.execute('SELECT * FROM sleep_logs WHERE sleep_date=?', (selected_date,)).fetchone()
    logs = conn.execute('SELECT * FROM sleep_logs WHERE sleep_date >= ? ORDER BY sleep_date DESC LIMIT 90', (cutoff_date,)).fetchall()
    today_naps = conn.execute('SELECT * FROM nap_logs WHERE nap_date=? ORDER BY start_time', (today,)).fetchall()
    recent_naps = conn.execute('SELECT * FROM nap_logs WHERE nap_date >= ? ORDER BY nap_date DESC, start_time DESC LIMIT 30', (cutoff_date,)).fetchall()
    conn.close()
    return render_template(
        'sleep.html',
        logs=logs,
        sleep_chart_logs=[dict(log) for log in logs],
        today_log=today_log,
        today=selected_date,
        actual_today=today,
        yesterday=(date.today()-timedelta(days=1)).isoformat(),
        history_days=history_days,
        today_naps=today_naps,
        recent_naps=recent_naps
    )

@app.route('/sleep/add', methods=['POST'])
def sleep_add():
    d = request.form
    st, wt = d['sleep_time'], d['wake_time']
    if st == '00:00' and wt == '00:00':
        hrs = 0
    else:
        sd = datetime.strptime(st, '%H:%M')
        wd = datetime.strptime(wt, '%H:%M')
        if wd <= sd:
            wd += timedelta(days=1)
        hrs = (wd - sd).total_seconds() / 3600
    conn = get_db()
    conn.execute('INSERT OR REPLACE INTO sleep_logs (sleep_date,sleep_time,wake_time,total_hours,quality_rating,notes) VALUES (?,?,?,?,?,?)',
        (d['sleep_date'], st, wt, round(hrs, 2), None, d.get('notes')))
    existing_water = conn.execute('SELECT is_fasting, sweat_factor FROM water_logs WHERE log_date=?', (d['sleep_date'],)).fetchone()
    conn.execute('DELETE FROM water_hourly WHERE log_date=?', (d['sleep_date'],))
    conn.execute('DELETE FROM water_logs WHERE log_date=?', (d['sleep_date'],))
    _create_water_schedule(
        conn,
        d['sleep_date'],
        wt,
        bool(existing_water['is_fasting']) if existing_water else False,
        bool(existing_water['sweat_factor']) if existing_water else False,
    )
    conn.commit()
    conn.close()
    flash(f'Sleep logged: {hrs:.1f} hours', 'success')
    return redirect(url_for('sleep_tracker'))

@app.route('/sleep/delete/<sleep_date>', methods=['POST'])
def sleep_delete(sleep_date):
    conn = get_db()
    conn.execute('DELETE FROM sleep_logs WHERE sleep_date=?', (sleep_date,))
    conn.commit()
    conn.close()
    flash('Sleep entry deleted.', 'success')
    return redirect(url_for('sleep_tracker'))

@app.route('/sleep/nap/add', methods=['POST'])
def nap_add():
    d = request.form
    st, et = d['start_time'], d['end_time']
    sd = datetime.strptime(st, '%H:%M')
    ed = datetime.strptime(et, '%H:%M')
    if ed <= sd:
        ed += timedelta(days=1)
    duration = int((ed - sd).total_seconds() / 60)
    conn = get_db()
    conn.execute(
        'INSERT INTO nap_logs (nap_date, start_time, end_time, duration_minutes, notes) VALUES (?,?,?,?,?)',
        (d['nap_date'], st, et, duration, d.get('notes') or None)
    )
    conn.commit()
    conn.close()
    flash(f'Nap logged: {duration} minutes', 'success')
    return redirect(url_for('sleep_tracker'))

@app.route('/sleep/nap/delete/<int:nap_id>', methods=['POST'])
def nap_delete(nap_id):
    conn = get_db()
    conn.execute('DELETE FROM nap_logs WHERE id=?', (nap_id,))
    conn.commit()
    conn.close()
    flash('Nap entry deleted.', 'success')
    return redirect(url_for('sleep_tracker'))

# ===== WATER =====
def _get_hydration_weight_kg(conn, log_date):
    row = conn.execute(
        'SELECT weight_kg FROM body_stats WHERE log_date <= ? ORDER BY log_date DESC LIMIT 1',
        (log_date,)
    ).fetchone()
    return float(row['weight_kg']) if row and row['weight_kg'] else 80.0

def _build_even_slots(start_dt, end_dt, total_ml, start_index):
    if end_dt <= start_dt or total_ml <= 0:
        return [], start_index
    slot_count = max(1, math.ceil((end_dt - start_dt).total_seconds() / 3600))
    base = total_ml // slot_count
    remainder = total_ml - (base * slot_count)
    slots = []
    for i in range(slot_count):
        ml = int(base + (1 if i < remainder else 0))
        slot_dt = start_dt + timedelta(hours=i)
        slots.append((slot_dt.strftime('%H:%M'), start_index + i, ml))
    return slots, start_index + slot_count

def _build_water_plan(conn, log_date, wake_time, is_fasting, sweat_factor):
    settings = get_settings()
    weight_kg = _get_hydration_weight_kg(conn, log_date)
    ml_per_kg = float(settings.get('hydration_ml_per_kg') or 32)
    sweat_extra_ml = int(float(settings.get('hydration_sweat_extra_ml') or 750))

    baseline_ml = int(round(weight_kg * ml_per_kg))
    target_ml = baseline_ml + (sweat_extra_ml if sweat_factor else 0)
    target_ml = min(max(target_ml, 1500), 6000)

    day = datetime.strptime(log_date, '%Y-%m-%d').date()
    wh, wm = map(int, wake_time.split(':'))
    wake_dt = datetime(day.year, day.month, day.day, wh, wm)
    slot_index = 0
    water_slots = []

    if is_fasting:
        lat = (settings.get('notif_latitude') or '').strip()
        lon = (settings.get('notif_longitude') or '').strip()
        method = int(settings.get('notif_prayer_method', '4') or '4')

        try:
            if lat and lon:
                todays = fetch_prayer_timings(day, lat, lon, method)
                tomorrow = fetch_prayer_timings(day + timedelta(days=1), lat, lon, method)
                iftar_dt = combine_date_and_time(day, todays.get('Maghrib') or '19:00')
                fajr_next_dt = combine_date_and_time(day + timedelta(days=1), tomorrow.get('Fajr') or '05:00')
            else:
                iftar_dt = combine_date_and_time(day, '19:00')
                fajr_next_dt = combine_date_and_time(day + timedelta(days=1), '05:00')
        except Exception:
            iftar_dt = combine_date_and_time(day, '19:00')
            fajr_next_dt = combine_date_and_time(day + timedelta(days=1), '05:00')

        sleep_row = conn.execute('SELECT sleep_time FROM sleep_logs WHERE sleep_date=?', (log_date,)).fetchone()
        sleep_time = sleep_row['sleep_time'] if sleep_row and sleep_row['sleep_time'] else '23:30'
        bedtime_dt = combine_date_and_time(day, sleep_time)
        if bedtime_dt <= iftar_dt:
            bedtime_dt = iftar_dt + timedelta(hours=4)

        evening_target = int(round(target_ml * 0.6))
        suhoor_target = target_ml - evening_target

        evening_slots, slot_index = _build_even_slots(iftar_dt, bedtime_dt, evening_target, slot_index)
        suhoor_start = max(iftar_dt + timedelta(hours=1), fajr_next_dt - timedelta(minutes=90))
        suhoor_slots, slot_index = _build_even_slots(suhoor_start, fajr_next_dt, suhoor_target, slot_index)
        water_slots.extend(evening_slots)
        water_slots.extend(suhoor_slots)

        phase_summary = [
            'Iftar to bed: 60% of target, steady sipping every hour.',
            'Suhoor window: 40% of target with electrolytes for retention.',
        ]
        mode_label = 'Fasting Mode'
    else:
        awake_hours = float(settings.get('hydration_awake_hours') or 16)
        sleep_dt = wake_dt + timedelta(hours=awake_hours)
        phase1_end = min(wake_dt + timedelta(hours=10), sleep_dt)
        taper_start = max(phase1_end, sleep_dt - timedelta(hours=2))

        phase1_target = int(round(target_ml * 0.75))
        phase2_target = target_ml - phase1_target
        phase2_main_target = int(round(phase2_target * 0.8))
        taper_target = phase2_target - phase2_main_target

        p1_slots, slot_index = _build_even_slots(wake_dt, phase1_end, phase1_target, slot_index)
        p2_slots, slot_index = _build_even_slots(phase1_end, taper_start, phase2_main_target, slot_index)
        taper_slots, slot_index = _build_even_slots(taper_start, sleep_dt, taper_target, slot_index)
        water_slots.extend(p1_slots)
        water_slots.extend(p2_slots)
        water_slots.extend(taper_slots)

        phase_summary = [
            'First 10 hours: 75% of target (front-loaded hydration).',
            'Remaining hours: 25%, tapering in final 2 hours before bed.',
        ]
        mode_label = 'Standard Mode'

    slots = [(log_date, label, idx, ml, 0) for (label, idx, ml) in water_slots if ml > 0]
    total_target = sum(s[3] for s in slots)
    meta = {
        'mode_label': mode_label,
        'weight_kg': round(weight_kg, 1),
        'baseline_ml': baseline_ml,
        'target_ml': total_target,
        'sweat_factor': bool(sweat_factor),
        'phase_summary': phase_summary,
        'electrolyte_tip': 'Add sodium/electrolytes early (or at suhoor in fasting mode) for better cellular hydration.',
    }
    return slots, total_target, meta

@app.route('/water')
def water():
    conn = get_db()
    today = date.today()
    history_days = request.args.get('history_days', default=7, type=int)
    if history_days not in (7, 14, 30, 90):
        history_days = 7
    selected_raw = request.args.get('date') or today.isoformat()
    try:
        selected_day = datetime.strptime(selected_raw, '%Y-%m-%d').date()
    except ValueError:
        selected_day = today
    selected_date = selected_day.isoformat()

    wake = get_wake_time_for_date(conn, selected_date)
    log = conn.execute('SELECT * FROM water_logs WHERE log_date=?', (selected_date,)).fetchone()
    first_slot = conn.execute(
        'SELECT hour_label FROM water_hourly WHERE log_date=? ORDER BY slot_index, hour_label LIMIT 1',
        (selected_date,)
    ).fetchone()
    wake_mismatch = bool(first_slot and log and not bool(log['is_fasting']) and first_slot['hour_label'] != wake)
    if not log or log['wake_time'] != wake or wake_mismatch:
        fasting = bool(log['is_fasting']) if log else False
        sweat_factor = bool(log['sweat_factor']) if log and 'sweat_factor' in log.keys() else False
        conn.execute('DELETE FROM water_hourly WHERE log_date=?', (selected_date,))
        conn.execute('DELETE FROM water_logs WHERE log_date=?', (selected_date,))
        _create_water_schedule(conn, selected_date, wake, fasting, sweat_factor)
        log = conn.execute('SELECT * FROM water_logs WHERE log_date=?', (selected_date,)).fetchone()

    hourly = conn.execute('SELECT * FROM water_hourly WHERE log_date=? ORDER BY slot_index, hour_label', (selected_date,)).fetchall()
    cutoff_date = (selected_day - timedelta(days=history_days - 1)).isoformat()
    history = conn.execute('SELECT * FROM water_logs WHERE log_date <= ? AND log_date >= ? ORDER BY log_date DESC LIMIT 120', (selected_date, cutoff_date)).fetchall()
    _, _, hydration_meta = _build_water_plan(
        conn,
        selected_date,
        wake,
        bool(log['is_fasting']) if log else False,
        bool(log['sweat_factor']) if log and 'sweat_factor' in log.keys() else False,
    )
    conn.close()
    next_date = (selected_day + timedelta(days=1)).isoformat() if selected_day < today else None
    prev_date = (selected_day - timedelta(days=1)).isoformat()
    return render_template(
        'water.html',
        log=log,
        hourly=hourly,
        today=today.isoformat(),
        selected_date=selected_date,
        wake_time=wake,
        history=history,
        hydration_meta=hydration_meta,
        prev_date=prev_date,
        next_date=next_date,
        is_today=(selected_day == today),
        history_days=history_days,
    )

def _create_water_schedule(conn, log_date, wake_time, is_fasting, sweat_factor=False):
    slots, total, _ = _build_water_plan(conn, log_date, wake_time, is_fasting, sweat_factor)
    conn.execute('INSERT OR REPLACE INTO water_logs (log_date,wake_time,is_fasting,total_ml,target_ml) VALUES (?,?,?,0,?)',
        (log_date, wake_time, 1 if is_fasting else 0, total))
    conn.execute('UPDATE water_logs SET sweat_factor=? WHERE log_date=?', (1 if sweat_factor else 0, log_date))
    conn.executemany('INSERT OR IGNORE INTO water_hourly (log_date,hour_label,slot_index,target_ml,completed) VALUES (?,?,?,?,?)', slots)
    conn.commit()

@app.route('/water/toggle', methods=['POST'])
def water_toggle():
    data = request.json
    ld, hl = data['log_date'], data['hour_label']
    conn = get_db()
    row = conn.execute('SELECT * FROM water_hourly WHERE log_date=? AND hour_label=?', (ld, hl)).fetchone()
    if row:
        new_val = 0 if row['completed'] else 1
        conn.execute('UPDATE water_hourly SET completed=?, completed_at=? WHERE id=?',
            (new_val, datetime.now().isoformat() if new_val else None, row['id']))
        # Update total
        total = conn.execute('SELECT SUM(target_ml) as t FROM water_hourly WHERE log_date=? AND completed=1', (ld,)).fetchone()['t'] or 0
        conn.execute('UPDATE water_logs SET total_ml=? WHERE log_date=?', (total, ld))
        conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/water/fasting', methods=['POST'])
def water_fasting():
    payload = request.get_json(silent=True) or {}
    target_date = payload.get('log_date') or date.today().isoformat()
    conn = get_db()
    wake = get_wake_time_for_date(conn, target_date)
    current = conn.execute('SELECT is_fasting, sweat_factor FROM water_logs WHERE log_date=?', (target_date,)).fetchone()
    new_fasting = not bool(current['is_fasting']) if current else True
    sweat_factor = bool(current['sweat_factor']) if current and 'sweat_factor' in current.keys() else False
    conn.execute('DELETE FROM water_hourly WHERE log_date=?', (target_date,))
    conn.execute('DELETE FROM water_logs WHERE log_date=?', (target_date,))
    _create_water_schedule(conn, target_date, wake, new_fasting, sweat_factor)
    conn.close()
    return jsonify({'success': True, 'fasting': new_fasting})

@app.route('/water/sweat-factor', methods=['POST'])
def water_sweat_factor():
    payload = request.get_json(silent=True) or {}
    target_date = payload.get('log_date') or date.today().isoformat()
    conn = get_db()
    wake = get_wake_time_for_date(conn, target_date)
    current = conn.execute('SELECT is_fasting, sweat_factor FROM water_logs WHERE log_date=?', (target_date,)).fetchone()
    is_fasting = bool(current['is_fasting']) if current else False
    new_sweat = not bool(current['sweat_factor']) if current and 'sweat_factor' in current.keys() else True
    conn.execute('DELETE FROM water_hourly WHERE log_date=?', (target_date,))
    conn.execute('DELETE FROM water_logs WHERE log_date=?', (target_date,))
    _create_water_schedule(conn, target_date, wake, is_fasting, new_sweat)
    conn.close()
    return jsonify({'success': True, 'sweat_factor': new_sweat})

@app.route('/water/wake-time', methods=['POST'])
def water_wake_time():
    d = request.form
    wt = d['wake_time']
    target_date = d.get('log_date') or date.today().isoformat()
    conn = get_db()
    conn.execute("INSERT OR REPLACE INTO app_settings (setting_key,setting_value) VALUES ('wake_time',?)", (wt,))
    existing = conn.execute('SELECT is_fasting, sweat_factor FROM water_logs WHERE log_date=?', (target_date,)).fetchone()
    conn.execute('DELETE FROM water_hourly WHERE log_date=?', (target_date,))
    conn.execute('DELETE FROM water_logs WHERE log_date=?', (target_date,))
    _create_water_schedule(
        conn,
        target_date,
        wt,
        bool(existing['is_fasting']) if existing else False,
        bool(existing['sweat_factor']) if existing and 'sweat_factor' in existing.keys() else False,
    )
    conn.commit()
    conn.close()
    flash('Wake time updated!', 'success')
    return redirect(url_for('water', date=target_date))

@app.route('/water/delete/<log_date>', methods=['POST'])
def water_delete(log_date):
    conn = get_db()
    conn.execute('DELETE FROM water_hourly WHERE log_date=?', (log_date,))
    conn.execute('DELETE FROM water_logs WHERE log_date=?', (log_date,))
    conn.commit()
    conn.close()
    flash('Water log deleted.', 'success')
    return redirect(url_for('water'))

@app.route('/notifications/settings/save', methods=['POST'])
def notifications_settings_save():
    d = request.form
    settings_payload = {
        'notif_enabled': 'true' if d.get('notif_enabled') else 'false',
        'notif_water_hourly': 'true' if d.get('notif_water_hourly') else 'false',
        'notif_prayer_before_start': 'true' if d.get('notif_prayer_before_start') else 'false',
        'notif_prayer_before_end': 'true' if d.get('notif_prayer_before_end') else 'false',
        'notif_todos_upcoming': 'true' if d.get('notif_todos_upcoming') else 'false',
        'notif_special_dates': 'true' if d.get('notif_special_dates') else 'false',
        'notif_latitude': (d.get('notif_latitude') or '').strip(),
        'notif_longitude': (d.get('notif_longitude') or '').strip(),
        'notif_prayer_method': (d.get('notif_prayer_method') or '4').strip(),
    }
    conn = get_db()
    for key, val in settings_payload.items():
        conn.execute('INSERT OR REPLACE INTO app_settings (setting_key,setting_value) VALUES (?,?)', (key, val))
    conn.commit()
    conn.close()
    flash('Notification settings saved.', 'success')
    return redirect(request.referrer or url_for('dashboard'))

# ===== DEEN =====
@app.route('/deen')
def deen():
    conn = get_db()
    today = date.today().isoformat()
    prayer = conn.execute('SELECT * FROM prayer_logs WHERE prayer_date=?', (today,)).fetchone()
    adhkar = conn.execute('SELECT * FROM adhkar_logs WHERE log_date=?', (today,)).fetchall()
    prayer_history_rows = conn.execute(
        'SELECT prayer_date, (fajr + dhuhr + asr + maghrib + isha) AS completed_count FROM prayer_logs ORDER BY prayer_date'
    ).fetchall()
    adhkar_history_rows = conn.execute(
        'SELECT log_date, SUM(completed) AS completed_count FROM adhkar_logs GROUP BY log_date ORDER BY log_date'
    ).fetchall()
    adhkar_status = {a['adhkar_type']: a['completed'] for a in adhkar}
    reading = conn.execute('SELECT * FROM quran_reading ORDER BY reading_date DESC LIMIT 10').fetchall()
    latest_reading = conn.execute('SELECT * FROM quran_reading ORDER BY reading_date DESC, id DESC LIMIT 1').fetchone()
    juz_ranges = get_juz_ranges(conn)
    raw_surahs = conn.execute('SELECT * FROM quran_surahs ORDER BY surah_number').fetchall()
    conn.close()
    surahs = [{
        'id': s['surah_number'],
        'name': s['name_english'],
        'ayah_count': s['total_ayahs'],
        'juz': s['juz_start']
    } for s in raw_surahs]

    last_juz = None
    if latest_reading:
        if latest_reading['juz_number']:
            last_juz = int(latest_reading['juz_number'])
        else:
            last_juz = infer_juz_number_from_reference(latest_reading['from_surah'], latest_reading['from_ayah'])
    suggested_juz = 1 if not last_juz else ((last_juz % 30) + 1)
    suggested_range = juz_ranges.get(suggested_juz)

    prayer_times = {}
    notif_settings = get_settings()
    lat = (notif_settings.get('notif_latitude') or '').strip()
    lon = (notif_settings.get('notif_longitude') or '').strip()
    if lat and lon:
        try:
            prayer_times = build_deen_prayer_times(date.today(), lat, lon)
        except Exception:
            prayer_times = {}

    prayer_daily_map = {row['prayer_date']: int(row['completed_count'] or 0) for row in prayer_history_rows}
    adhkar_daily_map = {row['log_date']: int(row['completed_count'] or 0) for row in adhkar_history_rows}

    prayer_history_labels = []
    prayer_history_values = []
    if prayer_daily_map:
        prayer_start = min(datetime.strptime(day, '%Y-%m-%d').date() for day in prayer_daily_map)
        cursor_day = prayer_start
        while cursor_day <= date.today():
            day_key = cursor_day.isoformat()
            prayer_history_labels.append(day_key)
            prayer_history_values.append(prayer_daily_map.get(day_key, 0))
            cursor_day += timedelta(days=1)
    else:
        prayer_history_labels = [today]
        prayer_history_values = [0]

    adhkar_history_labels = []
    adhkar_history_values = []
    if adhkar_daily_map:
        adhkar_start = min(datetime.strptime(day, '%Y-%m-%d').date() for day in adhkar_daily_map)
        cursor_day = adhkar_start
        while cursor_day <= date.today():
            day_key = cursor_day.isoformat()
            adhkar_history_labels.append(day_key)
            adhkar_history_values.append(adhkar_daily_map.get(day_key, 0))
            cursor_day += timedelta(days=1)
    else:
        adhkar_history_labels = [today]
        adhkar_history_values = [0]

    return render_template('deen.html', prayers=prayer, adhkar=adhkar_status, readings=reading,
        surahs=surahs, surahs_json=json.dumps(surahs), today=today,
        suggested_juz=suggested_juz, suggested_range=suggested_range,
        prayer_times=prayer_times,
        prayer_history_labels=prayer_history_labels, prayer_history_values=prayer_history_values,
        adhkar_history_labels=adhkar_history_labels, adhkar_history_values=adhkar_history_values)

@app.route('/deen/prayers/save', methods=['POST'])
def deen_prayers_save():
    d = request.form
    prayer_date = d.get('prayer_date') or d.get('date') or date.today().isoformat()
    conn = get_db()
    conn.execute('INSERT OR REPLACE INTO prayer_logs (prayer_date,fajr,dhuhr,asr,maghrib,isha) VALUES (?,?,?,?,?,?)',
        (prayer_date, 1 if d.get('fajr') else 0, 1 if d.get('dhuhr') else 0,
         1 if d.get('asr') else 0, 1 if d.get('maghrib') else 0, 1 if d.get('isha') else 0))
    conn.commit()
    conn.close()
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({'success': True})
    return redirect(url_for('deen'))

@app.route('/deen/adhkar/toggle', methods=['POST'])
def deen_adhkar_toggle():
    data = request.json
    log_date = data.get('date', date.today().isoformat())
    conn = get_db()
    ex = conn.execute('SELECT * FROM adhkar_logs WHERE log_date=? AND adhkar_type=?', (log_date, data['type'])).fetchone()
    if ex:
        new_val = 0 if ex['completed'] else 1
        conn.execute('UPDATE adhkar_logs SET completed=? WHERE id=?', (new_val, ex['id']))
    else:
        new_val = 1
        conn.execute('INSERT INTO adhkar_logs (log_date,adhkar_type,completed) VALUES (?,?,1)', (log_date, data['type']))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'completed': bool(new_val)})

@app.route('/deen/quran/memorization/<int:surah>')
def deen_quran_memorization(surah):
    conn = get_db()
    s = conn.execute('SELECT * FROM quran_surahs WHERE surah_number=?', (surah,)).fetchone()
    mems = conn.execute('SELECT ayah_number, is_memorized FROM quran_memorization WHERE surah_number=?', (surah,)).fetchall()
    mem_map = {m['ayah_number']: m['is_memorized'] for m in mems}
    conn.close()
    return jsonify([{'ayah': ayah, 'memorized': bool(mem_map.get(ayah, 0))} for ayah in range(1, s['total_ayahs'] + 1)])

@app.route('/deen/quran/memorization/toggle', methods=['POST'])
def deen_quran_mem_toggle():
    data = request.json
    sn = data.get('surah') or data.get('surah_id')
    an = data.get('ayah') or data.get('ayah_number')
    conn = get_db()
    ex = conn.execute('SELECT * FROM quran_memorization WHERE surah_number=? AND ayah_number=?', (sn, an)).fetchone()
    if ex:
        new_val = 0 if ex['is_memorized'] else 1
        conn.execute('UPDATE quran_memorization SET is_memorized=?, memorized_date=? WHERE id=?',
            (new_val, date.today().isoformat() if new_val else None, ex['id']))
    else:
        conn.execute('INSERT INTO quran_memorization (surah_number,ayah_number,is_memorized,memorized_date) VALUES (?,?,1,?)',
            (sn, an, date.today().isoformat()))
        new_val = 1
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'memorized': bool(new_val)})

@app.route('/deen/quran/memorization-stats')
def deen_quran_mem_stats():
    conn = get_db()
    total = conn.execute('SELECT SUM(total_ayahs) as total FROM quran_surahs').fetchone()['total'] or 0
    memorized = conn.execute('SELECT COUNT(*) as total FROM quran_memorization WHERE is_memorized=1').fetchone()['total'] or 0
    conn.close()
    return jsonify({'total': total, 'memorized': memorized, 'pct': round((memorized / total) * 100, 1) if total else 0})

@app.route('/deen/quran/reading/add', methods=['POST'])
def deen_quran_reading_add():
    d = request.form
    conn = get_db()
    conn.execute('INSERT INTO quran_reading (reading_date,from_surah,from_ayah,to_surah,to_ayah,juz_number,notes) VALUES (?,?,?,?,?,?,?)',
        (d.get('reading_date') or d.get('date') or date.today().isoformat(), d['from_surah'], d['from_ayah'], d['to_surah'], d['to_ayah'], d.get('juz_number') or None, d.get('notes')))
    conn.commit()
    conn.close()
    flash('Reading logged!', 'success')
    return redirect(url_for('deen'))

@app.route('/deen/tafseer/<int:surah>')
def deen_tafseer(surah):
    conn = get_db()
    progress = conn.execute('SELECT * FROM tafseer_progress WHERE surah_number=?', (surah,)).fetchall()
    conn.close()
    return jsonify([dict(p) for p in progress])

@app.route('/deen/tafseer/stats')
def deen_tafseer_stats():
    conn = get_db()
    total_ayahs_row = conn.execute('SELECT SUM(total_ayahs) AS total FROM quran_surahs').fetchone()
    total_ayahs = int(total_ayahs_row['total'] or 0)
    progress = conn.execute('SELECT concise_done, deeper_look_done, audio_done FROM tafseer_progress').fetchall()
    conn.close()

    concise_done = sum(1 for row in progress if row['concise_done'])
    deeper_done = sum(1 for row in progress if row['deeper_look_done'])
    audio_done = sum(1 for row in progress if row['audio_done'])

    def pct(done, total):
        return round((done / total) * 100, 1) if total else 0

    return jsonify({
        'total_ayahs': total_ayahs,
        'concise_done': concise_done,
        'deeper_look_done': deeper_done,
        'audio_done': audio_done,
        'concise_pct': pct(concise_done, total_ayahs),
        'deeper_pct': pct(deeper_done, total_ayahs),
        'audio_pct': pct(audio_done, total_ayahs),
    })

@app.route('/deen/tafseer/toggle', methods=['POST'])
def deen_tafseer_toggle():
    data = request.json
    sn = data.get('surah') or data.get('surah_id')
    an = data.get('ayah') or data.get('ayah_number')
    field_map = {'concise': 'concise_done', 'deeper_look': 'deeper_look_done', 'audio': 'audio_done'}
    field = field_map.get(data['field'], data['field'])
    if field not in ('concise_done', 'deeper_look_done', 'audio_done'):
        return jsonify({'error': 'Invalid field'}), 400
    conn = get_db()
    ex = conn.execute('SELECT * FROM tafseer_progress WHERE surah_number=? AND ayah_number=?', (sn, an)).fetchone()
    if ex:
        new_val = 0 if ex[field] else 1
        conn.execute(f'UPDATE tafseer_progress SET {field}=? WHERE id=?', (new_val, ex['id']))
    else:
        conn.execute(f'INSERT INTO tafseer_progress (surah_number,ayah_number,{field}) VALUES (?,?,1)', (sn, an))
        new_val = 1
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'value': bool(new_val)})

# ===== LANGUAGE =====
def _load_arabic_state(conn):
    rows = conn.execute('''
        SELECT
            program_name,
            MAX(current_day) AS current_day,
            MAX(total_days) AS total_days,
            MAX(last_completed_date) AS last_completed_date
        FROM arabic_learning
        GROUP BY program_name
    ''').fetchall()

    programs = []
    for row in rows:
        meta = ARABIC_PROGRAM_META.get(row['program_name'], {'label': row['program_name'], 'order': 99})
        total_days = int(row['total_days'] or 0)
        current_day = min(int(row['current_day'] or 0), total_days) if total_days else 0
        pct = round((current_day / total_days) * 100, 1) if total_days else 0
        programs.append({
            'program_name': row['program_name'],
            'label': meta['label'],
            'order': meta['order'],
            'current_day': current_day,
            'total_days': total_days,
            'last_completed_date': row['last_completed_date'],
            'progress_pct': pct,
        })

    programs.sort(key=lambda item: item['order'])
    total_current = sum(p['current_day'] for p in programs)
    total_target = sum(p['total_days'] for p in programs)
    overall_pct = round((total_current / total_target) * 100, 1) if total_target else 0
    return {
        'arabic_programs': programs,
        'arabic_total_current': total_current,
        'arabic_total_target': total_target,
        'arabic_overall_pct': overall_pct,
    }

@app.route('/language')
def language():
    return redirect(url_for('language_arabic'))

@app.route('/language/chinese')
@app.route('/language/kazakh')
def language_removed_sections():
    flash('Only Arabic is available now.', 'success')
    return redirect(url_for('language_arabic'))

@app.route('/language/arabic')
def language_arabic():
    conn = get_db()
    arabic_state = _load_arabic_state(conn)
    conn.close()
    return render_template('language_arabic.html', **arabic_state)

@app.route('/language/arabic/complete', methods=['POST'])
def language_arabic_complete():
    d = request.form
    conn = get_db()
    conn.execute('UPDATE arabic_learning SET current_day=current_day+1, last_completed_date=date("now") WHERE program_name=?', (d['program_name'],))
    conn.commit()
    conn.close()
    return redirect(url_for('language_arabic'))

# ===== GOALS =====
@app.route('/goals')
def goals():
    conn = get_db()
    main_goals = conn.execute('SELECT * FROM goals WHERE parent_id IS NULL AND is_completed=0 ORDER BY created_at DESC').fetchall()
    goals_with_subs = []
    for g in main_goals:
        subs = conn.execute('SELECT * FROM goals WHERE parent_id=? ORDER BY created_at', (g['id'],)).fetchall()
        total = len(subs)
        done = sum(1 for s in subs if s['is_completed'])
        goal_data = dict(g)
        goal_data['subgoals'] = [dict(s) for s in subs]
        goal_data['total'] = total
        goal_data['done'] = done
        goals_with_subs.append(goal_data)
    completed = conn.execute('SELECT * FROM goals WHERE parent_id IS NULL AND is_completed=1 ORDER BY completed_at DESC LIMIT 10').fetchall()
    conn.close()
    return render_template('goals.html', goals=goals_with_subs, completed=completed)

@app.route('/goals/add', methods=['POST'])
def goals_add():
    d = request.form
    conn = get_db()
    conn.execute('INSERT INTO goals (title,description,goal_type,target_date,parent_id,notes) VALUES (?,?,?,?,?,?)',
        (d['title'], d.get('description'), d.get('goal_type','short'), d.get('target_date') or None,
         d.get('parent_id') or None, d.get('notes')))
    conn.commit()
    conn.close()
    flash('Goal added!', 'success')
    return redirect(url_for('goals'))

@app.route('/goals/complete/<int:gid>', methods=['POST'])
def goals_complete(gid):
    conn = get_db()
    conn.execute('UPDATE goals SET is_completed=1, completed_at=datetime("now") WHERE id=?', (gid,))
    # Check if parent should be completed
    goal = conn.execute('SELECT parent_id FROM goals WHERE id=?', (gid,)).fetchone()
    if goal and goal['parent_id']:
        pid = goal['parent_id']
        total = conn.execute('SELECT COUNT(*) as c FROM goals WHERE parent_id=?', (pid,)).fetchone()['c']
        done = conn.execute('SELECT COUNT(*) as c FROM goals WHERE parent_id=? AND is_completed=1', (pid,)).fetchone()['c']
        if done >= total:
            conn.execute('UPDATE goals SET is_completed=1, completed_at=datetime("now") WHERE id=?', (pid,))
    conn.commit()
    conn.close()
    return redirect(url_for('goals'))

@app.route('/goals/delete/<int:gid>', methods=['POST'])
def goals_delete(gid):
    conn = get_db()
    conn.execute('DELETE FROM goals WHERE id=?', (gid,))
    conn.commit()
    conn.close()
    flash('Goal deleted', 'success')
    return redirect(url_for('goals'))

# ===== LIBRARY (Books) =====
@app.route('/library')
def library():
    conn = get_db()
    books = conn.execute('SELECT * FROM books ORDER BY created_at DESC').fetchall()
    conn.close()
    return render_template('library.html', books=books, books_json=json.dumps([dict(b) for b in books]))

@app.route('/library/add', methods=['POST'])
def library_add():
    d = request.form
    cover_path = None
    if 'cover' in request.files:
        f = request.files['cover']
        if f and f.filename and allowed_file(f.filename):
            fn = secure_filename(f.filename)
            fn = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{fn}"
            f.save(os.path.join(app.config['UPLOAD_FOLDER'], fn))
            cover_path = fn
    conn = get_db()
    conn.execute('INSERT INTO books (title,author,cover_image,total_pages,status) VALUES (?,?,?,?,?)',
        (d['title'], d.get('author'), cover_path, int(d['total_pages']) if d.get('total_pages') else None, d.get('status','to_read')))
    conn.commit()
    conn.close()
    flash('Book added!', 'success')
    return redirect(url_for('library'))

@app.route('/library/update/<int:bid>', methods=['POST'])
def library_update(bid):
    d = request.form
    conn = get_db()
    book = conn.execute('SELECT * FROM books WHERE id=?', (bid,)).fetchone()
    if not book:
        flash('Book not found', 'error')
        return redirect(url_for('library'))
    cp = int(d['current_page']) if d.get('current_page') else (book['current_page'] or 0)
    notes = d.get('notes', book['notes'])
    status = d.get('status', book['status'])
    rating = int(d['rating']) if d.get('rating') else None
    started_date = book['started_date']
    completed_date = book['completed_date']
    if status == 'reading' and not started_date:
        started_date = date.today().isoformat()
    if status == 'completed' and not completed_date:
        completed_date = date.today().isoformat()
    if status != 'completed':
        completed_date = None
    conn.execute('UPDATE books SET current_page=?, notes=?, status=?, rating=?, started_date=?, completed_date=? WHERE id=?',
        (cp, notes, status, rating, started_date, completed_date, bid))
    conn.commit()
    conn.close()
    return redirect(url_for('library'))

@app.route('/library/delete/<int:bid>', methods=['POST'])
def library_delete(bid):
    conn = get_db()
    conn.execute('DELETE FROM books WHERE id=?', (bid,))
    conn.commit()
    conn.close()
    return redirect(url_for('library'))

# ===== FOCUS =====
@app.route('/focus')
def focus():
    conn = get_db()
    today = date.today().isoformat()
    sessions = conn.execute('SELECT * FROM focus_sessions WHERE session_date=? ORDER BY created_at DESC', (today,)).fetchall()
    total_today = sum(s['duration_minutes'] for s in sessions)
    week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()
    week_rows = conn.execute('SELECT session_date, SUM(duration_minutes) as total FROM focus_sessions WHERE session_date>=? GROUP BY session_date ORDER BY session_date', (week_start,)).fetchall()
    conn.close()
    week_map = {row['session_date']: row['total'] for row in week_rows}
    week_data = []
    start_day = date.today() - timedelta(days=date.today().weekday())
    for offset in range(7):
        current = start_day + timedelta(days=offset)
        week_data.append({'day': current.strftime('%a'), 'minutes': int(week_map.get(current.isoformat(), 0) or 0)})
    return render_template('focus.html', sessions=sessions, total_today=total_today, week_data=week_data, today=today)

@app.route('/focus/save', methods=['POST'])
def focus_save():
    d = request.form
    conn = get_db()
    conn.execute('INSERT INTO focus_sessions (session_date,duration_minutes,task_description) VALUES (?,?,?)',
        (d.get('session_date', date.today().isoformat()), int(d['duration_minutes']), d.get('task_description') or d.get('task_label')))
    conn.commit()
    conn.close()
    return jsonify({'success': True}) if request.is_json else redirect(url_for('focus'))

# ===== CALENDAR =====
@app.route('/calendar')
def calendar_view():
    import calendar as cal_mod
    conn = get_db()
    today = date.today()
    month = int(request.args.get('month', today.month))
    year = int(request.args.get('year', today.year))

    # month navigation
    if month == 12:
        next_month, next_year = 1, year + 1
    else:
        next_month, next_year = month + 1, year
    if month == 1:
        prev_month, prev_year = 12, year - 1
    else:
        prev_month, prev_year = month - 1, year

    start = date(year, month, 1)
    end_day = cal_mod.monthrange(year, month)[1]
    end = date(year, month, end_day)

    todos_month = conn.execute(
        'SELECT * FROM todos WHERE status != "completed" AND due_date BETWEEN ? AND ? ORDER BY due_date, due_time',
        (start.isoformat(), end.isoformat()),
    ).fetchall()
    dates_month = conn.execute('SELECT * FROM important_dates WHERE event_date BETWEEN ? AND ? ORDER BY event_date',
        (start.isoformat(), end.isoformat())).fetchall()
    cal_events_month = conn.execute('SELECT * FROM calendar_events WHERE event_date BETWEEN ? AND ? ORDER BY event_date, event_time',
        (start.isoformat(), end.isoformat())).fetchall()

    upcoming_events = conn.execute(
        'SELECT * FROM calendar_events WHERE event_date >= ? ORDER BY event_date, event_time LIMIT 20',
        (today.isoformat(),),
    ).fetchall()
    upcoming_todos = conn.execute(
        'SELECT id, title, due_date, due_time, priority, category FROM todos WHERE status != "completed" AND due_date >= ? ORDER BY due_date, due_time LIMIT 20',
        (today.isoformat(),),
    ).fetchall()
    conn.close()

    events = {}
    for t in todos_month:
        d = t['due_date']
        events.setdefault(d, []).append({'type': 'todo', 'title': t['title'], 'priority': t['priority'], 'time': t['due_time']})
    for dt in dates_month:
        d = dt['event_date']
        events.setdefault(d, []).append({'type': 'date', 'title': dt['title'], 'event_type': dt['event_type']})
    for ev in cal_events_month:
        d = ev['event_date']
        events.setdefault(d, []).append({'type': 'event', 'id': ev['id'], 'title': ev['title'],
                                          'time': ev['event_time'], 'category': ev['category'], 'notes': ev['notes']})

    upcoming_items = [
        {
            'type': 'event',
            'id': ev['id'],
            'title': ev['title'],
            'date': ev['event_date'],
            'time': ev['event_time'],
            'category': ev['category'],
            'notes': ev['notes'],
        }
        for ev in upcoming_events
    ]
    upcoming_items.extend(
        {
            'type': 'todo',
            'id': todo['id'],
            'title': todo['title'],
            'date': todo['due_date'],
            'time': todo['due_time'],
            'priority': todo['priority'],
            'category': todo['category'],
            'notes': None,
        }
        for todo in upcoming_todos
    )
    upcoming_items.sort(key=lambda item: (item['date'] or '', item['time'] or '23:59'))
    upcoming_items = upcoming_items[:20]

    # build calendar grid (Mon-start weeks, pad with prev/next month days)
    first_weekday = start.weekday()  # 0=Mon
    grid_start = start - timedelta(days=first_weekday)
    calendar_days = []
    for i in range(42):
        day = grid_start + timedelta(days=i)
        calendar_days.append({
            'date': day.isoformat(),
            'day': day.day,
            'current_month': day.month == month,
            'is_today': day == today,
            'events': events.get(day.isoformat(), [])
        })

    month_name = cal_mod.month_name[month]
    return render_template('calendar.html',
        calendar_days=calendar_days,
        events=events, month=month, year=year,
        month_name=month_name,
        prev_month=prev_month, prev_year=prev_year,
        next_month=next_month, next_year=next_year,
        start_date=start, end_date=end,
        today=today.isoformat(),
        upcoming_items=upcoming_items)

@app.route('/calendar/events/add', methods=['POST'])
def calendar_event_add():
    f = request.form
    conn = get_db()
    conn.execute('INSERT INTO calendar_events (title, event_date, event_time, category, notes) VALUES (?,?,?,?,?)',
        (f['title'], f['event_date'], f.get('event_time') or None,
         f.get('category', 'general'), f.get('notes', '')))
    conn.commit()
    conn.close()
    flash('Event added!', 'success')
    # redirect back to the month the event is on
    event_date = date.fromisoformat(f['event_date'])
    return redirect(url_for('calendar_view', month=event_date.month, year=event_date.year))

@app.route('/calendar/events/update/<int:event_id>', methods=['POST'])
def calendar_event_update(event_id):
    f = request.form
    conn = get_db()
    existing = conn.execute('SELECT * FROM calendar_events WHERE id=?', (event_id,)).fetchone()
    if not existing:
        conn.close()
        flash('Event not found.', 'error')
        return redirect(url_for('calendar_view'))

    conn.execute(
        'UPDATE calendar_events SET title=?, event_date=?, event_time=?, category=?, notes=? WHERE id=?',
        (
            f['title'],
            f['event_date'],
            f.get('event_time') or None,
            f.get('category', 'general'),
            f.get('notes', ''),
            event_id,
        ),
    )
    conn.commit()
    conn.close()
    flash('Event updated.', 'success')
    event_date = date.fromisoformat(f['event_date'])
    return redirect(url_for('calendar_view', month=event_date.month, year=event_date.year))

@app.route('/calendar/events/delete/<int:event_id>', methods=['POST'])
def calendar_event_delete(event_id):
    conn = get_db()
    ev = conn.execute('SELECT * FROM calendar_events WHERE id=?', (event_id,)).fetchone()
    if ev:
        conn.execute('DELETE FROM calendar_events WHERE id=?', (event_id,))
        conn.commit()
        month, year = date.fromisoformat(ev['event_date']).month, date.fromisoformat(ev['event_date']).year
    else:
        month, year = date.today().month, date.today().year
    conn.close()
    flash('Event deleted.', 'success')
    return redirect(url_for('calendar_view', month=month, year=year))

# ===== IMPORTANT DATES =====
@app.route('/important-dates')
def important_dates():
    conn = get_db()
    upcoming = conn.execute('SELECT * FROM important_dates WHERE event_date >= date("now") ORDER BY event_date LIMIT 30').fetchall()
    past = conn.execute('SELECT * FROM important_dates WHERE event_date < date("now") ORDER BY event_date DESC LIMIT 10').fetchall()
    conn.close()
    return render_template('dates.html', upcoming=upcoming, past=past)

@app.route('/dates/add', methods=['POST'])
def dates_add():
    d = request.form
    conn = get_db()
    conn.execute('INSERT INTO important_dates (title,event_date,event_type,reminder_days_before,is_recurring,notes) VALUES (?,?,?,?,?,?)',
        (d['title'], d['event_date'], d.get('event_type','other'), int(d.get('reminder_days',0)),
         1 if d.get('is_recurring') else 0, d.get('notes')))
    conn.commit()
    conn.close()
    return redirect(url_for('important_dates'))

@app.route('/dates/delete/<int:did>', methods=['POST'])
def dates_delete(did):
    conn = get_db()
    conn.execute('DELETE FROM important_dates WHERE id=?', (did,))
    conn.commit()
    conn.close()
    return redirect(url_for('important_dates'))

# ===== REVIEWS =====
@app.route('/reviews')
def reviews():
    flash('Reviews page has been removed.', 'success')
    return redirect(url_for('dashboard'))

@app.route('/reviews/save', methods=['POST'])
def reviews_save():
    d = request.form
    conn = get_db()
    conn.execute('INSERT OR REPLACE INTO reviews (review_type,review_date,wins,challenges,lessons,goals_for_next,rating,notes) VALUES (?,?,?,?,?,?,?,?)',
        (d['review_type'], d['review_date'], d.get('wins'), d.get('challenges'), d.get('lessons'),
         d.get('goals_for_next'), int(d['rating']) if d.get('rating') else None, d.get('notes')))
    conn.commit()
    conn.close()
    flash('Review saved!', 'success')
    return redirect(url_for('reviews', tab=d['review_type']))

# ===== SETTINGS =====
@app.route('/settings')
def settings():
    conn = get_db()
    benchmark_rows = conn.execute('''
        SELECT e.id, e.name, e.muscle_group, wt.name as workout_name,
               b.beginner_1rm, b.intermediate_1rm, b.advanced_1rm
        FROM exercises e
        JOIN workout_types wt ON wt.id = e.workout_type_id
        LEFT JOIN exercise_strength_benchmarks b ON b.exercise_id = e.id
        WHERE e.is_active=1 AND e.is_cardio=0
        ORDER BY e.name, wt.name
    ''').fetchall()
    conn.close()
    exercises_for_benchmarks = []
    for row in benchmark_rows:
        group = normalize_muscle_group(row['muscle_group'])
        if group in {'Uncategorized', 'Core'}:
            continue
        exercises_for_benchmarks.append({
            'id': row['id'],
            'name': row['name'],
            'group': group,
            'workout_name': row['workout_name'],
            'beginner_1rm': row['beginner_1rm'],
            'intermediate_1rm': row['intermediate_1rm'],
            'advanced_1rm': row['advanced_1rm'],
        })
    return render_template('settings.html', settings=get_settings(), exercises_for_benchmarks=exercises_for_benchmarks)

@app.route('/settings/save', methods=['POST'])
def settings_save():
    d = request.form
    conn = get_db()
    notif_bool_keys = [
        'notif_enabled',
        'notif_water_hourly',
        'notif_prayer_before_start',
        'notif_prayer_before_end',
        'notif_todos_upcoming',
        'notif_special_dates',
    ]
    journal_bool_keys = ['journal_night_after_midnight_to_yesterday']

    for key in notif_bool_keys + journal_bool_keys:
        val = 'true' if d.get(key) else 'false'
        conn.execute('INSERT OR REPLACE INTO app_settings (setting_key,setting_value) VALUES (?,?)', (key, val))

    for key in d:
        if key in notif_bool_keys or key in journal_bool_keys:
            continue
        db_key = 'currency_symbol' if key == 'currency' else key
        conn.execute('INSERT OR REPLACE INTO app_settings (setting_key,setting_value) VALUES (?,?)', (db_key, d[key]))
    conn.commit()
    conn.close()
    flash('Settings saved!', 'success')
    return redirect(url_for('settings'))

@app.route('/settings/gym-benchmarks/save', methods=['POST'])
def settings_gym_benchmarks_save():
    conn = get_db()
    exercise_rows = conn.execute('SELECT id FROM exercises WHERE is_active=1 AND is_cardio=0').fetchall()
    for row in exercise_rows:
        eid = row['id']
        beginner = request.form.get(f'beginner_{eid}')
        intermediate = request.form.get(f'intermediate_{eid}')
        advanced = request.form.get(f'advanced_{eid}')
        if not beginner and not intermediate and not advanced:
            conn.execute('DELETE FROM exercise_strength_benchmarks WHERE exercise_id=?', (eid,))
            continue
        conn.execute('''
            INSERT INTO exercise_strength_benchmarks (exercise_id, beginner_1rm, intermediate_1rm, advanced_1rm, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(exercise_id) DO UPDATE SET
                beginner_1rm=excluded.beginner_1rm,
                intermediate_1rm=excluded.intermediate_1rm,
                advanced_1rm=excluded.advanced_1rm,
                updated_at=CURRENT_TIMESTAMP
        ''',
        (
            eid,
            float(beginner) if beginner else None,
            float(intermediate) if intermediate else None,
            float(advanced) if advanced else None,
        ))
    conn.commit()
    conn.close()
    flash('Gym benchmark lines saved.', 'success')
    return redirect(url_for('settings'))

@app.route('/settings/toggle-dark', methods=['POST'])
def toggle_dark():
    conn = get_db()
    cur = conn.execute("SELECT setting_value FROM app_settings WHERE setting_key='dark_mode'").fetchone()
    new_val = 'false' if cur and cur['setting_value'] == 'true' else 'true'
    conn.execute("INSERT OR REPLACE INTO app_settings (setting_key,setting_value) VALUES ('dark_mode',?)", (new_val,))
    conn.commit()
    conn.close()
    return jsonify({'dark_mode': new_val})

# ===== EXPORT =====
@app.route('/export/<table_name>')
def export_data(table_name):
    allowed = ['journal_entries','habits','habit_logs','workout_sessions','transactions','todos','sleep_logs',
               'prayer_logs','quran_reading','goals','books','focus_sessions','water_logs','important_dates','reviews']
    if table_name not in allowed:
        return jsonify({'error': 'Not allowed'}), 403
    conn = get_db()
    data = conn.execute(f'SELECT * FROM {table_name}').fetchall()
    conn.close()
    return jsonify([dict(r) for r in data])

@app.route('/export/all')
def export_all_data():
    conn = get_db()
    tables = [row['name'] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").fetchall()]
    payload = {}
    for table in tables:
        payload[table] = [dict(r) for r in conn.execute(f'SELECT * FROM {table}').fetchall()]
    conn.close()
    return jsonify(payload)


@app.route('/backup/gym-progress')
def backup_gym_progress():
    conn = get_db()
    payload = dump_tables(conn, GYM_PROGRESS_TABLES)
    conn.close()
    return jsonify(payload)


@app.route('/restore/gym-progress', methods=['POST'])
def restore_gym_progress():
    upload = request.files.get('gym_backup_file')
    if not upload or not upload.filename:
        flash('Please choose a Gym Progress JSON file first.', 'error')
        return redirect(url_for('settings'))

    try:
        incoming = json.loads(upload.read().decode('utf-8'))
    except Exception:
        flash('Invalid JSON file. Please upload a valid Gym Progress backup.', 'error')
        return redirect(url_for('settings'))

    if not isinstance(incoming, dict):
        flash('Invalid backup format. Expected a JSON object of table data.', 'error')
        return redirect(url_for('settings'))

    conn = get_db()
    try:
        conn.execute('PRAGMA foreign_keys = OFF')
        for table in GYM_RESTORE_DELETE_ORDER:
            if table_exists(conn, table):
                conn.execute(f'DELETE FROM {table}')

        for table in GYM_PROGRESS_TABLES:
            rows = incoming.get(table, [])
            if not isinstance(rows, list):
                continue
            restore_table_rows(conn, table, rows)

        conn.commit()
        flash('Gym progress restored successfully.', 'success')
    except Exception:
        conn.rollback()
        flash('Could not restore gym progress from that file.', 'error')
    finally:
        conn.execute('PRAGMA foreign_keys = ON')
        conn.close()

    return redirect(url_for('settings'))

@app.route('/backup/database')
def backup_database():
    db_path = get_database_path()
    return send_from_directory(
        os.path.dirname(db_path),
        os.path.basename(db_path),
        as_attachment=True,
        download_name=f"lifetracker-backup-{date.today().isoformat()}.db"
    )

if __name__ == '__main__':
    app.run(
        debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true',
        host='0.0.0.0',
        port=int(os.getenv('PORT', '5000'))
    )
