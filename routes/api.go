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

	router.GET("/user_data", util.AuthenticateJWT(), func(c *gin.Context) {
		userID := util.GetUserID(c)

		var user models.User
		if err := db.QueryRowx("SELECT * FROM users WHERE id = ?;", userID).StructScan(&user); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch user",
			})
			c.Abort()
			return
		}

		c.JSON(http.StatusOK, user)
	})

	router.PATCH("/update_settings", util.AuthenticateJWT(), func(c *gin.Context) {
		userID := util.GetUserID(c)

		var body struct {
			Settings string `json:"settings" binding:"required"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid body",
			})
			c.Abort()
			return
		}

		if err := db.QueryRowx("UPDATE users SET settings = ? WHERE id = ? RETURNING *;", body.Settings, userID).StructScan(&models.User{}); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to update user",
			})
			c.Abort()
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Updated settings",
		})
	})
}
