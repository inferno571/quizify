@echo off
echo Starting Quizify Complete Stack...

:: Start Go Backend
start "Quizify Go API Server" cmd /c "cd backend && go run main.go"

:: Start Next.js Frontend
start "Quizify Next.js App" cmd /c "cd frontend && npm run dev"

echo Both servers are starting! The frontend will be available at http://localhost:3000
