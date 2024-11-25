package routes

import (
	"fmt"
	"net/http"
	"strconv"

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

	router.PATCH("/groups/:id", util.AuthenticateJWT(), func(c *gin.Context) {
		userID, _ := c.Get("user_id")
		user := int(userID.(float64))
		param, err := strconv.Atoi(c.Param("id"))

		if err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Group :id should be a number",
			})
			c.Abort()
			return
		}

		var group models.Group
		if err := db.QueryRowx("SELECT * FROM groups WHERE id = ?;", param).StructScan(&group); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to fetch group",
			})
			c.Abort()
			return
		}

		if group.User != user {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "You do not own this group",
			})
			c.Abort()
			return
		}

		var body struct {
			Name  *string `json:"name"`
			Theme *string `json:"theme"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Bad request body",
			})
			c.Abort()
			return
		}

		if body.Name != nil {
			if err := db.QueryRowx("UPDATE groups SET name = ? WHERE id = ? RETURNING *;", body.Name, group.ID).StructScan(&group); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "Internal database error",
				})
				c.Abort()
				return
			}
		}

		if body.Theme != nil {
			if err := db.QueryRowx("UPDATE groups SET theme = ? WHERE id = ? RETURNING *;", body.Theme, group.ID).StructScan(&group); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "Internal database error",
				})
				c.Abort()
				return
			}
		}

		c.JSON(http.StatusOK, group)
	})
}
