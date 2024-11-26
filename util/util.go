package util

import (
	"time"

	"github.com/gin-gonic/gin"
)

const TimeLayout = "2006/01/02 15:04:05"

func IsValidDate(dateStr string) bool {
	_, err := time.Parse(TimeLayout, dateStr)
	return err == nil
}

func GetUserID(c *gin.Context) int {
	userID, _ := c.Get("user_id")
	return int(userID.(float64))
}
