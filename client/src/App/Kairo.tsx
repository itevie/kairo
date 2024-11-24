import { useEffect, useState } from "react";
import { showInputAlert } from "../dawn-ui/components/AlertManager";
import Column from "../dawn-ui/components/Column";
import Content from "../dawn-ui/components/Content";
import FAB from "../dawn-ui/components/FAB";
import Row from "../dawn-ui/components/Row";
import Sidebar from "../dawn-ui/components/Sidebar";
import SidebarButton from "../dawn-ui/components/SidebarButton";
import TaskList, { ListType } from "./TaskList";
import useTasks from "./hooks/useTasks";
import showTaskEditor from "./TaskEditor";
import {
  registerShortcut,
  setCallback,
} from "../dawn-ui/components/ShortcutManager";
import showMoodLogger from "./MoodLogger";
import SettingsPage from "./SettingsPage";

registerShortcut("search", { key: "s", modifiers: ["ctrl"] });
registerShortcut("new-task", { key: "n", modifiers: ["shift"] });
registerShortcut("settings", { key: "s", modifiers: ["ctrl", "alt"] });
registerShortcut("select-all", { key: "a", modifiers: ["ctrl"] });
registerShortcut("deselect-all", { key: "a", modifiers: ["shift", "ctrl"] });
registerShortcut("log-mood", {
  key: "l",
  modifiers: ["shift"],
  callback: showMoodLogger,
});

export default function Kairo() {
  const tasks = useTasks();
  const [page, _setPage] = useState<string>("all");

  useEffect(() => {
    if (window.location.hash) {
      setPage(window.location.hash.replace("#", ""));
    } else if (localStorage.getItem("kairo-default-page")) {
      setPage(localStorage.getItem("kairo-default-page") ?? "all");
    }

    setCallback("settings", () => {
      setPage("settings");
    });
  }, []);

  function setPage(page: string) {
    _setPage(page);
    window.location.hash = page;
  }

  async function handleCreateTask() {
    let result = await showTaskEditor(page, tasks.groups);
    if (!result) return;
    tasks.createTask(result);
  }

  return (
    <Row className="full-page" style={{ position: "relative" }}>
      <FAB shortcut={"new-task"} clicked={handleCreateTask} />
      <Sidebar>
        <Column style={{ gap: "5px" }}>
          {localStorage.getItem("kairo-show-mood") === "true" && (
            <>
              <SidebarButton
                label="Log Mood"
                icon="add"
                onClick={showMoodLogger}
              />
              <SidebarButton
                label="Mood History"
                icon="calendar_month"
                onClick={() => setPage("mood_history")}
              />
              <hr />
            </>
          )}
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
          mood_history: <></>,
          settings: <SettingsPage hook={tasks} />,
        }[page] ?? <TaskList hook={tasks} type={page as ListType} />}
      </Content>
    </Row>
  );
}
