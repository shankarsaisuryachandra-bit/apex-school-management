@echo off
echo ========================================================
echo Building Unified Production Package for School Management
echo ========================================================

echo [1/3] Building React Frontend with Vite...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    exit /b %errorlevel%
)
cd ..

echo [2/3] Embedding Frontend Assets into Backend Static Resources...
if not exist "backend\src\main\resources\static" mkdir "backend\src\main\resources\static"
xcopy /E /Y /I "frontend\dist\*" "backend\src\main\resources\static\"

echo [3/3] Packaging Production Spring Boot Executable JAR...
cd backend
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo Backend build failed!
    exit /b %errorlevel%
)
cd ..

echo ========================================================
echo Build Complete!
echo Production Executable: backend\target\school-management-system-1.0.0.jar
echo.
echo To run locally or on a cloud server:
echo   java -jar backend\target\school-management-system-1.0.0.jar
echo ========================================================

