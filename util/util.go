package util

import "time"

const TimeLayout = "2006/01/02 15:04:05"

func IsValidDate(dateStr string) bool {

	_, err := time.Parse(TimeLayout, dateStr)
	return err == nil
}
