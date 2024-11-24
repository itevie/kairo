package routes

import (
	"fmt"
	"net/http"
	"time"

	"dawn.rest/todo/models"
	"dawn.rest/todo/util"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func RegisterMoodRoutes(router *gin.RouterGroup, db *sqlx.DB) {
	router.GET("/moods", util.AuthenticateJWT(), func(c *gin.Context) {
		userID, _ := c.Get("user_id")
		user := int(userID.(float64))

		var moods []models.MoodEntry = []models.MoodEntry{}

		if err := db.Select(&moods, "SELECT * FROM mood_entries WHERE user = ?;", user); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to load mood entries from database",
			})
			c.Abort()
			return
		}

		c.JSON(http.StatusOK, moods)
	})

	router.POST("/moods", util.AuthenticateJWT(), func(c *gin.Context) {
		userID, _ := c.Get("user_id")
		user := int(userID.(float64))

		var body struct {
			Emotion string  `json:"emotion" binding:"required"`
			Note    *string `json:"note"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Bad requset body",
			})
			c.Abort()
			return
		}

		var mood models.MoodEntry
		if err := db.QueryRowx(
			"INSERT INTO mood_entries VALUES (user, emotion, note, created_at) VALUES (?, ?, ?, ?) RETURNING *;",
			user, body.Emotion, body.Note, time.Now().Format(util.TimeLayout),
		).StructScan(&mood); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Internal database error",
			})
			c.Abort()
			return
		}

		c.JSON(http.StatusOK, mood)
	})
}
