# ERP Project

A small ERP system with a Django REST Framework backend and a React (Vite + TypeScript) frontend.

```
ERP_Project/
├── backend/     Django REST API (erp_api project, core app)
├── frontend/    React + Vite + TypeScript client
├── start.sh     One-command dev startup — macOS / Linux
└── start.bat    One-command dev startup — Windows
```

## Prerequisites

Install these before you begin:

- **Python 3.10+** — https://www.python.org/downloads/
- **Node.js 18+** and npm — https://nodejs.org/
- **PostgreSQL** (server running locally) — https://www.postgresql.org/download/

## 1. Backend setup (Django)

All commands below are run from the `backend/` folder.

```bash
cd backend
```

### Create and activate a virtual environment

macOS / Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows (PowerShell or cmd):
```bat
python -m venv .venv
.venv\Scripts\activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Configure environment variables

Copy the example file and fill in your own values — `.env` is gitignored and never committed:

```bash
cp .env.example .env
```

```
DEBUG=True
SECRET_KEY=change-me-to-a-random-secret-key
DB_NAME=ERP_APP
DB_USER=postgres
DB_PASSWORD=change-me
DB_HOST=127.0.0.1
DB_PORT=5432
```

Set `DB_USER` / `DB_PASSWORD` to match your local PostgreSQL credentials, and set `SECRET_KEY` to a unique random value (never reuse the example).

### Create the database

Make sure PostgreSQL is running, then either:

```bash
python create_db.py
```

or create it manually with `psql`:

```sql
CREATE DATABASE "ERP_APP";
```

### Run migrations

```bash
python manage.py migrate
```

### (Optional) Seed sample data

```bash
python populate_db.py
```

This wipes existing non-superuser employees/timesheets/leave requests and generates ~50 sample employees.

### Create an admin user

```bash
python manage.py createsuperuser
```

### Start the API server

```bash
python manage.py runserver
```

The API is now available at `http://127.0.0.1:8000/api/`, with the Django admin at `http://127.0.0.1:8000/admin/`.

## 2. Frontend setup (React + Vite)

In a separate terminal, from the `frontend/` folder:

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://127.0.0.1:5173` and talks to the API at `http://127.0.0.1:8000/api` (see `frontend/src/api/client.ts`). Keep the backend server running for the frontend to work.

Other useful frontend commands:

```bash
npm run build     # production build (outputs to frontend/dist)
npm run preview   # preview the production build locally
npm run lint       # lint the codebase
```

## 3. Quick start (plug and play)

Once dependencies are installed the first time (see above), you can start both servers with a single script.

**macOS / Linux:**
```bash
./start.sh
```

**Windows:**
```bat
start.bat
```

Both scripts create the backend virtual environment and install dependencies on first run if they don't exist yet, run pending migrations, install frontend `node_modules` if missing, then launch the Django server and Vite dev server together.

- `start.sh` runs both servers in one terminal (backend in the background); press `Ctrl+C` to stop both.
- `start.bat` opens two separate windows, one per server; close either window to stop that server.

## Troubleshooting

- **`django.db.utils.OperationalError` / connection refused** — PostgreSQL isn't running, or the credentials in `backend/.env` don't match your local database.
- **CORS errors in the browser** — make sure the backend is running on port `8000` and the frontend on port `5173`; these are the only origins allowed in `CORS_ALLOWED_ORIGINS` (`backend/erp_api/settings.py`).
- **`ModuleNotFoundError: No module named 'django'`** — the virtual environment isn't activated; re-run the activate command for your OS.
