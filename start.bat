@echo off
REM Plug-and-play dev startup for Windows.
REM Sets up the backend venv + frontend node_modules on first run, then
REM launches the Django API and the Vite dev server in separate windows.
setlocal

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

echo ==^> Backend setup
cd /d "%BACKEND_DIR%"

if not exist ".env" (
    echo No .env found - copying .env.example. Edit backend\.env with your DB credentials before continuing.
    copy ".env.example" ".env" >nul
)

if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

call "%BACKEND_DIR%\.venv\Scripts\activate.bat"

echo Installing backend dependencies...
pip install -q -r requirements.txt

echo Applying database migrations...
python manage.py migrate

call "%BACKEND_DIR%\.venv\Scripts\deactivate.bat"

echo ==^> Frontend setup
cd /d "%FRONTEND_DIR%"
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

echo ==^> Starting Django backend on http://127.0.0.1:8000
start "ERP Backend" cmd /k "cd /d "%BACKEND_DIR%" && call .venv\Scripts\activate.bat && python manage.py runserver"

echo ==^> Starting Vite frontend on http://127.0.0.1:5173
start "ERP Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

endlocal
