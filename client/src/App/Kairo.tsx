import { useEffect, useState } from "react";
import {
  showConfirmModel,
  showInputAlert,
} from "../dawn-ui/components/AlertManager";
import Column from "../dawn-ui/components/Column";
import Container from "../dawn-ui/components/Container";
import Content from "../dawn-ui/components/Content";
import FAB from "../dawn-ui/components/FAB";
import Row from "../dawn-ui/components/Row";
import Sidebar from "../dawn-ui/components/Sidebar";
import SidebarButton from "../dawn-ui/components/SidebarButton";
import { AxiosWrapper, axiosWrapper } from "../dawn-ui/util";
import { apiUrl } from "../Pages/Login";
import { showContextMenu } from "../dawn-ui/components/ContextMenuManager";

export interface Task {
  id: number;
  user: number;
  title: string;
  finished: boolean;
  created_at: string;
  due: string | null;
  repeat: number | null;
  in_group: number | null;
  note: string | null;
}

const axiosClient = new AxiosWrapper();
axiosClient.showLoader = false;
axiosClient.config.withCredentials = true;

export default function Kairo() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    reloadTasks();
  }, []);

  async function reloadTasks() {
    try {
      const tasksResponse = await axiosClient.wrapper(
        "get",
        `${apiUrl}/api/tasks`,
        undefined
      );
      setTasks(tasksResponse.data);
    } catch {}
  }

  async function createTask() {
    const name = await showInputAlert("Enter body of task");
    if (!name) return;

    try {
      await axiosClient.wrapper("post", `${apiUrl}/api/tasks`, {
        title: name,
      });
      reloadTasks();
    } catch {}
  }

  async function toggleFinished(id: number) {
    try {
      const result = await axiosClient.wrapper(
        "patch",
        `${apiUrl}/api/tasks/${id}`,
        {
          finished: !tasks.find((x) => x.id === id)?.finished,
        }
      );

      const index = tasks.findIndex((x) => x.id === id) as number;
      setTasks((old) => {
        let n = [...old];
        n[index] = result.data;
        return n;
      });
    } catch {}
  }

  function deleteTask(id: number) {
    showConfirmModel("Are you sure you want to delete this task?", async () => {
      try {
        await axiosClient.wrapper("delete", `${apiUrl}/api/tasks/${id}`);
        reloadTasks();
      } catch {}
    });
  }

  return (
    <Row className="full-page" style={{ position: "relative" }}>
      <FAB clicked={createTask} />
      <Sidebar>
        <Column style={{ gap: "5px" }}>
          <SidebarButton label="Due" icon="schedule" />
          <SidebarButton label="All" icon="list" />
          <SidebarButton label="Repeating" icon="replay" />
        </Column>
      </Sidebar>
      <Content style={{ width: "100%" }}>
        <Column>
          {tasks.map((x) => (
            <Container
              onClick={() => toggleFinished(x.id)}
              onContextMenu={(e) => {
                showContextMenu({
                  event: e,
                  elements: [
                    {
                      label: "Delete",
                      type: "button",
                      scheme: "danger",
                      onClick: () => deleteTask(x.id),
                    },
                  ],
                });
              }}
              key={x.id}
              util={["no-min"]}
              style={{ width: "100%" }}
            >
              <Row>
                <input checked={x.finished} type="checkbox" />
                <label>{x.title}</label>
              </Row>
            </Container>
          ))}
        </Column>
      </Content>
    </Row>
  );
}
