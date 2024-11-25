import { useEffect, useState } from "react";
import {
  addGroup,
  addTask,
  createMoodEntry,
  deleteTask,
  fetchGroups,
  fetchMoodEntries,
  fetchTasks,
  updateGroup,
  updateTask,
} from "../api";
import { Group, MoodLog, Task } from "../types";
import { DawnTime } from "../../dawn-ui/time";
import showMoodLogger from "../MoodLogger";

export default function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [moods, setMoods] = useState<MoodLog[]>([]);

  useEffect(() => {
    _fetchMoodEntries();
    reloadGroups();
    reloadTasks();
  }, []);

  // ----- Tasks -----

  async function reloadTasks() {
    try {
      const response = await fetchTasks();
      setTasks(response.data);
    } catch {}
  }

  async function createTask(data: Partial<Task>) {
    try {
      await addTask(data);
      reloadTasks();
    } catch {}
  }

  async function _updateTask(id: number, data: Partial<Task>) {
    try {
      const task = tasks.find((x) => x.id === id);
      if (task) {
        const updatedTask = await updateTask(id, data);
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? updatedTask.data : t))
        );
      }
    } catch {}
  }

  async function _deleteTask(id: number) {
    try {
      await deleteTask(id);
      reloadTasks();
    } catch {}
  }

  // ----- Groups -----

  async function reloadGroups() {
    try {
      const response = await fetchGroups();
      console.log(response);
      setGroups(response.data);
    } catch {}
  }

  async function createGroup(name: string) {
    try {
      await addGroup(name);
      reloadGroups();
    } catch {}
  }

  async function _updateGroup(id: number, data: Partial<Group>) {
    try {
      await updateGroup(id, data);
      reloadGroups();
    } catch {}
  }

  // ----- Moods -----
  async function _createMoodEntry(entry: Partial<MoodLog>) {
    try {
      await createMoodEntry(entry);
    } catch {}
  }

  async function _fetchMoodEntries() {
    try {
      const result = await fetchMoodEntries();
      setMoods(result.data);

      if (
        DawnTime.formatDateString(
          new Date(result.data[result.data.length - 1].created_at),
          "YYYY-MM-DD"
        ) !== DawnTime.formatDateString(new Date(), "YYYY-MM-DD")
      ) {
        if (localStorage.getItem("kairo-prompt-mood") === "true")
          showMoodLogger();
      }
    } catch {}
  }

  return {
    tasks,
    groups,
    moods,
    reloadTasks,
    createTask,
    updateTask: _updateTask,
    deleteTask: _deleteTask,
    reloadGroups,
    createGroup,
    createMoodEntry: _createMoodEntry,
    fetchMoodEntries: _fetchMoodEntries,
    updateGroup: _updateGroup,
  };
}
