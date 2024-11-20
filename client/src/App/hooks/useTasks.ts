import { useEffect, useState } from "react";
import {
  addGroup,
  addTask,
  deleteTask,
  fetchGroups,
  fetchTasks,
  updateTask,
} from "../api";
import { Group, Task } from "../types";

export default function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    reloadGroups();
    reloadTasks();
  }, []);

  // ----- Tasks -----

  async function reloadTasks() {
    try {
      const response = await fetchTasks();
      console.log(response.data);
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

  return {
    tasks,
    groups,
    reloadTasks,
    createTask,
    updateTask: _updateTask,
    deleteTask: _deleteTask,
    reloadGroups,
    createGroup,
  };
}
