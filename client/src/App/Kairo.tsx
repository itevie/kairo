import { useEffect, useState } from "react";
import {
  addAlert,
  closeAlert,
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
import showTaskEditor from "./TaskEditor";
import {
  registerShortcut,
  setCallback,
} from "../dawn-ui/components/ShortcutManager";
import showMoodLogger from "./MoodLogger";
import SettingsPage from "./SettingsPage";
import "react-calendar/dist/Calendar.css";
import { DawnTime } from "../dawn-ui/time";
import "./style.css";
import { showContextMenu } from "../dawn-ui/components/ContextMenuManager";
import Button from "../dawn-ui/components/Button";
import Flyout from "../dawn-ui/components/Flyout";
import tips from "./tips";
import MoodHistoryForDate from "./MoodHistoryForDate";
import MoodHistory from "./MoodHistory";

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

    window.addEventListener("hashchange", () => {
      setPage(window.location.hash.replace("#", ""));
    });

    setCallback("settings", () => {
      setPage("settings");
    });

    if ((localStorage.getItem("kairo-enable-tips") ?? "true") === "true") {
      if (
        localStorage.getItem("kairo-last-tip") !==
        DawnTime.formatDateString(new Date(), "YYYY-MM-DD")
      ) {
        localStorage.setItem(
          "kairo-last-tip",
          DawnTime.formatDateString(new Date(), "YYYY-MM-DD")
        );
        addAlert({
          title: "Daily Tip",
          body: <label>{tips[Math.floor(Math.random() * tips.length)]}</label>,
          allowOutsideClose: true,
          buttons: [
            {
              id: "disable",
              text: "Disable Tips",
              click(close) {
                localStorage.setItem("kairo-enable-tips", "false");
                close();
              },
            },
            {
              id: "ok",
              text: "OK!",
              click(close) {
                close();
              },
            },
          ],
        });
      }
    }
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
          {(localStorage.getItem("kairo-show-mood") ?? "true") === "true" && (
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
              style={x.theme ? { color: x.theme } : {}}
              onContextMenu={(e) => {
                showContextMenu({
                  event: e,
                  elements: [
                    {
                      type: "button",
                      label: "Edit",
                      onClick: () => {
                        let color: string | null = x.theme;
                        let name: string = x.name;
                        addAlert({
                          title: `Edit Group ${x.name}`,
                          body: (
                            <Column>
                              <table>
                                <tbody>
                                  <tr>
                                    <td>Name</td>
                                    <td>
                                      <input
                                        defaultValue={name}
                                        onChange={(e) =>
                                          (name = e.currentTarget.value)
                                        }
                                        className="dawn-big"
                                      />
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Color</td>
                                    <td>
                                      <Row util={["no-gap"]}>
                                        <input
                                          defaultValue={color ?? "#FFFFFF"}
                                          onChange={(e) =>
                                            (color = e.currentTarget.value)
                                          }
                                          className="dawn-big"
                                          type="color"
                                        />
                                        <Flyout text="Color will be removed when you click Save">
                                          <Button
                                            big
                                            style={{ margin: "0px" }}
                                            onClick={() => (color = null)}
                                          >
                                            Remove Color
                                          </Button>
                                        </Flyout>
                                      </Row>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <Row>
                                <Button big onClick={() => closeAlert()}>
                                  Close
                                </Button>
                                <Button
                                  big
                                  onClick={() => {
                                    tasks.updateGroup(x.id, {
                                      name,
                                      theme: color,
                                    });
                                    closeAlert();
                                  }}
                                >
                                  Save
                                </Button>
                              </Row>
                            </Column>
                          ),
                        });
                      },
                    },
                  ],
                });
              }}
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
        {page.startsWith("view_mood_details") ? (
          <MoodHistoryForDate date={page.split("@")[1]} hook={tasks} />
        ) : (
          <>
            {{
              mood_history: <MoodHistory hook={tasks} setPage={setPage} />,
              settings: <SettingsPage hook={tasks} />,
            }[page] ?? <TaskList hook={tasks} type={page as ListType} />}
          </>
        )}
      </Content>
    </Row>
  );
}
