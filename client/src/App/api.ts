import { AxiosWrapper } from "../dawn-ui/util";
import { apiUrl } from "../Pages/Login";
import { Group, MoodLog, Task } from "./types";

const axiosClient = new AxiosWrapper();
axiosClient.showLoader = false;
axiosClient.config.withCredentials = true;
axiosClient.config.headers = {
  Authorization: "Bearer Guest",
};
// ----- Tasks -----

export async function fetchTasks() {
  return await axiosClient.wrapper<"get", Task[]>(
    "get",
    `${apiUrl}/api/tasks`,
    undefined
  );
}

export async function addTask(data: Partial<Task>) {
  return await axiosClient.wrapper<"post", Task>(
    "post",
    `${apiUrl}/api/tasks`,
    data
  );
}

export async function updateTask(id: number, data: Partial<Task>) {
  return await axiosClient.patch<Task>(`${apiUrl}/api/tasks/${id}`, data);
}

export async function deleteTask(id: number) {
  return await axiosClient.delete(`${apiUrl}/api/tasks/${id}`);
}

// ----- Groups -----

export async function fetchGroups() {
  return await axiosClient.get<Group[]>(`${apiUrl}/api/groups`);
}

export async function addGroup(name: string) {
  return await axiosClient.post<Group>(`${apiUrl}/api/groups`, { name });
}

export async function updateGroup(id: number, data: Partial<Group>) {
  return await axiosClient.patch<Group>(`${apiUrl}/api/groups/${id}`, data);
}

// ----- Moods -----

export async function createMoodEntry(details: Partial<MoodLog>) {
  return await axiosClient.post<MoodLog>(`${apiUrl}/api/moods`, details);
}

export async function fetchMoodEntries() {
  return await axiosClient.get<MoodLog[]>(`${apiUrl}/api/moods`);
}
