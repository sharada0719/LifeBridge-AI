import sqlite3
from ..config import settings

def init_memory_db():
    # Connect directly to the SQLite database defined in settings
    db_file = "./lifebridge.db"
    if settings.DATABASE_URL.startswith("sqlite:///"):
        db_file = settings.DATABASE_URL.split("///")[-1]
    
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_memories (
            user_id TEXT,
            key TEXT,
            value TEXT,
            PRIMARY KEY (user_id, key)
        )
    """)
    conn.commit()
    conn.close()

# Initialize dynamically on module loading
try:
    init_memory_db()
except Exception as e:
    print(f"Failed to initialize memory DB: {e}")

def save_memory_db(user_id: str, key: str, value: str):
    db_file = "./lifebridge.db"
    if settings.DATABASE_URL.startswith("sqlite:///"):
        db_file = settings.DATABASE_URL.split("///")[-1]
    
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO user_memories (user_id, key, value)
            VALUES (?, ?, ?)
        """, (user_id, key, value))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Memory save error: {e}")
        return False

def get_memory_db(user_id: str, key: str):
    db_file = "./lifebridge.db"
    if settings.DATABASE_URL.startswith("sqlite:///"):
        db_file = settings.DATABASE_URL.split("///")[-1]
        
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT value FROM user_memories WHERE user_id = ? AND key = ?
        """, (user_id, key))
        row = cursor.fetchone()
        conn.close()
        if row:
            return row[0]
        return None
    except Exception as e:
        print(f"Memory fetch error: {e}")
        return None

def get_all_memories_db(user_id: str):
    db_file = "./lifebridge.db"
    if settings.DATABASE_URL.startswith("sqlite:///"):
        db_file = settings.DATABASE_URL.split("///")[-1]
        
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT key, value FROM user_memories WHERE user_id = ?
        """, (user_id,))
        rows = cursor.fetchall()
        conn.close()
        return {row[0]: row[1] for row in rows}
    except Exception as e:
        print(f"Memory directory query error: {e}")
        return {}
