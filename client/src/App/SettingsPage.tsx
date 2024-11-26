import { useState } from "react";
import { setTheme, themeSetBackground } from "../dawn-ui";
import Column from "../dawn-ui/components/Column";
import Container from "../dawn-ui/components/Container";
import Row from "../dawn-ui/components/Row";
import { ShortcutList } from "../dawn-ui/components/ShortcutManager";
import Words from "../dawn-ui/components/Words";
import useTasks from "./hooks/useTasks";
import { defaultMoodList, moodColorMap, moodList, moodMap } from "./MoodLogger";
import GoogleMatieralIcon from "../dawn-ui/components/GoogleMaterialIcon";
import { combineStyles } from "../dawn-ui/util";
import { spawnConfetti } from "../dawn-ui/confetti";

export default function SettingsPage({
  hook,
}: {
  hook: ReturnType<typeof useTasks>;
}) {
  let data = localStorage.getItem("kairo-user-moods");
  const [userMoods, setUserMoods] = useState<string[]>(
    !data
      ? (defaultMoodList as any as string[])
      : (JSON.parse(data) as any as string[])
  );
  const useColors =
    (localStorage.getItem("kairo-use-mood-colors") ?? "true") === "true";

  function toggle(type: string) {
    setUserMoods((old) => {
      if (old.includes(type)) {
        old.splice(old.indexOf(type), 1);
      } else {
        old.push(type);
      }

      localStorage.setItem("kairo-user-moods", JSON.stringify(old));
      return [...old];
    });
  }

  return (
    <Column util={["no-gap"]}>
      <Words type="page-title">Settings</Words>
      <Container>
        <Words type="heading">Appearance</Words>
        <table style={{ borderSpacing: "10px" }}>
          <tbody>
            <tr>
              <td>
                <label>Starting Page</label>
              </td>
              <td>
                <select
                  defaultValue={
                    localStorage.getItem("kairo-default-page") ?? "all"
                  }
                  onChange={(e) => {
                    localStorage.setItem(
                      "kairo-default-page",
                      e.currentTarget.value
                    );
                  }}
                >
                  <option value="due">Due</option>
                  <option value="all">All</option>
                  <option value="repeating">Repeating</option>
                  <option value="finished">Finished</option>
                  <option disabled style={{ textAlign: "center" }}>
                    Groups
                  </option>
                  {hook.groups.map((x) => (
                    <option value={`group-${x.id}`}>{x.name}</option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td>
                <label>Theme</label>
              </td>
              <td>
                <select
                  defaultValue={localStorage.getItem("kairo-theme") || "dark"}
                  onChange={(e) => {
                    localStorage.setItem("kairo-theme", e.currentTarget.value);
                    setTheme(e.currentTarget.value as any);
                  }}
                >
                  <option value="light">Light</option>
                  <option value="light-transparent">Light Transparent</option>
                  <option value="dark">Dark</option>
                  <option value="dark-transparent">Dark Transparent</option>
                </select>
              </td>
            </tr>
            <tr>
              <td>
                <label>Background URL</label>
              </td>
              <td>
                <input
                  defaultValue={
                    localStorage.getItem("kairo-background-url") || ""
                  }
                  onChange={(e) => {
                    localStorage.setItem(
                      "kairo-background-url",
                      e.currentTarget.value
                    );
                    themeSetBackground(e.currentTarget.value);
                  }}
                />
              </td>
            </tr>
            <tr>
              <td>
                <label>Confetti</label>
              </td>
              <tr>
                <input
                  type="checkbox"
                  defaultValue={
                    localStorage.getItem("kairo-show-confetii") ?? "true"
                  }
                  onClick={(e) => {
                    spawnConfetti(e.pageX, e.pageY);
                  }}
                  onChange={(e) => {
                    localStorage.setItem(
                      "kairo-show-confetti",
                      e.currentTarget.checked.toString()
                    );
                  }}
                />
              </tr>
            </tr>
          </tbody>
        </table>
        <Words type="heading">Tips</Words>
        <Row style={{ margin: "10px" }}>
          <input
            type="checkbox"
            defaultChecked={
              (localStorage.getItem("kairo-enable-tips") ?? "true") === "true"
            }
            onChange={(e) => {
              localStorage.setItem(
                "kairo-enable-tips",
                e.currentTarget.checked.toString()
              );
            }}
          />
          <label>Show a random tip everyday</label>
        </Row>
        <Words type="heading">Mood Tracker</Words>
        <Row style={{ margin: "10px" }}>
          <input
            type="checkbox"
            defaultChecked={
              (localStorage.getItem("kairo-show-mood") ?? "true") === "true"
            }
            onChange={(e) => {
              localStorage.setItem(
                "kairo-show-mood",
                e.currentTarget.checked.toString()
              );
              window.location.reload();
            }}
          />
          <label>Show mood tracking section</label>
        </Row>
        <Row style={{ margin: "10px" }}>
          <input
            type="checkbox"
            defaultChecked={
              (localStorage.getItem("kairo-prompt-mood") ?? "true") === "true"
            }
            onChange={(e) => {
              localStorage.setItem(
                "kairo-prompt-mood",
                e.currentTarget.checked.toString()
              );
              window.location.reload();
            }}
          />
          <label>Prompt to log mood every day</label>
        </Row>
        <Row style={{ margin: "10px" }}>
          <input
            type="checkbox"
            defaultChecked={
              (localStorage.getItem("kairo-use-mood-colors") ?? "true") ===
              "true"
            }
            onChange={(e) => {
              localStorage.setItem(
                "kairo-use-mood-colors",
                e.currentTarget.checked.toString()
              );
              window.location.reload();
            }}
          />
          <label>Show mood colors</label>
        </Row>
        <label>Select moods to show on prompt:</label>
        <br />
        {moodList.map((x) => (
          <GoogleMatieralIcon
            util={[
              "clickable",
              "lift-up",
              "round",
              userMoods.includes(x) ? "selected" : "giraffe",
            ]}
            size="48px"
            outline={true}
            style={combineStyles(
              {
                padding: "5px",
              },
              useColors ? { color: moodColorMap[moodMap[x]] } : {}
            )}
            name={`sentiment_${x}`}
            onClick={() => toggle(x)}
          />
        ))}
        <Words type="heading" style={{ display: "block" }}>
          Shortcuts
        </Words>
        <ShortcutList />
      </Container>
    </Column>
  );
}
