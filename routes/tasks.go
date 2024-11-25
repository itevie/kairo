package routes

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"dawn.rest/todo/models"
	"dawn.rest/todo/util"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func RegisterTaskRoutes(router *gin.RouterGroup, db *sqlx.DB) {
	router.GET("/tasks", util.AuthenticateJWT(), func(c *gin.Context) {
		user, _ := c.Get("user_id")
		var tasks []models.Task = []models.Task{}

		if err := db.Select(&tasks, "SELECT * FROM tasks WHERE user = ?;", user); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to load tasks from database",
			})
			c.Abort()
			return
		}

		for _, v := range tasks {
			if v.Finished && v.Repeat != nil {
				var t time.Time
				if v.Due != nil {
					t, _ = time.Parse(util.TimeLayout, *v.Due)
				} else {
					t = time.Now()
				}

				var temp models.Task
				if err := db.QueryRowx(
					"INSERT INTO tasks (user, title, finished, created_at, due, repeat, in_group, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *;",
					user,
					v.Title,
					false,
					time.Now().Format(util.TimeLayout),
					t.Add(time.Duration(*v.Repeat)*time.Millisecond).Format(util.TimeLayout),
					*v.Repeat,
					v.Group,
					v.Note,
				).StructScan(&temp); err != nil {
					fmt.Println(err.Error())
					c.JSON(http.StatusInternalServerError, gin.H{
						"message": "Failed to create new task for repeating task",
					})
					c.Abort()
					return
				}
				tasks = append(tasks, temp)

				if err := db.QueryRowx("UPDATE tasks SET repeat = null WHERE id = ? RETURNING *;", v.ID).StructScan(&v); err != nil {
					fmt.Println(err.Error())
					c.JSON(http.StatusInternalServerError, gin.H{
						"message": "Failed to create new task for repeating task",
					})
					c.Abort()
					return
				}

			}
		}

		c.JSON(http.StatusOK, tasks)
	})

	router.POST("/tasks", util.AuthenticateJWT(), func(c *gin.Context) {
		user, _ := c.Get("user_id")

		var body struct {
			Title  string  `json:"title" binding:"required"`
			Due    *string `json:"due"`
			Note   *string `json:"note"`
			Repeat *int    `json:"repeat"`
			Group  *int    `json:"in_group"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": fmt.Sprintf("Invalid body: %s", err.Error()),
			})
			c.Abort()
			return
		}

		if body.Due != nil && !util.IsValidDate(*body.Due) {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Invalid date format for due, expected yyyy/mm/dd hh:mm:ss",
			})
			c.Abort()
			return
		}

		var task models.Task
		err := db.QueryRowx(
			"INSERT INTO tasks (user, title, created_at, due, repeat, in_group, note) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *",
			user, body.Title, time.Now().Format(util.TimeLayout), body.Due, body.Repeat, body.Group, body.Note,
		).StructScan(&task)

		if err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to create task",
			})
			c.Abort()
			return
		}

		c.JSON(http.StatusOK, task)
	})

	router.PATCH("/tasks/:id", util.AuthenticateJWT(), func(c *gin.Context) {
		user, _ := c.Get("user_id")
		param, err := strconv.Atoi(c.Param("id"))

		if err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Task :id should be a number",
			})
			c.Abort()
			return
		}

		var task models.Task
		if err := db.QueryRowx("SELECT * FROM tasks WHERE id = ?;", param).StructScan(&task); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to fetch task",
			})
			c.Abort()
			return
		}

		if task.User != int(user.(float64)) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "You do not own this task",
			})
			c.Abort()
			return
		}

		var body struct {
			Finished *bool   `json:"finished"`
			Due      *string `json:"due"`
			Group    *int    `json:"in_group"`
			Repeat   *int    `json:"repeat"`
			Note     *string `json:"note"`
			Title    *string `json:"title"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Bad request body",
			})
			c.Abort()
			return
		}

		if body.Finished != nil {
			if err := db.QueryRowx("UPDATE tasks SET finished = ? WHERE id = ? RETURNING *;", *body.Finished, task.ID).StructScan(&task); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "Internal database error",
				})
				c.Abort()
				return
			}
		}

		if body.Due != nil {
			if !util.IsValidDate(*body.Due) {
				c.JSON(http.StatusBadRequest, gin.H{
					"message": "Invalid date format for due, expected yyyy/mm/dd hh:mm:ss",
				})
				c.Abort()
				return
			}

			if err := db.QueryRowx("UPDATE tasks SET due = ? WHERE id = ? RETURNING *;", *body.Due, task.ID).StructScan(&task); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "Internal database error",
				})
				c.Abort()
				return
			}
		}

		if body.Note != nil {
			if err := db.QueryRowx("UPDATE tasks SET note = ? WHERE id = ? RETURNING *;", *body.Note, task.ID).StructScan(&task); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "Internal database error",
				})
				c.Abort()
				return
			}
		}

		if body.Title != nil {
			if err := db.QueryRowx("UPDATE tasks SET title = ? WHERE id = ? RETURNING *;", *body.Title, task.ID).StructScan(&task); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "Internal database error",
				})
				c.Abort()
				return
			}
		}

		if body.Repeat != nil {
			if *body.Repeat < 1000 {
				c.JSON(http.StatusBadRequest, gin.H{
					"message": "Repeat must be at least 1000",
				})
				c.Abort()
				return
			}

			if err := db.QueryRowx("UPDATE tasks SET repeat = ? WHERE id = ? RETURNING *;", *body.Repeat, task.ID).StructScan(&task); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "Internal database error",
				})
				c.Abort()
				return
			}
		}

		if body.Group != nil {
			if err := db.QueryRowx("UPDATE tasks SET in_group = ? WHERE id = ? RETURNING *;", *body.Group, task.ID).StructScan(&task); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "Internal database error",
				})
				c.Abort()
				return
			}
		}

		c.JSON(http.StatusOK, task)
	})

	router.DELETE("/tasks/:id", util.AuthenticateJWT(), func(c *gin.Context) {
		user, _ := c.Get("user_id")
		param, err := strconv.Atoi(c.Param("id"))

		if err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Task :id should be a number",
			})
			c.Abort()
			return
		}

		var task models.Task
		if err := db.QueryRowx("SELECT * FROM tasks WHERE id = ?;", param).StructScan(&task); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to fetch task",
			})
			c.Abort()
			return
		}

		if task.User != int(user.(float64)) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "You do not own this task",
			})
			c.Abort()
			return
		}

		if _, err := db.Exec("DELETE FROM tasks WHERE id = ?;", param); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to delete task",
			})
			c.Abort()
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Task deleted",
		})
	})
}
