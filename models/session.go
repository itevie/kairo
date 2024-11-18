package models

type Session struct {
	SID    string `db:"sid"`
	Expire string `db:"expire"`
	User   int    `db:"user"`
}
