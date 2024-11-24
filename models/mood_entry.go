package models

type MoodEntry struct {
	ID        int     `db:"id" json:"id"`
	User      int     `db:"user" json:"user"`
	Emotion   string  `db:"emotion" json:"emotion"`
	Note      *string `db:"note" json:"note"`
	CreatedAt string  `db:"created_at" json:"created_at"`
}
