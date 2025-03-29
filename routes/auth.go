package routes

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"dawn.rest/todo/models"
	"dawn.rest/todo/util"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func RegisterAuthRoutes(router *gin.RouterGroup, db *sqlx.DB) {
	router.GET("/dawn", func(c *gin.Context) {
		access_token := c.Query("access-token")

		if access_token == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "No access_token provided",
			})
			c.Abort()
			return
		}

		req, _ := http.NewRequest("POST", "https://auth.dawn.rest/api/token", nil)
		req.Header = http.Header{
			"Authorization": {fmt.Sprintf("Bearer %s", access_token)},
		}

		client := &http.Client{}
		resp, err := client.Do(req)

		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{
				"message": "Failed to authorize",
			})
			c.Abort()
			return
		}

		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)

		fmt.Println(resp.StatusCode)
		if err != nil || resp.StatusCode != 200 {
			c.JSON(http.StatusBadGateway, gin.H{
				"message": "Auth server gave a bad response (1)",
			})
			c.Abort()
			return
		}

		fmt.Println(string(body))

		var details struct {
			Token string `json:"token"`
			User  int    `json:"user"`
			Scope string `json:"scope"`
		}

		if err := json.Unmarshal(body, &details); err != nil {
			c.JSON(http.StatusBadGateway, gin.H{
				"message": "Auth server gave a bad response (2)",
			})
			c.Abort()
			return
		}

		var user models.User
		if c.Query("register") == "true" {
			var count int
			if err := db.Get(&count, "SELECT COUNT(*) FROM users WHERE dawn_id = ?;", details.User); err != nil {
				fmt.Println(err.Error())
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "Internal database error",
				})
				c.Abort()
				return
			}

			if count != 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"message": "An account is already registered with that Dawn account",
				})
				c.Abort()
				return
			}

			if err := db.QueryRowx("INSERT INTO users (dawn_id) VALUES (?) RETURNING *;", details.User).StructScan(&user); err != nil {
				fmt.Println(err.Error())
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "Internal database error",
				})
				c.Abort()
				return
			}
		}

		if c.Query("register") != "true" {
			if err := db.QueryRowx("SELECT * FROM users WHERE dawn_id = ?;", details.User).StructScan(&user); err != nil {
				if err == sql.ErrNoRows {
					c.Redirect(302, fmt.Sprintf("/auth/confirm_register?path=/auth/dawn&scheme=dawn&access_token=%s", access_token))
					c.Abort()
					return
				}

				fmt.Println(err.Error())
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "Internal database error",
				})
				c.Abort()
				return
			}
		}

		token, err := util.GenerateJWT(user.ID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to create JWT token",
			})
			c.Abort()
			return
		}

		expire := int(time.Now().Add(time.Hour * 24 * 7).Unix())

		var session models.Session
		if err := db.QueryRowx("INSERT INTO sessions (sid, expire, user) VALUES (?, ?, ?) RETURNING *;", token, expire, user.ID).StructScan(&session); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Internal database error",
			})
			c.Abort()
			return
		}

		c.SetCookie("session", session.SID, expire, "/", "", false, true)
		if c.Query("register") == "true" {
			c.Redirect(303, "/welcome")
		} else {
			c.Redirect(303, "/")
		}
	})

	router.GET("/token", util.AuthenticateJWT(), func(c *gin.Context) {
		user := util.GetUserID(c)

		token, err := util.GenerateJWT(user)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to create JWT token",
			})
			c.Abort()
			return
		}

		expire := int(time.Now().Add(time.Hour * 24 * 7).Unix())

		var session models.Session
		if err := db.QueryRowx("INSERT INTO sessions (sid, expire, user) VALUES (?, ?, ?) RETURNING *;", token, expire, user).StructScan(&session); err != nil {
			fmt.Println(err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Internal database error",
			})
			c.Abort()
			return
		}

		c.JSON(http.StatusOK, gin.H{
			token: session.SID,
		})
	})
}
