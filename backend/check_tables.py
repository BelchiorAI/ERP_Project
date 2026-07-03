import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_api.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='employees'")
    print('--- EMPLOYEES COLUMNS ---')
    for row in cursor.fetchall():
        print(f"{row[0]}: {row[1]}")
