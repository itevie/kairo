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
		user := util.GetUserID(c)

		fmt.Println(user)

		var tasks []models.Task = []models.Task{}
		if err := models.GetTasks(user, db, &tasks); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		fmt.Println(len(tasks))

		if err := models.UpdateTaskDueDates(tasks, user, db); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		c.JSON(http.StatusOK, tasks)
	})

	router.POST("/tasks", util.AuthenticateJWT(), func(c *gin.Context) {
		user := util.GetUserID(c)

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
		user := util.GetUserID(c)
		param, err := strconv.Atoi(c.Param("id"))

		if err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Task :id should be a number",
			})
			c.Abort()
			return
		}

		task, err, code := models.FetchTask(param, user, db)
		if err != nil {
			c.JSON(code, gin.H{
				"message": err.Error(),
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

		fields := map[string]interface{}{
			"finished": body.Finished,
			"due":      body.Due,
			"group":    body.Group,
			"repeat":   body.Repeat,
			"note":     body.Note,
			"title":    body.Title,
		}

		for field, value := range fields {
			if value != nil {
				query := fmt.Sprintf("UPDATE tasks SET %s = ? WHERE id = ? RETURNING *;", field)
				if err := db.QueryRowx(query, value, task.ID).StructScan(task); err != nil {
					fmt.Println(err.Error(), query, value)
					c.JSON(http.StatusInternalServerError, gin.H{
						"message": "Failed to update task",
					})
					c.Abort()
					return
				}
			}
		}

		c.JSON(http.StatusOK, task)
	})

	router.DELETE("/tasks/:id", util.AuthenticateJWT(), func(c *gin.Context) {
		user := util.GetUserID(c)
		param, err := strconv.Atoi(c.Param("id"))

		if err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Task :id should be a number",
			})
			c.Abort()
			return
		}

		_, err, code := models.FetchTask(param, user, db)
		if err != nil {
			c.JSON(code, gin.H{
				"message": err.Error(),
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
