import { useRef, useState } from "react";
import Column from "../dawn-ui/components/Column";
import Container from "../dawn-ui/components/Container";
import { showContextMenu } from "../dawn-ui/components/ContextMenuManager";
import Row from "../dawn-ui/components/Row";
import { DawnTime, units } from "../dawn-ui/time";
import showTaskEditor from "./TaskEditor";
import { Task } from "./types";
import { setCallback } from "../dawn-ui/components/ShortcutManager";
import { combineClasses } from "../dawn-ui/util";
import GoogleMatieralIcon from "../dawn-ui/components/GoogleMaterialIcon";
import { showConfirmModel } from "../dawn-ui/components/AlertManager";
import Flyout from "../dawn-ui/components/Flyout";
import { spawnConfetti } from "../dawn-ui/confetti";
// @ts-ignore
import task from "./task_completed.mp3";

export type ListType =
  | "due"
  | "all"
  | "finished"
  | "repeating"
  | `group-${number}`;

const filters: { [key: string]: (task: Task) => boolean } = {
  all: (t) => !t.finished,
  due: (t: Task) => t.due !== null && !t.finished,
  finished: (t: Task) => t.finished,
  repeating: (t: Task) => !t.finished && t.repeat !== null,
} as const;

export default function TaskList({
  hook,
  type,
}: {
  hook: ReturnType<typeof import("./hooks/useTasks").default>;
  type?: ListType;
}) {
  const [query, setQuery] = useState<string>("");
  const [selected, setSelected] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  let tasks = hook.tasks
    .filter(filters[type || "all"] || (() => true))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .sort(
      (a, b) => new Date(b.due || 0).getTime() - new Date(a.due || 0).getTime()
    );

  setCallback("search", () => {
    inputRef.current?.focus();
  });

  setCallback("select-all", () => {
    if (selected.length === tasks.length) setSelected([]);
    else setSelected(filter(tasks, query).map((x) => x.id));
  });

  setCallback("deselect-all", () => {
    setSelected([]);
  });

  let data: { [key: string]: Task[] } = {};

  switch (type) {
    case "due":
      data = {
        Overdue: [],
        Today: [],
        Tomorrow: [],
        "In a week": [],
        Later: [],
      };

      for (const task of tasks) {
        const diff = new Date(task.due as string).getTime() - Date.now();
        if (diff < 0) data["Overdue"].push(task);
        else if (diff < units.day) data["Today"].push(task);
        else if (diff < units.day * 2) data["Tomorrow"].push(task);
        else if (diff < units.day * 7) data["In a week"].push(task);
        else data["Later"].push(task);
      }
      break;
    case "all":
    case "finished":
      for (const task of tasks)
        if (!task.in_group) {
          if (!data["Ungrouped"]) data["Ungrouped"] = [];
          data["Ungrouped"].push(task);
        } else {
          const name = hook.groups.find((x) => x.id === task.in_group)
            ?.name as string;
          if (!data[name]) data[name] = [];
          data[name].push(task);
        }
      break;
    case "repeating":
      tasks = tasks.sort((a, b) => (a.repeat as number) - (b.repeat as number));
      data = {
        Other: [],
      };
      for (const task of tasks) {
        const time = new DawnTime(task.repeat as number);
        const unit = time.biggestUnit;
        if (!unit) {
          data["Other"].push(task);
          continue;
        }

        let key = `Every ${time.units[unit]} ${unit}${
          time.units[unit] !== 1 ? "s" : ""
        }`;
        if (time.units[unit] === 1)
          key = `Every ${unit}${time.units[unit] !== 1 ? "s" : ""}`;

        if (!data[key]) data[key] = [];
        data[key].push(task);
      }
      break;
    default:
      if (type?.startsWith("group")) {
        data = {
          "": tasks.filter(
            (x) => !x.finished && x.in_group?.toString() === type.split("-")[1]
          ),
          Finished: tasks.filter(
            (x) => x.finished && x.in_group?.toString() === type.split("-")[1]
          ),
        };
      }
      break;
  }

  return (
    <Column>
      <input
        ref={inputRef}
        placeholder="Search tasks..."
        className="dawn-big dawn-page-input"
        onChange={(e) => setQuery(e.currentTarget.value)}
      />
      {selected.length > 0 && (
        <div style={{ textAlign: "center" }}>
          <hr />
          <Column style={{ gap: "5px" }}>
            <label>{selected.length} tasks selected</label>
            <Row style={{ justifyContent: "center" }}>
              <Flyout direction="up" text="Delete Selected">
                <GoogleMatieralIcon
                  name="delete"
                  onClick={() => {
                    showConfirmModel(
                      "Are you sure you want to delete all selected tasks?",
                      () => {
                        for (const task of tasks.filter((x) =>
                          selected.includes(x.id)
                        ))
                          hook.deleteTask(task.id);
                        setSelected([]);
                      }
                    );
                  }}
                />
              </Flyout>
              <Flyout text="Mark Selected as Finished">
                <GoogleMatieralIcon
                  name="check_circle"
                  onClick={() => {
                    showConfirmModel(
                      "Are you sure you want to finish all selected tasks?",
                      () => {
                        for (const task of tasks.filter(
                          (x) => !x.finished && selected.includes(x.id)
                        ))
                          hook.updateTask(task.id, { finished: true });
                        setSelected([]);
                      }
                    );
                  }}
                />
              </Flyout>
              <Flyout text="Mark Selected as Unfinished">
                <GoogleMatieralIcon
                  name="unpublished"
                  onClick={() => {
                    showConfirmModel(
                      "Are you sure you want to unfinish all selected tasks?",
                      () => {
                        for (const task of tasks.filter(
                          (x) => x.finished && selected.includes(x.id)
                        ))
                          hook.updateTask(task.id, { finished: false });
                        setSelected([]);
                      }
                    );
                  }}
                />
              </Flyout>
              <Flyout text="Deselect All">
                <GoogleMatieralIcon
                  name="check_box_outline_blank"
                  onClick={() => setSelected([])}
                />
              </Flyout>
            </Row>
          </Column>
          <hr />
        </div>
      )}
      {Object.keys(data)
        .filter((x) => filter(data[x], query).length > 0)
        .map((k) => (
          <>
            <label>
              {k}
              {k.length !== 0 ? " - " : ""}
              {filter(data[k], query).length} items
            </label>
            <Column style={{ margin: "3px" }}>
              {filter(data[k], query).map((x) => (
                <Container
                  className={combineClasses(
                    x.due &&
                      !x.finished &&
                      Date.now() - new Date(x.due).getTime() > 0
                      ? "dawn-danger"
                      : "",
                    selected.includes(x.id) ? "dawn-selected" : ""
                  )}
                  onClick={(e) => {
                    if (e.ctrlKey) {
                      if (selected.includes(x.id))
                        setSelected((old) => {
                          old.splice(old.indexOf(x.id), 1);
                          return [...old];
                        });
                      else setSelected((old) => [...old, x.id]);
                    }
                  }}
                  onContextMenu={(e) => {
                    showContextMenu({
                      event: e,
                      elements: [
                        {
                          label: "Select",
                          type: "button",
                          onClick: () => {
                            setSelected((old) => [...old, x.id]);
                          },
                        },
                        {
                          label: "Edit",
                          type: "button",
                          onClick: async () => {
                            const result = await showTaskEditor(
                              type ?? "",
                              hook.groups,
                              x,
                              true
                            );
                            if (!result) return;
                            await hook.updateTask(x.id, result);
                          },
                        },
                        {
                          type: "seperator",
                        },
                        {
                          label: "Delete",
                          type: "button",
                          scheme: "danger",
                          onClick: () => hook.deleteTask(x.id),
                        },
                      ],
                    });
                  }}
                  key={x.id}
                  util={["no-min"]}
                  style={{ width: "100%" }}
                >
                  <Row>
                    <input
                      onClick={(e) => {
                        if (!x.finished) {
                          if (
                            (localStorage.getItem("kairo-show-confetti") ??
                              "true") === "true"
                          )
                            spawnConfetti(e.pageX, e.pageY);
                        }
                        hook.updateTask(x.id, { finished: !x.finished });
                      }}
                      readOnly
                      checked={x.finished}
                      type="checkbox"
                    />
                    <Column>
                      <label>{x.title}</label>
                      {x.note ? (
                        <label style={{ fontSize: "0.8em" }}>{x.note}</label>
                      ) : (
                        ""
                      )}
                      {(x.due || x.repeat) && (
                        <small>
                          {x.due ? `Due: ${x.due} ` : ""}
                          {x.repeat
                            ? `Repeat: ${new DawnTime(
                                x.repeat || 0
                              ).toString()}`
                            : ""}
                        </small>
                      )}
                    </Column>
                  </Row>
                </Container>
              ))}
            </Column>
          </>
        ))}
    </Column>
  );
}

function filter(what: Task[], query: string): Task[] {
  const regex = new RegExp(query, "gi");
  return what.filter(
    (x) =>
      x.title.match(regex) ||
      x.note?.match(regex) ||
      x.due?.match(regex) ||
      x.created_at.match(regex)
  );
}
