package models

type Task struct {
	ID        int     `db:"id" json:"id"`
	User      int     `db:"user" json:"user"`
	Title     string  `db:"title" json:"title"`
	Finished  bool    `db:"finished" json:"finished"`
	CreatedAt string  `db:"created_at" json:"created_at"`
	Due       *string `db:"due" json:"due"`
	Repeat    *int    `db:"repeat" json:"repeat"`
	Group     *int    `db:"in_group" json:"in_group"`
	Note      *string `db:"note" json:"note"`
}
