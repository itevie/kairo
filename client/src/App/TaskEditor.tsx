import { addAlert, showErrorAlert } from "../dawn-ui/components/AlertManager";
import { DawnTime } from "../dawn-ui/time";
import { Group, Task } from "./types";

export default async function showTaskEditor(
  page: string,
  groups: Group[],
  preset?: Partial<Task>,
  isEdit?: boolean
): Promise<Partial<Task> | null> {
  return new Promise<Partial<Task> | null>((resolve) => {
    let title = preset?.title ?? "";
    let due = preset?.due
      ? preset.due.replace(/\//g, "-").replace(" ", "T")
      : "";
    let repeat = preset?.repeat
      ? new DawnTime(preset?.repeat).toString(["ms"])
      : "";
    let group = preset?.in_group
      ? groups.find((x) => x.id === preset.in_group)?.name ?? ""
      : "";
    let note = preset?.note ?? "";

    if (page.startsWith("group-") && !preset) {
      let id = page.split("-")[1];
      group = groups.find((x) => x.id.toString() === id)?.name || "";
    }

    addAlert({
      title: isEdit ? "Edit Task" : "Create New Task",
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
                  defaultValue={title}
                  onChange={(e) => (title = e.currentTarget.value)}
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
                <select
                  defaultValue={group}
                  onChange={(e) => (group = e.currentTarget.value)}
                  style={{ width: "100%", textAlign: "center" }}
                  className="dawn-big"
                >
                  <option value="">None</option>
                  {groups.map((x) => (
                    <option value={x.name}>{x.name}</option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td>
                <label>Note</label>
              </td>
              <td>
                <textarea
                  defaultValue={note}
                  onChange={(e) => (note = e.currentTarget.value)}
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
            resolve(null);
          },
        },
        {
          id: "create",
          text: isEdit ? "Update" : "Create",
          enterKey: true,
          click(close) {
            const _repeat = DawnTime.fromString(repeat);
            if (!_repeat)
              return showErrorAlert("Invalid value in repeat field!");
            const _group = groups.find(
              (x) => x.name.toLowerCase() === group.toLowerCase()
            );
            if (group && !_group)
              return showErrorAlert(`The group ${_group} does not exist`);
            if (due) due = due?.replace(/-/g, "/").replace("T", " ");
            if (due && !due.match(/[0-9]{2}:[0-9]{2}:[0-9]{2}/)) due += ":00";
            close();
            resolve({
              repeat: _repeat.toMs() || null,
              in_group: _group?.id,
              title: title,
              due: due || null,
              note: note,
            });
          },
        },
      ],
    });
  });
}
