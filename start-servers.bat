@echo off
echo ====================================================
echo Starting School Management System Full Stack Servers
echo ====================================================

echo [1/3] Clearing any dangling H2 database lock...
if exist "backend\data\schooldb.lock.db" del /f /q "backend\data\schooldb.lock.db"

echo [2/3] Launching Spring Boot Backend on http://localhost:8080...
start "SMS Backend (Port 8080)" cmd /k "cd backend && mvn spring-boot:run"

echo [3/3] Launching Vite Frontend on http://localhost:3000...
start "SMS Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo [Optional] Launching Port 5173 redirect proxy...
start "SMS Port 5173 Redirect" cmd /k "node redirect_5173.js"

echo ====================================================
echo All services launched!
echo Open your browser at http://localhost:3000 or http://localhost:5173
echo ====================================================

