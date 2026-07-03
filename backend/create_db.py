import os
from pathlib import Path

import environ
import psycopg2

env = environ.Env()
environ.Env.read_env(os.path.join(Path(__file__).resolve().parent, '.env'))

DB_NAME = env('DB_NAME', default='erp_db')

try:
    conn = psycopg2.connect(
        dbname='postgres',
        user=env('DB_USER', default='postgres'),
        password=env('DB_PASSWORD', default=''),
        host=env('DB_HOST', default='127.0.0.1'),
        port=env('DB_PORT', default='5432'),
    )
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute(f'CREATE DATABASE "{DB_NAME}"')
    cursor.close()
    conn.close()
    print(f"Database {DB_NAME} created successfully!")
except psycopg2.errors.DuplicateDatabase:
    print(f"Database {DB_NAME} already exists!")
except Exception as e:
    print("Error:", e)
