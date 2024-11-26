package models

import (
	"errors"
	"time"

	"dawn.rest/todo/util"
	"github.com/jmoiron/sqlx"
)

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

func FetchTask(id int, user int, db *sqlx.DB) (*Task, error, int) {
	var task Task
	if err := db.QueryRowx("SELECT * FROM tasks WHERE id = ?;", id).StructScan(&task); err != nil {
		return nil, errors.New("failed to fetch task"), 404
	}

	if task.User != user {
		return nil, errors.New("you do not own this task"), 403
	}

	return &task, nil, 200
}

func GetTasks(user int, db *sqlx.DB, scan []Task) error {
	if err := db.Select(scan, "SELECT * FROM tasks WHERE user = ?;", user); err != nil {
		return errors.New("failed to load tasks from database")
	}

	return nil
}

func UpdateTaskDueDates(tasks []Task, user int, db *sqlx.DB) error {
	for _, v := range tasks {
		if v.Finished && v.Repeat != nil {
			var t time.Time
			if v.Due != nil {
				t, _ = time.Parse(util.TimeLayout, *v.Due)
			} else {
				t = time.Now()
			}

			var temp Task
			if err := db.QueryRowx(
				"INSERT INTO tasks (user, title, finished, created_at, due, repeat, in_group, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *;",
				user,
				v.Title,
				false,
				time.Now().Format(util.TimeLayout),
				t.Add(time.Duration(*v.Repeat)*time.Millisecond).Format(util.TimeLayout),
				*v.Repeat,
				v.Group,
				v.Note,
			).StructScan(&temp); err != nil {
				return errors.New("failed to create new task for repeating task")
			}
			tasks = append(tasks, temp)

			if err := db.QueryRowx("UPDATE tasks SET repeat = null WHERE id = ? RETURNING *;", v.ID).StructScan(&v); err != nil {
				return errors.New("failed to create new task for repeating task")
			}
		}
	}

	return nil
}
