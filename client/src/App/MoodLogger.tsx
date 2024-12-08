import { useRef, useState } from "react";
import { addAlert, closeAlert } from "../dawn-ui/components/AlertManager";
import Button from "../dawn-ui/components/Button";
import Column from "../dawn-ui/components/Column";
import GoogleMatieralIcon from "../dawn-ui/components/GoogleMaterialIcon";
import Row from "../dawn-ui/components/Row";
import { combineStyles } from "../dawn-ui/util";
import { createMoodEntry } from "./api";

export type MoodType = "very_bad" | "bad" | "neutral" | "good" | "very_good";
export const moodTypes = [
  "very_bad",
  "bad",
  "neutral",
  "good",
  "very_good",
] as const;

export const moodList = [
  "extremely_dissatisfied",
  "very_dissatisfied",
  "frustrated",
  "sad",
  "dissatisfied",
  "stressed",
  "worried",
  "neutral",
  "content",
  "calm",
  "satisfied",
  "very_satisfied",
  "excited",
] as const;

export const moodMap: Record<(typeof moodList)[number], MoodType> = {
  extremely_dissatisfied: "very_bad",
  very_dissatisfied: "very_bad",
  frustrated: "very_bad",
  sad: "bad",
  dissatisfied: "bad",
  stressed: "bad",
  worried: "bad",
  neutral: "neutral",
  content: "neutral",
  calm: "good",
  satisfied: "good",
  very_satisfied: "very_good",
  excited: "very_good",
};

export const moodColorMap: Record<MoodType, string> = {
  very_bad: "#FF0000",
  bad: "#FF5555",
  neutral: "#8888FF",
  good: "#55FF55",
  very_good: "#00FF00",
};

export const defaultMoodList = [
  "sad",
  "dissatisfied",
  "neutral",
  "satisfied",
  "very_satisfied",
] as const;

export function createAverageMood(values: MoodType[]): MoodType {
  let average = 0;
  for (const v of values) average += moodTypes.indexOf(v);
  average /= values.length;
  return moodTypes[Math.round(average)];
}

function MoodLoggerElement() {
  const [selected, setSelected] = useState<string | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const data = localStorage.getItem("kairo-user-moods");
  const userMoods = !data ? defaultMoodList : JSON.parse(data);
  const useColors =
    (localStorage.getItem("kairo-use-mood-colors") ?? "true") === "true";

  return (
    <Column>
      <label>How are you feeling today?</label>
      <Row
        util={["justify-center"]}
        style={{ position: "relative", gap: "3px" }}
      >
        {moodList
          .filter((x) => userMoods.includes(x))
          .map((x) => (
            <GoogleMatieralIcon
              util={[
                "clickable",
                "lift-up",
                "round",
                selected === x ? "selected" : "giraffe",
              ]}
              style={combineStyles(
                {
                  padding: "5px",
                },
                useColors ? { color: moodColorMap[moodMap[x]] } : {}
              )}
              size="48px"
              outline={true}
              name={`sentiment_${x}`}
              onClick={() => setSelected(x)}
            />
          ))}
      </Row>
      <textarea
        ref={noteRef}
        className="dawn-big"
        placeholder="Add a note..."
      />
      <Row>
        <Button big onClick={() => closeAlert()}>
          Cancel
        </Button>
        <Button
          big
          onClick={async () => {
            if (!selected) return;
            try {
              await createMoodEntry({
                emotion: selected,
                note: noteRef.current?.value,
              });
            } catch {}
            closeAlert();
          }}
        >
          Log it!
        </Button>
      </Row>
    </Column>
  );
}

export default function showMoodLogger() {
  addAlert({
    title: "Log Mood",
    body: <MoodLoggerElement />,
  });
}
