import { showInputAlert } from "../dawn-ui/components/AlertManager";
import Column from "../dawn-ui/components/Column";
import Container from "../dawn-ui/components/Container";
import { showContextMenu } from "../dawn-ui/components/ContextMenuManager";
import Row from "../dawn-ui/components/Row";
import { DawnTime, units } from "../dawn-ui/time";
import showTaskEditor from "./TaskEditor";
import { Task } from "./types";

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
  let tasks = hook.tasks
    .filter(filters[type || "all"] || (() => true))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .sort(
      (a, b) => new Date(b.due || 0).getTime() - new Date(a.due || 0).getTime()
    );
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
      {Object.keys(data)
        .filter((x) => data[x].length > 0)
        .map((k) => (
          <>
            <label>
              {k}
              {k.length !== 0 ? " - " : ""}
              {data[k].length} items
            </label>
            <Column style={{ margin: "3px" }}>
              {data[k].map((x) => (
                <Container
                  className={
                    x.due &&
                    !x.finished &&
                    Date.now() - new Date(x.due).getTime() > 0
                      ? "dawn-danger"
                      : ""
                  }
                  onClick={() =>
                    hook.updateTask(x.id, { finished: !x.finished })
                  }
                  onContextMenu={(e) => {
                    showContextMenu({
                      event: e,
                      elements: [
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
                    <input readOnly checked={x.finished} type="checkbox" />
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
