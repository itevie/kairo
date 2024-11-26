package routes

import (
	"fmt"
	"net/http"

	"dawn.rest/todo/models"
	"dawn.rest/todo/util"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func RegisterAPIRoutes(router *gin.RouterGroup, db *sqlx.DB) {
	router.GET("/all", util.AuthenticateJWT(), func(c *gin.Context) {
		userID, _ := c.Get("user_id")
		user := int(userID.(float64))

		update_token := c.Query("update_token")

		var user_data models.User
		if err := db.QueryRowx("SELECT * FROM users WHERE id = ?;", user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Internal database error",
			})
			c.Abort()
			return
		}

		if user_data.UpdateToken != nil && *user_data.UpdateToken == update_token {
			c.Status(204)
			c.Abort()
			return
		}

		var tasks []models.Task = []models.Task{}
		if err := db.Select(&tasks, "SELECT * FROM tasks WHERE user = ?;", user); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to load tasks from database",
			})
			c.Abort()
			return
		}

		var groups []models.Group = []models.Group{}
		if err := db.Select(&tasks, "SELECT * FROM groups WHERE user = ?;", user); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to load groups from database",
			})
			c.Abort()
			return
		}

		var moods []models.MoodEntry = []models.MoodEntry{}
		if err := db.Select(&tasks, "SELECT * FROM mood_entries WHERE user = ?;", user); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to load moods from database",
			})
			c.Abort()
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"tasks":  tasks,
			"groups": groups,
			"moods":  moods,
		})
	})
}
