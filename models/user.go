package models

type User struct {
	ID     int `db:"id" json:"id"`
	DawnID int `db:"dawn_id" json:"-"`
}
