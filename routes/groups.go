package routes

import (
	"fmt"
	"net/http"

	"dawn.rest/todo/models"
	"dawn.rest/todo/util"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func RegisterGroupRoutes(router *gin.RouterGroup, db *sqlx.DB) {
	router.GET("/groups", util.AuthenticateJWT(), func(c *gin.Context) {
		userID, _ := c.Get("user_id")
		user := int(userID.(float64))

		var groups []models.Group = []models.Group{}

		if err := db.Select(&groups, "SELECT * FROM groups WHERE user = ?;", user); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to load groups from database",
			})
			c.Abort()
			return
		}

		c.JSON(http.StatusOK, groups)
	})

	router.POST("/groups", util.AuthenticateJWT(), func(c *gin.Context) {
		userID, _ := c.Get("user_id")
		user := int(userID.(float64))

		var body struct {
			Name string `json:"name" binding:"required"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Bad request body",
			})
			c.Abort()
			return
		}

		var group models.Group
		if err := db.QueryRowx("INSERT INTO groups (user, name) VALUES (?, ?) RETURNING *;", user, body.Name).StructScan(&group); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Internal database error",
			})
			c.Abort()
			return
		}

		c.JSON(http.StatusOK, group)
	})
}
