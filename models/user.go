package models

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type User struct {
	ID          int     `db:"id" json:"id"`
	DawnID      int     `db:"dawn_id" json:"-"`
	UpdateToken *string `db:"update_token" json:"-"`
	Settings    *string `db:"settings" json:"settings"`
}

func UpdateUpdateToken(user int, db *sqlx.DB) {
	if err := db.Select("UPDATE users SET update_token = ? WHERE id = ?;", uuid.NewString(), user); err != nil {
		fmt.Println(err.Error())
	}
}
