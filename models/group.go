package models

type Group struct {
	ID    int     `db:"id" json:"id"`
	User  int     `db:"user" json:"user"`
	Name  string  `db:"name" json:"name"`
	Note  *string `db:"note" json:"note"`
	Theme *string `db:"theme" json:"theme"`
}
