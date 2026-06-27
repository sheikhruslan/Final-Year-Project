import sqlite3
from datetime import datetime, date
import json
import os

BASE_DIR = os.path.dirname(__file__)
DATABASE = os.getenv('DATABASE_PATH', os.path.join(BASE_DIR, 'lifetracker.db'))
FALLBACK_DATABASE = os.path.join(BASE_DIR, 'lifetracker.db')


def get_database_path():
    return DATABASE

def get_db():
    chosen_path = DATABASE
    db_dir = os.path.dirname(chosen_path)
    try:
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        conn = sqlite3.connect(chosen_path)
    except (PermissionError, OSError, sqlite3.OperationalError):
        fallback_dir = os.path.dirname(FALLBACK_DATABASE)
        if fallback_dir:
            os.makedirs(fallback_dir, exist_ok=True)
        conn = sqlite3.connect(FALLBACK_DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, height_cm REAL, age INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS body_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_date DATE NOT NULL,
        weight_kg REAL NOT NULL,
        body_fat_percentage REAL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS daily_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_date DATE NOT NULL UNIQUE,
        step_count INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_date DATE NOT NULL,
        entry_type TEXT CHECK(entry_type IN ('morning','night')),
        content TEXT,
        gratitude_1 TEXT, gratitude_2 TEXT, gratitude_3 TEXT,
        gratitude_4 TEXT, gratitude_5 TEXT, gratitude_6 TEXT, gratitude_7 TEXT,
        mood INTEGER CHECK(mood >= 1 AND mood <= 5),
        tags TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, description TEXT,
        frequency_type TEXT CHECK(frequency_type IN ('daily','specific_days')),
        days_of_week TEXT, color TEXT DEFAULT '#3b82f6',
        category TEXT DEFAULT 'General',
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    habit_columns = {row[1] for row in c.execute("PRAGMA table_info(habits)").fetchall()}
    if 'category' not in habit_columns:
        c.execute("ALTER TABLE habits ADD COLUMN category TEXT DEFAULT 'General'")
    c.execute('''CREATE TABLE IF NOT EXISTS habit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habit_id INTEGER NOT NULL, log_date DATE NOT NULL,
        completed INTEGER DEFAULT 0, notes TEXT,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
        UNIQUE(habit_id, log_date)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS shopping_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_name TEXT NOT NULL,
        item_url TEXT,
        notes TEXT,
        is_bought INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS workout_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE, description TEXT,
        is_cardio INTEGER DEFAULT 0
    )''')
    c.executemany('INSERT OR IGNORE INTO workout_types (name,description,is_cardio) VALUES (?,?,?)', [
        ('Push','Chest, Shoulders, Triceps',0),('Pull','Back, Biceps',0),
        ('Legs','Quads, Hamstrings, Glutes',0),('Endurance Cardio','Treadmill intervals',1),
        ('HIIT Cardio','High intensity interval training',1),('Athletic Legs','Explosive leg training',0),
        ('Outdoor Run','Outdoor running - pace, distance, time',1),
    ])

    c.execute('''CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        workout_type_id INTEGER NOT NULL,
        muscle_group TEXT DEFAULT 'Uncategorized',
        is_cardio INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (workout_type_id) REFERENCES workout_types(id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS workout_stretches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_type_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        tracking_type TEXT DEFAULT 'seconds' CHECK(tracking_type IN ('seconds','reps','breaths')),
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (workout_type_id) REFERENCES workout_types(id) ON DELETE CASCADE
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS workout_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_type_id INTEGER NOT NULL,
        session_date DATE NOT NULL,
        duration_minutes INTEGER, calories_burned REAL DEFAULT 0, notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workout_type_id) REFERENCES workout_types(id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS session_stretch_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        stretch_id INTEGER NOT NULL,
        set_number INTEGER DEFAULT 1,
        completed INTEGER DEFAULT 0,
        amount INTEGER,
        duration_seconds INTEGER,
        notes TEXT,
        FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (stretch_id) REFERENCES workout_stretches(id) ON DELETE CASCADE
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS workout_exercise_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        set_number INTEGER NOT NULL,
        set_type TEXT CHECK(set_type IN ('warmup','working','interval')) DEFAULT 'working',
        reps INTEGER, weight_kg REAL,
        time_seconds INTEGER, incline REAL, speed REAL,
        distance_km REAL,
        notes TEXT,
        FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    )''')
    wel_cols = {row[1] for row in c.execute('PRAGMA table_info(workout_exercise_logs)').fetchall()}
    if 'distance_km' not in wel_cols:
        c.execute('ALTER TABLE workout_exercise_logs ADD COLUMN distance_km REAL')

    c.execute('''CREATE TABLE IF NOT EXISTS exercise_strength_benchmarks (
        exercise_id INTEGER PRIMARY KEY,
        beginner_1rm REAL,
        intermediate_1rm REAL,
        advanced_1rm REAL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS financial_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        type TEXT CHECK(type IN ('income','expense')),
        color TEXT DEFAULT '#3b82f6'
    )''')
    for cat in ['Food','Transport','Health','Education','Entertainment','Utilities','Shopping','Other']:
        c.execute('INSERT OR IGNORE INTO financial_categories (name,type) VALUES (?,?)', (cat,'expense'))
    for cat in ['Salary','Freelance','Investment','Gift','Other Income']:
        c.execute('INSERT OR IGNORE INTO financial_categories (name,type) VALUES (?,?)', (cat,'income'))

    c.execute('''CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_date DATE NOT NULL,
        type TEXT CHECK(type IN ('income','expense')),
        category_id INTEGER, amount REAL NOT NULL,
        description TEXT, notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES financial_categories(id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS savings_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, target_amount REAL NOT NULL,
        current_amount REAL DEFAULT 0, deadline DATE,
        is_completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS expected_cash (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        amount REAL NOT NULL,
        expected_date DATE,
        notes TEXT,
        is_received INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS job_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT NOT NULL, position TEXT NOT NULL,
        application_date DATE NOT NULL,
        status TEXT CHECK(status IN ('applied','interview','offer','rejected','withdrawn')),
        salary_range TEXT, location TEXT, job_url TEXT,
        contact_person TEXT, contact_email TEXT, notes TEXT,
        interview_date DATE, follow_up_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL, description TEXT,
        priority TEXT CHECK(priority IN ('high','medium','low')) DEFAULT 'medium',
        status TEXT CHECK(status IN ('pending','in_progress','completed')) DEFAULT 'pending',
        due_date DATE, due_time TEXT, category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
    )''')
    todo_columns = {row[1] for row in c.execute("PRAGMA table_info(todos)").fetchall()}
    if 'parent_todo_id' not in todo_columns:
        c.execute('ALTER TABLE todos ADD COLUMN parent_todo_id INTEGER')
    c.execute('CREATE INDEX IF NOT EXISTS idx_todos_parent_todo_id ON todos(parent_todo_id)')

    c.execute('''CREATE TABLE IF NOT EXISTS routines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        routine_type TEXT CHECK(routine_type IN ('morning','night')),
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS routine_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_id INTEGER NOT NULL,
        item_text TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS routine_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_id INTEGER NOT NULL,
        log_date DATE NOT NULL,
        completed_items TEXT,
        FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
        UNIQUE(routine_id, log_date)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS sleep_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sleep_date DATE NOT NULL UNIQUE,
        sleep_time TEXT NOT NULL, wake_time TEXT NOT NULL,
        total_hours REAL,
        quality_rating INTEGER CHECK(quality_rating >= 1 AND quality_rating <= 5),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS nap_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nap_date DATE NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        duration_minutes INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS diet_food_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_date DATE NOT NULL,
        meal_type TEXT DEFAULT 'snack' CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
        food_name TEXT NOT NULL,
        calories REAL NOT NULL DEFAULT 0,
        protein_g REAL NOT NULL DEFAULT 0,
        carbs_g REAL NOT NULL DEFAULT 0,
        fat_g REAL NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS diet_saved_meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        calories REAL NOT NULL DEFAULT 0,
        protein_g REAL NOT NULL DEFAULT 0,
        carbs_g REAL NOT NULL DEFAULT 0,
        fat_g REAL NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS prayer_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prayer_date DATE NOT NULL UNIQUE,
        fajr INTEGER DEFAULT 0, dhuhr INTEGER DEFAULT 0,
        asr INTEGER DEFAULT 0, maghrib INTEGER DEFAULT 0, isha INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS adhkar_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_date DATE NOT NULL,
        adhkar_type TEXT CHECK(adhkar_type IN ('morning_adhkar','evening_adhkar','morning_dua','sleep_dua')),
        completed INTEGER DEFAULT 0,
        UNIQUE(log_date, adhkar_type)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS quran_surahs (
        surah_number INTEGER PRIMARY KEY,
        name_arabic TEXT NOT NULL, name_english TEXT NOT NULL,
        total_ayahs INTEGER NOT NULL, juz_start INTEGER NOT NULL,
        revelation_type TEXT
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS quran_memorization (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surah_number INTEGER NOT NULL, ayah_number INTEGER NOT NULL,
        is_memorized INTEGER DEFAULT 0, memorized_date DATE,
        UNIQUE(surah_number, ayah_number)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS quran_reading (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reading_date DATE NOT NULL,
        from_surah INTEGER NOT NULL, from_ayah INTEGER NOT NULL,
        to_surah INTEGER NOT NULL, to_ayah INTEGER NOT NULL,
        juz_number INTEGER, notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS tafseer_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surah_number INTEGER NOT NULL, ayah_number INTEGER NOT NULL,
        concise_done INTEGER DEFAULT 0,
        deeper_look_done INTEGER DEFAULT 0,
        audio_done INTEGER DEFAULT 0,
        UNIQUE(surah_number, ayah_number)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS duas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL, arabic_text TEXT,
        transliteration TEXT, translation TEXT,
        category TEXT, is_favorite INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS arabic_learning (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        program_name TEXT CHECK(program_name IN ('64_videos','bayyinah_nahw','bayyinah_sarf')),
        current_day INTEGER DEFAULT 0,
        total_days INTEGER NOT NULL,
        last_completed_date DATE, notes TEXT
    )''')
    # Normalize any duplicate Arabic rows created before uniqueness enforcement.
    arabic_compacted = c.execute('''
        SELECT
            program_name,
            MAX(current_day) AS current_day,
            MAX(total_days) AS total_days,
            MAX(last_completed_date) AS last_completed_date,
            MAX(notes) AS notes
        FROM arabic_learning
        WHERE program_name IS NOT NULL
        GROUP BY program_name
    ''').fetchall()
    if arabic_compacted:
        c.execute('DELETE FROM arabic_learning')
        c.executemany(
            'INSERT INTO arabic_learning (program_name,current_day,total_days,last_completed_date,notes) VALUES (?,?,?,?,?)',
            [(r[0], r[1], r[2], r[3], r[4]) for r in arabic_compacted]
        )
    c.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_arabic_learning_program_name ON arabic_learning(program_name)')
    c.executemany('INSERT OR IGNORE INTO arabic_learning (program_name,current_day,total_days) VALUES (?,?,?)',
        [('64_videos',0,64),('bayyinah_nahw',0,156),('bayyinah_sarf',0,75)])

    c.execute('''CREATE TABLE IF NOT EXISTS kazakh_learning (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        current_topic INTEGER DEFAULT 1, current_page INTEGER DEFAULT 1,
        notes TEXT, last_studied_date DATE
    )''')
    # Keep a single canonical Kazakh learning row.
    kz_rows = c.execute('SELECT id,current_topic,current_page,notes,last_studied_date FROM kazakh_learning ORDER BY id').fetchall()
    if kz_rows:
        chosen = kz_rows[0]
        c.execute('DELETE FROM kazakh_learning')
        c.execute(
            'INSERT INTO kazakh_learning (id,current_topic,current_page,notes,last_studied_date) VALUES (1,?,?,?,?)',
            (chosen[1] or 1, chosen[2] or 1, chosen[3], chosen[4])
        )
    c.execute('INSERT OR IGNORE INTO kazakh_learning (id,current_topic,current_page) VALUES (1,1,1)')
    c.execute('''CREATE TABLE IF NOT EXISTS kazakh_topics (
        topic_number INTEGER PRIMARY KEY, topic_name TEXT NOT NULL, page_start INTEGER
    )''')
    c.executemany('INSERT OR IGNORE INTO kazakh_topics VALUES (?,?,?)', [
        (1,'Personal Identification',10),(2,'Classroom Orientation',19),
        (3,'Conversation with Host',29),(4,'Communication',41),(5,'Food',49),
        (6,'Money',57),(7,'Transportation',63),(8,'Directions',74),
        (9,'Shopping at the Bazaar',80),(10,'Being Invited by Family',88),
        (11,'At the Workplace',98),(12,'Medical',107),(13,'Interaction with Officials',114)
    ])

    c.execute('''CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER,
        title TEXT NOT NULL, description TEXT,
        goal_type TEXT CHECK(goal_type IN ('short','medium','long')),
        target_date DATE, is_completed INTEGER DEFAULT 0, notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, completed_at TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES goals(id) ON DELETE CASCADE
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL, author TEXT, cover_image TEXT,
        total_pages INTEGER, current_page INTEGER DEFAULT 0,
        status TEXT CHECK(status IN ('to_read','reading','completed')) DEFAULT 'to_read',
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        notes TEXT, started_date DATE, completed_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS focus_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_date DATE NOT NULL,
        duration_minutes INTEGER NOT NULL,
        task_description TEXT, completed INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS water_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_date DATE NOT NULL UNIQUE,
        wake_time TEXT DEFAULT '07:00',
        is_fasting INTEGER DEFAULT 0,
        sweat_factor INTEGER DEFAULT 0,
        total_ml INTEGER DEFAULT 0, target_ml INTEGER DEFAULT 0
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS water_hourly (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_date DATE NOT NULL, hour_label TEXT NOT NULL,
        slot_index INTEGER DEFAULT 0,
        target_ml INTEGER NOT NULL, completed INTEGER DEFAULT 0,
        completed_at TIMESTAMP,
        UNIQUE(log_date, hour_label)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS important_dates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL, event_date DATE NOT NULL,
        event_type TEXT, reminder_days_before INTEGER DEFAULT 0,
        is_recurring INTEGER DEFAULT 0, notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        review_type TEXT CHECK(review_type IN ('daily','weekly','monthly','yearly')),
        review_date DATE NOT NULL,
        wins TEXT, challenges TEXT, lessons TEXT,
        goals_for_next TEXT,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(review_type, review_date)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT NOT NULL UNIQUE, setting_value TEXT
    )''')
    c.executemany('INSERT OR IGNORE INTO app_settings (setting_key,setting_value) VALUES (?,?)', [
        ('dark_mode','false'),('wake_time','07:00'),('currency_symbol','$'),
        ('notif_enabled','true'),('notif_water_hourly','true'),
        ('notif_prayer_before_start','true'),('notif_prayer_before_end','true'),
        ('notif_todos_upcoming','true'),('notif_special_dates','true'),
        ('notif_latitude',''),('notif_longitude',''),('notif_prayer_method','4'),
        ('hydration_ml_per_kg','32'),('hydration_awake_hours','16'),('hydration_sweat_extra_ml','750')
    ])

    water_log_columns = [row[1] for row in c.execute("PRAGMA table_info(water_logs)").fetchall()]
    if 'sweat_factor' not in water_log_columns:
        c.execute('ALTER TABLE water_logs ADD COLUMN sweat_factor INTEGER DEFAULT 0')

    water_hourly_columns = [row[1] for row in c.execute("PRAGMA table_info(water_hourly)").fetchall()]
    if 'slot_index' not in water_hourly_columns:
        c.execute('ALTER TABLE water_hourly ADD COLUMN slot_index INTEGER DEFAULT 0')

    workout_session_columns = [row[1] for row in c.execute("PRAGMA table_info(workout_sessions)").fetchall()]
    if 'calories_burned' not in workout_session_columns:
        c.execute('ALTER TABLE workout_sessions ADD COLUMN calories_burned REAL DEFAULT 0')

    workout_stretch_columns = [row[1] for row in c.execute("PRAGMA table_info(workout_stretches)").fetchall()]
    if 'tracking_type' not in workout_stretch_columns:
        c.execute("ALTER TABLE workout_stretches ADD COLUMN tracking_type TEXT DEFAULT 'seconds'")

    exercise_columns = [row[1] for row in c.execute("PRAGMA table_info(exercises)").fetchall()]
    if 'muscle_group' not in exercise_columns:
        c.execute("ALTER TABLE exercises ADD COLUMN muscle_group TEXT DEFAULT 'Uncategorized'")

    # Backfill existing exercises with practical default groups.
    c.execute("UPDATE exercises SET muscle_group='Chest' WHERE lower(name) LIKE '%bench%' OR lower(name) LIKE '%fly%'")
    c.execute("UPDATE exercises SET muscle_group='Back' WHERE lower(name) LIKE '%row%' OR lower(name) LIKE '%pull up%' OR lower(name) LIKE '%lat pulldown%'")
    c.execute("UPDATE exercises SET muscle_group='Shoulders' WHERE lower(name) LIKE '%shoulder%' OR lower(name) LIKE '%overhead press%' OR lower(name) LIKE '%lateral raise%'")
    c.execute("UPDATE exercises SET muscle_group='Legs' WHERE lower(name) LIKE '%hamstring%' OR lower(name) LIKE '%leg curl%'")
    c.execute("UPDATE exercises SET muscle_group='Arms' WHERE (lower(name) LIKE '%curl%' OR lower(name) LIKE '%tricep%' OR lower(name) LIKE '%bicep%') AND lower(name) NOT LIKE '%hamstring%' AND lower(name) NOT LIKE '%leg curl%'")
    c.execute("UPDATE exercises SET muscle_group='Core' WHERE lower(name) LIKE '%crunch%' OR lower(name) LIKE '%plank%' OR lower(name) LIKE '%ab%'")
    c.execute("UPDATE exercises SET muscle_group='Glutes' WHERE lower(name) LIKE '%hip thrust%' OR lower(name) LIKE '%glute%'")
    c.execute("UPDATE exercises SET muscle_group='Legs' WHERE muscle_group='Uncategorized' AND (lower(name) LIKE '%squat%' OR lower(name) LIKE '%deadlift%' OR lower(name) LIKE '%lunge%' OR lower(name) LIKE '%leg%' OR lower(name) LIKE '%hamstring%')")
    c.execute("UPDATE exercises SET muscle_group='Cardio' WHERE is_cardio=1")
    c.execute("UPDATE exercises SET muscle_group='Uncategorized' WHERE muscle_group IS NULL OR trim(muscle_group)='' ")

    session_stretch_columns = [row[1] for row in c.execute("PRAGMA table_info(session_stretch_logs)").fetchall()]
    if 'set_number' not in session_stretch_columns:
        c.execute('ALTER TABLE session_stretch_logs ADD COLUMN set_number INTEGER DEFAULT 1')
    if 'amount' not in session_stretch_columns:
        c.execute('ALTER TABLE session_stretch_logs ADD COLUMN amount INTEGER')

    c.execute('''CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        event_date DATE NOT NULL,
        event_time TEXT,
        category TEXT DEFAULT 'general',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    _populate_quran_surahs(c)
    conn.commit()
    conn.close()
    print("Database initialized successfully!")


def _populate_quran_surahs(c):
    existing = c.execute('SELECT COUNT(*) FROM quran_surahs').fetchone()[0]
    if existing > 0:
        return
    surahs = [
        (1,'الفاتحة','Al-Fatiha',7,1,'Meccan'),(2,'البقرة','Al-Baqarah',286,1,'Medinan'),
        (3,'آل عمران','Ali Imran',200,3,'Medinan'),(4,'النساء','An-Nisa',176,4,'Medinan'),
        (5,'المائدة','Al-Maidah',120,6,'Medinan'),(6,'الأنعام','Al-Anam',165,7,'Meccan'),
        (7,'الأعراف','Al-Araf',206,8,'Meccan'),(8,'الأنفال','Al-Anfal',75,9,'Medinan'),
        (9,'التوبة','At-Tawbah',129,10,'Medinan'),(10,'يونس','Yunus',109,11,'Meccan'),
        (11,'هود','Hud',123,11,'Meccan'),(12,'يوسف','Yusuf',111,12,'Meccan'),
        (13,'الرعد','Ar-Rad',43,13,'Medinan'),(14,'ابراهيم','Ibrahim',52,13,'Meccan'),
        (15,'الحجر','Al-Hijr',99,14,'Meccan'),(16,'النحل','An-Nahl',128,14,'Meccan'),
        (17,'الإسراء','Al-Isra',111,15,'Meccan'),(18,'الكهف','Al-Kahf',110,15,'Meccan'),
        (19,'مريم','Maryam',98,16,'Meccan'),(20,'طه','Taha',135,16,'Meccan'),
        (21,'الأنبياء','Al-Anbiya',112,17,'Meccan'),(22,'الحج','Al-Hajj',78,17,'Medinan'),
        (23,'المؤمنون','Al-Muminun',118,18,'Meccan'),(24,'النور','An-Nur',64,18,'Medinan'),
        (25,'الفرقان','Al-Furqan',77,18,'Meccan'),(26,'الشعراء','Ash-Shuara',227,19,'Meccan'),
        (27,'النمل','An-Naml',93,19,'Meccan'),(28,'القصص','Al-Qasas',88,20,'Meccan'),
        (29,'العنكبوت','Al-Ankabut',69,20,'Meccan'),(30,'الروم','Ar-Rum',60,21,'Meccan'),
        (31,'لقمان','Luqman',34,21,'Meccan'),(32,'السجدة','As-Sajdah',30,21,'Meccan'),
        (33,'الأحزاب','Al-Ahzab',73,21,'Medinan'),(34,'سبإ','Saba',54,22,'Meccan'),
        (35,'فاطر','Fatir',45,22,'Meccan'),(36,'يس','Ya-Sin',83,22,'Meccan'),
        (37,'الصافات','As-Saffat',182,23,'Meccan'),(38,'ص','Sad',88,23,'Meccan'),
        (39,'الزمر','Az-Zumar',75,23,'Meccan'),(40,'غافر','Ghafir',85,24,'Meccan'),
        (41,'فصلت','Fussilat',54,24,'Meccan'),(42,'الشورى','Ash-Shura',53,25,'Meccan'),
        (43,'الزخرف','Az-Zukhruf',89,25,'Meccan'),(44,'الدخان','Ad-Dukhan',59,25,'Meccan'),
        (45,'الجاثية','Al-Jathiyah',37,25,'Meccan'),(46,'الأحقاف','Al-Ahqaf',35,26,'Meccan'),
        (47,'محمد','Muhammad',38,26,'Medinan'),(48,'الفتح','Al-Fath',29,26,'Medinan'),
        (49,'الحجرات','Al-Hujurat',18,26,'Medinan'),(50,'ق','Qaf',45,26,'Meccan'),
        (51,'الذاريات','Adh-Dhariyat',60,26,'Meccan'),(52,'الطور','At-Tur',49,27,'Meccan'),
        (53,'النجم','An-Najm',62,27,'Meccan'),(54,'القمر','Al-Qamar',55,27,'Meccan'),
        (55,'الرحمن','Ar-Rahman',78,27,'Medinan'),(56,'الواقعة','Al-Waqiah',96,27,'Meccan'),
        (57,'الحديد','Al-Hadid',29,27,'Medinan'),(58,'المجادلة','Al-Mujadilah',22,28,'Medinan'),
        (59,'الحشر','Al-Hashr',24,28,'Medinan'),(60,'الممتحنة','Al-Mumtahanah',13,28,'Medinan'),
        (61,'الصف','As-Saff',14,28,'Medinan'),(62,'الجمعة','Al-Jumuah',11,28,'Medinan'),
        (63,'المنافقون','Al-Munafiqun',11,28,'Medinan'),(64,'التغابن','At-Taghabun',18,28,'Medinan'),
        (65,'الطلاق','At-Talaq',12,28,'Medinan'),(66,'التحريم','At-Tahrim',12,28,'Medinan'),
        (67,'الملك','Al-Mulk',30,29,'Meccan'),(68,'القلم','Al-Qalam',52,29,'Meccan'),
        (69,'الحاقة','Al-Haqqah',52,29,'Meccan'),(70,'المعارج','Al-Maarij',44,29,'Meccan'),
        (71,'نوح','Nuh',28,29,'Meccan'),(72,'الجن','Al-Jinn',28,29,'Meccan'),
        (73,'المزمل','Al-Muzzammil',20,29,'Meccan'),(74,'المدثر','Al-Muddaththir',56,29,'Meccan'),
        (75,'القيامة','Al-Qiyamah',40,29,'Meccan'),(76,'الانسان','Al-Insan',31,29,'Medinan'),
        (77,'المرسلات','Al-Mursalat',50,29,'Meccan'),(78,'النبإ','An-Naba',40,30,'Meccan'),
        (79,'النازعات','An-Naziat',46,30,'Meccan'),(80,'عبس','Abasa',42,30,'Meccan'),
        (81,'التكوير','At-Takwir',29,30,'Meccan'),(82,'الإنفطار','Al-Infitar',19,30,'Meccan'),
        (83,'المطففين','Al-Mutaffifin',36,30,'Meccan'),(84,'الإنشقاق','Al-Inshiqaq',25,30,'Meccan'),
        (85,'البروج','Al-Buruj',22,30,'Meccan'),(86,'الطارق','At-Tariq',17,30,'Meccan'),
        (87,'الأعلى','Al-Ala',19,30,'Meccan'),(88,'الغاشية','Al-Ghashiyah',26,30,'Meccan'),
        (89,'الفجر','Al-Fajr',30,30,'Meccan'),(90,'البلد','Al-Balad',20,30,'Meccan'),
        (91,'الشمس','Ash-Shams',15,30,'Meccan'),(92,'الليل','Al-Layl',21,30,'Meccan'),
        (93,'الضحى','Ad-Duhaa',11,30,'Meccan'),(94,'الشرح','Ash-Sharh',8,30,'Meccan'),
        (95,'التين','At-Tin',8,30,'Meccan'),(96,'العلق','Al-Alaq',19,30,'Meccan'),
        (97,'القدر','Al-Qadr',5,30,'Meccan'),(98,'البينة','Al-Bayyinah',8,30,'Medinan'),
        (99,'الزلزلة','Az-Zalzalah',8,30,'Medinan'),(100,'العاديات','Al-Adiyat',11,30,'Meccan'),
        (101,'القارعة','Al-Qariah',11,30,'Meccan'),(102,'التكاثر','At-Takathur',8,30,'Meccan'),
        (103,'العصر','Al-Asr',3,30,'Meccan'),(104,'الهمزة','Al-Humazah',9,30,'Meccan'),
        (105,'الفيل','Al-Fil',5,30,'Meccan'),(106,'قريش','Quraysh',4,30,'Meccan'),
        (107,'الماعون','Al-Maun',7,30,'Meccan'),(108,'الكوثر','Al-Kawthar',3,30,'Meccan'),
        (109,'الكافرون','Al-Kafirun',6,30,'Meccan'),(110,'النصر','An-Nasr',3,30,'Medinan'),
        (111,'المسد','Al-Masad',5,30,'Meccan'),(112,'الإخلاص','Al-Ikhlas',4,30,'Meccan'),
        (113,'الفلق','Al-Falaq',5,30,'Meccan'),(114,'الناس','An-Nas',6,30,'Meccan')
    ]
    c.executemany('INSERT OR IGNORE INTO quran_surahs VALUES (?,?,?,?,?,?)', surahs)


def reset_language_progress():
    conn = get_db()
    conn.execute('UPDATE arabic_learning SET current_day = 0, last_completed_date = NULL, notes = NULL')
    conn.execute('UPDATE kazakh_learning SET current_topic = 1, current_page = 1, notes = NULL, last_studied_date = NULL')
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
