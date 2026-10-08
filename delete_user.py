import os
import sqlite3

db_file = next((os.path.join(root, f) for root, _, files in os.walk('.') for f in files if f.endswith(('.db', '.sqlite', '.sqlite3'))), None)

if not db_file:
    print('No database file found in project folder!')
else:
    print(f'Found database at: {db_file}')
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall() if not t[0].startswith('sqlite_')]
    print(f'Tables found: {tables}')
    total_deleted = 0
    for table in tables:
        try:
            cursor.execute(f"DELETE FROM {table} WHERE email = ?", ('rpmadumika@gmail.com',))
            if cursor.rowcount > 0:
                print(f'Deleted {cursor.rowcount} row(s) from table: {table}')
                total_deleted += cursor.rowcount
        except sqlite3.OperationalError:
            pass
    conn.commit()
    conn.close()
    print(f'Finished! Total records removed: {total_deleted}')