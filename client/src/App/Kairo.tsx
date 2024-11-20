import { useEffect, useState } from "react";
import {
  addAlert,
  showErrorAlert,
  showInputAlert,
} from "../dawn-ui/components/AlertManager";
import Column from "../dawn-ui/components/Column";
import Content from "../dawn-ui/components/Content";
import FAB from "../dawn-ui/components/FAB";
import Row from "../dawn-ui/components/Row";
import Sidebar from "../dawn-ui/components/Sidebar";
import SidebarButton from "../dawn-ui/components/SidebarButton";
import TaskList, { ListType } from "./TaskList";
import useTasks from "./hooks/useTasks";
import { DawnTime } from "../dawn-ui/time";
import Words from "../dawn-ui/components/Words";

export default function Kairo() {
  const tasks = useTasks();
  const [page, _setPage] = useState<string>("due");

  useEffect(() => {
    if (window.location.hash) {
      _setPage(window.location.hash.replace("#", ""));
    }
  }, []);

  function setPage(page: string) {
    _setPage(page);
    window.location.hash = page;
  }

  async function handleCreateTask() {
    let name = "";
    let due = "";
    let repeat = "";
    let group = "";

    if (page.startsWith("group-")) {
      let id = page.split("-")[1];
      group = tasks.groups.find((x) => x.id.toString() === id)?.name || "";
    }

    addAlert({
      title: "Create New Task",
      body: (
        <table style={{ width: "100%" }}>
          <tbody style={{ width: "100%" }}>
            <tr>
              <td>
                <label>Name</label>
              </td>
              <td>
                <input
                  autoFocus
                  defaultValue={name}
                  onChange={(e) => (name = e.currentTarget.value)}
                  style={{ width: "100%" }}
                  className="dawn-big"
                />
              </td>
            </tr>
            <tr>
              <td>
                <label>Due</label>
              </td>
              <td>
                <input
                  defaultValue={due}
                  onChange={(e) => (due = e.currentTarget.value)}
                  type="datetime-local"
                  style={{ width: "100%" }}
                  className="dawn-big"
                />
              </td>
            </tr>
            <tr>
              <td>
                <label>Repeat</label>
              </td>
              <td>
                <input
                  defaultValue={repeat}
                  onChange={(e) => (repeat = e.currentTarget.value)}
                  style={{ width: "100%" }}
                  className="dawn-big"
                />
              </td>
            </tr>
            <tr>
              <td>
                <label>Group</label>
              </td>
              <td>
                <input
                  defaultValue={group}
                  onChange={(e) => (group = e.currentTarget.value)}
                  style={{ width: "100%" }}
                  className="dawn-big"
                />
              </td>
            </tr>
          </tbody>
        </table>
      ),
      buttons: [
        {
          id: "cancel",
          text: "Cancel",
          click(close) {
            close();
          },
        },
        {
          id: "create",
          text: "Create",
          enterKey: true,
          click(close) {
            const _repeat = DawnTime.fromString(repeat);
            if (!_repeat)
              return showErrorAlert("Invalid value in repeat field!");
            const _group = tasks.groups.find(
              (x) => x.name.toLowerCase() === group.toLowerCase()
            );
            if (group && !_group)
              return showErrorAlert(`The group ${_group} does not exist`);
            if (due) due = due?.replace(/-/g, "/").replace("T", " ") + ":00";
            close();
            console.log(due?.replace(/-/g, "/").replace("T", " ") + ":00");
            tasks.createTask({
              repeat: _repeat.toMs() || null,
              in_group: _group?.id,
              title: name,
              due: due || null,
            });
          },
        },
      ],
    });
  }

  return (
    <Row className="full-page" style={{ position: "relative" }}>
      <FAB clicked={handleCreateTask} />
      <Sidebar>
        <Column style={{ gap: "5px" }}>
          {[
            ["Due", "due", "schedule"],
            ["All", "all", "list"],
            ["Reapting", "repeating", "replay"],
            ["Finished", "finished", "task_alt"],
          ].map((x) => (
            <SidebarButton
              label={x[0]}
              icon={x[2]}
              selected={page === x[1]}
              onClick={() => setPage(x[1])}
            />
          ))}
          <hr />
          {tasks.groups.map((x) => (
            <SidebarButton
              key={x.id}
              label={x.name}
              icon="folder"
              selected={page === `group-${x.id}`}
              onClick={() => setPage(`group-${x.id}`)}
            />
          ))}
          {tasks.groups.length > 0 && <hr />}
          <SidebarButton
            label="New Group"
            icon="folder"
            onClick={async () => {
              const name = await showInputAlert("Enter group name");
              if (name) tasks.createGroup(name);
            }}
          />
          <SidebarButton
            label="Settings"
            icon="settings"
            onClick={() => setPage("settings")}
          />
        </Column>
      </Sidebar>
      <Content style={{ width: "100%", overflow: "auto" }}>
        {{
          settings: (
            <>
              <Words type="page-title">Settings</Words>
            </>
          ),
        }[page] ?? <TaskList hook={tasks} type={page as ListType} />}
      </Content>
    </Row>
  );
}
