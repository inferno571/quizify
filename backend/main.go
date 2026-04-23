package main

import (
	"log"
	"os"

	"quizify-backend/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Attempt to load .env from the parent directory
	_ = godotenv.Load("../.env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := gin.Default()

	// CORS to allow Next.js during development
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// API routes
	api := r.Group("/api")
	{
		api.POST("/extract-quiz", handlers.ExtractQuiz)
		api.POST("/generate-quiz", handlers.GenerateQuiz)
	}

	log.Printf("🚀 Go API Server running on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
