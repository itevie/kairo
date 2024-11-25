import { useEffect, useMemo, useState } from "react";
import Column from "../dawn-ui/components/Column";
import Container from "../dawn-ui/components/Container";
import GoogleMatieralIcon from "../dawn-ui/components/GoogleMaterialIcon";
import Row from "../dawn-ui/components/Row";
import Words from "../dawn-ui/components/Words";
import { combineStyles } from "../dawn-ui/util";
import useTasks from "./hooks/useTasks";
import { moodColorMap, moodMap, MoodType, moodTypes } from "./MoodLogger";
import { MoodLog } from "./types";
import { ChartConfiguration } from "chart.js";
import { DawnTime } from "../dawn-ui/time";

export default function MoodHistoryForDate({
  hook,
  date,
}: {
  date: string;
  hook: ReturnType<typeof useTasks>;
}) {
  const _moodMap = useMemo(() => {
    const t: Record<string, MoodLog[]> = {};
    for (const m of hook.moods) {
      let k = DawnTime.formatDateString(new Date(m.created_at), "YYYY-MM-DD");
      if (!t[k]) t[k] = [];
      t[k].push(m);
    }
    return t;
  }, [hook.moods]);

  const useColors =
    (localStorage.getItem("kairo-use-mood-colors") ?? "true") === "true";

  return (
    <Column>
      <Words type="page-title">Entries for {date}</Words>
      {(_moodMap[date] ?? []).reverse().map((x) => (
        <Container util={["no-min"]}>
          <Row util={["align-center"]}>
            <GoogleMatieralIcon
              util={["round"]}
              style={combineStyles(
                {
                  padding: "5px",
                },
                useColors
                  ? {
                      color:
                        moodColorMap[
                          moodMap[x.emotion as keyof typeof moodMap]
                        ],
                    }
                  : {}
              )}
              size="32px"
              outline={true}
              name={`sentiment_${x.emotion}`}
            />
            <Column>
              <label>{x.created_at}</label>
              {x.note ? <small>{x.note}</small> : <></>}
            </Column>
          </Row>
        </Container>
      ))}
    </Column>
  );
}
